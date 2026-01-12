<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\EspDevice;
use App\Models\AttendanceLog;
use App\Models\TeacherAttendanceLog;
use Carbon\Carbon;

class TapService
{
    protected $fonnteService;

    public function __construct(FonnteService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

    public function processStudentTap($deviceCode, $rfidUid)
    {
        // Find the device
        $device = EspDevice::where('device_code', $deviceCode)
            ->where('is_active', true)
            ->first();

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Device not found or inactive',
                'code' => 'DEVICE_NOT_FOUND'
            ];
        }

        // Find the student
        $student = Student::where('rfid_uid', $rfidUid)
            ->where('is_active', true)
            ->with('class')
            ->first();

        if (!$student) {
            return [
                'success' => false,
                'message' => 'Kartu tidak terdaftar',
                'code' => 'STUDENT_NOT_FOUND'
            ];
        }

        // Check tap delay
        $lastTap = AttendanceLog::where('student_id', $student->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();
        $delaySeconds = $device->tap_delay_seconds ?? 300; // Default 5 minutes

        if ($lastTap && $now->diffInSeconds($lastTap->tapped_at) < $delaySeconds) {
            $remainingSeconds = $delaySeconds - $now->diffInSeconds($lastTap->tapped_at);
            $remainingMinutes = ceil($remainingSeconds / 60);
            
            return [
                'success' => false,
                'message' => "Tunggu {$remainingMinutes} menit lagi",
                'code' => 'TAP_TOO_SOON',
                'student' => [
                    'name' => $student->name,
                    'class' => $student->class->name ?? '-'
                ]
            ];
        }

        // Determine tap type (in/out) - only based on TODAY's last tap
        $todayLastTap = AttendanceLog::where('student_id', $student->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->latest('tapped_at')
            ->first();
        
        $tapType = 'in';
        if ($todayLastTap && $todayLastTap->tap_type === 'in') {
            $tapType = 'out';
        }

        // Create attendance log
        $attendanceLog = AttendanceLog::create([
            'student_id' => $student->id,
            'esp_device_id' => $device->id,
            'tap_type' => $tapType,
            'tapped_at' => $now,
            'wa_sent' => false,
        ]);

        // Send WhatsApp notification
        $locationName = $device->location->name ?? $device->name;
        $waResults = $this->fonnteService->sendStudentNotification(
            $student,
            $tapType,
            $locationName,
            $now
        );

        // Update wa_sent status
        $waSent = !empty(array_filter($waResults, fn($r) => $r['success'] ?? false));
        $attendanceLog->update(['wa_sent' => $waSent]);

        $message = $tapType === 'in' 
            ? "Selamat datang, {$student->name}!" 
            : "Sampai jumpa, {$student->name}!";

        $result = [
            'success' => true,
            'message' => $message,
            'tap_type' => $tapType,
            'wa_sent' => $waSent,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'class' => $student->class->name ?? '-',
                'photo' => $student->photo,
            ],
            'location' => $locationName,
            'tapped_at' => $now->format('H:i:s'),
        ];

        // Broadcast event for real-time updates
        event(new \App\Events\AttendanceTapped($result, 'student'));

        return $result;
    }

    public function processTeacherTap($deviceCode, $rfidUid)
    {
        // Find the device
        $device = EspDevice::where('device_code', $deviceCode)
            ->where('is_active', true)
            ->first();

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Device not found or inactive',
                'code' => 'DEVICE_NOT_FOUND'
            ];
        }

        // Find the teacher
        $teacher = Teacher::where('rfid_uid', $rfidUid)
            ->where('is_active', true)
            ->first();

        if (!$teacher) {
            return [
                'success' => false,
                'message' => 'Kartu guru tidak terdaftar',
                'code' => 'TEACHER_NOT_FOUND'
            ];
        }

        // Check tap delay
        $lastTap = TeacherAttendanceLog::where('teacher_id', $teacher->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();
        $delaySeconds = $device->tap_delay_seconds ?? 300;

        if ($lastTap && $now->diffInSeconds($lastTap->tapped_at) < $delaySeconds) {
            $remainingSeconds = $delaySeconds - $now->diffInSeconds($lastTap->tapped_at);
            $remainingMinutes = ceil($remainingSeconds / 60);
            
            return [
                'success' => false,
                'message' => "Tunggu {$remainingMinutes} menit lagi",
                'code' => 'TAP_TOO_SOON',
                'teacher' => [
                    'name' => $teacher->name,
                    'nip' => $teacher->nip
                ]
            ];
        }

        // Determine tap type - only based on TODAY's last tap
        $todayLastTap = TeacherAttendanceLog::where('teacher_id', $teacher->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->latest('tapped_at')
            ->first();
        
        $tapType = 'in';
        if ($todayLastTap && $todayLastTap->tap_type === 'in') {
            $tapType = 'out';
        }

        // Create attendance log
        $attendanceLog = TeacherAttendanceLog::create([
            'teacher_id' => $teacher->id,
            'esp_device_id' => $device->id,
            'tap_type' => $tapType,
            'tapped_at' => $now,
            'wa_sent' => false,
        ]);

        // Send WhatsApp to principal (only for classroom devices)
        $waSent = false;
        if ($device->type === 'classroom') {
            $locationName = $device->location->name ?? $device->name;
            $waResult = $this->fonnteService->sendTeacherNotification(
                $teacher,
                $tapType,
                $locationName,
                $now
            );
            $waSent = $waResult['success'] ?? false;
            $attendanceLog->update(['wa_sent' => $waSent]);
        }

        $message = $tapType === 'in' 
            ? "Selamat datang, {$teacher->name}!" 
            : "Sampai jumpa, {$teacher->name}!";

        $result = [
            'success' => true,
            'message' => $message,
            'tap_type' => $tapType,
            'wa_sent' => $waSent,
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'nip' => $teacher->nip,
                'photo' => $teacher->photo,
            ],
            'location' => $device->location->name ?? $device->name,
            'tapped_at' => $now->format('H:i:s'),
        ];

        // Broadcast event for real-time updates
        event(new \App\Events\AttendanceTapped($result, 'teacher'));

        return $result;
    }
}
