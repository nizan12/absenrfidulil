<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAttendanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'esp_device_id',
        'tap_type',
        'tapped_at',
        'wa_sent',
    ];

    protected $casts = [
        'tapped_at' => 'datetime',
        'wa_sent' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function espDevice()
    {
        return $this->belongsTo(EspDevice::class);
    }
}
