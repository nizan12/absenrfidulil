import { useState, useEffect } from 'react';
import { attendanceService, classService } from '../services/dataService';
import CustomSelect from '../components/ui/CustomSelect';
import { TableSkeleton } from '../components/ui/Skeleton';
import {
    Download,
    Calendar,
    Filter,
    FileSpreadsheet,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Users,
    GraduationCap,
    User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Recap() {
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        class_id: '',
        name: '',
    });

    useEffect(() => {
        fetchClasses();
        fetchLogs();
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
                per_page: 20,
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

    const handleSearch = () => {
        fetchLogs(1);
    };

    const handleExport = async () => {
        try {
            const baseUrl = 'http://localhost:8000/api';
            const token = localStorage.getItem('token');

            let url = activeTab === 'students'
                ? `${baseUrl}/reports/students/export`
                : `${baseUrl}/reports/teachers/export`;

            const params = new URLSearchParams();
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.class_id && activeTab === 'students') params.append('class_id', filters.class_id);
            if (filters.name) params.append('name', filters.name);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            // Trigger download
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rekapitulasi Kehadiran</h1>
                    <p className="text-gray-500 dark:text-gray-400">Export data kehadiran dalam format Excel</p>
                </div>
                <button
                    onClick={handleExport}
                    className="btn btn-primary"
                >
                    <FileSpreadsheet size={20} />
                    <span>Export Excel</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'students'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <GraduationCap size={20} />
                    <span>Siswa</span>
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'teachers'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Users size={20} />
                    <span>Guru</span>
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
                    {activeTab === 'students' && (
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
                        <button
                            onClick={handleSearch}
                            className="btn btn-primary w-full"
                        >
                            <Search size={20} />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                                <td>{index + 1 + ((pagination?.currentPage - 1) * 20)}</td>
                                                <td className="font-medium">
                                                    {activeTab === 'students' ? log.student?.nis : log.teacher?.nip}
                                                </td>
                                                <td>{activeTab === 'students' ? log.student?.name : log.teacher?.name}</td>
                                                {activeTab === 'students' && <td>{log.student?.class?.name || '-'}</td>}
                                                <td>
                                                    <span className={`badge ${log.tap_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                                                        {log.tap_type === 'in' ? (
                                                            <><ArrowUpRight size={14} /> Masuk</>
                                                        ) : (
                                                            <><ArrowDownRight size={14} /> Keluar</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>{log.esp_device?.location?.name || log.esp_device?.name || '-'}</td>
                                                <td>{new Date(log.tapped_at).toLocaleString('id-ID')}</td>
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
                        {pagination && pagination.lastPage > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Menampilkan {logs.length} dari {pagination.total} data
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchLogs(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="btn btn-secondary text-sm disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <span className="px-3 py-2 text-sm">
                                        {pagination.currentPage} / {pagination.lastPage}
                                    </span>
                                    <button
                                        onClick={() => fetchLogs(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.lastPage}
                                        className="btn btn-secondary text-sm disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
