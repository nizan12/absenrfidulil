<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLateStatusToAttendanceLogs extends Migration
{
    public function up()
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->string('late_status', 20)->default('on_time')->after('tap_type');
            // Values: 'on_time', 'tolerated', 'late'
        });
    }

    public function down()
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropColumn('late_status');
        });
    }
}
