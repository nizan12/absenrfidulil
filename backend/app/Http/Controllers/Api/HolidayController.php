<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $query = Holiday::query();

        // Filter by month/year
        if ($request->month && $request->year) {
            $query->whereMonth('date', $request->month)
                  ->whereYear('date', $request->year);
        } elseif ($request->year) {
            $query->whereYear('date', $request->year);
        }

        $holidays = $query->orderBy('date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $holidays,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date|unique:holidays,date',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($request->only(['date', 'name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Hari libur berhasil ditambahkan',
            'data' => $holiday,
        ], 201);
    }

    /**
     * Bulk store holidays (for date ranges)
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'holidays' => 'required|array|min:1',
            'holidays.*.date' => 'required|date',
            'holidays.*.name' => 'required|string|max:255',
            'holidays.*.description' => 'nullable|string',
        ]);

        $created = 0;
        $skipped = 0;

        foreach ($request->holidays as $holidayData) {
            $exists = Holiday::where('date', $holidayData['date'])->exists();
            if (!$exists) {
                Holiday::create([
                    'date' => $holidayData['date'],
                    'name' => $holidayData['name'],
                    'description' => $holidayData['description'] ?? null,
                ]);
                $created++;
            } else {
                $skipped++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$created} hari libur ditambahkan" . ($skipped > 0 ? ", {$skipped} dilewati (sudah ada)" : ""),
            'created' => $created,
            'skipped' => $skipped,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $holiday = Holiday::findOrFail($id);

        $request->validate([
            'date' => 'required|date|unique:holidays,date,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $holiday->update($request->only(['date', 'name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Hari libur berhasil diperbarui',
            'data' => $holiday,
        ]);
    }

    public function destroy($id)
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hari libur berhasil dihapus',
        ]);
    }
}
