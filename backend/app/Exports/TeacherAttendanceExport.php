<?php

namespace App\Exports;

use App\Models\TeacherAttendanceLog;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class TeacherAttendanceExport
{
    protected $dateFrom;
    protected $dateTo;
    protected $name;

    public function __construct($dateFrom = null, $dateTo = null, $name = null)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->name = $name;
    }

    public function collection()
    {
        $query = TeacherAttendanceLog::with(['teacher', 'espDevice.location'])
            ->orderBy('tapped_at', 'desc');

        if ($this->dateFrom) {
            $query->whereDate('tapped_at', '>=', $this->dateFrom);
        }

        if ($this->dateTo) {
            $query->whereDate('tapped_at', '<=', $this->dateTo);
        }

        if ($this->name) {
            $query->whereHas('teacher', function ($q) {
                $q->where('name', 'like', '%' . $this->name . '%');
            });
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'NIP',
            'Nama Guru',
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
            $log->teacher->nip ?? '-',
            $log->teacher->name ?? '-',
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
        $sheet->setTitle('Kehadiran Guru');
        
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
        $sheet->getStyle('A1:G1')->applyFromArray($headerStyle);
        
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
        foreach (range('A', 'G') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        // Add borders to data
        if (count($result['data']) > 0) {
            $lastRow = count($result['data']) + 1;
            $sheet->getStyle('A1:G' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
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
        $data = $this->collection();
        $output = implode(',', $this->headings()) . "\n";
        
        foreach ($data as $index => $log) {
            $row = $this->map($log, $index);
            $escapedRow = array_map(function ($cell) {
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
