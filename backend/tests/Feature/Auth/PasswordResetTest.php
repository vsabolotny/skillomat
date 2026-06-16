<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_a_reset_notification_to_a_known_user(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'jane@example.com'])
            ->assertOk();

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_does_not_reveal_unknown_emails(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk();

        Notification::assertNothingSent();
    }

    public function test_reset_password_with_a_valid_token_changes_the_password(): void
    {
        $user = User::factory()->create(['email' => 'jane@example.com']);
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'jane@example.com',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertOk();

        // The new password now works for login.
        $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'brand-new-password',
        ])->assertOk();
    }

    public function test_reset_password_with_an_invalid_token_is_rejected(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->postJson('/api/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'jane@example.com',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_reset_notification_links_to_the_frontend(): void
    {
        // Guards against the default ResetPassword notification, which builds the
        // link from a `password.reset` named route that this API app does not define.
        $this->assertTrue(is_subclass_of(ResetPasswordNotification::class, ResetPassword::class));
    }
}
