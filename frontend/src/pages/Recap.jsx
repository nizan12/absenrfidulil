import { useState, useEffect } from 'react';
import { attendanceService, classService } from '../services/dataService';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import {
    Download,
    Calendar,
    FileSpreadsheet,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    ClipboardList,
    Users,
    GraduationCap,
    User,
    CalendarCheck,
    CalendarX,
    Clock,
    TrendingUp,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Recap() {
    const [activeTab, setActiveTab] = useState('recap');
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);

    // Recap state
    const [recapData, setRecapData] = useState([]);
    const [recapSummary, setRecapSummary] = useState(null);
    const [recapLoading, setRecapLoading] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [recapPage, setRecapPage] = useState(1);
    const [recapPerPage, setRecapPerPage] = useState(10);

    // Get current month range as defaults
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const [filters, setFilters] = useState({
        date_from: firstDay,
        date_to: lastDayStr,
        class_id: '',
        name: '',
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (activeTab === 'recap') {
            fetchRecap();
        } else {
            fetchLogs();
        }
    }, [activeTab]);

    const fetchClasses = async () => {
        try {
            const response = await classService.getAll();
            if (response.success) {
                setClasses(response.data);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page,
                per_page: perPage,
            };

            const response = activeTab === 'students'
                ? await attendanceService.getStudentLogs(params)
                : await attendanceService.getTeacherLogs(params);

            if (response.success) {
                setLogs(response.data.data || []);
                setPagination({
                    currentPage: response.data.current_page,
                    lastPage: response.data.last_page,
                    total: response.data.total,
                });
            }
        } catch (error) {
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecap = async () => {
        if (!filters.date_from || !filters.date_to) {
            toast.error('Pilih range tanggal terlebih dahulu');
            return;
        }
        setRecapLoading(true);
        try {
            const params = {
                date_from: filters.date_from,
                date_to: filters.date_to,
            };
            if (filters.class_id) params.class_id = filters.class_id;
            if (filters.name) params.name = filters.name;

            const response = await attendanceService.getStudentRecap(params);
            if (response.success) {
            setRecapData(response.data.recap || []);
                setRecapSummary(response.data.summary || null);
                setRecapPage(1); // Reset to first page on new search
            }
        } catch (error) {
            toast.error('Gagal memuat rekap kehadiran');
        } finally {
            setRecapLoading(false);
        }
    };

    const handleSearch = () => {
        if (activeTab === 'recap') {
            fetchRecap();
        } else {
            fetchLogs(1);
        }
    };

    const handleExport = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const token = localStorage.getItem('token');

            let url = activeTab === 'teachers'
                ? `${baseUrl}/reports/teachers/export`
                : `${baseUrl}/reports/students/export`;

            const params = new URLSearchParams();
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.class_id && activeTab !== 'teachers') params.append('class_id', filters.class_id);
            if (filters.name) params.append('name', filters.name);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `kehadiran_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Export berhasil!');
        } catch (error) {
            toast.error('Gagal export data');
        }
    };

    const handleExportRecap = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const token = localStorage.getItem('token');

            const params = new URLSearchParams();
            params.append('date_from', filters.date_from);
            params.append('date_to', filters.date_to);
            if (filters.class_id) params.append('class_id', filters.class_id);
            if (filters.name) params.append('name', filters.name);

            const url = `${baseUrl}/reports/recap/export?${params.toString()}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `rekap_kehadiran_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Export rekap berhasil!');
        } catch (error) {
            toast.error('Gagal export rekap');
        }
    };

    const getPercentageColor = (pct) => {
        if (pct >= 90) return '#10b981';
        if (pct >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><FileSpreadsheet className="text-primary-600" />Rekapitulasi Kehadiran</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Rekap dan export data kehadiran</p>
                </div>
                {activeTab === 'recap' ? (
                    <button onClick={handleExportRecap} className="btn btn-primary" disabled={recapData.length === 0}>
                        <FileSpreadsheet size={20} />
                        <span>Export Rekap</span>
                    </button>
                ) : (
                    <button onClick={handleExport} className="btn btn-primary">
                        <FileSpreadsheet size={20} />
                        <span>Export Excel</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('recap')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'recap'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <BarChart3 size={20} />
                    <span>Rekap Bulanan</span>
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'students'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <GraduationCap size={20} />
                    <span>Log Siswa</span>
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'teachers'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Users size={20} />
                    <span>Log Guru</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <User size={14} className="inline mr-1" />
                            Cari Nama
                        </label>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            placeholder="Ketik nama..."
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Mulai
                        </label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Akhir
                        </label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                            className="input"
                        />
                    </div>
                    {activeTab !== 'teachers' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Kelas
                            </label>
                            <CustomSelect
                                options={[{ value: '', label: 'Semua Kelas' }, ...classes.map(cls => ({ value: cls.id, label: cls.name }))]}
                                value={filters.class_id}
                                onChange={(val) => setFilters({ ...filters, class_id: val })}
                                placeholder="Semua Kelas"
                                searchable={true}
                            />
                        </div>
                    )}
                    <div className="flex items-end">
                        <button onClick={handleSearch} className="btn btn-primary w-full">
                            <Search size={20} />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* RECAP TAB */}
            {activeTab === 'recap' && (
                <>
                    {/* Summary Cards */}
                    {recapSummary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                                        <Calendar size={20} style={{ color: 'var(--accent-color)' }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{recapSummary.total_calendar_days}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hari Kalender</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #10b981 15%, transparent)' }}>
                                        <CalendarCheck size={20} style={{ color: '#10b981' }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{recapSummary.total_school_days}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hari Sekolah</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #f59e0b 15%, transparent)' }}>
                                        <CalendarX size={20} style={{ color: '#f59e0b' }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{recapSummary.total_off_days}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hari Libur Mingguan</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)' }}>
                                        <CalendarX size={20} style={{ color: '#ef4444' }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{recapSummary.total_holidays}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hari Libur Nasional</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recap Table */}
                    <div className="card">
                        {recapLoading ? (
                            <TableSkeleton columns={8} />
                        ) : (
                            <>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>NIS</th>
                                            <th>Nama</th>
                                            <th>Kelas</th>
                                            <th className="text-center">Hari Sekolah</th>
                                            <th className="text-center">Hadir</th>
                                            <th className="text-center">Tidak Hadir</th>
                                            <th className="text-center">Terlambat</th>
                                            <th className="text-center">% Kehadiran</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recapData.length > 0 ? (
                                            recapData
                                                .slice((recapPage - 1) * recapPerPage, recapPage * recapPerPage)
                                                .map((row, index) => (
                                                <>
                                                    <tr key={row.student_id}>
                                                        <td>{(recapPage - 1) * recapPerPage + index + 1}</td>
                                                        <td className="font-medium whitespace-nowrap">{row.nis}</td>
                                                        <td className="whitespace-nowrap">{row.name}</td>
                                                        <td className="whitespace-nowrap">{row.class}</td>
                                                        <td className="text-center">
                                                            <span className="font-semibold">{row.school_days}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge badge-success">{row.present_days}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge ${row.absent_days > 0 ? 'badge-danger' : 'badge-success'}`}>
                                                                {row.absent_days}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge ${row.late_days > 0 ? 'badge-warning' : 'badge-success'}`}>
                                                                {row.late_days}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-page)' }}>
                                                                    <div className="h-full rounded-full transition-all" style={{
                                                                        width: `${row.percentage}%`,
                                                                        background: getPercentageColor(row.percentage),
                                                                    }} />
                                                                </div>
                                                                <span className="text-xs font-bold" style={{ color: getPercentageColor(row.percentage) }}>
                                                                    {row.percentage}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {row.absent_days > 0 && (
                                                                <button
                                                                    onClick={() => setExpandedStudent(expandedStudent === row.student_id ? null : row.student_id)}
                                                                    className="p-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    title="Lihat tanggal tidak hadir"
                                                                >
                                                                    {expandedStudent === row.student_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {/* Expanded row: show absent dates */}
                                                    {expandedStudent === row.student_id && row.absent_dates.length > 0 && (
                                                        <tr key={`${row.student_id}-detail`}>
                                                            <td colSpan={10} className="!py-3 !px-6" style={{ background: 'color-mix(in srgb, #ef4444 5%, var(--bg-card))' }}>
                                                                <div className="flex items-start gap-2">
                                                                    <CalendarX size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>
                                                                            Tanggal Tidak Hadir ({row.absent_dates.length} hari):
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {row.absent_dates.map(date => (
                                                                                <span key={date} className="text-xs px-2 py-0.5 rounded-md font-medium"
                                                                                    style={{ background: 'color-mix(in srgb, #ef4444 12%, transparent)', color: '#ef4444' }}>
                                                                                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="text-center py-8 text-gray-500">
                                                    {recapSummary ? 'Tidak ada data siswa' : 'Klik tombol "Filter" untuk menampilkan rekap'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {recapData.length > 0 && (
                                <Pagination
                                    currentPage={recapPage}
                                    totalItems={recapData.length}
                                    perPage={recapPerPage}
                                    onPageChange={(page) => setRecapPage(page)}
                                    onPerPageChange={(newPerPage) => setRecapPerPage(newPerPage)}
                                />
                            )}
                        </>
                        )}
                    </div>
                </>
            )}

            {/* LOG TABS (students / teachers) */}
            {(activeTab === 'students' || activeTab === 'teachers') && (
                <div className="card">
                    {loading ? (
                        <TableSkeleton columns={7} />
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>{activeTab === 'students' ? 'NIS' : 'NIP'}</th>
                                            <th>Nama</th>
                                            {activeTab === 'students' && <th>Kelas</th>}
                                            <th>Tipe</th>
                                            <th>Lokasi</th>
                                            <th>Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length > 0 ? (
                                            logs.map((log, index) => (
                                                <tr key={log.id}>
                                                    <td className="whitespace-nowrap">{index + 1 + ((pagination?.currentPage - 1) * perPage)}</td>
                                                    <td className="font-medium whitespace-nowrap">
                                                        {activeTab === 'students' ? log.student?.nis : log.teacher?.nip}
                                                    </td>
                                                    <td className="whitespace-nowrap">{activeTab === 'students' ? log.student?.name : log.teacher?.name}</td>
                                                    {activeTab === 'students' && <td className="whitespace-nowrap">{log.student?.class?.name || '-'}</td>}
                                                    <td>
                                                        <span className={`badge whitespace-nowrap ${log.tap_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                                                            {log.tap_type === 'in' ? (
                                                                <><ArrowUpRight size={14} /> Masuk</>
                                                            ) : (
                                                                <><ArrowDownRight size={14} /> Keluar</>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap">{log.esp_device?.location?.name || log.esp_device?.name || '-'}</td>
                                                    <td className="whitespace-nowrap">{new Date(log.tapped_at).toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={activeTab === 'students' ? 7 : 6} className="text-center py-8 text-gray-500">
                                                    Tidak ada data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.total > 0 && (
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalItems={pagination.total}
                                    perPage={perPage}
                                    onPageChange={(page) => fetchLogs(page)}
                                    onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
