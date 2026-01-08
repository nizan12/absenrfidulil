<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    protected $allowedKeys = [
        'institution_name',
        'institution_address',
        'institution_logo',
        'principal_phone',
        'fonnte_api_token',
        'esp_api_key',
        'default_tap_delay',
    ];

    public function index()
    {
        $settings = AppSetting::whereIn('key', $this->allowedKeys)
            ->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            if (in_array($key, $this->allowedKeys)) {
                AppSetting::set($key, $value);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil diperbarui',
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            AppSetting::set('institution_logo', $path);

            return response()->json([
                'success' => true,
                'message' => 'Logo berhasil diupload',
                'data' => ['path' => $path],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan',
        ], 400);
    }
}
