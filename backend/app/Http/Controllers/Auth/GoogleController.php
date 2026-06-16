<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $googleUser->getEmail())->first();

        if ($user) {
            if (! $user->google_id) {
                $user->forceFill(['google_id' => $googleUser->getId()])->save();
            }
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Skillomat user',
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
            ]);
        }

        $token = $user->createToken('auth')->plainTextToken;

        $target = rtrim(config('app.frontend_url'), '/').'/auth/google/callback#token='.$token;

        return redirect()->away($target);
    }
}
