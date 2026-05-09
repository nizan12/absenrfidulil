<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AppSetting;
use Illuminate\Support\Facades\DB;

class AutoBackupDatabase extends Command
{
    protected $signature = 'backup:auto';
    protected $description = 'Auto backup database berdasarkan jadwal yang dikonfigurasi';

    public function handle()
    {
        // Check if auto backup is enabled
        $backupEnabled = AppSetting::get('backup_enabled', '0');
        $backupDay = (int) AppSetting::get('backup_day', 1); // tanggal 1-28

        if ($backupEnabled !== '1') {
            $this->info('Auto backup dinonaktifkan.');
            return 0;
        }

        // Check if today is the backup day
        $today = (int) now()->format('d');
        if ($today !== $backupDay) {
            $this->info("Bukan hari backup. Hari ini: {$today}, jadwal: {$backupDay}");
            return 0;
        }

        // Check if already backed up today
        $backupDir = storage_path('app/backups');
        $todayFile = "backup_auto_" . now()->format('Y-m-d') . '.sql';
        if (file_exists("{$backupDir}/{$todayFile}")) {
            $this->info('Backup otomatis hari ini sudah ada.');
            return 0;
        }

        // Create backup
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $dbHost = config('database.connections.mysql.host');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $filepath = "{$backupDir}/{$todayFile}";

        // Try mysqldump
        $dumped = false;
        exec('which mysqldump 2>/dev/null', $output, $code);
        if ($code === 0 && !empty($output)) {
            $command = sprintf(
                '%s --host=%s --user=%s --password=%s %s > %s 2>&1',
                escapeshellarg($output[0]),
                escapeshellarg($dbHost),
                escapeshellarg($dbUser),
                escapeshellarg($dbPass),
                escapeshellarg($dbName),
                escapeshellarg($filepath)
            );
            exec($command, $out, $ret);
            if ($ret === 0 && file_exists($filepath) && filesize($filepath) > 0) {
                $dumped = true;
            }
        }

        // Fallback: PHP native
        if (!$dumped) {
            $this->phpNativeBackup($filepath, $dbName);
        }

        if (file_exists($filepath) && filesize($filepath) > 0) {
            $sizeMb = round(filesize($filepath) / 1024 / 1024, 2);
            $this->info("Auto backup berhasil: {$todayFile} ({$sizeMb} MB)");
            return 0;
        }

        $this->error('Gagal membuat auto backup');
        return 1;
    }

    private function phpNativeBackup($filepath, $dbName)
    {
        $tables = DB::select('SHOW TABLES');
        $sql = "-- Auto Backup: {$dbName}\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tableKey = "Tables_in_{$dbName}";

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
            if (!empty($createTable)) {
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= ($createTable[0]->{'Create Table'} ?? '') . ";\n\n";
            }

            $rows = DB::select("SELECT * FROM `{$tableName}`");
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

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        file_put_contents($filepath, $sql);
    }
}
