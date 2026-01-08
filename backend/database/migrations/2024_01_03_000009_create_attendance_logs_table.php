<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAttendanceLogsTable extends Migration
{
    public function up()
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('esp_device_id')->nullable()->constrained('esp_devices')->onDelete('set null');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('tap_type', ['in', 'out'])->default('in');
            $table->timestamp('tapped_at');
            $table->boolean('wa_sent')->default(false);
            $table->timestamps();

            $table->index(['student_id', 'tapped_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance_logs');
    }
}
