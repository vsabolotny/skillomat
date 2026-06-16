<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_a_user_and_returns_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jane Traveler',
            'email' => 'jane@example.com',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        // Password must never be serialized back to the client.
        $response->assertJsonMissingPath('user.password');
    }

    public function test_register_rejects_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Someone',
            'email' => 'taken@example.com',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_register_requires_name_email_and_password(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_with_valid_credentials_returns_a_token(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => 'secret-password',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'secret-password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => 'secret-password',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_login_for_unknown_email_is_rejected(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'whatever-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
