<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware('throttle:10,1');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('throttle:6,1');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('throttle:6,1');

    Route::get('/google/redirect', [GoogleController::class, 'redirect']);
    Route::get('/google/callback', [GoogleController::class, 'callback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', fn (Request $request) => $request->user());
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    });
});
