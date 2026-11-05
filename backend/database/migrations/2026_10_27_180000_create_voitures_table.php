<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voitures', function (Blueprint $table) {
            $table->id();
            $table->string('marque');
            $table->string('modele');
            $table->string('immatriculation')->unique();
            $table->enum('carburant', ['essence', 'diesel', 'hybride', 'electrique', 'gpl']);
            $table->enum('boite', ['manuelle', 'automatique']);
            $table->decimal('prix_heure', 10, 2);
            $table->decimal('prix_jour', 10, 2);
            $table->decimal('caution', 10, 2);
            $table->unsignedInteger('km_actuel');
            $table->enum('statut', ['active', 'maintenance', 'hors_service'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voitures');
    }
};
