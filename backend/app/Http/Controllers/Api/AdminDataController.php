<?php

namespace App\Http\Controllers\Api;

use App\Events\AdminActivity;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Models\Voiture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminDataController extends Controller
{
    public function vehicles(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'vehicles' => Voiture::query()
                ->withCount(['reservations as active_rentals_count' => fn ($query) => $query->where('statut', 'en_cours')])
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function storeVehicle(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $request->merge([
            'immatriculation' => mb_strtoupper(trim((string) $request->input('immatriculation'))),
        ]);

        $validated = $request->validate([
            'marque' => ['required', 'string', 'max:255'],
            'modele' => ['required', 'string', 'max:255'],
            'immatriculation' => ['required', 'string', 'max:255', 'unique:voitures,immatriculation'],
            'categorie' => ['required', 'string', 'in:Citadine,SUV,Berline,Premium,Électrique'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'places' => ['required', 'integer', 'min:1', 'max:60'],
            'carburant' => ['required', 'in:essence,diesel,hybride,electrique,gpl'],
            'boite' => ['required', 'in:manuelle,automatique'],
            'prix_heure' => ['required', 'numeric', 'gt:0', 'max:99999999.99'],
            'prix_jour' => ['required', 'numeric', 'gt:0', 'max:99999999.99'],
            'caution' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'km_actuel' => ['required', 'integer', 'min:0'],
        ]);
        $imagePath = isset($validated['image'])
            ? $validated['image']->store('vehicles', 'public')
            : null;

        try {
            $vehicle = DB::transaction(fn (): Voiture => Voiture::create([
                ...$validated,
                'image' => $imagePath,
            ]));
        } catch (Throwable $exception) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $exception;
        }

        AdminActivity::dispatch('vehicle.created', 'Un véhicule a été ajouté à la flotte.', $vehicle->id);

        return response()->json(['vehicle' => $vehicle], 201);
    }

    public function clients(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'clients' => Client::query()->withCount('reservations')->orderBy('id')->get(),
        ]);
    }

    public function storeClient(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->input('email'))),
            'numero_permis' => mb_strtoupper(trim((string) $request->input('numero_permis'))),
        ]);

        $client = Client::create($request->validate([
            'nom' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:clients,email', 'unique:users,email'],
            'telephone' => ['required', 'string', 'max:40'],
            'numero_permis' => ['required', 'string', 'min:3', 'max:255', 'unique:clients,numero_permis'],
            'date_naissance' => ['nullable', 'date', 'before_or_equal:today'],
        ]));
        AdminActivity::dispatch('client.created', 'Un nouveau profil client a été créé.', $client->id);

        return response()->json(['client' => $client], 201);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user() instanceof User && $request->user()->role === 'admin', 403, 'Accès réservé aux administrateurs.');
    }
}
