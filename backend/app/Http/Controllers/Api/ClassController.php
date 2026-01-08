<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = Classes::withCount('students');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $classes = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'grade' => 'nullable|string|max:50',
            'major' => 'nullable|string|max:100',
        ]);

        $class = Classes::create($request->only(['name', 'grade', 'major']));

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil ditambahkan',
            'data' => $class,
        ], 201);
    }

    public function show(Classes $class)
    {
        return response()->json([
            'success' => true,
            'data' => $class->load('students'),
        ]);
    }

    public function update(Request $request, Classes $class)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'grade' => 'nullable|string|max:50',
            'major' => 'nullable|string|max:100',
        ]);

        $class->update($request->only(['name', 'grade', 'major']));

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diperbarui',
            'data' => $class,
        ]);
    }

    public function destroy(Classes $class)
    {
        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus',
        ]);
    }
}
