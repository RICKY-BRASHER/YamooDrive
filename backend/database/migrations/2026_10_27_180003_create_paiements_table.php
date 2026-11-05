<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->restrictOnDelete();
            $table->enum('type', ['location', 'caution']);
            $table->decimal('montant', 10, 2);
            $table->enum('methode', ['cb', 'espece','mobile']);
            $table->enum('statut', ['en_attente', 'paye', 'echoue', 'rembourse']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
