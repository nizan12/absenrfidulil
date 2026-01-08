import { useState, useEffect, useRef } from 'react';
import { publicService } from '../services/publicService';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export default function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentLogs, setStudentLogs] = useState([]);
    const [liveFeed, setLiveFeed] = useState([]);
    const [stats, setStats] = useState({ total_in: 0, total_out: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchLiveFeed();

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
            if (searchQuery.length >= 2) {
                searchStudents();
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchQuery]);

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
        setShowSuggestions(false);
        setLoading(true);

        try {
            const response = await publicService.getStudentLog(student.id);
            if (response.success) {
                setStudentLogs(response.logs || []);
                setSelectedStudent(response.student);
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
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            {/* Glassmorphism Header */}
            <header className="sticky top-4 mx-4 z-50">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <GraduationCap className="text-white" size={22} />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="font-bold text-white text-lg">Absensi RFID</h1>
                                    <p className="text-blue-200 text-xs">Student Log System</p>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div ref={searchRef} className="flex-1 max-w-xl relative">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        placeholder="Cari siswa atau nama orang tua..."
                                        className="w-full pl-12 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="text-white/60" size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                        {suggestions.map((student) => (
                                            <button
                                                key={student.id}
                                                onClick={() => selectStudent(student)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="text-blue-600 dark:text-blue-400" size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        NIS: {student.nis} • {student.class}
                                                    </p>
                                                </div>
                                                <ChevronRight className="text-gray-400" size={20} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Login Button */}
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all flex-shrink-0"
                            >
                                <LogIn size={18} />
                                <span className="hidden sm:inline">Login</span>
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
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                                    {selectedStudent.name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                                    <p className="text-blue-200">NIS: {selectedStudent.nis} • {selectedStudent.class}</p>
                                    {selectedStudent.parents?.length > 0 && (
                                        <p className="text-blue-300 text-sm mt-1">
                                            Orang Tua: {selectedStudent.parents.map(p => p.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Calendar size={20} />
                                    Riwayat Kehadiran
                                </h3>
                            </div>
                            <div className="divide-y divide-white/10 max-h-[400px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
                                    </div>
                                ) : studentLogs.length > 0 ? (
                                    studentLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.tap_type === 'in'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {log.tap_type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                                    </p>
                                                    <p className="text-sm text-blue-200">{log.location}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">{log.time}</p>
                                                <p className="text-sm text-blue-200">{log.date}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-blue-200">
                                        Belum ada data kehadiran
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={clearSearch}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                        >
                            Kembali ke Live Feed
                        </button>
                    </div>
                ) : (
                    /* Live Feed View */
                    <div className="space-y-6">
                        {/* Stats & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200 text-sm">Hari ini</p>
                                        <p className="text-white text-xl font-semibold">{formatDate(currentTime)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-200 text-sm">Waktu</p>
                                        <p className="text-white text-4xl font-bold font-mono">
                                            {currentTime.toLocaleTimeString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-4 text-center">
                                    <p className="text-green-300 text-sm">Masuk</p>
                                    <p className="text-white text-3xl font-bold">{stats.total_in}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-4 text-center">
                                    <p className="text-red-300 text-sm">Keluar</p>
                                    <p className="text-white text-3xl font-bold">{stats.total_out}</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Feed */}
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Wifi className="text-green-400 animate-pulse" size={20} />
                                    Live Feed - Kehadiran Hari Ini
                                </h3>
                                <span className="text-sm text-blue-200">
                                    Auto refresh setiap 5 detik
                                </span>
                            </div>
                            <div className="divide-y divide-white/10">
                                {liveFeed.length > 0 ? (
                                    liveFeed.map((log, index) => (
                                        <div
                                            key={`${log.id}-${index}`}
                                            className={`flex items-center gap-4 p-4 transition-all ${index === 0 ? 'bg-blue-500/10' : ''
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${log.tap_type === 'in'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {log.tap_type === 'in' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white text-lg truncate">{log.name}</p>
                                                <p className="text-blue-200">{log.class} • {log.location}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${log.tap_type === 'in'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {log.tap_type === 'in' ? 'Masuk' : 'Keluar'}
                                                </span>
                                                <p className="text-blue-200 text-sm mt-1 flex items-center justify-end gap-1">
                                                    <Clock size={14} />
                                                    {log.tapped_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <GraduationCap className="mx-auto text-blue-300/50 mb-4" size={64} />
                                        <p className="text-blue-200 text-lg">Belum ada siswa yang tap hari ini</p>
                                        <p className="text-blue-300 text-sm mt-2">Data akan muncul otomatis saat siswa melakukan tap</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-blue-300/60 text-sm">
                © 2026 Absensi RFID - Student Attendance Log System
            </footer>
        </div>
    );
}
