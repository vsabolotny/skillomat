<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Report service health, including database connectivity.
     */
    public function show(): JsonResponse
    {
        try {
            DB::connection()->getPdo()->query('SELECT 1');
            $database = 'connected';
        } catch (Throwable) {
            $database = 'unreachable';
        }

        $ok = $database === 'connected';

        return response()->json([
            'status' => $ok ? 'ok' : 'degraded',
            'database' => $database,
        ], $ok ? 200 : 503);
    }
}
