<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {email}';

    protected $description = 'Create a verified Yamoo Drive administrator account';

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Veuillez saisir une adresse e-mail valide.');

            return self::FAILURE;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error('Un compte existe déjà avec cette adresse. Aucun compte n’a été modifié.');

            return self::FAILURE;
        }

        $name = trim((string) $this->ask('Nom affiché', 'Administrateur Yamoo'));
        $password = $this->secret('Mot de passe (12 caractères minimum)');

        if (! is_string($password) || mb_strlen($password) < 12) {
            $this->error('Le mot de passe doit contenir au moins 12 caractères.');

            return self::FAILURE;
        }

        if ($password !== $this->secret('Confirmez le mot de passe')) {
            $this->error('Les mots de passe ne correspondent pas.');

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name !== '' ? $name : 'Administrateur Yamoo',
            'email' => $email,
            'password' => $password,
        ]);
        $user->forceFill([
            'email_verified_at' => now(),
            'role' => 'admin',
        ])->save();

        $this->info("Compte administrateur créé et adresse vérifiée : {$email}");

        return self::SUCCESS;
    }
}
