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

    // =====================================================
    // STUDENT TAP
    // =====================================================

    public function processStudentTap($deviceCode, $rfidUid, $forceTapType = null)
    {
        // Find the device
        $device = EspDevice::where('device_code', $deviceCode)
            ->where('is_active', true)
            ->first();

        if (!$device) {

            return [
                'success' => false,

                // TAMBAHAN UNTUK LCD ESP32
                'nama' => '',
                'pesan' => 'DEVICE ERROR',

                // RESPONSE LAMA
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

                // TAMBAHAN UNTUK LCD ESP32
                'nama' => '',
                'pesan' => 'KARTU TIDAK TERDAFTAR',

                // RESPONSE LAMA
                'message' => 'Kartu tidak terdaftar',
                'code' => 'STUDENT_NOT_FOUND'
            ];
        }

        // Check tap delay
        $lastTap = AttendanceLog::where('student_id', $student->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();

        $delaySeconds = $device->tap_delay_seconds ?? 300;

        if ($lastTap) {

            $lastTapTime = Carbon::parse($lastTap->tapped_at);

            $secondsSinceLastTap =
                $now->diffInSeconds($lastTapTime, false);

            if (abs($secondsSinceLastTap) < $delaySeconds) {

                $remainingSeconds =
                    $delaySeconds - abs($secondsSinceLastTap);

                // Format delay text
                if ($remainingSeconds >= 60) {

                    $remainingMinutes =
                        ceil($remainingSeconds / 60);

                    $waitMessage =
                        "Tunggu {$remainingMinutes} menit";
                }

                else {

                    $waitMessage =
                        "Tunggu {$remainingSeconds} detik lagi";
                }

                return [

                    'success' => false,

                    // TAMBAHAN UNTUK LCD ESP32
                    'pesan' => 'TUNGGU DULU',
                    'nama' => $waitMessage,

                    // RESPONSE LAMA
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

        // Count today's taps
        $todayTapCount = AttendanceLog::where('student_id', $student->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->count();

        $todayLastTap = AttendanceLog::where('student_id', $student->id)
            ->whereDate('tapped_at', $now->toDateString())
            ->latest('tapped_at')
            ->first();

        // Check boarding
        $isBoarding = false;

        if ($student->category) {

            $categoryName =
                strtolower(trim($student->category->name));

            $isBoarding =
                str_contains($categoryName, 'boarding') ||
                $categoryName === 'asrama';
        }

        // Determine tap type
        $tapType = 'in';

        if (
            $forceTapType !== null &&
            in_array($forceTapType, ['in', 'out'])
        ) {

            $tapType = $forceTapType;
        }

        else if ($todayTapCount > 0) {

            $tapType =
                ($todayLastTap->tap_type === 'in')
                ? 'out'
                : 'in';
        }

        // =====================================================
        // LATE STATUS CHECK
        // =====================================================
        // Non-Boarding: hanya cek keterlambatan di tap IN PERTAMA hari ini
        // Boarding: cek setiap tap IN (karena aturan jam kembali ke asrama)
        // =====================================================
        $lateStatus = 'on_time';

        $isFirstInToday = ($todayTapCount === 0 && $tapType === 'in');

        if ($tapType === 'in' && ($isBoarding || $isFirstInToday)) {
            // Get settings
            $lateTimeRegular = \App\Models\AppSetting::get('late_time_regular', '07:30');
            $lateTimeBoarding = \App\Models\AppSetting::get('late_time_boarding', '17:00');
            $toleranceMinutes = (int) \App\Models\AppSetting::get('late_tolerance_minutes', 15);

            // Determine which time limit applies
            $limitTime = $isBoarding ? $lateTimeBoarding : $lateTimeRegular;

            // Parse limit time for today
            $limitCarbon = Carbon::createFromFormat('H:i', $limitTime)->setDate($now->year, $now->month, $now->day);
            $toleranceCarbon = $limitCarbon->copy()->addMinutes($toleranceMinutes);

            if ($now->gt($toleranceCarbon)) {
                $lateStatus = 'late';
            } elseif ($now->gt($limitCarbon)) {
                $lateStatus = 'tolerated';
            }
        }

        // Save attendance
        $attendanceLog = AttendanceLog::create([
            'student_id' => $student->id,
            'esp_device_id' => $device->id,
            'tap_type' => $tapType,
            'late_status' => $lateStatus,
            'tapped_at' => $now,
            'wa_sent' => false,
        ]);

        // Send WhatsApp
        $locationName =
            $device->location->name ?? $device->name;

        $waResults =
            $this->fonnteService->sendStudentNotification(
                $student,
                $tapType,
                $locationName,
                $now,
                $isBoarding,
                $lateStatus
            );

        // Update wa_sent
        $waSent =
            !empty(array_filter(
                $waResults,
                fn($r) => $r['success'] ?? false
            ));

        $attendanceLog->update([
            'wa_sent' => $waSent
        ]);

        // Message
        $message =
            $tapType === 'in'
            ? "Selamat datang, {$student->name}!"
            : "Sampai jumpa, {$student->name}!";

        // Late status message for LCD
        $lcdPesan = $tapType === 'in' ? 'SELAMAT DATANG' : 'SAMPAI JUMPA';
        if ($lateStatus === 'late') {
            $lcdPesan = 'TERLAMBAT!';
        } elseif ($lateStatus === 'tolerated') {
            $lcdPesan = 'HAMPIR TERLAMBAT';
        }

        // Result
        $result = [

            'success' => true,

            // TAMBAHAN UNTUK LCD ESP32
            'nama' => $student->name,
            'pesan' => $lcdPesan,

            // RESPONSE LAMA
            'message' => $message,

            'tap_type' => $tapType,
            'late_status' => $lateStatus,
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

            'tapped_at' =>
                $now->format('H:i:s'),
        ];

        // Broadcast event
        event(
            new \App\Events\AttendanceTapped(
                $result,
                'student'
            )
        );

        return $result;
    }

    // =====================================================
    // TEACHER TAP
    // =====================================================

    public function processTeacherTap($deviceCode, $rfidUid)
    {
        // Find device
        $device = EspDevice::where('device_code', $deviceCode)
            ->where('is_active', true)
            ->first();

        if (!$device) {

            return [
                'success' => false,

                // LCD
                'nama' => '',
                'pesan' => 'DEVICE ERROR',

                // RESPONSE LAMA
                'message' => 'Device not found or inactive',
                'code' => 'DEVICE_NOT_FOUND'
            ];
        }

        // Find teacher
        $teacher = Teacher::where('rfid_uid', $rfidUid)
            ->where('is_active', true)
            ->first();

        if (!$teacher) {

            return [
                'success' => false,

                // LCD
                'nama' => 'TERDAFTAR',
                'pesan' => 'KARTU TIDAK',

                // RESPONSE LAMA
                'message' => 'Kartu tidak terdaftar',
                'code' => 'TEACHER_NOT_FOUND'
            ];
        }

        // Check delay
        $lastTap = TeacherAttendanceLog::where('teacher_id', $teacher->id)
            ->latest('tapped_at')
            ->first();

        $now = Carbon::now();

        $delaySeconds = $device->tap_delay_seconds ?? 300;

        if ($lastTap) {

            $lastTapTime =
                Carbon::parse($lastTap->tapped_at);

            $secondsSinceLastTap =
                $now->diffInSeconds($lastTapTime, false);

            if (abs($secondsSinceLastTap) < $delaySeconds) {

                $remainingSeconds =
                    $delaySeconds - abs($secondsSinceLastTap);

                $remainingMinutes =
                    ceil($remainingSeconds / 60);

                $waitMessage =
                    "Tunggu {$remainingMinutes} menit lagi";

                return [

                    'success' => false,

                    // LCD
                    'pesan' => 'TUNGGU DULU',
                    'nama' => $waitMessage,

                    // RESPONSE LAMA
                    'message' => $waitMessage,
                    'code' => 'TAP_TOO_SOON',
                    'remaining_seconds' => $remainingSeconds,

                    'teacher' => [
                        'name' => $teacher->name,
                        'nip' => $teacher->nip
                    ]
                ];
            }
        }

        // Today's tap
        $todayLastTap =
            TeacherAttendanceLog::where('teacher_id', $teacher->id)
                ->whereDate('tapped_at', $now->toDateString())
                ->latest('tapped_at')
                ->first();

        $tapType = 'in';

        if (
            $todayLastTap &&
            $todayLastTap->tap_type === 'in'
        ) {

            $tapType = 'out';
        }

        // Save attendance
        $attendanceLog = TeacherAttendanceLog::create([
            'teacher_id' => $teacher->id,
            'esp_device_id' => $device->id,
            'tap_type' => $tapType,
            'tapped_at' => $now,
            'wa_sent' => false,
        ]);

        // Send WhatsApp
        $waSent = false;

        if ($device->type === 'classroom') {

            $locationName =
                $device->location->name ?? $device->name;

            $waResult =
                $this->fonnteService->sendTeacherNotification(
                    $teacher,
                    $tapType,
                    $locationName,
                    $now
                );

            $waSent = $waResult['success'] ?? false;

            $attendanceLog->update([
                'wa_sent' => $waSent
            ]);
        }

        // Message
        $message =
            $tapType === 'in'
            ? "Selamat datang, {$teacher->name}!"
            : "Sampai jumpa, {$teacher->name}!";

        // Result
        $result = [

            'success' => true,

            // LCD
            'nama' => $teacher->name,

            'pesan' =>
                $tapType === 'in'
                ? 'SELAMAT DATANG'
                : 'SAMPAI JUMPA',

            // RESPONSE LAMA
            'message' => $message,

            'tap_type' => $tapType,
            'wa_sent' => $waSent,

            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'nip' => $teacher->nip,
                'photo' => $teacher->photo,
            ],

            'location' =>
                $device->location->name ?? $device->name,

            'tapped_at' =>
                $now->format('H:i:s'),
        ];

        // Broadcast
        event(
            new \App\Events\AttendanceTapped(
                $result,
                'teacher'
            )
        );

        return $result;
    }
}