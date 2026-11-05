<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([ 
            'name' => ['required', 'string', 'min:2', 'max:255'], 
            'email' => ['required', 'email', 'max:255', 'unique:users,email'], 
            'password' => ['required', 'string', 'min:8'], 
            'telephone' => ['required', 'string', 'regex:/^\+237[26]\d{8}$/'], 
        ], [ 
            'required' => 'Entrez tous les champs.',
            'unique' => 'Cet email a déjà été utilisé.',
            'regex' => 'Mauvais format de téléphone.',
            'password.min' => 'Entrez au moins 8 caractères.',
            'email' => 'Entrez une adresse mail valide.',
        ]);


        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            // Reuse an agency-created profile so its existing permit and booking history stay attached.
            $client = Client::query()
                ->where('email', $validated['email'])
                ->lockForUpdate()
                ->first();

            if ($client !== null) {
                if ($client->user_id !== null) {
                    throw ValidationException::withMessages([
                        'email' => 'Cette adresse e-mail est déjà associée à un compte client.',
                    ]);
                }

                $client->user()->associate($user);
                $client->save();
            } else {
                $user->client()->create([
                    'nom' => $validated['name'],
                    'email' => $validated['email'],
                    'telephone' => $validated['telephone'],
                ]);
            }

            return $user;
        });

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Compte créé. Consultez votre boîte mail pour vérifier votre adresse avant de vous connecter.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->input('email'))),
        ]);

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();

            return response()->json([
                'code' => 'email_not_verified',
                'message' => 'Votre adresse e-mail n’est pas encore vérifiée. Un nouveau lien vient de vous être envoyé.',
            ], 403);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    public function currentUser(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json(['user' => $this->userPayload($user)]);
    }

    private function userPayload(User $user): array
    {
        // Include the saved permit so the booking form only requests it when the profile is missing one.
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'client',
            'licenseNumber' => $user->client?->numero_permis,
        ];
    }
}
