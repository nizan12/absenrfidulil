<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'esp_device_id',
        'recorded_by',
        'tap_type',
        'tapped_at',
        'wa_sent',
    ];

    protected $casts = [
        'tapped_at' => 'datetime',
        'wa_sent' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function espDevice()
    {
        return $this->belongsTo(EspDevice::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
