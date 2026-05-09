<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Add 'master' to role ENUM
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('master','super_admin','kepala_sekolah','staff_admin','guru_piket','operator') DEFAULT 'operator'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('super_admin','kepala_sekolah','staff_admin','guru_piket','operator') DEFAULT 'operator'");
    }
};
