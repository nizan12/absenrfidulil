<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EspDevice;
use Illuminate\Http\Request;

class EspDeviceController extends Controller
{
    public function index(Request $request)
    {
        $query = EspDevice::with('location');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('device_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $devices = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $devices,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'device_code' => 'required|string|unique:esp_devices,device_code',
            'name' => 'required|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'type' => 'required|in:gate_in,gate_out,classroom',
            'tap_delay_seconds' => 'nullable|integer|min:0',
        ]);

        $data = $request->only(['device_code', 'name', 'location_id', 'type', 'tap_delay_seconds']);
        $data['is_active'] = true;
        $data['tap_delay_seconds'] = $data['tap_delay_seconds'] ?? 300;

        $device = EspDevice::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Device berhasil ditambahkan',
            'data' => $device->load('location'),
        ], 201);
    }

    public function show(EspDevice $espDevice)
    {
        return response()->json([
            'success' => true,
            'data' => $espDevice->load('location'),
        ]);
    }

    public function update(Request $request, EspDevice $espDevice)
    {
        $request->validate([
            'device_code' => 'sometimes|string|unique:esp_devices,device_code,' . $espDevice->id,
            'name' => 'sometimes|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
            'type' => 'sometimes|in:gate_in,gate_out,classroom',
            'is_active' => 'sometimes|boolean',
            'tap_delay_seconds' => 'nullable|integer|min:0',
        ]);

        $espDevice->update($request->only(['device_code', 'name', 'location_id', 'type', 'is_active', 'tap_delay_seconds']));

        return response()->json([
            'success' => true,
            'message' => 'Device berhasil diperbarui',
            'data' => $espDevice->load('location'),
        ]);
    }

    public function destroy(EspDevice $espDevice)
    {
        $espDevice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device berhasil dihapus',
        ]);
    }
}
