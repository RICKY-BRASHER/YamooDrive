<?php

use App\Http\Controllers\Api\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::get('/', function () {
    return view('welcome');
});
