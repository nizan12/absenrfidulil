<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Hide master accounts from non-master users
        if (!auth()->user() || auth()->user()->role !== 'master') {
            $query->where('role', '!=', 'master');
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $perPage = $request->get('per_page', 15);
        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:super_admin,kepala_sekolah,staff_admin,guru_piket,operator', // master cannot be created via API
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ];

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/users', 'public');
        }

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan',
            'data' => $user,
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        // Protect master account from non-master users
        if ($user->role === 'master' && (!auth()->user() || auth()->user()->role !== 'master')) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat mengubah akun ini'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|in:super_admin,kepala_sekolah,staff_admin,guru_piket,operator,master',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['name', 'email', 'role']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/users', 'public');
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui',
            'data' => $user,
        ]);
    }

    public function destroy(User $user)
    {
        // Protect master account
        if ($user->role === 'master') {
            return response()->json([
                'success' => false,
                'message' => 'Akun master tidak dapat dihapus',
            ], 403);
        }

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus akun sendiri',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus',
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
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Template Import User');

            // Headers
            $headers = ['Nama', 'Email', 'Password', 'Role', 'No Telepon'];
            $sheet->fromArray($headers, null, 'A1');

            // Style headers
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ];
            $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);

            // Sample data
            $sampleData = [
                ['Ahmad Fauzi', 'ahmad@email.com', 'password123', 'staff_admin', '081234567890'],
                ['Siti Aminah', 'siti@email.com', 'password123', 'guru_piket', '085678901234'],
                ['Budi Hartono', 'budi@email.com', 'password123', 'operator', '087890123456'],
            ];
            $sheet->fromArray($sampleData, null, 'A2');

            // Auto width
            foreach (range('A', 'E') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            // Sheet 2: Daftar Role
            $sheet2 = $spreadsheet->createSheet();
            $sheet2->setTitle('Daftar Role');
            $sheet2->setCellValue('A1', 'Role');
            $sheet2->setCellValue('B1', 'Keterangan');
            $sheet2->getStyle('A1:B1')->applyFromArray($headerStyle);

            $roleData = [
                ['super_admin', 'Super Admin - Akses penuh'],
                ['kepala_sekolah', 'Kepala Sekolah'],
                ['staff_admin', 'Staff Admin'],
                ['guru_piket', 'Guru Piket'],
                ['operator', 'Operator'],
            ];
            $sheet2->fromArray($roleData, null, 'A2');
            $sheet2->getColumnDimension('A')->setAutoSize(true);
            $sheet2->getColumnDimension('B')->setAutoSize(true);

            $spreadsheet->setActiveSheetIndex(0);

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'template_import_user_' . date('Y-m-d') . '.xlsx';
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

                    if (empty($firstCell) ||
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'nama') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        strpos($firstCell, 'role') !== false ||
                        in_array($firstCell, ['name', 'email'])) {
                        continue;
                    }

                    if (count($row) >= 4) {
                        $result = $this->processImportRow([
                            'name' => $row[0] ?? '',
                            'email' => $row[1] ?? '',
                            'password' => $row[2] ?? '',
                            'role' => $row[3] ?? 'staff_admin',
                            'phone' => $row[4] ?? '',
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
                $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($file->getRealPath());
                $spreadsheet = $reader->load($file->getRealPath());
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();

                foreach ($rows as $row) {
                    $firstCell = strtolower(trim((string)($row[0] ?? '')));

                    if (empty($firstCell) ||
                        strpos($firstCell, '===') !== false ||
                        strpos($firstCell, 'nama') !== false ||
                        strpos($firstCell, 'template') !== false ||
                        strpos($firstCell, 'role') !== false ||
                        in_array($firstCell, ['name', 'email'])) {
                        continue;
                    }

                    $result = $this->processImportRow([
                        'name' => $row[0] ?? '',
                        'email' => $row[1] ?? '',
                        'password' => $row[2] ?? '',
                        'role' => $row[3] ?? 'staff_admin',
                        'phone' => $row[4] ?? '',
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
                'message' => "Berhasil mengimpor {$imported} user",
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
            if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
                return ['success' => false, 'error' => 'Data tidak lengkap (nama, email, password wajib diisi)'];
            }

            // Check if user already exists
            $existingUser = User::where('email', $data['email'])->first();
            if ($existingUser) {
                return ['success' => false, 'error' => "User dengan email sudah ada: {$data['email']}"];
            }

            // Validate role
            $validRoles = ['super_admin', 'kepala_sekolah', 'staff_admin', 'guru_piket', 'operator'];
            $role = strtolower(trim($data['role']));
            if (!in_array($role, $validRoles)) {
                $role = 'staff_admin';
            }

            // Normalize phone
            $phone = $data['phone'] ?? null;
            if (!empty($phone)) {
                $phone = preg_replace('/[^0-9]/', '', $phone);
                if (str_starts_with($phone, '0')) {
                    $phone = '62' . substr($phone, 1);
                }
            }

            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $role,
                'phone' => !empty($phone) ? $phone : null,
            ]);

            return ['success' => true];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
