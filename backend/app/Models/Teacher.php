<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfid_uid',
        'nip',
        'name',
        'phone',
        'photo',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function attendanceLogs()
    {
        return $this->hasMany(TeacherAttendanceLog::class);
    }

    public function getLastTapAttribute()
    {
        return $this->attendanceLogs()->latest('tapped_at')->first();
    }
}
