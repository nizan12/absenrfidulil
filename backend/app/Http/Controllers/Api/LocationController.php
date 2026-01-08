<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $query = Location::withCount('espDevices');

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $locations = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $location = Location::create($request->only(['name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil ditambahkan',
            'data' => $location,
        ], 201);
    }

    public function show(Location $location)
    {
        return response()->json([
            'success' => true,
            'data' => $location->load('espDevices'),
        ]);
    }

    public function update(Request $request, Location $location)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $location->update($request->only(['name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil diperbarui',
            'data' => $location,
        ]);
    }

    public function destroy(Location $location)
    {
        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil dihapus',
        ]);
    }
}
