<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AppSetting;
use App\Models\Classes;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Create Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
        ]);

        // Create Kepala Sekolah
        User::create([
            'name' => 'Kepala Sekolah',
            'email' => 'kepsek@sekolah.com',
            'password' => Hash::make('password123'),
            'role' => 'kepala_sekolah',
        ]);

        // Default app settings
        $settings = [
            'institution_name' => 'SMA Negeri 1',
            'default_tap_delay' => '300',
            'esp_api_key' => 'secret_api_key_here',
        ];

        foreach ($settings as $key => $value) {
            AppSetting::create(['key' => $key, 'value' => $value]);
        }

        // Sample classes
        $classes = [
            ['name' => 'X RPL 1', 'grade' => 'X', 'major' => 'RPL'],
            ['name' => 'X RPL 2', 'grade' => 'X', 'major' => 'RPL'],
            ['name' => 'XI RPL 1', 'grade' => 'XI', 'major' => 'RPL'],
            ['name' => 'XI RPL 2', 'grade' => 'XI', 'major' => 'RPL'],
            ['name' => 'XII RPL 1', 'grade' => 'XII', 'major' => 'RPL'],
            ['name' => 'XII RPL 2', 'grade' => 'XII', 'major' => 'RPL'],
        ];

        foreach ($classes as $class) {
            Classes::create($class);
        }

        // Sample categories
        $categories = [
            ['name' => 'Reguler', 'description' => 'Siswa reguler'],
            ['name' => 'Beasiswa', 'description' => 'Siswa penerima beasiswa'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // Sample locations
        $locations = [
            ['name' => 'Gerbang Utama', 'description' => 'Gerbang masuk utama sekolah'],
            ['name' => 'Gerbang Belakang', 'description' => 'Gerbang belakang sekolah'],
            ['name' => 'Ruang Kelas X RPL 1', 'description' => 'Kelas X RPL 1'],
            ['name' => 'Ruang Kelas XI RPL 1', 'description' => 'Kelas XI RPL 1'],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}
