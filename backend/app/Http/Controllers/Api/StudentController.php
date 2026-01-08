<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['class', 'category']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('rfid_uid', 'like', "%{$search}%");
            });
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->get('per_page', 15);
        $students = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'rfid_uid' => 'required|string|unique:students,rfid_uid',
            'nis' => 'required|string|unique:students,nis',
            'name' => 'required|string|max:255',
            'class_id' => 'required|exists:classes,id',
            'category_id' => 'nullable|exists:categories,id',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['rfid_uid', 'nis', 'name', 'class_id', 'category_id']);
        $data['is_active'] = true;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/students', 'public');
        }

        $student = Student::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil ditambahkan',
            'data' => $student->load(['class', 'category']),
        ], 201);
    }

    public function show(Student $student)
    {
        return response()->json([
            'success' => true,
            'data' => $student->load(['class', 'category', 'parents']),
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $request->validate([
            'rfid_uid' => 'sometimes|string|unique:students,rfid_uid,' . $student->id,
            'nis' => 'sometimes|string|unique:students,nis,' . $student->id,
            'name' => 'sometimes|string|max:255',
            'class_id' => 'sometimes|exists:classes,id',
            'category_id' => 'nullable|exists:categories,id',
            'is_active' => 'sometimes|boolean',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['rfid_uid', 'nis', 'name', 'class_id', 'category_id', 'is_active']);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/students', 'public');
        }

        $student->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil diperbarui',
            'data' => $student->load(['class', 'category']),
        ]);
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil dihapus',
        ]);
    }

    public function downloadTemplate()
    {
        // Suppress deprecation warnings for old PhpSpreadsheet version
        $errorLevel = error_reporting();
        error_reporting($errorLevel & ~E_DEPRECATED);
        
        try {
            // Clear any previous output
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            
            // Sheet 1: Template Data
            $sheet1 = $spreadsheet->getActiveSheet();
            $sheet1->setTitle('Template Import');
            
            // Headers
            $headers = ['RFID UID', 'NIS', 'Nama Siswa', 'Kelas', 'Kategori', 'Nama Ortu', 'No HP Ortu', 'Hubungan'];
            $sheet1->fromArray($headers, null, 'A1');
            
            // Style headers
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F43F5E']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ];
            $sheet1->getStyle('A1:H1')->applyFromArray($headerStyle);
            
            // Sample data
            $sampleData = [
                ['A1B2C3D4', '12345', 'Ahmad Rizki', 'X RPL 1', 'Reguler', 'Budi Santoso', '08123456789', 'ayah'],
                ['E5F6G7H8', '12346', 'Siti Nurhaliza', 'X RPL 2', 'Full Day', 'Dewi Rahayu', '08987654321', 'ibu'],
                ['I9J0K1L2', '12347', 'Budi Pratama', 'X TKJ 1', '', 'Pak Wali', '08555666777', 'wali'],
            ];
            $sheet1->fromArray($sampleData, null, 'A2');
            
            // Auto width
            foreach (range('A', 'H') as $col) {
                $sheet1->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Sheet 2: Daftar Kelas
            $sheet2 = $spreadsheet->createSheet();
            $sheet2->setTitle('Daftar Kelas');
            $sheet2->setCellValue('A1', 'Nama Kelas');
            $sheet2->getStyle('A1')->applyFromArray($headerStyle);
            
            $classes = \App\Models\Classes::orderBy('name')->pluck('name')->toArray();
            $row = 2;
            foreach ($classes as $class) {
                $sheet2->setCellValue('A' . $row, $class);
                $row++;
            }
            $sheet2->getColumnDimension('A')->setAutoSize(true);
            
            // Sheet 3: Daftar Kategori
            $sheet3 = $spreadsheet->createSheet();
            $sheet3->setTitle('Daftar Kategori');
            $sheet3->setCellValue('A1', 'Nama Kategori');
            $sheet3->getStyle('A1')->applyFromArray($headerStyle);
            
            $categories = \App\Models\Category::orderBy('name')->pluck('name')->toArray();
            $row = 2;
            foreach ($categories as $category) {
                $sheet3->setCellValue('A' . $row, $category);
                $row++;
            }
            $sheet3->getColumnDimension('A')->setAutoSize(true);
            
            // Sheet 4: Daftar Hubungan
            $sheet4 = $spreadsheet->createSheet();
            $sheet4->setTitle('Daftar Hubungan');
            $sheet4->setCellValue('A1', 'Hubungan');
            $sheet4->setCellValue('B1', 'Keterangan');
            $sheet4->getStyle('A1:B1')->applyFromArray($headerStyle);
            
            $relationships = [
                ['ayah', 'Ayah kandung siswa'],
                ['ibu', 'Ibu kandung siswa'],
                ['wali', 'Wali atau pengasuh siswa'],
            ];
            $sheet4->fromArray($relationships, null, 'A2');
            $sheet4->getColumnDimension('A')->setAutoSize(true);
            $sheet4->getColumnDimension('B')->setAutoSize(true);
            
            // Set active sheet back to first
            $spreadsheet->setActiveSheetIndex(0);
            
            // Generate file
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'template_import_siswa_' . date('Y-m-d') . '.xlsx';
            
            $tempFile = tempnam(sys_get_temp_dir(), 'template');
            $writer->save($tempFile);
            
            // Restore error level
            error_reporting($errorLevel);
            
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            // Restore error level
            error_reporting($errorLevel);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat template: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:5120',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        
        try {
            $imported = 0;
            $errors = [];

            if ($extension === 'csv') {
                $handle = fopen($file->getRealPath(), 'r');
                
                while (($row = fgetcsv($handle)) !== false) {
                    $firstCell = strtolower(trim((string)($row[0] ?? '')));
                    
                    // Skip empty rows, header rows, and reference data rows
                    if (empty($firstCell) || 
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'rfid') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        strpos($firstCell, 'daftar') !== false ||
                        in_array($firstCell, ['ayah', 'ibu', 'wali', 'nama siswa', 'nama ortu'])) {
                        continue;
                    }
                    
                    if (count($row) >= 5) {
                        $result = $this->processImportRow([
                            'rfid_uid' => $row[0] ?? '',
                            'nis' => $row[1] ?? '',
                            'name' => $row[2] ?? '',
                            'class_name' => $row[3] ?? '',
                            'category_name' => $row[4] ?? '',
                            'parent_name' => $row[5] ?? '',
                            'parent_phone' => $row[6] ?? '',
                            'relationship' => $row[7] ?? 'wali',
                        ]);
                        
                        if ($result['success']) {
                            $imported++;
                        } else {
                            $errors[] = $result['error'];
                        }
                    }
                }
                fclose($handle);
            } else {
                // For xlsx/xls, use PhpSpreadsheet
                $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($file->getRealPath());
                $spreadsheet = $reader->load($file->getRealPath());
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();
                
                foreach ($rows as $row) {
                    $firstCell = strtolower(trim((string)($row[0] ?? '')));
                    
                    // Skip empty rows, header rows, and reference data rows
                    if (empty($firstCell) || 
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'rfid') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        strpos($firstCell, 'daftar') !== false ||
                        in_array($firstCell, ['ayah', 'ibu', 'wali', 'nama siswa', 'nama ortu'])) {
                        continue;
                    }
                    
                    $result = $this->processImportRow([
                        'rfid_uid' => $row[0] ?? '',
                        'nis' => $row[1] ?? '',
                        'name' => $row[2] ?? '',
                        'class_name' => $row[3] ?? '',
                        'category_name' => $row[4] ?? '',
                        'parent_name' => $row[5] ?? '',
                        'parent_phone' => $row[6] ?? '',
                        'relationship' => $row[7] ?? 'wali',
                    ]);
                    
                    if ($result['success']) {
                        $imported++;
                    } else {
                        $errors[] = $result['error'];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Berhasil mengimpor {$imported} siswa",
                'data' => [
                    'imported' => $imported,
                    'errors' => $errors,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimpor data: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function processImportRow(array $data)
    {
        try {
            // Find or skip if required fields are empty
            if (empty($data['rfid_uid']) || empty($data['nis']) || empty($data['name'])) {
                return ['success' => false, 'error' => 'Data tidak lengkap'];
            }

            // Check if student already exists
            $existingStudent = Student::where('rfid_uid', $data['rfid_uid'])
                ->orWhere('nis', $data['nis'])
                ->first();

            if ($existingStudent) {
                return ['success' => false, 'error' => "Siswa dengan RFID/NIS sudah ada: {$data['name']}"];
            }

            // Find class by name
            $class = \App\Models\Classes::where('name', 'like', '%' . $data['class_name'] . '%')->first();
            if (!$class) {
                // Create class if not exists
                $class = \App\Models\Classes::create(['name' => $data['class_name']]);
            }

            // Find category by name
            $category = null;
            if (!empty($data['category_name'])) {
                $category = \App\Models\Category::where('name', 'like', '%' . $data['category_name'] . '%')->first();
                if (!$category) {
                    $category = \App\Models\Category::create(['name' => $data['category_name']]);
                }
            }

            // Create student
            $student = Student::create([
                'rfid_uid' => $data['rfid_uid'],
                'nis' => $data['nis'],
                'name' => $data['name'],
                'class_id' => $class->id,
                'category_id' => $category?->id,
                'is_active' => true,
            ]);

            // Create parent if provided
            if (!empty($data['parent_name']) || !empty($data['parent_phone'])) {
                $relationship = strtolower(trim($data['relationship'] ?? 'wali'));
                // Validate relationship
                if (!in_array($relationship, ['ayah', 'ibu', 'wali'])) {
                    $relationship = 'wali';
                }
                
                \App\Models\StudentParent::create([
                    'student_id' => $student->id,
                    'name' => $data['parent_name'] ?: 'Orang Tua ' . $data['name'],
                    'phone' => $this->normalizePhone($data['parent_phone']),
                    'relationship' => $relationship,
                    'receive_notification' => true,
                ]);
            }

            return ['success' => true];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function normalizePhone($phone)
    {
        if (empty($phone)) return null;
        
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        return $phone;
    }
}
