<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeacherAttendanceLogsTable extends Migration
{
    public function up()
    {
        Schema::create('teacher_attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->foreignId('esp_device_id')->nullable()->constrained('esp_devices')->onDelete('set null');
            $table->enum('tap_type', ['in', 'out'])->default('in');
            $table->timestamp('tapped_at');
            $table->boolean('wa_sent')->default(false);
            $table->timestamps();

            $table->index(['teacher_id', 'tapped_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('teacher_attendance_logs');
    }
}
