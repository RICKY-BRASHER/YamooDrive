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

    public function test_a_client_can_only_view_their_own_reservation_history(): void
    {
        [$firstUser, $firstClient] = $this->createClient('CM-123-AB');
        [$secondUser] = $this->createClient('CM-456-CD', 'second@example.com');
        $firstVehicle = $this->createVehicle();
        $secondVehicle = Voiture::create([
            'marque' => 'Honda',
            'modele' => 'Civic',
            'immatriculation' => 'EF-456-GH',
            'carburant' => 'essence',
            'boite' => 'automatique',
            'prix_heure' => 12,
            'prix_jour' => 50,
            'caution' => 500,
            'km_actuel' => 30000,
            'statut' => 'active',
        ]);
        $start = now()->addDay()->startOfHour();

        $this->actingAs($firstUser)->postJson('/api/reservations', [
            'voiture_id' => $firstVehicle->id,
            'date_debut' => $start->toIso8601String(),
            'date_fin' => $start->copy()->addHours(2)->toIso8601String(),
        ])->assertCreated();
        $this->actingAs($secondUser)->postJson('/api/reservations', [
            'voiture_id' => $secondVehicle->id,
            'date_debut' => $start->copy()->addDays(2)->toIso8601String(),
            'date_fin' => $start->copy()->addDays(2)->addHours(2)->toIso8601String(),
        ])->assertCreated();

        $this->actingAs($firstUser)
            ->getJson('/api/my/reservations')
            ->assertOk()
            ->assertJsonCount(1, 'reservations')
            ->assertJsonPath('reservations.0.client_id', $firstClient->id);
    }

    public function test_an_admin_cannot_read_the_client_reservation_history_endpoint(): void
    {
        $admin = User::create([
            'name' => 'Yamoo Admin',
            'email' => 'admin@example.com',
            'password' => 'password-123',
        ]);
        $admin->forceFill(['role' => 'admin'])->save();

        $this->actingAs($admin)->getJson('/api/my/reservations')->assertForbidden();
    }

    /**
     * @return array{User, Client}
     */
    private function createClient(?string $licenseNumber, string $email = 'client@example.com'): array
    {
        $user = User::create([
            'name' => 'Client Test',
            'email' => $email,
            'password' => 'password-123',
        ]);
        $client = $user->client()->create([
            'nom' => 'Client Test',
            'email' => $email,
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
