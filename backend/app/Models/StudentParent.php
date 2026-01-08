<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentParent extends Model
{
    use HasFactory;

    protected $table = 'parents';

    protected $fillable = [
        'student_id',
        'name',
        'phone',
        'relationship',
        'photo',
        'receive_notification',
    ];

    protected $casts = [
        'receive_notification' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
