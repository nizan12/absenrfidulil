<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('rfid_uid', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->get('per_page', 15);
        $teachers = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $teachers,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'rfid_uid' => 'required|string|unique:teachers,rfid_uid',
            'nip' => 'required|string|unique:teachers,nip',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['rfid_uid', 'nip', 'name', 'phone']);
        $data['is_active'] = true;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/teachers', 'public');
        }

        $teacher = Teacher::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil ditambahkan',
            'data' => $teacher,
        ], 201);
    }

    public function show(Teacher $teacher)
    {
        return response()->json([
            'success' => true,
            'data' => $teacher,
        ]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $request->validate([
            'rfid_uid' => 'sometimes|string|unique:teachers,rfid_uid,' . $teacher->id,
            'nip' => 'sometimes|string|unique:teachers,nip,' . $teacher->id,
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['rfid_uid', 'nip', 'name', 'phone', 'is_active']);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/teachers', 'public');
        }

        $teacher->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil diperbarui',
            'data' => $teacher,
        ]);
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil dihapus',
        ]);
    }

    public function downloadTemplate()
    {
        $errorLevel = error_reporting();
        error_reporting($errorLevel & ~E_DEPRECATED);
        
        try {
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            
            // Sheet 1: Template Data
            $sheet1 = $spreadsheet->getActiveSheet();
            $sheet1->setTitle('Template Import Guru');
            
            // Headers
            $headers = ['RFID UID', 'NIP', 'Nama Guru', 'No Telepon'];
            $sheet1->fromArray($headers, null, 'A1');
            
            // Style headers
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F43F5E']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ];
            $sheet1->getStyle('A1:D1')->applyFromArray($headerStyle);
            
            // Sample data
            $sampleData = [
                ['A1B2C3D4', '198501012010011001', 'Ahmad Fauzi S.Pd', '081234567890'],
                ['E5F6G7H8', '198703152011012002', 'Siti Aminah M.Pd', '085678901234'],
                ['I9J0K1L2', '199005202014031003', 'Budi Hartono S.Kom', '087890123456'],
            ];
            $sheet1->fromArray($sampleData, null, 'A2');
            
            // Auto width
            foreach (range('A', 'D') as $col) {
                $sheet1->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Set active sheet back to first
            $spreadsheet->setActiveSheetIndex(0);
            
            // Generate file
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'template_import_guru_' . date('Y-m-d') . '.xlsx';
            
            $tempFile = tempnam(sys_get_temp_dir(), 'template');
            $writer->save($tempFile);
            
            error_reporting($errorLevel);
            
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
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
            'file' => 'required|file|max:5120',
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
                    
                    // Skip empty rows and header rows
                    if (empty($firstCell) || 
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'rfid') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        in_array($firstCell, ['nama guru', 'nip', 'no'])) {
                        continue;
                    }
                    
                    if (count($row) >= 3) {
                        $result = $this->processImportRow([
                            'rfid_uid' => $row[0] ?? '',
                            'nip' => $row[1] ?? '',
                            'name' => $row[2] ?? '',
                            'phone' => $row[3] ?? '',
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
                    
                    // Skip empty rows and header rows
                    if (empty($firstCell) || 
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'rfid') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        in_array($firstCell, ['nama guru', 'nip', 'no'])) {
                        continue;
                    }
                    
                    if (count($row) >= 3) {
                        $result = $this->processImportRow([
                            'rfid_uid' => $row[0] ?? '',
                            'nip' => $row[1] ?? '',
                            'name' => $row[2] ?? '',
                            'phone' => $row[3] ?? '',
                        ]);
                        
                        if ($result['success']) {
                            $imported++;
                        } else {
                            $errors[] = $result['error'];
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Berhasil mengimpor {$imported} guru",
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
            if (empty($data['rfid_uid']) || empty($data['nip']) || empty($data['name'])) {
                return ['success' => false, 'error' => 'Data tidak lengkap'];
            }

            // Check if teacher already exists
            $existingTeacher = Teacher::where('rfid_uid', $data['rfid_uid'])
                ->orWhere('nip', $data['nip'])
                ->first();

            if ($existingTeacher) {
                return ['success' => false, 'error' => "Guru dengan RFID/NIP sudah ada: {$data['name']}"];
            }

            // Normalize phone
            $phone = $data['phone'] ?? null;
            if (!empty($phone)) {
                $phone = preg_replace('/[^0-9]/', '', $phone);
                if (str_starts_with($phone, '0')) {
                    $phone = '62' . substr($phone, 1);
                }
            }

            // Create teacher
            Teacher::create([
                'rfid_uid' => $data['rfid_uid'],
                'nip' => $data['nip'],
                'name' => $data['name'],
                'phone' => $phone,
                'is_active' => true,
            ]);

            return ['success' => true];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
