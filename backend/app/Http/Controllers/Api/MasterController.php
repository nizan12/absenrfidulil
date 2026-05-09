<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\Category;
use App\Models\EspDevice;
use App\Models\AttendanceLog;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class MasterController extends Controller
{
    /**
     * Check if current user is master
     */
    private function checkMaster()
    {
        if (!auth()->user() || auth()->user()->role !== 'master') {
            abort(403, 'Unauthorized — Master only');
        }
    }

    /**
     * System statistics
     */
    public function statistics()
    {
        $this->checkMaster();

        $dbName = config('database.connections.mysql.database');

        // Database size (may fail on shared hosting)
        $dbSizeMb = 0;
        $dbTables = [];
        try {
            $dbSize = DB::select("SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb 
                FROM information_schema.TABLES 
                WHERE table_schema = ?", [$dbName]);
            $dbSizeMb = $dbSize[0]->size_mb ?? 0;

            $tables = DB::select("SELECT 
                table_name, 
                table_rows,
                ROUND((data_length + index_length) / 1024, 2) as size_kb
                FROM information_schema.TABLES 
                WHERE table_schema = ?
                ORDER BY (data_length + index_length) DESC", [$dbName]);
            $dbTables = array_map(function($t) {
                return [
                    'name' => $t->table_name,
                    'rows' => $t->table_rows,
                    'size_kb' => $t->size_kb,
                ];
            }, $tables);
        } catch (\Exception $e) {
            // information_schema access denied on shared hosting
        }

        // Storage usage
        $storageSizeMb = 0;
        try {
            $storagePath = storage_path('app/public');
            if (is_dir($storagePath)) {
                $storageSizeMb = round($this->getDirectorySize($storagePath) / 1024 / 1024, 2);
            }
        } catch (\Exception $e) {}

        // User counts by role
        $usersByRole = [];
        try {
            $usersByRole = User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray();
        } catch (\Exception $e) {}

        // Counts
        $stats = [
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'db_name' => $dbName,
            'db_size_mb' => $dbSizeMb,
            'db_tables' => $dbTables,
            'storage_size_mb' => $storageSizeMb,
            'users_by_role' => $usersByRole,
            'total_students' => 0,
            'total_teachers' => 0,
            'total_classes' => 0,
            'total_devices' => 0,
            'total_logs_today' => 0,
            'total_logs_all' => 0,
            'server_time' => now()->format('Y-m-d H:i:s'),
            'timezone' => config('app.timezone'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
        ];

        try { $stats['total_students'] = Student::count(); } catch (\Exception $e) {}
        try { $stats['total_teachers'] = Teacher::count(); } catch (\Exception $e) {}
        try { $stats['total_classes'] = Classes::count(); } catch (\Exception $e) {}
        try { $stats['total_devices'] = EspDevice::count(); } catch (\Exception $e) {}
        try { $stats['total_logs_today'] = AttendanceLog::whereDate('created_at', today())->count(); } catch (\Exception $e) {}
        try { $stats['total_logs_all'] = AttendanceLog::count(); } catch (\Exception $e) {}

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Get error logs
     */
    public function getErrors(Request $request)
    {
        $this->checkMaster();

        try {
            $logFile = storage_path('logs/laravel.log');
            $lines = (int) $request->get('lines', 200);
            $level = $request->get('level', null);

            if (!file_exists($logFile)) {
                return response()->json([
                    'success' => true,
                    'data' => ['entries' => [], 'file_size' => 0, 'file_size_mb' => 0],
                ]);
            }

            $fileSize = filesize($logFile);
            
            // Read last N lines - simple method
            $content = '';
            if ($fileSize < 5 * 1024 * 1024) { // Under 5MB, read whole file
                $content = file_get_contents($logFile);
            } else {
                // Read last 1MB for large files
                $fp = fopen($logFile, 'r');
                fseek($fp, -1024 * 1024, SEEK_END);
                $content = fread($fp, 1024 * 1024);
                fclose($fp);
            }
            
            $entries = $this->parseLogEntries($content, $level);
            $entries = array_slice($entries, -$lines);

            return response()->json([
                'success' => true,
                'data' => [
                    'entries' => array_values($entries),
                    'file_size' => round($fileSize / 1024, 2),
                    'file_size_mb' => round($fileSize / 1024 / 1024, 2),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => ['entries' => [['timestamp' => now()->toDateTimeString(), 'level' => 'ERROR', 'message' => 'Gagal membaca log: ' . $e->getMessage()]], 'file_size' => 0, 'file_size_mb' => 0],
            ]);
        }
    }

    /**
     * Clear error logs
     */
    public function clearErrors()
    {
        $this->checkMaster();

        $logFile = storage_path('logs/laravel.log');
        
        if (file_exists($logFile)) {
            file_put_contents($logFile, '');
        }

        return response()->json([
            'success' => true,
            'message' => 'Log berhasil dibersihkan',
        ]);
    }

    /**
     * Create database backup
     */
    public function createBackup()
    {
        $this->checkMaster();

        try {
            $dbHost = config('database.connections.mysql.host');
            $dbName = config('database.connections.mysql.database');
            $dbUser = config('database.connections.mysql.username');
            $dbPass = config('database.connections.mysql.password');

            $backupDir = storage_path('app/backups');
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $filename = "backup_{$dbName}_" . date('Y-m-d_His') . '.sql';
            $filepath = "{$backupDir}/{$filename}";

            $dumped = false;

            // Try mysqldump (only if exec is available)
            if (function_exists('exec') && !in_array('exec', array_map('trim', explode(',', ini_get('disable_functions'))))) {
                try {
                    $mysqldumpPath = $this->findMysqldump();
                    if ($mysqldumpPath) {
                        $command = sprintf(
                            '%s --host=%s --user=%s --password=%s %s > %s 2>&1',
                            escapeshellarg($mysqldumpPath),
                            escapeshellarg($dbHost),
                            escapeshellarg($dbUser),
                            escapeshellarg($dbPass),
                            escapeshellarg($dbName),
                            escapeshellarg($filepath)
                        );
                        exec($command, $output, $returnCode);
                        if ($returnCode === 0 && file_exists($filepath) && filesize($filepath) > 0) {
                            $dumped = true;
                        }
                    }
                } catch (\Exception $e) {
                    // exec failed, continue to PHP native
                }
            }

            // PHP-native backup (always works)
            if (!$dumped) {
                $this->phpNativeBackup($filepath, $dbName);
            }

            if (!file_exists($filepath) || filesize($filepath) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membuat backup database',
                ], 500);
            }

            // Backups are kept permanently — user can delete manually

            return response()->json([
                'success' => true,
                'message' => 'Backup berhasil dibuat',
                'data' => [
                    'filename' => $filename,
                    'size_kb' => round(filesize($filepath) / 1024, 2),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List backup files
     */
    public function listBackups()
    {
        $this->checkMaster();

        $backupDir = storage_path('app/backups');
        $backups = [];

        if (is_dir($backupDir)) {
            $files = glob("{$backupDir}/*.sql");
            foreach ($files as $file) {
                $backups[] = [
                    'filename' => basename($file),
                    'size_kb' => round(filesize($file) / 1024, 2),
                    'size_mb' => round(filesize($file) / 1024 / 1024, 2),
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                ];
            }
            // Sort newest first
            usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
        }

        return response()->json(['success' => true, 'data' => $backups]);
    }

    /**
     * Download backup file
     */
    public function downloadBackup($filename)
    {
        $this->checkMaster();

        $filepath = storage_path("app/backups/{$filename}");

        if (!file_exists($filepath)) {
            return response()->json(['success' => false, 'message' => 'File tidak ditemukan'], 404);
        }

        return response()->download($filepath, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    /**
     * Delete backup file
     */
    public function deleteBackup($filename)
    {
        $this->checkMaster();

        $filepath = storage_path("app/backups/{$filename}");

        if (!file_exists($filepath)) {
            return response()->json(['success' => false, 'message' => 'File tidak ditemukan'], 404);
        }

        unlink($filepath);

        return response()->json(['success' => true, 'message' => 'Backup berhasil dihapus']);
    }

    /**
     * Get backup schedule settings
     */
    public function getBackupSettings()
    {
        $this->checkMaster();

        return response()->json([
            'success' => true,
            'data' => [
                'backup_enabled' => AppSetting::get('backup_enabled', '0') === '1',
                'backup_day' => (int) AppSetting::get('backup_day', 1),
            ],
        ]);
    }

    /**
     * Update backup schedule settings
     */
    public function updateBackupSettings(Request $request)
    {
        $this->checkMaster();

        $request->validate([
            'backup_enabled' => 'required|boolean',
            'backup_day' => 'required|integer|min:1|max:28',
        ]);

        AppSetting::set('backup_enabled', $request->backup_enabled ? '1' : '0');
        AppSetting::set('backup_day', (string) $request->backup_day);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal backup berhasil diperbarui',
            'data' => [
                'backup_enabled' => $request->backup_enabled,
                'backup_day' => $request->backup_day,
            ],
        ]);
    }

    // ==================== HELPER METHODS ====================

    private function getDirectorySize($path)
    {
        $size = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            $size += $file->getSize();
        }
        return $size;
    }

    private function tailFile($filepath, $lines = 500)
    {
        $file = new \SplFileObject($filepath, 'r');
        $file->seek(PHP_INT_MAX);
        $totalLines = $file->key();

        $start = max(0, $totalLines - $lines);
        $file->seek($start);

        $content = '';
        while (!$file->eof()) {
            $content .= $file->fgets();
        }

        return $content;
    }

    private function parseLogEntries($content, $levelFilter = null)
    {
        $entries = [];
        $pattern = '/\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]\s+\w+\.(ERROR|WARNING|INFO|DEBUG|CRITICAL|ALERT|EMERGENCY|NOTICE):\s+(.*)/';

        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $level = $match[2];
            
            if ($levelFilter && strtoupper($levelFilter) !== $level) {
                continue;
            }

            $entries[] = [
                'timestamp' => $match[1],
                'level' => $level,
                'message' => mb_substr(trim($match[3]), 0, 500),
            ];
        }

        return $entries;
    }

    private function findMysqldump()
    {
        $paths = [
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump',
            '/usr/local/mysql/bin/mysqldump',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
            'mysqldump',
        ];

        foreach ($paths as $path) {
            if (PHP_OS_FAMILY === 'Windows') {
                exec("where mysqldump 2>NUL", $output, $code);
                if ($code === 0 && !empty($output)) return $output[0];
            }
            if (file_exists($path) && is_executable($path)) return $path;
        }

        // Try shell
        exec('which mysqldump 2>/dev/null', $output, $code);
        if ($code === 0 && !empty($output)) return $output[0];

        return null;
    }

    private function phpNativeBackup($filepath, $dbName)
    {
        $tables = DB::select('SHOW TABLES');
        $sql = "-- Database Backup: {$dbName}\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Method: PHP Native\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tableKey = "Tables_in_{$dbName}";

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            // Table structure
            $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
            if (!empty($createTable)) {
                $createSql = $createTable[0]->{'Create Table'} ?? '';
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= "{$createSql};\n\n";
            }

            // Table data
            $rows = DB::select("SELECT * FROM `{$tableName}`");
            if (!empty($rows)) {
                foreach ($rows as $row) {
                    $values = array_map(function ($val) {
                        if (is_null($val)) return 'NULL';
                        return "'" . addslashes($val) . "'";
                    }, (array) $row);

                    $columns = array_keys((array) $row);
                    $sql .= "INSERT INTO `{$tableName}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                }
                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        file_put_contents($filepath, $sql);
    }

    private function cleanupOldBackups($dir, $keep = 5)
    {
        $files = glob("{$dir}/*.sql");
        usort($files, fn($a, $b) => filemtime($b) - filemtime($a));

        foreach (array_slice($files, $keep) as $file) {
            unlink($file);
        }
    }
}
