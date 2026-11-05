<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voiture_id')->constrained('voitures')->restrictOnDelete();
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();
            $table->foreignId('bon_plan_id')->nullable()->constrained('bons_plans')->restrictOnDelete();
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->decimal('prix_heure_applique', 10, 2);
            $table->decimal('prix_jour_applique', 10, 2);
            $table->decimal('caution_appliquee', 10, 2);
            $table->string('bon_plan_nom_applique')->nullable();
            $table->decimal('bon_plan_prix_applique', 12, 2)->nullable();
            $table->unsignedInteger('km_depart')->nullable();
            $table->unsignedInteger('km_prevu')->nullable();
            $table->decimal('total_prix', 10, 2);
            $table->enum('statut', ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee']);
            $table->timestamps();
            $table->index(['voiture_id', 'statut', 'date_debut', 'date_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
