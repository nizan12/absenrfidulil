<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentParent;
use App\Models\Student;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentParent::with('student.class');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $perPage = $request->get('per_page', 15);
        $parents = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $parents,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'relationship' => 'required|in:ayah,ibu,wali',
            'receive_notification' => 'boolean',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['student_id', 'name', 'phone', 'relationship']);
        $data['receive_notification'] = $request->boolean('receive_notification', true);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/parents', 'public');
        }

        $parent = StudentParent::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Orang tua berhasil ditambahkan',
            'data' => $parent->load('student'),
        ], 201);
    }

    public function show(StudentParent $parent)
    {
        return response()->json([
            'success' => true,
            'data' => $parent->load('student.class'),
        ]);
    }

    public function update(Request $request, StudentParent $parent)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'relationship' => 'sometimes|in:ayah,ibu,wali',
            'receive_notification' => 'sometimes|boolean',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['name', 'phone', 'relationship', 'receive_notification']);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos/parents', 'public');
        }

        $parent->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Orang tua berhasil diperbarui',
            'data' => $parent,
        ]);
    }

    public function destroy(StudentParent $parent)
    {
        $parent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Orang tua berhasil dihapus',
        ]);
    }
}
