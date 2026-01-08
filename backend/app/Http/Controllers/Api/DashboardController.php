<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index()
    {
        $statistics = $this->dashboardService->getStatistics();
        $recentLogs = $this->dashboardService->getRecentLogs(10);

        return response()->json([
            'success' => true,
            'data' => [
                'statistics' => $statistics,
                'recent_logs' => $recentLogs,
            ],
        ]);
    }

    public function todayAttendance()
    {
        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getTodayAttendance(),
        ]);
    }

    public function weeklyAttendance()
    {
        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getWeeklyAttendance(),
        ]);
    }

    public function recentLogs(Request $request)
    {
        $limit = $request->get('limit', 20);
        
        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getRecentLogs($limit),
        ]);
    }
}
