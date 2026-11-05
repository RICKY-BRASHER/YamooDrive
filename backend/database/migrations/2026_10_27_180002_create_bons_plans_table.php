<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bons_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voiture_id')->constrained('voitures')->restrictOnDelete();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->unsignedInteger('duree_forfait_heures');
            $table->unsignedInteger('duree_minimum_heures')->default(0);
            $table->decimal('prix_forfait', 12, 2);
            $table->boolean('actif')->default(true);
            $table->dateTime('valide_du')->nullable();
            $table->dateTime('valide_au')->nullable();
            $table->timestamps();
            $table->index(['voiture_id', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bons_plans');
    }
};
