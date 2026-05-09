<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterUserSeeder extends Seeder
{
    public function run()
    {
        User::updateOrCreate(
            ['email' => 'master@absenulilalbab.com'],
            [
                'name' => 'Master Admin',
                'password' => Hash::make('Master@2026!'),
                'role' => 'master',
            ]
        );

        $this->command->info('Master account created: master@absenulilalbab.com');
    }
}
