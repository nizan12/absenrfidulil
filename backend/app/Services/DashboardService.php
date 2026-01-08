<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\AttendanceLog;
use App\Models\TeacherAttendanceLog;
use App\Models\EspDevice;
use Carbon\Carbon;

class DashboardService
{
    public function getStatistics()
    {
        $today = Carbon::today();
        
        return [
            'total_students' => Student::where('is_active', true)->count(),
            'total_teachers' => Teacher::where('is_active', true)->count(),
            'total_classes' => Classes::count(),
            'total_devices' => EspDevice::where('is_active', true)->count(),
            'today_attendance' => $this->getTodayAttendance(),
            'weekly_attendance' => $this->getWeeklyAttendance(),
            'monthly_attendance' => $this->getMonthlyAttendance(),
        ];
    }

    public function getTodayAttendance()
    {
        $today = Carbon::today();
        
        $studentsIn = AttendanceLog::whereDate('tapped_at', $today)
            ->where('tap_type', 'in')
            ->distinct('student_id')
            ->count('student_id');

        $studentsOut = AttendanceLog::whereDate('tapped_at', $today)
            ->where('tap_type', 'out')
            ->distinct('student_id')
            ->count('student_id');

        $teachersIn = TeacherAttendanceLog::whereDate('tapped_at', $today)
            ->where('tap_type', 'in')
            ->distinct('teacher_id')
            ->count('teacher_id');

        return [
            'students_in' => $studentsIn,
            'students_out' => $studentsOut,
            'teachers_in' => $teachersIn,
            'total_taps' => AttendanceLog::whereDate('tapped_at', $today)->count(),
        ];
    }

    public function getWeeklyAttendance()
    {
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        
        $data = [];
        for ($date = $startOfWeek->copy(); $date <= $endOfWeek; $date->addDay()) {
            $dayName = $date->format('D');
            $data[$dayName] = AttendanceLog::whereDate('tapped_at', $date)
                ->where('tap_type', 'in')
                ->distinct('student_id')
                ->count('student_id');
        }

        return $data;
    }

    public function getMonthlyAttendance()
    {
        $data = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M');
            $data[$monthName] = AttendanceLog::whereYear('tapped_at', $month->year)
                ->whereMonth('tapped_at', $month->month)
                ->where('tap_type', 'in')
                ->distinct('student_id')
                ->count('student_id');
        }

        return $data;
    }

    public function getRecentLogs($limit = 10)
    {
        return AttendanceLog::with(['student.class', 'espDevice.location'])
            ->latest('tapped_at')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'student_name' => $log->student->name,
                    'class' => $log->student->class->name ?? '-',
                    'tap_type' => $log->tap_type,
                    'location' => $log->espDevice->location->name ?? $log->espDevice->name ?? '-',
                    'tapped_at' => $log->tapped_at->format('Y-m-d H:i:s'),
                    'time_ago' => $log->tapped_at->diffForHumans(),
                ];
            });
    }
}
