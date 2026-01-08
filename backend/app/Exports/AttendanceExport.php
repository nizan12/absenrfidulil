<?php

namespace App\Exports;

use App\Models\AttendanceLog;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AttendanceExport
{
    protected $dateFrom;
    protected $dateTo;
    protected $classId;
    protected $name;

    public function __construct($dateFrom = null, $dateTo = null, $classId = null, $name = null)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->classId = $classId;
        $this->name = $name;
    }

    public function collection()
    {
        $query = AttendanceLog::with(['student.class', 'espDevice.location'])
            ->orderBy('tapped_at', 'desc');

        if ($this->dateFrom) {
            $query->whereDate('tapped_at', '>=', $this->dateFrom);
        }

        if ($this->dateTo) {
            $query->whereDate('tapped_at', '<=', $this->dateTo);
        }

        if ($this->classId) {
            $query->whereHas('student', function ($q) {
                $q->where('class_id', $this->classId);
            });
        }

        if ($this->name) {
            $query->whereHas('student', function ($q) {
                $q->where('name', 'like', '%' . $this->name . '%');
            });
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'NIS',
            'Nama Siswa',
            'Kelas',
            'Tipe',
            'Lokasi',
            'Waktu',
            'Tanggal',
        ];
    }

    public function map($log, $index): array
    {
        return [
            $index + 1,
            $log->student->nis ?? '-',
            $log->student->name ?? '-',
            $log->student->class->name ?? '-',
            $log->tap_type === 'in' ? 'Masuk' : 'Keluar',
            $log->espDevice->location->name ?? $log->espDevice->name ?? '-',
            $log->tapped_at ? $log->tapped_at->format('H:i:s') : '-',
            $log->tapped_at ? $log->tapped_at->format('Y-m-d') : '-',
        ];
    }

    public function toArray()
    {
        $data = $this->collection();
        $rows = [];
        
        foreach ($data as $index => $log) {
            $rows[] = $this->map($log, $index);
        }

        return [
            'headings' => $this->headings(),
            'data' => $rows,
        ];
    }

    public function toExcel()
    {
        $result = $this->toArray();
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Kehadiran Siswa');
        
        // Header styling
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];
        
        // Write headings
        $col = 'A';
        foreach ($result['headings'] as $heading) {
            $sheet->setCellValue($col . '1', $heading);
            $col++;
        }
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);
        
        // Write data
        $row = 2;
        foreach ($result['data'] as $rowData) {
            $col = 'A';
            foreach ($rowData as $cell) {
                $sheet->setCellValue($col . $row, $cell);
                $col++;
            }
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        // Add borders to data
        if (count($result['data']) > 0) {
            $lastRow = count($result['data']) + 1;
            $sheet->getStyle('A1:H' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }
        
        // Write to temp file and return content
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);
        $content = file_get_contents($tempFile);
        unlink($tempFile);
        
        return $content;
    }

    public function toCsv()
    {
        $result = $this->toArray();
        $output = '';
        
        // Add headings
        $output .= implode(',', $result['headings']) . "\n";
        
        // Add data rows
        foreach ($result['data'] as $row) {
            $escapedRow = array_map(function ($cell) {
                // Escape quotes and wrap in quotes if needed
                if (strpos($cell, ',') !== false || strpos($cell, '"') !== false) {
                    return '"' . str_replace('"', '""', $cell) . '"';
                }
                return $cell;
            }, $row);
            $output .= implode(',', $escapedRow) . "\n";
        }

        return $output;
    }
}
