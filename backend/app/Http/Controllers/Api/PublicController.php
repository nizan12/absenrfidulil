<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\AttendanceLog;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicController extends Controller
{
    // Get public settings (logo, institution name)
    public function getSettings()
    {
        $settings = AppSetting::whereIn('key', ['institution_name', 'institution_logo', 'institution_address'])
            ->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }
    // Search students by name or parent name (case insensitive)
    public function searchStudents(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $students = Student::with(['class'])
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                // Search by student name
                $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                  // Search by parent name
                  ->orWhereHas('parents', function ($parentQuery) use ($query) {
                      $parentQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%']);
                  });
            })
            ->limit(10)
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'class' => $student->class->name ?? '-',
                    'photo' => $student->photo,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    // Get student attendance log
    public function getStudentLog(Request $request, $studentId)
    {
        $student = Student::with(['class', 'parents'])->find($studentId);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Siswa tidak ditemukan',
            ], 404);
        }

        $dateFrom = $request->get('date_from', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));

        $logs = AttendanceLog::with(['espDevice.location'])
            ->where('student_id', $studentId)
            ->whereDate('tapped_at', '>=', $dateFrom)
            ->whereDate('tapped_at', '<=', $dateTo)
            ->orderBy('tapped_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'tap_type' => $log->tap_type,
                    'location' => $log->espDevice->location->name ?? $log->espDevice->name ?? '-',
                    'tapped_at' => $log->tapped_at->format('Y-m-d H:i:s'),
                    'date' => $log->tapped_at->format('Y-m-d'),
                    'time' => $log->tapped_at->format('H:i:s'),
                ];
            });

        // Get today's status
        $todayLogs = AttendanceLog::where('student_id', $studentId)
            ->whereDate('tapped_at', Carbon::today())
            ->orderBy('tapped_at', 'asc')
            ->get();
        
        $todayStatus = [
            'has_attendance' => $todayLogs->count() > 0,
            'first_tap' => $todayLogs->first() ? [
                'type' => $todayLogs->first()->tap_type,
                'time' => $todayLogs->first()->tapped_at->format('H:i:s'),
            ] : null,
            'last_tap' => $todayLogs->last() ? [
                'type' => $todayLogs->last()->tap_type,
                'time' => $todayLogs->last()->tapped_at->format('H:i:s'),
            ] : null,
            'total_taps' => $todayLogs->count(),
        ];

        // Get monthly stats
        $startOfMonth = Carbon::now()->startOfMonth();
        $monthlyLogs = AttendanceLog::where('student_id', $studentId)
            ->whereBetween('tapped_at', [$startOfMonth, Carbon::now()])
            ->get();
        
        $daysPresent = $monthlyLogs->groupBy(fn($log) => $log->tapped_at->format('Y-m-d'))->count();
        
        // Count working days passed
        $workingDays = 0;
        $current = $startOfMonth->copy();
        while ($current <= Carbon::now()) {
            if (!$current->isWeekend()) $workingDays++;
            $current->addDay();
        }
        
        $monthlyStats = [
            'days_present' => $daysPresent,
            'working_days' => $workingDays,
            'percentage' => $workingDays > 0 ? round(($daysPresent / $workingDays) * 100) : 0,
            'month_name' => Carbon::now()->locale('id')->monthName,
        ];

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->class->name ?? '-',
                'photo' => $student->photo,
                'parents' => $student->parents->map(fn($p) => [
                    'name' => $p->name,
                    'phone' => $p->phone,
                    'relationship' => $p->relationship,
                ]),
            ],
            'logs' => $logs,
            'today_status' => $todayStatus,
            'monthly_stats' => $monthlyStats,
        ]);
    }

    // Get today's live feed for public display
    public function getLiveFeed()
    {
        $today = Carbon::today();
        
        $logs = AttendanceLog::with(['student.class', 'espDevice.location'])
            ->whereDate('tapped_at', $today)
            ->orderBy('tapped_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => 'student',
                    'name' => $log->student->name,
                    'class' => $log->student->class->name ?? '-',
                    'photo' => $log->student->photo,
                    'tap_type' => $log->tap_type,
                    'location' => $log->espDevice->location->name ?? $log->espDevice->name ?? '-',
                    'tapped_at' => $log->tapped_at->format('H:i:s'),
                    'time_ago' => $log->tapped_at->diffForHumans(),
                ];
            });

        $stats = [
            'total_in' => AttendanceLog::whereDate('tapped_at', $today)
                ->where('tap_type', 'in')->count(),
            'total_out' => AttendanceLog::whereDate('tapped_at', $today)
                ->where('tap_type', 'out')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'logs' => $logs,
                'stats' => $stats,
                'date' => $today->format('l, d F Y'),
                'time' => Carbon::now()->format('H:i:s'),
            ],
        ]);
    }
}
