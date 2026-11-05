<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_user_and_client_and_sends_a_verification_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Aicha Kone',
            'email' => ' AICHA@EXAMPLE.COM ',
            'password' => 'password-123',
            'telephone' => '+237699123456',
            'role' => 'admin',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Compte créé. Consultez votre boîte mail pour vérifier votre adresse avant de vous connecter.');

        $user = User::where('email', 'aicha@example.com')->firstOrFail();
        $client = Client::where('user_id', $user->id)->firstOrFail();

        $this->assertGuest();
        $this->assertSame('client', $user->role);
        $this->assertSame('Aicha Kone', $client->nom);
        $this->assertSame('+237699123456', $client->telephone);
        $this->assertNull($client->numero_permis);
        $this->assertNull($client->date_naissance);
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_registration_links_to_an_existing_agency_client_without_losing_their_permit(): void
    {
        Notification::fake();
        $client = Client::create([
            'nom' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'telephone' => '+237699123456',
            'numero_permis' => 'CM-123-AB',
        ]);

        $this->postJson('/api/register', [
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
            'telephone' => '+237699123456',
        ])->assertCreated();

        $user = User::where('email', 'aicha@example.com')->firstOrFail();
        $this->assertSame($client->id, $user->client->id);
        $this->assertSame('CM-123-AB', $user->client->numero_permis);
        $this->assertSame(1, Client::where('email', 'aicha@example.com')->count());
    }

    public function test_registration_rejects_an_existing_email(): void
    {
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
            'password' => 'password-123',
        ]);

        $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'password' => 'password-123',
            'telephone' => '+237699123456',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_registration_requires_a_valid_cameroonian_phone_number(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
            'telephone' => '+23712345',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('telephone');
    }

    public function test_user_and_client_mutators_normalize_profile_data(): void
    {
        $user = User::make([
            'name' => '  Aicha Kone  ',
            'email' => ' AICHA@EXAMPLE.COM ',
            'password' => 'password-123',
        ]);
        $client = Client::make([
            'nom' => '  Aicha Kone ',
            'email' => ' AICHA@EXAMPLE.COM ',
            'telephone' => '(699) 123-456',
            'numero_permis' => ' cm-123-ab ',
        ]);

        $this->assertSame('Aicha Kone', $user->name);
        $this->assertSame('aicha@example.com', $user->email);
        $this->assertSame('Aicha Kone', $client->nom);
        $this->assertSame('aicha@example.com', $client->email);
        $this->assertSame('+237699123456', $client->telephone);
        $this->assertSame('CM-123-AB', $client->numero_permis);
        $this->assertNull(Client::make(['numero_permis' => '  '])->numero_permis);
    }

    public function test_a_registered_user_can_log_in(): void
    {
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);
        $user->client()->create([
            'nom' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'telephone' => '+237699123456',
            'numero_permis' => 'CM-123-AB',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->postJson('/api/login', [
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ])->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.licenseNumber', 'CM-123-AB');

        $this->assertAuthenticatedAs($user);
    }

    public function test_an_admin_can_use_the_same_login_endpoint_and_receives_the_admin_role(): void
    {
        $admin = User::create([
            'name' => 'Yamoo Admin',
            'email' => 'admin@gmail.com',
            'password' => 'a-strong-admin-password',
        ]);
        $admin->forceFill([
            'email_verified_at' => now(),
            'role' => 'admin',
        ])->save();

        $this->postJson('/api/login', [
            'email' => 'admin@gmail.com',
            'password' => 'a-strong-admin-password',
        ])->assertOk()
            ->assertJsonPath('user.id', $admin->id)
            ->assertJsonPath('user.role', 'admin');

        $this->assertAuthenticatedAs($admin);
        $this->assertNull($admin->client()->first());
    }

    public function test_an_authenticated_session_can_retrieve_its_user(): void
    {
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.name', 'Aicha Kone')
            ->assertJsonPath('user.email', 'aicha@example.com');
    }

    public function test_a_guest_cannot_retrieve_the_authenticated_user(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_update_their_profile_and_client_details(): void
    {
        Notification::fake();
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);
        $client = $user->client()->create([
            'nom' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'telephone' => '+237699123456',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->actingAs($user)
            ->patchJson('/api/profile', [
                'name' => ' Aicha Njoya ',
                'email' => ' AICHA.NJOYA@EXAMPLE.COM ',
                'current_password' => 'password-123',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Aicha Njoya')
            ->assertJsonPath('user.email', 'aicha.njoya@example.com')
            ->assertJsonPath('emailVerificationRequired', true);

        $this->assertSame('Aicha Njoya', $client->fresh()->nom);
        $this->assertSame('aicha.njoya@example.com', $client->fresh()->email);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_profile_password_changes_require_the_current_password_and_confirmation(): void
    {
        $user = User::create([
            'name' => 'Yamoo Admin',
            'email' => 'admin@example.com',
            'password' => 'old-password-123',
        ]);

        $this->actingAs($user)
            ->patchJson('/api/profile', [
                'name' => 'Yamoo Admin',
                'email' => 'admin@example.com',
                'current_password' => 'wrong-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->actingAs($user)
            ->patchJson('/api/profile', [
                'name' => 'Yamoo Admin',
                'email' => 'admin@example.com',
                'current_password' => 'old-password-123',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_an_authenticated_user_can_log_out(): void
    {
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);

        $this->actingAs($user)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertGuest();
    }

    public function test_an_unverified_user_receives_another_verification_email_instead_of_logging_in(): void
    {
        Notification::fake();
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ])->assertForbidden()
            ->assertJsonPath('code', 'email_not_verified');

        $this->assertGuest();
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'aicha@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_a_signed_verification_link_marks_the_email_as_verified(): void
    {
        $user = User::create([
            'name' => 'Aicha Kone',
            'email' => 'aicha@example.com',
            'password' => 'password-123',
        ]);
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->get($verificationUrl)
            ->assertRedirect('http://localhost:3000/?email_verified=1');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
