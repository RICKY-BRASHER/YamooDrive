<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voitures', function (Blueprint $table) {
            $table->string('categorie')->default('Citadine');
            $table->text('image')->nullable();
            $table->unsignedTinyInteger('places')->default(5);
        });
    }

    public function down(): void
    {
        Schema::table('voitures', function (Blueprint $table) {
            $table->dropColumn(['categorie', 'image', 'places']);
        });
    }
};
