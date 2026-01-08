<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPhotoToParentsTable extends Migration
{
    public function up()
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('relationship');
        });
    }

    public function down()
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
}
