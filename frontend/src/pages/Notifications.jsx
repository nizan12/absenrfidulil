import { useState, useEffect } from 'react';
import { notificationService } from '../services/dataService';
import CustomSelect from '../components/ui/CustomSelect';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Search, Loader2, Bell, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, today: 0 });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(); fetchStats(); }, []);

    // Re-fetch when filter changes
    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (filter) params.status = filter;
            const response = await notificationService.getAll(params);
            if (response.success) {
                setLogs(response.data.data || response.data || []);
                if (response.data.current_page) setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page, total: response.data.total });
            }
        } catch (error) { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const response = await notificationService.getStatistics();
            if (response.success) setStats(response.data);
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell className="text-primary-600" />Log Notifikasi WhatsApp</h1>
                    <p className="text-gray-500 dark:text-gray-400">Riwayat pengiriman notifikasi via Fonnte</p>
                </div>
                <button onClick={() => { fetchLogs(); fetchStats(); }} className="btn btn-secondary"><RefreshCw size={20} /><span>Refresh</span></button>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-4 text-center">
                            <Skeleton className="h-9 w-16 mx-auto mb-1" />
                            <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="card p-4 text-center bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <p className="text-3xl font-bold text-green-600">{stats.success}</p>
                        <p className="text-sm text-green-600">Berhasil</p>
                    </div>
                    <div className="card p-4 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                        <p className="text-sm text-red-600">Gagal</p>
                    </div>
                    <div className="card p-4 text-center bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
                        <p className="text-sm text-blue-600">Hari Ini</p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="card p-4">
                <div className="flex gap-4">
                    <CustomSelect
                        options={[
                            { value: '', label: 'Semua Status' },
                            { value: 'sent', label: 'Berhasil' },
                            { value: 'failed', label: 'Gagal' },
                        ]}
                        value={filter}
                        onChange={setFilter}
                        placeholder="Semua Status"
                        className="w-48"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <TableSkeleton columns={6} />
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>Waktu</th><th>Penerima</th><th>Telepon</th><th>Tipe</th><th>Status</th><th>Pesan</th></tr></thead>
                            <tbody>
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="text-sm">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                        <td className="font-medium">{log.recipient_name}</td>
                                        <td>{log.phone}</td>
                                        <td><span className="badge badge-info">{log.type}</span></td>
                                        <td>
                                            {log.status === 'sent' ? (
                                                <span className="badge badge-success flex items-center gap-1"><CheckCircle size={14} />Berhasil</span>
                                            ) : (
                                                <span className="badge badge-danger flex items-center gap-1"><XCircle size={14} />Gagal</span>
                                            )}
                                        </td>
                                        <td className="max-w-xs truncate text-sm text-gray-500" title={log.message}>{log.message}</td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="text-center py-8 text-gray-500">Tidak ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.lastPage > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500">Total: {pagination.total}</p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchLogs(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="btn btn-secondary text-sm disabled:opacity-50">Prev</button>
                            <span className="px-3 py-2 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
                            <button onClick={() => fetchLogs(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} className="btn btn-secondary text-sm disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
