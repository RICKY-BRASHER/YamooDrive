<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $table = 'clients';

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'numero_permis',
        'date_naissance',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
        ];
    }

    protected function nom(): Attribute
    {
        return Attribute::make(
            set: fn (string $value): string => trim($value),
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => ($email = mb_strtolower(trim((string) $value))) === '' ? null : $email,
        );
    }

    protected function telephone(): Attribute
    {
        return Attribute::make(
            set: function (string $value): string {
                $digits = preg_replace('/\D+/', '', $value) ?? '';
                if (str_starts_with($digits, '00237')) {
                    $digits = substr($digits, 5);
                } elseif (str_starts_with($digits, '237')) {
                    $digits = substr($digits, 3);
                }

                return strlen($digits) === 9 ? '+237'.$digits : trim($value);
            },
        );
    }

    protected function numeroPermis(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => ($permit = mb_strtoupper(trim((string) $value))) === '' ? null : $permit,
        );
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
