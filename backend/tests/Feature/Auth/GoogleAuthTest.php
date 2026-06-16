<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogleUser(string $id, string $email, string $name): void
    {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn($id);
        $googleUser->shouldReceive('getEmail')->andReturn($email);
        $googleUser->shouldReceive('getName')->andReturn($name);
        $googleUser->shouldReceive('getNickname')->andReturn(null);

        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    public function test_callback_creates_a_user_and_redirects_with_a_token(): void
    {
        $this->fakeGoogleUser('google-123', 'jane@example.com', 'Jane Traveler');

        $response = $this->get('/api/auth/google/callback?code=fake-code');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'http://localhost:5173/auth/google/callback#token=',
            $response->headers->get('Location'),
        );

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'google_id' => 'google-123',
        ]);
    }

    public function test_callback_logs_in_an_existing_google_user_without_duplicating(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'google_id' => 'google-123',
        ]);

        $this->fakeGoogleUser('google-123', 'jane@example.com', 'Jane Traveler');

        $this->get('/api/auth/google/callback?code=fake-code')->assertRedirect();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_callback_links_google_to_an_existing_email_account(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'google_id' => null,
        ]);

        $this->fakeGoogleUser('google-999', 'jane@example.com', 'Jane Traveler');

        $this->get('/api/auth/google/callback?code=fake-code')->assertRedirect();

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'google_id' => 'google-999',
        ]);
    }
}
