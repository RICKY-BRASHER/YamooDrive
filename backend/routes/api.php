<?php

use App\Http\Controllers\Api\AdminDataController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RentalController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/csrf-cookie', fn () => response()->json(['csrf' => true]));
    Route::get('/catalog', [RentalController::class, 'catalog']);
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::get('/user', [AuthController::class, 'currentUser'])->middleware('auth');
    Route::patch('/profile', [AuthController::class, 'updateProfile'])->middleware('auth');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::get('/my/reservations', [RentalController::class, 'myReservations'])->middleware('auth');
    Route::post('/reservations', [RentalController::class, 'storePublicReservation'])->middleware('auth');

    Route::middleware('auth')->prefix('admin')->group(function () {
        Route::get('/vehicles', [AdminDataController::class, 'vehicles']);
        Route::post('/vehicles', [AdminDataController::class, 'storeVehicle']);
        Route::patch('/vehicles/{vehicle}/status', [RentalController::class, 'updateVehicleStatus']);
        Route::get('/clients', [AdminDataController::class, 'clients']);
        Route::post('/clients', [AdminDataController::class, 'storeClient']);
        Route::get('/offers', [RentalController::class, 'offers']);
        Route::post('/offers', [RentalController::class, 'storeOffer']);
        Route::patch('/offers/{offer}/status', [RentalController::class, 'updateOfferStatus']);
        Route::get('/reservations', [RentalController::class, 'reservations']);
        Route::post('/reservations', [RentalController::class, 'storeAdminReservation']);
        Route::patch('/reservations/{reservation}/status', [RentalController::class, 'updateReservationStatus']);
        Route::post('/reservations/{reservation}/payments', [RentalController::class, 'recordPayment']);
        Route::post('/reservations/{reservation}/return', [RentalController::class, 'storeReturn']);
    });
});
