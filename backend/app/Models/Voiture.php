<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voiture extends Model
{
    protected $table = 'voitures';

    protected $fillable = [
        'marque',
        'modele',
        'immatriculation',
        'categorie',
        'image',
        'places',
        'carburant',
        'boite',
        'prix_heure',
        'prix_jour',
        'caution',
        'km_actuel',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'prix_heure' => 'decimal:2',
            'prix_jour' => 'decimal:2',
            'caution' => 'decimal:2',
            'km_actuel' => 'integer',
            'places' => 'integer',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function bonsPlans(): HasMany
    {
        return $this->hasMany(BonPlan::class);
    }

    public function offres(): BelongsToMany
    {
        return $this->belongsToMany(BonPlan::class, 'bon_plan_voiture');
    }
}
