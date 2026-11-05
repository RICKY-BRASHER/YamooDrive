<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BonPlan extends Model
{
    protected $table = 'bons_plans';

    protected $fillable = [
        'voiture_id',
        'nom',
        'description',
        'duree_forfait_heures',
        'duree_minimum_heures',
        'prix_forfait',
        'actif',
        'valide_du',
        'valide_au',
    ];

    protected function casts(): array
    {
        return [
            'duree_forfait_heures' => 'integer',
            'duree_minimum_heures' => 'integer',
            'prix_forfait' => 'decimal:2',
            'actif' => 'boolean',
            'valide_du' => 'datetime',
            'valide_au' => 'datetime',
        ];
    }

    public function voiture(): BelongsTo
    {
        return $this->belongsTo(Voiture::class);
    }

    public function voitures(): BelongsToMany
    {
        return $this->belongsToMany(Voiture::class, 'bon_plan_voiture');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
