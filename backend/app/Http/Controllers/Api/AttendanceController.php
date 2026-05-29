<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\TeacherAttendanceLog;
use App\Models\Holiday;
use App\Models\Student;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AttendanceController extends Controller
{
    public function studentLogs(Request $request)
    {
        $query = AttendanceLog::with(['student.class', 'espDevice.location']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('tapped_at', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('tapped_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('tapped_at', '<=', $request->date_to);
        }

        if ($request->filled('tap_type')) {
            $query->where('tap_type', $request->tap_type);
        }

        if ($request->filled('class_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('class_id', $request->class_id);
            });
        }

        // Name search filter
        if ($request->filled('name')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->name . '%');
            });
        }

        $perPage = $request->get('per_page', 20);
        $logs = $query->latest('tapped_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function teacherLogs(Request $request)
    {
        $query = TeacherAttendanceLog::with(['teacher', 'espDevice.location']);

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('tapped_at', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('tapped_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('tapped_at', '<=', $request->date_to);
        }

        // Name search filter
        if ($request->filled('name')) {
            $query->whereHas('teacher', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->name . '%');
            });
        }

        $perPage = $request->get('per_page', 20);
        $logs = $query->latest('tapped_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function liveMonitor(Request $request)
    {
        $today = Carbon::today();
        
        $studentLogs = AttendanceLog::with(['student.class', 'espDevice.location'])
            ->whereDate('tapped_at', $today)
            ->latest('tapped_at')
            ->limit(50)
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

        $teacherLogs = TeacherAttendanceLog::with(['teacher', 'espDevice.location'])
            ->whereDate('tapped_at', $today)
            ->latest('tapped_at')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => 'teacher',
                    'name' => $log->teacher->name,
                    'nip' => $log->teacher->nip,
                    'photo' => $log->teacher->photo,
                    'tap_type' => $log->tap_type,
                    'location' => $log->espDevice->location->name ?? $log->espDevice->name ?? '-',
                    'tapped_at' => $log->tapped_at->format('H:i:s'),
                    'time_ago' => $log->tapped_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'students' => $studentLogs,
                'teachers' => $teacherLogs,
            ],
        ]);
    }

    /**
     * Student Attendance Recap — calculates present/absent days per student
     */
    public function studentRecap(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'class_id' => 'nullable|exists:classes,id',
            'name' => 'nullable|string',
        ]);

        $dateFrom = Carbon::parse($request->date_from)->startOfDay();
        $dateTo = Carbon::parse($request->date_to)->endOfDay();

        // 1. Get configured off-days (e.g. "0,6" = Sunday, Saturday)
        $offDaysSetting = AppSetting::get('school_off_days', '0,6');
        $offDays = array_map('intval', array_filter(explode(',', $offDaysSetting), fn($v) => $v !== ''));

        // 2. Get holidays in range
        $holidays = Holiday::whereBetween('date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        // 3. Calculate school days
        $period = CarbonPeriod::create($dateFrom, $dateTo);
        $schoolDays = [];
        $offDayCount = 0;
        $holidayCount = count(array_unique($holidays));

        foreach ($period as $date) {
            $dayOfWeek = $date->dayOfWeek; // 0=Sunday, 6=Saturday
            $dateStr = $date->toDateString();

            if (in_array($dayOfWeek, $offDays)) {
                $offDayCount++;
                continue;
            }

            if (in_array($dateStr, $holidays)) {
                continue;
            }

            $schoolDays[] = $dateStr;
        }

        $totalSchoolDays = count($schoolDays);

        // 4. Get students
        $studentQuery = Student::with('class')->where('is_active', true);

        if ($request->filled('class_id')) {
            $studentQuery->where('class_id', $request->class_id);
        }

        if ($request->filled('name')) {
            $studentQuery->where('name', 'like', '%' . $request->name . '%');
        }

        $students = $studentQuery->orderBy('name')->get();

        // 5. Batch query: get all attendance logs for these students in range
        $studentIds = $students->pluck('id');
        
        $attendanceDates = AttendanceLog::whereIn('student_id', $studentIds)
            ->where('tap_type', 'in')
            ->whereDate('tapped_at', '>=', $dateFrom->toDateString())
            ->whereDate('tapped_at', '<=', $dateTo->toDateString())
            ->selectRaw('student_id, DATE(tapped_at) as tap_date')
            ->groupBy('student_id', 'tap_date')
            ->get()
            ->groupBy('student_id');

        // Late dates
        $lateDates = AttendanceLog::whereIn('student_id', $studentIds)
            ->where('tap_type', 'in')
            ->where('late_status', 'late')
            ->whereDate('tapped_at', '>=', $dateFrom->toDateString())
            ->whereDate('tapped_at', '<=', $dateTo->toDateString())
            ->selectRaw('student_id, DATE(tapped_at) as tap_date')
            ->groupBy('student_id', 'tap_date')
            ->get()
            ->groupBy('student_id');

        // 6. Build recap per student
        $recap = [];
        foreach ($students as $student) {
            $presentDatesCollection = $attendanceDates->get($student->id, collect());
            $presentDates = $presentDatesCollection->pluck('tap_date')->map(fn($d) => Carbon::parse($d)->toDateString())->unique()->values()->toArray();
            
            $lateDatesCollection = $lateDates->get($student->id, collect());
            $lateCount = $lateDatesCollection->pluck('tap_date')->unique()->count();

            $presentCount = count($presentDates);
            $absentCount = $totalSchoolDays - $presentCount;
            if ($absentCount < 0) $absentCount = 0;

            // Find which school days the student was absent
            $absentDatesArr = array_values(array_diff($schoolDays, $presentDates));

            $percentage = $totalSchoolDays > 0 ? round(($presentCount / $totalSchoolDays) * 100, 1) : 0;

            $recap[] = [
                'student_id' => $student->id,
                'nis' => $student->nis,
                'name' => $student->name,
                'class' => $student->class->name ?? '-',
                'school_days' => $totalSchoolDays,
                'present_days' => $presentCount,
                'absent_days' => $absentCount,
                'late_days' => $lateCount,
                'percentage' => $percentage,
                'absent_dates' => $absentDatesArr,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'recap' => $recap,
                'summary' => [
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'total_calendar_days' => $period->count(),
                    'total_off_days' => $offDayCount,
                    'total_holidays' => $holidayCount,
                    'total_school_days' => $totalSchoolDays,
                    'off_days_config' => $offDays,
                ],
            ],
        ]);
    }
}
