<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\AttendanceExport;
use App\Exports\TeacherAttendanceExport;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function exportStudentAttendance(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'class_id' => 'nullable|exists:classes,id',
            'name' => 'nullable|string',
        ]);

        $export = new AttendanceExport(
            $request->date_from,
            $request->date_to,
            $request->class_id,
            $request->name
        );

        $excel = $export->toExcel();
        $filename = 'kehadiran_siswa_' . date('Y-m-d_His') . '.xlsx';

        return response($excel, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function exportTeacherAttendance(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'name' => 'nullable|string',
        ]);

        $export = new TeacherAttendanceExport(
            $request->date_from,
            $request->date_to,
            $request->name
        );

        $excel = $export->toExcel();
        $filename = 'kehadiran_guru_' . date('Y-m-d_His') . '.xlsx';

        return response($excel, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function previewStudentAttendance(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'class_id' => 'nullable|exists:classes,id',
            'name' => 'nullable|string',
        ]);

        $export = new AttendanceExport(
            $request->date_from,
            $request->date_to,
            $request->class_id,
            $request->name
        );

        return response()->json([
            'success' => true,
            'data' => $export->toArray(),
        ]);
    }
}
