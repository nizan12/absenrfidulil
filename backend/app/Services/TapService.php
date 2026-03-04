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

    public function processStudentTap($deviceCode, $rfidUid, $forceTapType = null)
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

        // Find the student with category
        $student = Student::where('rfid_uid', $rfidUid)
            ->where('is_active', true)
            ->with(['class', 'category'])
            ->first();

        if (!$student) {
            return [
                'success' => false,
                'message' => 'Kartu tidak terdaftar',
                'code' => 'STUDENT_NOT_FOUND'
            ];
        }

        // Check tap delay - use Carbon::parse to ensure consistent timezone
        $lastTap = AttendanceLog::where('student_id', $student->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();
        $delaySeconds = $device->tap_delay_seconds ?? 300; // Default 5 minutes

        if ($lastTap) {
            $lastTapTime = Carbon::parse($lastTap->tapped_at);
            $secondsSinceLastTap = $now->diffInSeconds($lastTapTime, false);
            
            // Use absolute value for comparison (diffInSeconds can be negative)
            if (abs($secondsSinceLastTap) < $delaySeconds) {
                $remainingSeconds = $delaySeconds - abs($secondsSinceLastTap);
                
                // Format message based on remaining time
                if ($remainingSeconds >= 60) {
                    $remainingMinutes = ceil($remainingSeconds / 60);
                    $waitMessage = "Tunggu {$remainingMinutes} menit lagi";
                } else {
                    $waitMessage = "Tunggu {$remainingSeconds} detik lagi";
                }
                
                return [
                    'success' => false,
                    'message' => $waitMessage,
                    'code' => 'TAP_TOO_SOON',
                    'remaining_seconds' => $remainingSeconds,
                    'student' => [
                        'name' => $student->name,
                        'class' => $student->class->name ?? '-'
                    ]
                ];
            }
        }

        // Determine tap type based on student category and today's taps
        // Count today's taps for boarding logic
        $todayTapCount = AttendanceLog::where('student_id', $student->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->count();
        
        $todayLastTap = AttendanceLog::where('student_id', $student->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->latest('tapped_at')
            ->first();
        
        // Check if student is boarding (case-insensitive check)
        $isBoarding = false;
        if ($student->category) {
            $categoryName = strtolower(trim($student->category->name));
            $isBoarding = str_contains($categoryName, 'boarding') || $categoryName === 'asrama';
        }

        // Determine tap type - ALTERNATING for all students (boarding and regular)
        // For complex boarding cases, use manual tap with forced tap_type
        $tapType = 'in'; // Default first tap is always IN
        
        // If forceTapType is provided (from manual tap), use it directly
        if ($forceTapType !== null && in_array($forceTapType, ['in', 'out'])) {
            $tapType = $forceTapType;
        } else if ($todayTapCount > 0) {
            // Simple alternating logic for everyone
            $tapType = ($todayLastTap->tap_type === 'in') ? 'out' : 'in';
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
            $now,
            $isBoarding
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
            'is_boarding' => $isBoarding,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'class' => $student->class->name ?? '-',
                'category' => $student->category->name ?? 'Full Day',
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
                'message' => 'Kartu tidak terdaftar',
                'code' => 'TEACHER_NOT_FOUND'
            ];
        }

        // Check tap delay
        $lastTap = TeacherAttendanceLog::where('teacher_id', $teacher->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();
        $delaySeconds = $device->tap_delay_seconds ?? 300;

        if ($lastTap) {
            $lastTapTime = Carbon::parse($lastTap->tapped_at);
            $secondsSinceLastTap = $now->diffInSeconds($lastTapTime, false);
            
            if (abs($secondsSinceLastTap) < $delaySeconds) {
                $remainingSeconds = $delaySeconds - abs($secondsSinceLastTap);
                $remainingMinutes = ceil($remainingSeconds / 60);
                
                return [
                    'success' => false,
                    'message' => "Tunggu {$remainingMinutes} menit lagi",
                    'code' => 'TAP_TOO_SOON',
                    'remaining_seconds' => $remainingSeconds,
                    'teacher' => [
                        'name' => $teacher->name,
                        'nip' => $teacher->nip
                    ]
                ];
            }
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
