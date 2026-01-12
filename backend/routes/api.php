<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\EspDeviceController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\TapController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordResetController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes - ESP32 tap endpoints
Route::post('/tap', [TapController::class, 'tap']);
Route::post('/tap/student', [TapController::class, 'studentTap']);
Route::post('/tap/teacher', [TapController::class, 'teacherTap']);

// Public routes - Landing page
Route::get('/public/settings', [\App\Http\Controllers\Api\PublicController::class, 'getSettings']);
Route::get('/public/search', [\App\Http\Controllers\Api\PublicController::class, 'searchStudents']);
Route::get('/public/student/{studentId}', [\App\Http\Controllers\Api\PublicController::class, 'getStudentLog']);
Route::get('/public/live', [\App\Http\Controllers\Api\PublicController::class, 'getLiveFeed']);
Route::post('/public/tap/manual', [TapController::class, 'publicManualTap']);

// Password Reset routes
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/theme', [AuthController::class, 'updateTheme']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/today', [DashboardController::class, 'todayAttendance']);
    Route::get('/dashboard/weekly', [DashboardController::class, 'weeklyAttendance']);
    Route::get('/dashboard/recent', [DashboardController::class, 'recentLogs']);

    // Students
    Route::get('/student-template', [StudentController::class, 'downloadTemplate']);
    Route::post('/students/import', [StudentController::class, 'import']);
    Route::apiResource('students', StudentController::class);

    // Classes
    Route::apiResource('classes', ClassController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Users (Admin management)
    Route::apiResource('users', UserController::class);

    // Teachers
    Route::apiResource('teachers', TeacherController::class);

    // Parents
    Route::apiResource('parents', ParentController::class);

    // ESP Devices
    Route::apiResource('devices', EspDeviceController::class);

    // Locations
    Route::apiResource('locations', LocationController::class);

    // Attendance
    Route::get('/attendance/students', [AttendanceController::class, 'studentLogs']);
    Route::get('/attendance/teachers', [AttendanceController::class, 'teacherLogs']);
    Route::get('/attendance/live', [AttendanceController::class, 'liveMonitor']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);
    Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/statistics', [NotificationController::class, 'statistics']);

    // Manual Tap (for dashboard input)
    Route::post('/tap/manual', [TapController::class, 'manualTap']);

    // Reports / Export
    Route::get('/reports/students/export', [\App\Http\Controllers\Api\ReportController::class, 'exportStudentAttendance']);
    Route::get('/reports/students/preview', [\App\Http\Controllers\Api\ReportController::class, 'previewStudentAttendance']);
    Route::get('/reports/teachers/export', [\App\Http\Controllers\Api\ReportController::class, 'exportTeacherAttendance']);
});


