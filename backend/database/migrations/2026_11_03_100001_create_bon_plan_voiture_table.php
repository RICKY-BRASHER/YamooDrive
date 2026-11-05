<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bon_plan_voiture', function (Blueprint $table) {
            $table->foreignId('bon_plan_id')->constrained('bons_plans')->cascadeOnDelete();
            $table->foreignId('voiture_id')->constrained('voitures')->cascadeOnDelete();
            $table->primary(['bon_plan_id', 'voiture_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bon_plan_voiture');
    }
};
