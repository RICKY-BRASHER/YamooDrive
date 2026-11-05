<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Retour extends Model
{
    protected $table = 'retours';

    protected $fillable = [
        'reservation_id',
        'km_retour',
        'carburant_retour',
        'degats',
        'frais_supplementaires',
    ];

    protected function casts(): array
    {
        return [
            'km_retour' => 'integer',
            'frais_supplementaires' => 'decimal:2',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
