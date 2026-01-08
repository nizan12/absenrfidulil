<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEspDevicesTable extends Migration
{
    public function up()
    {
        Schema::create('esp_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_code')->unique();
            $table->string('name');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->enum('type', ['gate_in', 'gate_out', 'classroom'])->default('gate_in');
            $table->boolean('is_active')->default(true);
            $table->integer('tap_delay_seconds')->default(300); // 5 minutes default
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('esp_devices');
    }
}
