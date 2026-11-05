<?php

namespace App\Http\Controllers\Api;

use App\Events\AdminActivity;
use App\Http\Controllers\Controller;
use App\Models\BonPlan;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Retour;
use App\Models\User;
use App\Models\Voiture;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RentalController extends Controller
{
    public function catalog(): JsonResponse
    {
        return response()->json([
            'vehicles' => Voiture::query()
                ->where('statut', 'active')
                ->withCount(['reservations as active_rentals_count' => fn ($query) => $query->where('statut', 'en_cours')])
                ->orderBy('id')
                ->get(),
            'offers' => BonPlan::query()
                ->where('actif', true)
                ->with(['voitures', 'voiture'])
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function updateVehicleStatus(Request $request, Voiture $vehicle): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'statut' => ['required', Rule::in(['active', 'maintenance', 'hors_service'])],
        ]);

        $vehicle->update($validated);
        AdminActivity::dispatch('vehicle.updated', 'A vehicle availability status changed.', $vehicle->id);

        return response()->json(['vehicle' => $vehicle]);
    }

    public function offers(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'offers' => BonPlan::query()
                ->withCount('reservations')
                ->with(['voitures', 'voiture'])
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function storeOffer(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duree_forfait_heures' => ['required', 'integer', 'min:1', 'max:8760'],
            'duree_minimum_heures' => ['required', 'integer', 'min:1', 'max:8760'],
            'prix_forfait' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'voiture_ids' => ['required', 'array', 'min:1'],
            'voiture_ids.*' => ['required', 'integer', 'distinct', 'exists:voitures,id'],
        ]);

        $offer = DB::transaction(function () use ($validated): BonPlan {
            $offer = BonPlan::create([
                'voiture_id' => $validated['voiture_ids'][0],
                'nom' => $validated['nom'],
                'description' => $validated['description'] ?? null,
                'duree_forfait_heures' => $validated['duree_forfait_heures'],
                'duree_minimum_heures' => $validated['duree_minimum_heures'],
                'prix_forfait' => $validated['prix_forfait'],
                'actif' => true,
            ]);
            $offer->voitures()->sync($validated['voiture_ids']);

            return $offer->load(['voitures', 'voiture'])->loadCount('reservations');
        });

        AdminActivity::dispatch('offer.created', 'A new rental offer was created.', $offer->id);

        return response()->json(['offer' => $offer], 201);
    }

    public function updateOfferStatus(Request $request, BonPlan $offer): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate(['actif' => ['required', 'boolean']]);
        $offer->update($validated);
        AdminActivity::dispatch('offer.updated', 'A rental offer status changed.', $offer->id);

        return response()->json(['offer' => $offer->load(['voitures', 'voiture'])]);
    }

    public function reservations(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'reservations' => Reservation::query()
                ->with(['client', 'voiture', 'bonPlan', 'paiements', 'retour'])
                ->latest()
                ->get(),
        ]);
    }

    public function myReservations(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === 'client', 403);
        $client = $user->client;
        abort_unless($client instanceof Client, 404, 'Client profile not found.');

        return response()->json([
            'reservations' => Reservation::query()
                ->where('client_id', $client->id)
                ->with(['client', 'voiture', 'bonPlan', 'paiements', 'retour'])
                ->latest()
                ->get(),
        ]);
    }

    public function storeAdminReservation(Request $request, ReservationService $service): JsonResponse
    {
        $this->authorizeAdmin($request);
        $clientId = $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
        ])['client_id'];
        $client = Client::query()->findOrFail($clientId);
        $validated = $request->validate([
            'voiture_id' => ['required', 'integer', 'exists:voitures,id'],
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'bon_plan_id' => ['nullable', 'integer', 'exists:bons_plans,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'numero_permis' => [
                $client->numero_permis ? 'nullable' : 'required',
                'string',
                'min:3',
                'max:255',
                Rule::unique('clients', 'numero_permis')->ignore($client->id),
            ],
            'km_prevu' => ['nullable', 'integer', 'min:0'],
        ]);
        $validated['numero_permis'] = $client->numero_permis ?? $validated['numero_permis'];

        $reservation = $service->create($validated);
        $reservation->load(['client', 'voiture', 'bonPlan', 'paiements', 'retour']);
        AdminActivity::dispatch('reservation.created', 'A reservation was created.', $reservation->id);

        return response()->json(['reservation' => $reservation], 201);
    }

    public function storePublicReservation(Request $request, ReservationService $service): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === 'client', 403);
        $client = $user->client;
        abort_unless($client instanceof Client, 404, 'Client profile not found.');

        $validated = $request->validate([
            'voiture_id' => ['required', 'integer', 'exists:voitures,id'],
            'bon_plan_id' => ['nullable', 'integer', 'exists:bons_plans,id'],
            'date_debut' => ['required', 'date', 'after:now'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'numero_permis' => [
                $client->numero_permis ? 'nullable' : 'required',
                'string',
                'min:3',
                'max:255',
                Rule::unique('clients', 'numero_permis')->ignore($client->id),
            ],
        ]);
        $validated['numero_permis'] = $client->numero_permis ?? $validated['numero_permis'];
        $validated['client_id'] = $client->id;

        $reservation = $service->create($validated);
        $reservation->load(['client', 'voiture', 'bonPlan', 'paiements', 'retour']);
        AdminActivity::dispatch('reservation.created', 'A customer submitted a booking request.', $reservation->id);

        return response()->json(['reservation' => $reservation], 201);
    }

    public function updateReservationStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'statut' => ['required', Rule::in(['en_attente', 'confirmee', 'en_cours', 'annulee'])],
        ]);
        $nextStatus = $validated['statut'];
        $allowedTransitions = [
            'en_attente' => ['confirmee', 'annulee'],
            'confirmee' => ['en_cours', 'annulee'],
            'en_cours' => ['annulee'],
            'terminee' => [],
            'annulee' => [],
        ];

        if (! in_array($nextStatus, $allowedTransitions[$reservation->statut] ?? [], true)) {
            throw ValidationException::withMessages([
                'statut' => 'This status transition is not allowed.',
            ]);
        }

        if ($nextStatus === 'en_cours') {
            $reservation->km_depart ??= $reservation->voiture()->value('km_actuel');
        }
        $reservation->update(['statut' => $nextStatus, 'km_depart' => $reservation->km_depart]);

        AdminActivity::dispatch('reservation.updated', 'A reservation status changed.', $reservation->id);

        return response()->json([
            'reservation' => $reservation->fresh()->load(['client', 'voiture', 'bonPlan', 'paiements', 'retour']),
        ]);
    }

    public function recordPayment(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'type' => ['required', Rule::in(['location', 'caution'])],
            'montant' => ['required', 'numeric', 'gt:0', 'max:99999999.99'],
            'methode' => ['required', Rule::in(['cb', 'espece', 'mobile'])],
        ]);
        $payment = DB::transaction(function () use ($reservation, $validated): Paiement {
            $lockedReservation = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $targetAmount = $validated['type'] === 'location'
                ? (float) $lockedReservation->total_prix
                : (float) $lockedReservation->caution_appliquee;
            $paidAmount = (float) $lockedReservation->paiements()
                ->where('type', $validated['type'])
                ->where('statut', 'paye')
                ->sum('montant');
            $remainingCents = max(0, (int) round(($targetAmount - $paidAmount) * 100));
            $amountCents = (int) round((float) $validated['montant'] * 100);

            if ($amountCents > $remainingCents) {
                throw ValidationException::withMessages([
                    'montant' => 'The payment cannot exceed the remaining balance for this payment type.',
                ]);
            }

            return $lockedReservation->paiements()->create([
                ...$validated,
                'statut' => 'paye',
            ]);
        });
        AdminActivity::dispatch('payment.recorded', 'A payment was recorded for a reservation.', $reservation->id);

        return response()->json(['payment' => $payment], 201);
    }

    public function storeReturn(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($reservation->statut !== 'en_cours' || $reservation->retour()->exists()) {
            throw ValidationException::withMessages([
                'reservation' => 'Only active reservations can be returned, and each can have one return record.',
            ]);
        }

        $validated = $request->validate([
            'km_retour' => ['required', 'integer', 'min:0'],
            'carburant_retour' => ['required', Rule::in(['vide', 'quart', 'moitie', 'trois_quarts', 'plein'])],
            'degats' => ['nullable', 'string', 'max:5000'],
            'frais_supplementaires' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ]);

        if ($validated['km_retour'] < ($reservation->km_depart ?? 0)) {
            throw ValidationException::withMessages([
                'km_retour' => 'The return mileage cannot be lower than the departure mileage.',
            ]);
        }

        $return = DB::transaction(function () use ($reservation, $validated): Retour {
            $return = $reservation->retour()->create($validated);
            $reservation->update(['statut' => 'terminee']);
            $reservation->voiture()->update(['km_actuel' => $validated['km_retour']]);

            return $return;
        });

        AdminActivity::dispatch('reservation.returned', 'A vehicle return was recorded.', $reservation->id);

        return response()->json(['return' => $return], 201);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user() instanceof User && $request->user()->role === 'admin', 403, 'Accès réservé aux administrateurs.');
    }
}
