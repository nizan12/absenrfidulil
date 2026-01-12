<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TapService;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class TapController extends Controller
{
    protected $tapService;

    public function __construct(TapService $tapService)
    {
        $this->tapService = $tapService;
    }

    public function studentTap(Request $request)
    {
        $request->validate([
            'device_code' => 'required|string',
            'rfid_uid' => 'required|string',
            'api_key' => 'required|string',
        ]);

        // Verify API key
        $validApiKey = AppSetting::get('esp_api_key');
        if ($validApiKey && $request->api_key !== $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key',
                'code' => 'INVALID_API_KEY'
            ], 401);
        }

        $result = $this->tapService->processStudentTap(
            $request->device_code,
            $request->rfid_uid
        );

        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }

    public function teacherTap(Request $request)
    {
        $request->validate([
            'device_code' => 'required|string',
            'rfid_uid' => 'required|string',
            'api_key' => 'required|string',
        ]);

        // Verify API key
        $validApiKey = AppSetting::get('esp_api_key');
        if ($validApiKey && $request->api_key !== $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key',
                'code' => 'INVALID_API_KEY'
            ], 401);
        }

        $result = $this->tapService->processTeacherTap(
            $request->device_code,
            $request->rfid_uid
        );

        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }

    // Universal tap endpoint - auto-detect student or teacher
    public function tap(Request $request)
    {
        $request->validate([
            'device_code' => 'required|string',
            'rfid_uid' => 'required|string',
            'api_key' => 'required|string',
        ]);

        // Verify API key
        $validApiKey = AppSetting::get('esp_api_key');
        if ($validApiKey && $request->api_key !== $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key',
                'code' => 'INVALID_API_KEY'
            ], 401);
        }

        // Try student first
        $result = $this->tapService->processStudentTap(
            $request->device_code,
            $request->rfid_uid
        );

        // If student not found, try teacher
        if (!$result['success'] && ($result['code'] ?? '') === 'STUDENT_NOT_FOUND') {
            $result = $this->tapService->processTeacherTap(
                $request->device_code,
                $request->rfid_uid
            );
        }

        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }

    // Manual tap from dashboard (requires authentication)
    public function manualTap(Request $request)
    {
        $request->validate([
            'rfid_uid' => 'required|string',
            'device_id' => 'required|exists:esp_devices,id',
        ]);

        // Get device code from device ID
        $device = \App\Models\EspDevice::find($request->device_id);
        
        if (!$device || !$device->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Device tidak aktif atau tidak ditemukan',
                'code' => 'DEVICE_INACTIVE'
            ], 400);
        }

        // Try student first
        $result = $this->tapService->processStudentTap(
            $device->device_code,
            $request->rfid_uid
        );

        // If student not found, try teacher
        if (!$result['success'] && ($result['code'] ?? '') === 'STUDENT_NOT_FOUND') {
            $result = $this->tapService->processTeacherTap(
                $device->device_code,
                $request->rfid_uid
            );
        }

        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }

    // Public manual tap - for USB RFID readers (no authentication)
    public function publicManualTap(Request $request)
    {
        $request->validate([
            'rfid_uid' => 'required|string',
        ]);

        // Get default USB reader device from settings, or use first active device
        $defaultDeviceId = AppSetting::get('default_usb_reader_device_id');
        
        if ($defaultDeviceId) {
            $device = \App\Models\EspDevice::find($defaultDeviceId);
        } else {
            // Fallback: use first active device
            $device = \App\Models\EspDevice::where('is_active', true)->first();
        }
        
        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada device aktif yang tersedia',
                'code' => 'NO_ACTIVE_DEVICE'
            ], 400);
        }

        // Try student first
        $result = $this->tapService->processStudentTap(
            $device->device_code,
            $request->rfid_uid
        );

        // If student not found, try teacher
        if (!$result['success'] && ($result['code'] ?? '') === 'STUDENT_NOT_FOUND') {
            $result = $this->tapService->processTeacherTap(
                $device->device_code,
                $request->rfid_uid
            );
        }

        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }
}
