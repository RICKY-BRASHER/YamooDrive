<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminUserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_admin_with_a_verified_email_and_hashed_password(): void
    {
        $this->artisan('admin:create', ['email' => 'ADMIN@example.com'])
            ->expectsQuestion('Nom affiché', 'Yamoo Admin')
            ->expectsQuestion('Mot de passe (12 caractères minimum)', 'a-unique-and-strong-password')
            ->expectsQuestion('Confirmez le mot de passe', 'a-unique-and-strong-password')
            ->expectsOutputToContain('Compte administrateur créé et adresse vérifiée : admin@example.com')
            ->assertExitCode(0);

        $admin = User::where('email', 'admin@example.com')->firstOrFail();

        $this->assertSame('admin', $admin->role);
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('a-unique-and-strong-password', $admin->password));
    }

    public function test_it_does_not_overwrite_an_existing_account(): void
    {
        User::factory()->create(['email' => 'admin@example.com']);

        $this->artisan('admin:create', ['email' => 'admin@example.com'])
            ->expectsOutput('Un compte existe déjà avec cette adresse. Aucun compte n’a été modifié.')
            ->assertExitCode(1);

        $this->assertSame('client', User::where('email', 'admin@example.com')->firstOrFail()->role);
    }
}
