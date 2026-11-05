<?php

namespace Tests\Feature;

use App\Events\AdminActivity;
use App\Models\Client;
use App\Models\User;
use App\Models\Voiture;
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminDataApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_create_and_list_a_vehicle(): void
    {
        $admin = $this->createAdmin();
        Storage::fake('public');
        Queue::fake();

        $this->actingAs($admin)
            ->postJson('/api/admin/vehicles', [
                'marque' => 'Toyota',
                'modele' => 'Corolla',
                'immatriculation' => 'AB-123-CD',
                'categorie' => 'Berline',
                'image' => UploadedFile::fake()->createWithContent(
                    'corolla.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rWQAAAAASUVORK5CYII=', true) ?: '',
                ),
                'places' => 5,
                'carburant' => 'hybride',
                'boite' => 'automatique',
                'prix_heure' => 5000,
                'prix_jour' => 35000,
                'caution' => 100000,
                'km_actuel' => 42000,
            ])
            ->assertCreated()
            ->assertJsonPath('vehicle.marque', 'Toyota')
            ->assertJsonPath('vehicle.immatriculation', 'AB-123-CD');

        Queue::assertPushed(BroadcastEvent::class, fn (BroadcastEvent $event): bool =>
            $event->event instanceof AdminActivity
            && $event->event->activity === 'vehicle.created'
        );

        $vehicle = Voiture::query()->where('immatriculation', 'AB-123-CD')->firstOrFail();
        $imagePath = $vehicle->image;
        $this->assertIsString($imagePath);
        Storage::disk('public')->assertExists($imagePath);
        $this->assertDatabaseHas('voitures', [
            'marque' => 'Toyota',
            'immatriculation' => 'AB-123-CD',
            'categorie' => 'Berline',
            'places' => 5,
            'km_actuel' => 42000,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/vehicles')
            ->assertOk()
            ->assertJsonPath('vehicles.0.immatriculation', 'AB-123-CD');

        $this->actingAs($admin)
            ->patchJson('/api/admin/vehicles/'.$vehicle->id.'/status', ['statut' => 'maintenance'])
            ->assertOk()
            ->assertJsonPath('vehicle.statut', 'maintenance');

        Queue::assertPushed(BroadcastEvent::class, fn (BroadcastEvent $event): bool =>
            $event->event instanceof AdminActivity
            && $event->event->activity === 'vehicle.updated'
        );
    }

    public function test_an_admin_can_create_and_list_a_client(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->postJson('/api/admin/clients', [
                'nom' => 'Aïcha Koné',
                'email' => ' AICHA@EXAMPLE.COM ',
                'telephone' => '+237699123456',
                'numero_permis' => ' cm-123-ab ',
                'date_naissance' => '1992-04-15',
            ])
            ->assertCreated()
            ->assertJsonPath('client.nom', 'Aïcha Koné')
            ->assertJsonPath('client.email', 'aicha@example.com')
            ->assertJsonPath('client.numero_permis', 'CM-123-AB');

        $this->assertDatabaseHas('clients', [
            'nom' => 'Aïcha Koné',
            'email' => 'aicha@example.com',
            'telephone' => '+237699123456',
            'numero_permis' => 'CM-123-AB',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/clients')
            ->assertOk()
            ->assertJsonPath('clients.0.email', 'aicha@example.com');
    }

    public function test_non_admins_cannot_create_vehicles_or_clients(): void
    {
        $user = User::create([
            'name' => 'Client',
            'email' => 'client@example.com',
            'password' => 'password-123',
        ]);

        $this->actingAs($user)
            ->postJson('/api/admin/vehicles', [])
            ->assertForbidden();

        $this->actingAs($user)
            ->postJson('/api/admin/clients', [])
            ->assertForbidden();

        $this->assertSame(0, Voiture::count());
        $this->assertSame(0, Client::count());
    }

    public function test_guests_cannot_list_admin_data(): void
    {
        $this->getJson('/api/admin/vehicles')->assertUnauthorized();
        $this->getJson('/api/admin/clients')->assertUnauthorized();
    }

    private function createAdmin(): User
    {
        $admin = User::create([
            'name' => 'Yamoo Admin',
            'email' => 'admin@example.com',
            'password' => 'password-123',
        ]);
        $admin->forceFill(['role' => 'admin'])->save();

        return $admin;
    }
}
