<?php
/**
 * MASTER ACCOUNT SETUP
 * Upload ke: public_html/api/setup-master.php
 * Akses: https://absenulilalbab.com/api/setup-master.php
 * HAPUS FILE INI SETELAH DIGUNAKAN!
 */

require __DIR__ . '/../../backend/vendor/autoload.php';

$app = require __DIR__ . '/../../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Check if master already exists
$existing = User::where('email', 'master@absenulilalbab.com')->first();

if ($existing) {
    if ($existing->role === 'master') {
        echo "<h2>✅ Akun master sudah ada</h2>";
        echo "<p>Email: master@absenulilalbab.com</p>";
        echo "<p>Role: {$existing->role}</p>";
    } else {
        // Update role to master
        $existing->update(['role' => 'master']);
        echo "<h2>✅ Akun diupdate ke role master</h2>";
    }
} else {
    User::create([
        'name' => 'Master Admin',
        'email' => 'master@absenulilalbab.com',
        'password' => Hash::make('Master@2026!'),
        'role' => 'master',
    ]);
    echo "<h2>✅ Akun master berhasil dibuat</h2>";
    echo "<p><strong>Email:</strong> master@absenulilalbab.com</p>";
    echo "<p><strong>Password:</strong> Master@2026!</p>";
}

echo "<br><p style='color:red;font-weight:bold;'>⚠️ HAPUS FILE INI SEGERA SETELAH DIGUNAKAN!</p>";
