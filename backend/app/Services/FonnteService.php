<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Http;

class FonnteService
{
    protected $apiUrl = 'https://api.fonnte.com/send';
    
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

    public function sendStudentNotification($student, $tapType, $location, $tappedAt, $isBoarding = false)
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
            $message .= "📍 {$location}\n\n";
            $message .= "🏨 _Siswa Asrama - {$institutionName}_";
        } else {
            // REGULAR STUDENT MESSAGE
            $status = $tapType === 'in' ? 'MASUK' : 'KELUAR';
            
            $message = "📍 *Notifikasi Kehadiran*\n\n";
            $message .= "Ananda *{$student->name}* telah *{$status}* sekolah pada:\n";
            $message .= "📅 " . $tappedAt->format('d F Y') . "\n";
            $message .= "⏰ " . $tappedAt->format('H:i') . " WIB\n";
            $message .= "📍 {$location}\n\n";
            $message .= "_{$institutionName}_";
        }

        $results = [];
        foreach ($parents as $parent) {
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
        $message .= "⏰ " . $tappedAt->format('H:i') . " WIB\n";
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
