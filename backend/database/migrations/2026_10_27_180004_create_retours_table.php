<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->unique()->constrained('reservations')->restrictOnDelete();
            $table->unsignedInteger('km_retour');
            $table->enum('carburant_retour', ['vide', 'quart', 'moitie', 'trois_quarts', 'plein']);
            $table->text('degats')->nullable();
            $table->decimal('frais_supplementaires', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retours');
    }
};
