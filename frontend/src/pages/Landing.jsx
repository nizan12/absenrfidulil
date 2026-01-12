import { useState, useEffect, useRef } from 'react';
import { publicService } from '../services/publicService';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    Search,
    X,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    User,
    GraduationCap,
    Calendar,
    ChevronRight,
    Wifi,
    LogIn,
    Keyboard,
    Scan,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentLogs, setStudentLogs] = useState([]);
    const [todayStatus, setTodayStatus] = useState(null);
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [liveFeed, setLiveFeed] = useState([]);
    const [stats, setStats] = useState({ total_in: 0, total_out: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [inputMode, setInputMode] = useState('live'); // 'live' or 'manual'
    const [rfidInput, setRfidInput] = useState('');
    const [tapResult, setTapResult] = useState(null);
    const [tapLoading, setTapLoading] = useState(false);
    const searchRef = useRef(null);
    const rfidInputRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchLiveFeed();
        fetchSettings();

        // Update live feed every 5 seconds
        intervalRef.current = setInterval(() => {
            fetchLiveFeed();
        }, 5000);

        // Update clock every second
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            clearInterval(clockInterval);
        };
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/public/settings');
            if (response.data.success) {
                setSettings(response.data.data || {});
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchTimer = setTimeout(() => {
            // Don't search if student is already selected
            if (selectedStudent) return;

            if (searchQuery.length >= 2) {
                searchStudents();
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchQuery, selectedStudent]);

    const fetchLiveFeed = async () => {
        try {
            const response = await publicService.getLiveFeed();
            if (response.success) {
                setLiveFeed(response.data.logs || []);
                setStats(response.data.stats || { total_in: 0, total_out: 0 });
            }
        } catch (error) {
            console.error('Error fetching live feed:', error);
        }
    };

    const searchStudents = async () => {
        try {
            const response = await publicService.searchStudents(searchQuery);
            if (response.success) {
                setSuggestions(response.data);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setSearchQuery(student.name);
        setSuggestions([]); // Clear suggestions
        setShowSuggestions(false);
        setLoading(true);

        try {
            const response = await publicService.getStudentLog(student.id);
            if (response.success) {
                setStudentLogs(response.logs || []);
                setSelectedStudent(response.student);
                setTodayStatus(response.today_status || null);
                setMonthlyStats(response.monthly_stats || null);
            }
        } catch (error) {
            console.error('Error fetching student logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSuggestions([]);
        setSelectedStudent(null);
        setStudentLogs([]);
        setTodayStatus(null);
        setMonthlyStats(null);
    };

    const handleManualTap = async (e) => {
        e?.preventDefault();
        if (!rfidInput.trim() || tapLoading) return;

        setTapLoading(true);
        setTapResult(null);

        try {
            const response = await publicService.manualTap(rfidInput.trim());
            const data = response.data || response;
            const name = data.student?.name || data.teacher?.name || 'User';
            const tapType = data.tap_type;
            setTapResult({
                success: true,
                message: `${name} berhasil ${tapType === 'in' ? 'MASUK' : 'KELUAR'}`,
                data: data
            });
            setRfidInput('');
            // Refresh live feed
            fetchLiveFeed();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal memproses tap';
            setTapResult({
                success: false,
                message: errorMessage
            });
        } finally {
            setTapLoading(false);
            // Auto focus back to input
            rfidInputRef.current?.focus();
        }
    };

    // Auto clear result after 5 seconds
    useEffect(() => {
        if (tapResult) {
            const timer = setTimeout(() => setTapResult(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [tapResult]);

    // Focus input when switching to manual mode
    useEffect(() => {
        if (inputMode === 'manual') {
            rfidInputRef.current?.focus();
        }
    }, [inputMode]);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Clean Premium Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    {/* Mobile: Two rows, Desktop: Single row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Row 1: Logo and Buttons */}
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                            {/* Logo from Database */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {settingsLoading ? (
                                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
                                ) : settings.institution_logo ? (
                                    <img
                                        src={`${API_URL}/storage/${settings.institution_logo}`}
                                        alt="Logo"
                                        className="h-10 w-auto object-contain"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <GraduationCap className="text-white" size={22} />
                                    </div>
                                )}
                            </div>

                            {/* Mobile: Buttons on right */}
                            <div className="flex items-center gap-2 sm:hidden">
                                {/* Mode Toggle Button */}
                                <button
                                    onClick={() => setInputMode(inputMode === 'live' ? 'manual' : 'live')}
                                    className={`p-2.5 rounded-xl transition-all ${inputMode === 'manual'
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}
                                >
                                    {inputMode === 'manual' ? <Keyboard size={18} /> : <Scan size={18} />}
                                </button>
                                {/* Login Button */}
                                <Link
                                    to="/login"
                                    className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white"
                                >
                                    <LogIn size={18} />
                                </Link>
                            </div>
                        </div>

                        {/* Row 2 (Mobile) / Middle (Desktop): Search Box */}
                        <div ref={searchRef} className="flex-1 relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder="Cari siswa atau orang tua..."
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <X className="text-slate-400" size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[60] max-h-64 overflow-y-auto">
                                    {suggestions.map((student) => (
                                        <button
                                            key={student.id}
                                            onClick={() => selectStudent(student)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                                        >
                                            {student.photo ? (
                                                <img
                                                    src={`${API_URL}/storage/${student.photo}`}
                                                    alt={student.name}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="text-blue-600" size={20} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 truncate text-sm">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    NIS: {student.nis} • {student.class}
                                                </p>
                                            </div>
                                            <ChevronRight className="text-slate-400 flex-shrink-0" size={18} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop: Buttons on right */}
                        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">

                            {/* Mode Toggle Button */}
                            <button
                                onClick={() => setInputMode(inputMode === 'live' ? 'manual' : 'live')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all flex-shrink-0 ${inputMode === 'manual'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                {inputMode === 'manual' ? (
                                    <>
                                        <Keyboard size={18} />
                                        <span className="hidden sm:inline">Manual</span>
                                    </>
                                ) : (
                                    <>
                                        <Scan size={18} />
                                        <span className="hidden sm:inline">Input RFID</span>
                                    </>
                                )}
                            </button>

                            {/* Login Button */}
                            <Link
                                to="/login"
                                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white font-medium transition-all flex-shrink-0 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                            >
                                <LogIn size={18} className="group-hover:rotate-12 transition-transform" />
                                <span className="hidden sm:inline">Masuk</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {selectedStudent ? (
                    /* Student Log View */
                    <div className="space-y-6">
                        {/* Student Info Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                {/* Left: Photo & Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    {selectedStudent.photo ? (
                                        <img
                                            src={`${API_URL}/storage/${selectedStudent.photo}`}
                                            alt={selectedStudent.name}
                                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                                            {selectedStudent.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{selectedStudent.name}</h2>
                                        <p className="text-slate-500 text-sm">NIS: {selectedStudent.nis} • {selectedStudent.class}</p>
                                        {selectedStudent.parents?.length > 0 && (
                                            <p className="text-slate-400 text-sm mt-1 truncate">
                                                Orang Tua: {selectedStudent.parents.map(p => p.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Today Status & Monthly Stats */}
                                <div className="flex flex-row md:flex-col gap-3 md:gap-2 md:text-right md:border-l md:pl-6 md:border-slate-200">
                                    {/* Today Status */}
                                    {todayStatus && (
                                        <div className="flex-1 md:flex-none">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">Hari Ini</p>
                                            {todayStatus.has_attendance ? (
                                                <div className="flex items-center gap-2 md:justify-end">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle size={12} /> Masuk
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-700">{todayStatus.first_tap?.time}</span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                    Belum Tap
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Calendar size={20} />
                                    Riwayat Kehadiran
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : studentLogs.length > 0 ? (
                                    studentLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.tap_type === 'in'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {log.tap_type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{log.location}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-800 font-medium">{log.time}</p>
                                                <p className="text-sm text-slate-500">{log.date}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        Belum ada data kehadiran
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={clearSearch}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition-all"
                        >
                            Kembali ke Live Feed
                        </button>
                    </div>
                ) : (
                    /* Live Feed View */
                    <div className="space-y-6">
                        {/* Manual Input Card - Only show in manual mode */}
                        {inputMode === 'manual' && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Keyboard className="text-emerald-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Mode Input Manual RFID</h3>
                                        <p className="text-sm text-slate-500">Scan kartu atau ketik nomor RFID</p>
                                    </div>
                                </div>

                                <form onSubmit={handleManualTap} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            ref={rfidInputRef}
                                            type="text"
                                            value={rfidInput}
                                            onChange={(e) => setRfidInput(e.target.value)}
                                            placeholder="Ketik RFID UID..."
                                            className="w-full px-4 py-4 bg-white border-2 border-emerald-200 rounded-xl text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                            autoComplete="off"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!rfidInput.trim() || tapLoading}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {tapLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Submit Tap
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Result Display */}
                                {tapResult && (
                                    <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${tapResult.success
                                        ? 'bg-green-100 border border-green-200 text-green-800'
                                        : 'bg-red-100 border border-red-200 text-red-800'
                                        }`}>
                                        {tapResult.success ? (
                                            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                        ) : (
                                            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{tapResult.message}</p>
                                            {tapResult.data && (
                                                <p className="text-sm opacity-75">
                                                    {new Date().toLocaleTimeString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Hari ini</p>
                                        <p className="text-slate-800 text-xl font-semibold">{formatDate(currentTime)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-sm">Waktu</p>
                                        <p className="text-slate-800 text-4xl font-bold font-mono">
                                            {currentTime.toLocaleTimeString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                                    <p className="text-green-600 text-sm">Masuk</p>
                                    <p className="text-green-700 text-3xl font-bold">{stats.total_in}</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                    <p className="text-red-600 text-sm">Keluar</p>
                                    <p className="text-red-700 text-3xl font-bold">{stats.total_out}</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Feed */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Wifi className="text-green-500 animate-pulse" size={20} />
                                    Live Feed - Kehadiran Hari Ini
                                </h3>
                                <span className="text-sm text-slate-500">
                                    Auto refresh setiap 5 detik
                                </span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {liveFeed.length > 0 ? (
                                    liveFeed.map((log, index) => (
                                        <div
                                            key={`${log.id}-${index}`}
                                            className={`flex items-center gap-4 p-4 transition-all ${index === 0 ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${log.tap_type === 'in'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                                }`}>
                                                {log.tap_type === 'in' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-lg truncate">{log.name}</p>
                                                <p className="text-slate-500">{log.class} • {log.location}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${log.tap_type === 'in'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                                </span>
                                                <p className="text-slate-500 text-sm mt-1 flex items-center justify-end gap-1">
                                                    <Clock size={14} />
                                                    {log.tapped_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <GraduationCap className="mx-auto text-slate-300 mb-4" size={64} />
                                        <p className="text-slate-500 text-lg">Belum ada siswa yang tap hari ini</p>
                                        <p className="text-slate-400 text-sm mt-2">Data akan muncul otomatis saat siswa melakukan tap</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-slate-500 text-sm">
                © 2026 {settings.institution_name || 'Absensi RFID'} - Student Attendance Log System
            </footer>
        </div>
    );
}
