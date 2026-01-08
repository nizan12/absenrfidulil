import { useState, useEffect, useRef } from 'react';
import { attendanceService, deviceService } from '../services/dataService';
import CustomSelect from '../components/ui/CustomSelect';
import { Skeleton } from '../components/ui/Skeleton';
import {
    Eye,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Users,
    GraduationCap,
    Wifi,
    CreditCard,
    Send,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveMonitor() {
    const [loading, setLoading] = useState(true);
    const [studentLogs, setStudentLogs] = useState([]);
    const [teacherLogs, setTeacherLogs] = useState([]);
    const [connected, setConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const intervalRef = useRef(null);

    // Manual input states
    const [rfidInput, setRfidInput] = useState('');
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLogs();
        fetchDevices();

        // Poll every 5 seconds for updates (fallback for WebSocket)
        intervalRef.current = setInterval(() => {
            fetchLogs(false);
        }, 5000);

        // Try to connect to WebSocket (if available)
        tryConnectWebSocket();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const fetchDevices = async () => {
        try {
            const response = await deviceService.getAll();
            if (response.success) {
                const activeDevices = (response.data || []).filter(d => d.is_active);
                setDevices(activeDevices);
                if (activeDevices.length > 0) {
                    setSelectedDevice(activeDevices[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    };

    const tryConnectWebSocket = () => {
        // Check if Echo/Pusher is available
        if (window.Echo) {
            window.Echo.channel('attendance')
                .listen('.tap.received', (data) => {
                    handleNewTap(data);
                });
            setConnected(true);
        }
    };

    const handleNewTap = (data) => {
        setLastUpdate(new Date());

        if (data.type === 'student') {
            setStudentLogs(prev => {
                const newLogs = [data.data, ...prev.slice(0, 49)];
                return newLogs;
            });
            toast.success(`${data.data.student?.name} ${data.data.tap_type === 'in' ? 'masuk' : 'keluar'}!`, {
                icon: data.data.tap_type === 'in' ? '🟢' : '🔴',
            });
        } else if (data.type === 'teacher') {
            setTeacherLogs(prev => {
                const newLogs = [data.data, ...prev.slice(0, 19)];
                return newLogs;
            });
            toast.success(`Guru ${data.data.teacher?.name} ${data.data.tap_type === 'in' ? 'hadir' : 'keluar'}!`, {
                icon: '👨‍🏫',
            });
        }
    };

    const fetchLogs = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await attendanceService.getLiveMonitor();
            if (response.success) {
                setStudentLogs(response.data.students || []);
                setTeacherLogs(response.data.teachers || []);
                setLastUpdate(new Date());
            }
        } catch (error) {
            if (showLoading) toast.error('Gagal memuat data');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleManualTap = async (e) => {
        e.preventDefault();

        if (!rfidInput.trim()) {
            toast.error('Masukkan nomor RFID');
            return;
        }

        if (!selectedDevice) {
            toast.error('Pilih device/lokasi');
            return;
        }

        setSubmitting(true);
        try {
            const response = await attendanceService.manualTap(rfidInput.trim(), selectedDevice);
            if (response.success) {
                toast.success(response.message || 'Berhasil!');
                setRfidInput('');
                // Refresh logs immediately
                fetchLogs(false);
            } else {
                toast.error(response.message || 'Gagal mencatat kehadiran');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Gagal mencatat kehadiran';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        return timeStr;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                {/* Manual Input Skeleton */}
                <div className="card p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-10 w-32" />
                        <div className="flex-1">
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student Logs Skeleton */}
                    <div className="card h-[600px]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-5 w-8 rounded-full" />
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Teacher Logs Skeleton */}
                    <div className="card h-[600px]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-5 w-8 rounded-full" />
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                        <Eye className="text-primary-600" />
                        Live Monitor
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Pantau kehadiran siswa dan guru secara real-time
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${connected
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                        }`}>
                        {connected ? <Wifi size={16} /> : <RefreshCw size={16} className="animate-spin" />}
                        {connected ? 'Real-time' : 'Polling (5s)'}
                    </div>
                    {lastUpdate && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Update: {lastUpdate.toLocaleTimeString('id-ID')}
                        </span>
                    )}
                    <button
                        onClick={() => fetchLogs(true)}
                        className="btn btn-secondary"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Manual Input Card */}
            <div className="card p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <form onSubmit={handleManualTap} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <CreditCard className="text-primary-600" size={24} />
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Input Manual:</span>
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={rfidInput}
                            onChange={(e) => setRfidInput(e.target.value)}
                            placeholder="Masukkan nomor RFID (UID)"
                            className="input font-mono"
                            disabled={submitting}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            options={devices.length === 0
                                ? [{ value: '', label: 'Tidak ada device' }]
                                : devices.map(device => ({ value: device.id, label: device.location?.name || device.name }))
                            }
                            value={selectedDevice}
                            onChange={setSelectedDevice}
                            placeholder="Pilih Device"
                            disabled={submitting}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting || !rfidInput.trim() || !selectedDevice}
                        className="btn btn-primary disabled:opacity-50"
                    >
                        {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        <span>Kirim</span>
                    </button>
                </form>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Tidak perlu scan kartu - masukkan nomor UID RFID secara manual untuk mencatat kehadiran
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Logs */}
                <div className="card">
                    <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <GraduationCap size={20} style={{ color: 'var(--accent-color)' }} />
                            Kehadiran Siswa Hari Ini
                            <span className="ml-auto badge" style={{ background: 'var(--accent-color-light)', color: 'var(--accent-color)' }}>{studentLogs.length}</span>
                        </h2>
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
                        {studentLogs.length > 0 ? (
                            studentLogs.map((log, index) => (
                                <div
                                    key={`${log.id}-${index}`}
                                    className={`p-4 flex items-center gap-4 ${index === 0 ? 'animate-pulse' : ''}`}
                                    style={{ background: index === 0 ? 'var(--accent-color-light)' : 'transparent' }}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${log.tap_type === 'in'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        {log.tap_type === 'in' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {log.name}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {log.class} • {log.location}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`badge ${log.tap_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                                            {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                        </span>
                                        <p className="text-xs mt-1 flex items-center justify-end gap-1" style={{ color: 'var(--text-secondary)' }}>
                                            <Clock size={12} />
                                            {formatTime(log.tapped_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
                                <p>Belum ada kehadiran siswa hari ini</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Teacher Logs */}
                <div className="card">
                    <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Users size={20} style={{ color: 'var(--accent-color)' }} />
                            Kehadiran Guru Hari Ini
                            <span className="ml-auto badge" style={{ background: 'var(--accent-color-light)', color: 'var(--accent-color)' }}>{teacherLogs.length}</span>
                        </h2>
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
                        {teacherLogs.length > 0 ? (
                            teacherLogs.map((log, index) => (
                                <div
                                    key={`${log.id}-${index}`}
                                    className={`p-4 flex items-center gap-4 ${index === 0 ? 'animate-pulse' : ''}`}
                                    style={{ background: index === 0 ? 'var(--accent-color-light)' : 'transparent' }}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${log.tap_type === 'in'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        {log.tap_type === 'in' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {log.name}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            NIP: {log.nip} • {log.location}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`badge ${log.tap_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                                            {log.tap_type === 'in' ? 'Hadir' : 'Keluar'}
                                        </span>
                                        <p className="text-xs mt-1 flex items-center justify-end gap-1" style={{ color: 'var(--text-secondary)' }}>
                                            <Clock size={12} />
                                            {formatTime(log.tapped_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                <Users size={48} className="mx-auto mb-3 opacity-30" />
                                <p>Belum ada kehadiran guru hari ini</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="card p-4" style={{ background: 'var(--accent-color-light)', borderColor: 'var(--accent-color)' }}>
                <div className="flex items-start gap-3">
                    <Eye style={{ color: 'var(--accent-color)' }} className="flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Cara Kerja</h3>
                        <ul className="text-sm mt-1 list-disc list-inside space-y-1" style={{ color: 'var(--text-secondary)' }}>
                            <li>Data terupdate otomatis setiap 5 detik</li>
                            <li>Gunakan form di atas untuk input manual nomor RFID tanpa perlu scan kartu</li>
                            <li>Pilih lokasi/device yang sesuai untuk mencatat kehadiran</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
