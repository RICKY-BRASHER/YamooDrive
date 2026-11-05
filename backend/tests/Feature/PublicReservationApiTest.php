<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Models\Voiture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PublicReservationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    public function test_a_client_with_a_saved_permit_can_reserve_without_entering_it_again(): void
    {
        [$user, $client] = $this->createClient('CM-123-AB');
        $vehicle = $this->createVehicle();
        $start = now()->addDay()->startOfHour();

        $this->actingAs($user)
            ->postJson('/api/reservations', [
                'voiture_id' => $vehicle->id,
                'date_debut' => $start->toIso8601String(),
                'date_fin' => $start->copy()->addHours(2)->toIso8601String(),
            ])
            ->assertCreated()
            ->assertJsonPath('reservation.client_id', $client->id)
            ->assertJsonPath('reservation.total_prix', '20.00');

        $this->assertSame('CM-123-AB', $client->fresh()->numero_permis);
    }

    public function test_a_client_without_a_saved_permit_must_provide_it_and_it_is_saved(): void
    {
        [$user, $client] = $this->createClient(null);
        $vehicle = $this->createVehicle();
        $start = now()->addDay()->startOfHour();
        $reservation = [
            'voiture_id' => $vehicle->id,
            'date_debut' => $start->toIso8601String(),
            'date_fin' => $start->copy()->addHour()->toIso8601String(),
        ];

        $this->actingAs($user)
            ->postJson('/api/reservations', $reservation)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('numero_permis');

        $this->actingAs($user)
            ->postJson('/api/reservations', [...$reservation, 'numero_permis' => ' cm-456-de '])
            ->assertCreated();

        $this->assertSame('CM-456-DE', $client->fresh()->numero_permis);
    }

    /**
     * @return array{User, Client}
     */
    private function createClient(?string $licenseNumber): array
    {
        $user = User::create([
            'name' => 'Client Test',
            'email' => 'client@example.com',
            'password' => 'password-123',
        ]);
        $client = $user->client()->create([
            'nom' => 'Client Test',
            'email' => 'client@example.com',
            'telephone' => '+237699123456',
            'numero_permis' => $licenseNumber,
        ]);

        return [$user, $client];
    }

    private function createVehicle(): Voiture
    {
        return Voiture::create([
            'marque' => 'Toyota',
            'modele' => 'Corolla',
            'immatriculation' => 'AB-123-CD',
            'carburant' => 'essence',
            'boite' => 'manuelle',
            'prix_heure' => 10,
            'prix_jour' => 45,
            'caution' => 500,
            'km_actuel' => 25000,
            'statut' => 'active',
        ]);
    }
}
