<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasswordResetLinkRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class PasswordResetLinkController extends Controller
{
    public function store(PasswordResetLinkRequest $request): JsonResponse
    {
        // Fire-and-forget: the response is identical whether or not the email
        // matches an account, so the endpoint can't be used to enumerate users.
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => __('If that email is registered, a reset link is on its way.'),
        ]);
    }
}
