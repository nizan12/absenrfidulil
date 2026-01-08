<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = NotificationLog::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 20);
        $logs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function statistics()
    {
        $total = NotificationLog::count();
        $sent = NotificationLog::where('status', 'sent')->count();
        $failed = NotificationLog::where('status', 'failed')->count();
        $pending = NotificationLog::where('status', 'pending')->count();
        $today = NotificationLog::whereDate('created_at', today())->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'sent' => $sent,
                'success' => $sent, // alias for frontend
                'failed' => $failed,
                'pending' => $pending,
                'today' => $today,
                'success_rate' => $total > 0 ? round(($sent / $total) * 100, 2) : 0,
            ],
        ]);
    }
}
