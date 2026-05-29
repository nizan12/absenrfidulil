<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Http;

class FonnteService
{
    protected $apiUrl = 'https://api.fonnte.com/send';

    /**
     * Random delay to mimic human behavior and avoid rate-limiting.
     * @param int $minMs Minimum delay in milliseconds
     * @param int $maxMs Maximum delay in milliseconds
     */
    protected function humanDelay($minMs = 2000, $maxMs = 5000)
    {
        $delay = rand($minMs, $maxMs);
        usleep($delay * 1000); // usleep uses microseconds
    }
    
    public function sendWhatsApp($phone, $message, $type = 'student')
    {
        $token = AppSetting::get('fonnte_api_token');
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Fonnte API token not configured'
            ];
        }

        // Normalize phone number
        $phone = $this->normalizePhone($phone);

        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => $token
                ])->post($this->apiUrl, [
                    'target' => $phone,
                    'message' => $message,
                ]);

            $result = $response->json();

            // Log the notification
            NotificationLog::create([
                'phone' => $phone,
                'message' => $message,
                'type' => $type,
                'status' => $result['status'] ?? false ? 'sent' : 'failed',
                'response' => json_encode($result),
            ]);

            return [
                'success' => $result['status'] ?? false,
                'message' => $result['detail'] ?? 'Unknown error',
                'data' => $result
            ];
        } catch (\Exception $e) {
            NotificationLog::create([
                'phone' => $phone,
                'message' => $message,
                'type' => $type,
                'status' => 'failed',
                'response' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function sendStudentNotification($student, $tapType, $location, $tappedAt, $isBoarding = false, $lateStatus = 'on_time')
    {
        $parents = $student->parents()->where('receive_notification', true)->get();
        $institutionName = AppSetting::get('institution_name', 'Sekolah');
        
        if ($isBoarding) {
            // BOARDING STUDENT MESSAGE - Different wording
            if ($tapType === 'in') {
                $status = 'MASUK ke area sekolah';
                $emoji = '🏫';
            } else {
                $status = 'KELUAR dari area sekolah';
                $emoji = '🏠';
            }
            
            $message = "{$emoji} *Notifikasi Siswa Boarding*\n\n";
            $message .= "Ananda *{$student->name}* telah *{$status}* pada:\n";
            $message .= "📅 " . $tappedAt->format('d F Y') . "\n";
            $message .= "⏰ " . $tappedAt->format('H:i') . " WIB\n";
            $message .= "📍 {$location}\n";

            // Late status notification
            if ($lateStatus === 'late') {
                $lateTimeBoarding = AppSetting::get('late_time_boarding', '17:00');
                $message .= "\n🚫 *TERLAMBAT* - Ananda kembali ke asrama melebihi batas jam masuk ({$lateTimeBoarding} WIB)\n";
            } elseif ($lateStatus === 'tolerated') {
                $message .= "\n⚠️ _Catatan: Masuk dalam batas toleransi keterlambatan_\n";
            }

            $message .= "\n🏨 _Siswa Asrama - {$institutionName}_";
        } else {
            // REGULAR STUDENT MESSAGE
            $status = $tapType === 'in' ? 'MASUK' : 'KELUAR';
            
            $message = "📍 *Notifikasi Kehadiran*\n\n";
            $message .= "Ananda *{$student->name}* telah *{$status}* sekolah pada:\n";
            $message .= "📅 " . $tappedAt->format('d F Y') . "\n";
            $message .= "⏰ " . $tappedAt->format('H:i') . " WIB\n";
            $message .= "📍 {$location}\n";

            // Late status notification
            if ($lateStatus === 'late') {
                $lateTimeRegular = AppSetting::get('late_time_regular', '07:30');
                $message .= "\n🚫 *TERLAMBAT* - Ananda datang melebihi batas jam masuk ({$lateTimeRegular} WIB)\n";
            } elseif ($lateStatus === 'tolerated') {
                $message .= "\n⚠️ _Catatan: Masuk dalam batas toleransi keterlambatan_\n";
            }

            $message .= "\n_{$institutionName}_";
        }

        $results = [];
        foreach ($parents as $index => $parent) {
            // Delay between messages to avoid rate-limiting (skip delay for first message)
            if ($index > 0) {
                $this->humanDelay(2000, 5000); // 2-5 second random delay
            }
            $results[] = $this->sendWhatsApp($parent->phone, $message, 'student');
        }

        return $results;
    }

    public function sendTeacherNotification($teacher, $tapType, $location, $tappedAt)
    {
        $principalPhone = AppSetting::get('principal_phone');
        $institutionName = AppSetting::get('institution_name', 'Sekolah');
        
        if (!$principalPhone) {
            return ['success' => false, 'message' => 'Principal phone not configured'];
        }

        $status = $tapType === 'in' ? 'HADIR' : 'KELUAR';
        
        $message = "📍 *Notifikasi Guru*\n\n";
        $message .= "Bapak/Ibu *{$teacher->name}* telah *{$status}* di:\n";
        $message .= "📅 " . $tappedAt->format('d F Y') . "\n";
        $message .= "⏰ " . $tappedAt->format('H:i') . "\n";
        $message .= "📍 {$location}\n\n";
        $message .= "_{$institutionName}_";

        return $this->sendWhatsApp($principalPhone, $message, 'teacher');
    }

    protected function normalizePhone($phone)
    {
        // Remove all non-digits
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Convert 08xx to 628xx
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }
        
        return $phone;
    }
}

