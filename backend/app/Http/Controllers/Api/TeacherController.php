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
}
