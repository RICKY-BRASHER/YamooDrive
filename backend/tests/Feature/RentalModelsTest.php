<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Retour;
use App\Models\Voiture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_rental_models_are_linked(): void
    {
        $voiture = Voiture::create([
            'marque' => 'Renault',
            'modele' => 'Clio',
            'immatriculation' => 'AB-123-CD',
            'carburant' => 'essence',
            'boite' => 'manuelle',
            'prix_heure' => 10,
            'prix_jour' => 45,
            'caution' => 500,
            'km_actuel' => 25000,
            'statut' => 'active',
        ]);
        $client = Client::create([
            'nom' => 'Client Test',
            'email' => 'client@example.com',
            'telephone' => '0600000000',
            'numero_permis' => 'PERMIS-123',
            'date_naissance' => '1990-01-01',
        ]);
        $reservation = Reservation::create([
            'voiture_id' => $voiture->id,
            'client_id' => $client->id,
            'date_debut' => '2026-11-01 09:00:00',
            'date_fin' => '2026-11-03 09:00:00',
            'prix_heure_applique' => 10,
            'prix_jour_applique' => 45,
            'caution_appliquee' => 500,
            'km_depart' => 25000,
            'km_prevu' => 25200,
            'total_prix' => 90,
            'statut' => 'confirmee',
        ]);
        $paiement = Paiement::create([
            'reservation_id' => $reservation->id,
            'type' => 'location',
            'montant' => 90,
            'methode' => 'cb',
            'statut' => 'paye',
        ]);
        $retour = Retour::create([
            'reservation_id' => $reservation->id,
            'km_retour' => 25200,
            'carburant_retour' => 'plein',
            'frais_supplementaires' => 0,
        ]);

        $this->assertTrue($voiture->reservations->contains($reservation));
        $this->assertTrue($client->reservations->contains($reservation));
        $this->assertTrue($reservation->voiture->is($voiture));
        $this->assertTrue($reservation->client->is($client));
        $this->assertTrue($reservation->paiements->contains($paiement));
        $this->assertTrue($reservation->retour->is($retour));
        $this->assertTrue($paiement->reservation->is($reservation));
        $this->assertTrue($retour->reservation->is($reservation));
    }
}
