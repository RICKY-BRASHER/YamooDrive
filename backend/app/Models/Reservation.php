<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    protected $table = 'reservations';

    protected $fillable = [
        'voiture_id',
        'client_id',
        'bon_plan_id',
        'date_debut',
        'date_fin',
        'prix_heure_applique',
        'prix_jour_applique',
        'caution_appliquee',
        'bon_plan_nom_applique',
        'bon_plan_prix_applique',
        'km_depart',
        'km_prevu',
        'total_prix',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'datetime',
            'date_fin' => 'datetime',
            'prix_heure_applique' => 'decimal:2',
            'prix_jour_applique' => 'decimal:2',
            'caution_appliquee' => 'decimal:2',
            'bon_plan_prix_applique' => 'decimal:2',
            'km_depart' => 'integer',
            'km_prevu' => 'integer',
            'total_prix' => 'decimal:2',
        ];
    }

    public function voiture(): BelongsTo
    {
        return $this->belongsTo(Voiture::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function bonPlan(): BelongsTo
    {
        return $this->belongsTo(BonPlan::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function retour(): HasOne
    {
        return $this->hasOne(Retour::class);
    }
}
