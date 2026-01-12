<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link to email
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan dalam sistem',
            ], 404);
        }

        // Generate token
        $token = Str::random(64);

        // Delete existing tokens for this email
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Insert new token
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        // Build reset URL (use APP_URL since frontend is on same domain)
        $frontendUrl = rtrim(config('app.url'), '/');
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        // Get settings for logo
        $settings = \App\Models\AppSetting::first();
        $logoUrl = null;
        if ($settings && $settings->institution_logo) {
            $logoUrl = $frontendUrl . '/storage/' . $settings->institution_logo;
        }
        $institutionName = $settings->institution_name ?? 'Sistem Absensi RFID';

        // Send email
        try {
            Mail::send('emails.password-reset', [
                'resetUrl' => $resetUrl, 
                'user' => $user,
                'logoUrl' => $logoUrl,
                'institutionName' => $institutionName,
            ], function ($message) use ($user) {
                $message->to($user->email);
                $message->subject('Reset Password - Sistem Absensi RFID');
            });

            return response()->json([
                'success' => true,
                'message' => 'Link reset password telah dikirim ke email Anda',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid atau sudah kadaluarsa',
            ], 400);
        }

        // Check if token is expired (15 minutes)
        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addMinutes(15)->isPast()) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Token sudah kadaluarsa, silakan request ulang',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid',
            ], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan',
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete token
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset, silakan login',
        ]);
    }
}
