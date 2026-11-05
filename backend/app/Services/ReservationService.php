<?php

namespace App\Services;

use App\Models\BonPlan;
use App\Models\Reservation;
use App\Models\Voiture;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    /**
     * Create a reservation after checking the car's schedule inside a transaction.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Reservation
    {
        $validated = Validator::make($attributes, [
            'voiture_id' => ['required', 'integer', 'exists:voitures,id'],
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'bon_plan_id' => ['nullable', 'integer', 'exists:bons_plans,id'],
            'numero_permis' => ['nullable', 'string', 'max:255'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'km_prevu' => ['nullable', 'integer', 'min:0'],
        ])->validate();

        $start = CarbonImmutable::parse($validated['date_debut']);
        $end = CarbonImmutable::parse($validated['date_fin']);

        return DB::transaction(function () use ($validated, $start, $end): Reservation {
            $voiture = Voiture::query()
                ->lockForUpdate()
                ->findOrFail($validated['voiture_id']);

            if ($voiture->statut !== 'active') {
                throw ValidationException::withMessages([
                    'voiture_id' => 'Cette voiture n’est pas disponible à la location.',
                ]);
            }

            $hasConflict = Reservation::query()
                ->where('voiture_id', $voiture->id)
                ->whereIn('statut', ['en_attente', 'confirmee', 'en_cours'])
                ->where('date_debut', '<', $end)
                ->where('date_fin', '>', $start)
                ->exists();

            if ($hasConflict) {
                throw ValidationException::withMessages([
                    'date_debut' => 'Cette voiture est déjà réservée sur cette période.',
                ]);
            }

            $bonPlan = isset($validated['bon_plan_id'])
                ? BonPlan::query()->lockForUpdate()->findOrFail($validated['bon_plan_id'])
                : null;

            if ($bonPlan !== null) {
                $this->assertBonPlanApplicable($bonPlan, $voiture, $start, $end);
            }

            $hourlyCents = $this->toCents((string) $voiture->prix_heure);
            $dailyCents = $this->toCents((string) $voiture->prix_jour);
            $total = $this->calculateTotal(
                $start,
                $end,
                (string) $voiture->prix_heure,
                (string) $voiture->prix_jour,
                $bonPlan,
            );

            $bonPlanApplied = $bonPlan !== null
                && $this->parseCents($total) < $this->calculateBaseTotalCents(
                    $this->billableHours($start, $end), $hourlyCents, $dailyCents,
                );

            $reservation = Reservation::create([
                'voiture_id' => $voiture->id,
                'client_id' => $validated['client_id'],
                'bon_plan_id' => $bonPlanApplied ? $bonPlan->id : null,
                'date_debut' => $start,
                'date_fin' => $end,
                'prix_heure_applique' => $voiture->prix_heure,
                'prix_jour_applique' => $voiture->prix_jour,
                'caution_appliquee' => $voiture->caution,
                'bon_plan_nom_applique' => $bonPlanApplied ? $bonPlan->nom : null,
                'bon_plan_prix_applique' => $bonPlanApplied ? $bonPlan->prix_forfait : null,
                'km_prevu' => $validated['km_prevu'] ?? null,
                'total_prix' => $total,
                'statut' => 'en_attente',
            ]);

            if (! empty($validated['numero_permis'])) {
                $reservation->client()->update(['numero_permis' => $validated['numero_permis']]);
            }

            return $reservation;
        });
    }

    /**
     * Price billed hours at the cheaper hourly/daily rate, then compare valid package combinations.
     */
    public function calculateTotal(
        CarbonImmutable $start,
        CarbonImmutable $end,
        string $hourlyRate,
        string $dailyRate,
        ?BonPlan $bonPlan = null,
    ): string {
        $billableHours = $this->billableHours($start, $end);
        $hourlyCents = $this->toCents($hourlyRate);
        $dailyCents = $this->toCents($dailyRate);
        $baseTotalCents = $this->calculateBaseTotalCents($billableHours, $hourlyCents, $dailyCents);

        if ($bonPlan === null) {
            return $this->formatCents($baseTotalCents);
        }

        $packageHours = $bonPlan->duree_forfait_heures;
        $minimumHours = $bonPlan->duree_minimum_heures;
        $packagePriceCents = $this->toCents((string) $bonPlan->prix_forfait);

        if ($packageHours <= 0) {
            throw new \InvalidArgumentException('La durée du forfait doit être supérieure à zéro.');
        }

        if ($billableHours < $minimumHours || $billableHours < $packageHours) {
            throw ValidationException::withMessages([
                'bon_plan_id' => 'La durée de cette réservation ne permet pas d’appliquer ce bon plan.',
            ]);
        }

        $bestTotalCents = $baseTotalCents;
        $packageCount = intdiv($billableHours, $packageHours);

        for ($count = 1; $count <= $packageCount; $count++) {
            $remainingHours = $billableHours - ($count * $packageHours);
            $totalCents = ($count * $packagePriceCents)
                + $this->calculateBaseTotalCents($remainingHours, $hourlyCents, $dailyCents);
            $bestTotalCents = min($bestTotalCents, $totalCents);
        }

        return $this->formatCents($bestTotalCents);
    }

    private function assertBonPlanApplicable(
        BonPlan $bonPlan,
        Voiture $voiture,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): void {
        $isApplicable = $bonPlan->voitures()->whereKey($voiture->id)->exists()
            || (int) $bonPlan->voiture_id === (int) $voiture->id;

        if (! $isApplicable || ! $bonPlan->actif) {
            throw ValidationException::withMessages([
                'bon_plan_id' => 'Ce bon plan n’est pas actif pour cette voiture.',
            ]);
        }

        if (
            ($bonPlan->valide_du !== null && $start->lt($bonPlan->valide_du))
            || ($bonPlan->valide_au !== null && $end->gt($bonPlan->valide_au))
        ) {
            throw ValidationException::withMessages([
                'bon_plan_id' => 'Les dates de cette réservation sont en dehors de la période de validité du bon plan.',
            ]);
        }
    }

    private function billableHours(CarbonImmutable $start, CarbonImmutable $end): int
    {
        $durationSeconds = $end->getTimestamp() - $start->getTimestamp();

        if ($durationSeconds <= 0) {
            throw ValidationException::withMessages([
                'date_fin' => 'La date de fin doit être après la date de début.',
            ]);
        }

        return intdiv($durationSeconds + 3599, 3600);
    }

    private function calculateBaseTotalCents(int $hours, int $hourlyCents, int $dailyCents): int
    {
        $fullDays = intdiv($hours, 24);
        $remainingHours = $hours % 24;

        return ($fullDays * min(24 * $hourlyCents, $dailyCents))
            + min($remainingHours * $hourlyCents, $dailyCents);
    }

    private function formatCents(int $amount): string
    {
        return sprintf('%d.%02d', intdiv($amount, 100), $amount % 100);
    }

    private function toCents(string $amount): int
    {
        $totalCents = $this->parseCents($amount);

        if ($totalCents <= 0) {
            throw new \InvalidArgumentException('Le tarif doit être supérieur à zéro.');
        }

        return $totalCents;
    }

    private function parseCents(string $amount): int
    {
        if (! preg_match('/\A\d+(?:\.\d{1,2})?\z/', $amount)) {
            throw new \InvalidArgumentException('Le montant doit avoir deux décimales au maximum.');
        }

        [$euros, $cents] = array_pad(explode('.', $amount, 2), 2, '');

        return ((int) $euros * 100) + (int) str_pad($cents, 2, '0');
    }
}
