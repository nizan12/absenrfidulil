<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EspDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_code',
        'name',
        'location_id',
        'type',
        'is_active',
        'tap_delay_seconds',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tap_delay_seconds' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function teacherAttendanceLogs()
    {
        return $this->hasMany(TeacherAttendanceLog::class);
    }
}
