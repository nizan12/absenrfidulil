import { useState, useEffect } from 'react';
import { Skeleton } from '../components/ui/Skeleton';
import { dashboardService } from '../services/dashboardService';
import {
    Users,
    GraduationCap,
    BookOpen,
    Cpu,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Activity,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StatCard = ({ icon: Icon, label, value, color, trend, trendUp }) => (
    <div className="stat-card">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon size={28} className="text-white" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await dashboardService.getStatistics();
            if (response.success) {
                setStats(response.data.statistics);
                setRecentLogs(response.data.recent_logs);
            }
        } catch (error) {
            toast.error('Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    const weeklyChartData = {
        labels: stats?.weekly_attendance ? Object.keys(stats.weekly_attendance) : [],
        datasets: [
            {
                label: 'Kehadiran Siswa',
                data: stats?.weekly_attendance ? Object.values(stats.weekly_attendance) : [],
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
            },
        ],
    };

    const monthlyChartData = {
        labels: stats?.monthly_attendance ? Object.keys(stats.monthly_attendance) : [],
        datasets: [
            {
                label: 'Kehadiran Bulanan',
                data: stats?.monthly_attendance ? Object.values(stats.monthly_attendance) : [],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                                <Skeleton className="h-14 w-14 rounded-2xl" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Today Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-8 w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                    <div className="card p-6">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                </div>

                {/* Recent Activity Skeleton */}
                <div className="card p-6">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1 max-w-sm">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Selamat datang di Sistem Absensi RFID</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={GraduationCap}
                    label="Total Siswa"
                    value={stats?.total_students || 0}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                    icon={Users}
                    label="Total Guru"
                    value={stats?.total_teachers || 0}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                    icon={BookOpen}
                    label="Total Kelas"
                    value={stats?.total_classes || 0}
                    color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
                <StatCard
                    icon={Cpu}
                    label="Perangkat Aktif"
                    value={stats?.total_devices || 0}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                />
            </div>

            {/* Today Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card !bg-gradient-to-br !from-blue-500 !to-blue-600" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <TrendingUp size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Siswa Masuk Hari Ini</p>
                            <p className="text-3xl font-bold" style={{ color: 'white' }}>{stats?.today_attendance?.students_in || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(to bottom right, #f59e0b, #f97316)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <ArrowDownRight size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Siswa Keluar Hari Ini</p>
                            <p className="text-3xl font-bold" style={{ color: 'white' }}>{stats?.today_attendance?.students_out || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(to bottom right, #22c55e, #059669)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <Activity size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Total Tap Hari Ini</p>
                            <p className="text-3xl font-bold" style={{ color: 'white' }}>{stats?.today_attendance?.total_taps || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Kehadiran Minggu Ini
                    </h3>
                    <div className="h-64">
                        <Line data={weeklyChartData} options={chartOptions} />
                    </div>
                </div>
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Kehadiran Bulanan
                    </h3>
                    <div className="h-64">
                        <Bar data={monthlyChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Aktivitas Terbaru
                </h3>
                <div className="space-y-3">
                    {recentLogs.length > 0 ? (
                        recentLogs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ background: 'var(--bg-page)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.tap_type === 'in'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        {log.tap_type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{log.student_name}</p>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{log.class}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`badge ${log.tap_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                                        {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                    </span>
                                    <p className="text-xs mt-1 flex items-center gap-1 justify-end" style={{ color: 'var(--text-muted)' }}>
                                        <Clock size={12} />
                                        {log.time_ago}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                            Belum ada aktivitas hari ini
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
