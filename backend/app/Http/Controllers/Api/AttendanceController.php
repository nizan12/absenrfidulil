<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\TeacherAttendanceLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

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
}
