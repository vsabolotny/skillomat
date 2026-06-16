<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;

class ResetPasswordNotification extends BaseResetPassword
{
    /**
     * The reset link lives in the SPA, not on the API host, so point users at
     * the frontend route that renders the "set a new password" form.
     */
    protected function resetUrl(mixed $notifiable): string
    {
        return rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }
}
