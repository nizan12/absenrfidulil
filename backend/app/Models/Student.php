<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfid_uid',
        'nis',
        'name',
        'photo',
        'class_id',
        'category_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function parents()
    {
        return $this->hasMany(StudentParent::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function getLastTapAttribute()
    {
        return $this->attendanceLogs()->latest('tapped_at')->first();
    }
}
