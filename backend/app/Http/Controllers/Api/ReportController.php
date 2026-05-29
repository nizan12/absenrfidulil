<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\AttendanceExport;
use App\Exports\TeacherAttendanceExport;
use App\Models\AttendanceLog;
use App\Models\Student;
use App\Models\Holiday;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

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

    /**
     * Export Recap (per-student summary) to Excel
     */
    public function exportRecap(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'class_id' => 'nullable|exists:classes,id',
            'name' => 'nullable|string',
        ]);

        $dateFrom = Carbon::parse($request->date_from)->startOfDay();
        $dateTo = Carbon::parse($request->date_to)->endOfDay();

        // 1. Off-days
        $offDaysSetting = AppSetting::get('school_off_days', '0,6');
        $offDays = array_map('intval', array_filter(explode(',', $offDaysSetting), fn($v) => $v !== ''));

        // 2. Holidays
        $holidays = Holiday::whereBetween('date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        // 3. School days
        $period = CarbonPeriod::create($dateFrom, $dateTo);
        $schoolDays = [];
        foreach ($period as $date) {
            if (in_array($date->dayOfWeek, $offDays)) continue;
            if (in_array($date->toDateString(), $holidays)) continue;
            $schoolDays[] = $date->toDateString();
        }
        $totalSchoolDays = count($schoolDays);

        // 4. Students
        $studentQuery = Student::with('class')->where('is_active', true);
        if ($request->filled('class_id')) $studentQuery->where('class_id', $request->class_id);
        if ($request->filled('name')) $studentQuery->where('name', 'like', '%' . $request->name . '%');
        $students = $studentQuery->orderBy('name')->get();
        $studentIds = $students->pluck('id');

        // 5. Attendance & late data
        $attendanceDates = AttendanceLog::whereIn('student_id', $studentIds)
            ->where('tap_type', 'in')
            ->whereDate('tapped_at', '>=', $dateFrom->toDateString())
            ->whereDate('tapped_at', '<=', $dateTo->toDateString())
            ->selectRaw('student_id, DATE(tapped_at) as tap_date')
            ->groupBy('student_id', 'tap_date')
            ->get()->groupBy('student_id');

        $lateDates = AttendanceLog::whereIn('student_id', $studentIds)
            ->where('tap_type', 'in')
            ->where('late_status', 'late')
            ->whereDate('tapped_at', '>=', $dateFrom->toDateString())
            ->whereDate('tapped_at', '<=', $dateTo->toDateString())
            ->selectRaw('student_id, DATE(tapped_at) as tap_date')
            ->groupBy('student_id', 'tap_date')
            ->get()->groupBy('student_id');

        // 6. Build spreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Rekap Kehadiran');

        // Title rows
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', 'REKAP KEHADIRAN SISWA');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:I2');
        $sheet->setCellValue('A2', 'Periode: ' . $dateFrom->format('d/m/Y') . ' - ' . $dateTo->format('d/m/Y') . ' | Hari Sekolah: ' . $totalSchoolDays . ' hari');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Headers at row 4
        $headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Hari Sekolah', 'Hadir', 'Tidak Hadir', 'Terlambat', '% Kehadiran'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '4', $header);
            $col++;
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];
        $sheet->getStyle('A4:I4')->applyFromArray($headerStyle);

        // Data rows
        $row = 5;
        $no = 1;
        foreach ($students as $student) {
            $presentDatesCollection = $attendanceDates->get($student->id, collect());
            $presentDates = $presentDatesCollection->pluck('tap_date')->map(fn($d) => Carbon::parse($d)->toDateString())->unique()->values()->toArray();
            $lateCount = $lateDates->get($student->id, collect())->pluck('tap_date')->unique()->count();

            $presentCount = count($presentDates);
            $absentCount = max(0, $totalSchoolDays - $presentCount);
            $percentage = $totalSchoolDays > 0 ? round(($presentCount / $totalSchoolDays) * 100, 1) : 0;

            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $student->nis ?? '-');
            $sheet->setCellValue('C' . $row, $student->name ?? '-');
            $sheet->setCellValue('D' . $row, $student->class->name ?? '-');
            $sheet->setCellValue('E' . $row, $totalSchoolDays);
            $sheet->setCellValue('F' . $row, $presentCount);
            $sheet->setCellValue('G' . $row, $absentCount);
            $sheet->setCellValue('H' . $row, $lateCount);
            $sheet->setCellValue('I' . $row, $percentage . '%');

            // Color absent column red if > 0
            if ($absentCount > 0) {
                $sheet->getStyle('G' . $row)->getFont()->getColor()->setRGB('DC2626');
                $sheet->getStyle('G' . $row)->getFont()->setBold(true);
            }

            // Color late column orange if > 0
            if ($lateCount > 0) {
                $sheet->getStyle('H' . $row)->getFont()->getColor()->setRGB('D97706');
                $sheet->getStyle('H' . $row)->getFont()->setBold(true);
            }

            $row++;
            $no++;
        }

        // Borders for data
        $lastRow = $row - 1;
        if ($lastRow >= 5) {
            $sheet->getStyle('A4:I' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('A5:A' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E5:I' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Auto-size columns
        foreach (range('A', 'I') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Write
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'recap_');
        $writer->save($tempFile);
        $content = file_get_contents($tempFile);
        unlink($tempFile);

        $filename = 'rekap_kehadiran_' . date('Y-m-d_His') . '.xlsx';

        return response($content, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
