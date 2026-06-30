<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Transport\SesTransport;
use Illuminate\Support\Facades\Mail;
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

    public function test_reset_notification_links_to_the_frontend_with_token(): void
    {
        // The default ResetPassword notification builds its link from a
        // `password.reset` named route this API app does not define; ours must point
        // at the SPA reset form and carry the token + email as query params.
        config(['app.frontend_url' => 'https://app.example.test']);
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $mail = (new ResetPasswordNotification('reset-token-123'))->toMail($user);

        $this->assertStringStartsWith('https://app.example.test/reset-password?', $mail->actionUrl);
        $this->assertStringContainsString('token=reset-token-123', $mail->actionUrl);
        $this->assertStringContainsString('email=jane%40example.com', $mail->actionUrl);
    }

    public function test_ses_mailer_resolves(): void
    {
        // Production sends via the `ses` mailer, which needs aws/aws-sdk-php. Without
        // the SDK this only surfaces as a runtime 500 on forgot-password in prod, so
        // assert the transport actually builds here.
        config([
            'mail.default' => 'ses',
            'services.ses' => ['key' => 'test', 'secret' => 'test', 'region' => 'us-east-1'],
        ]);

        $transport = Mail::mailer('ses')->getSymfonyTransport();

        $this->assertInstanceOf(SesTransport::class, $transport);
    }
}
