import { useState, useEffect } from 'react';
import { masterService } from '../services/masterService';
import { Skeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';
import CustomSelect from '../components/ui/CustomSelect';
import {
    Shield, Database, AlertTriangle, Server, HardDrive,
    Download, Trash2, RefreshCw, Loader2, FileText,
    CheckCircle, XCircle, Clock, Cpu, Globe, Users,
    GraduationCap, BookOpen, Activity, Plus, Eraser, Calendar, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [errors, setErrors] = useState([]);
    const [errorMeta, setErrorMeta] = useState({});
    const [backups, setBackups] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [clearingLogs, setClearingLogs] = useState(false);
    const [errorFilter, setErrorFilter] = useState('');
    const [backupSettings, setBackupSettings] = useState({ backup_enabled: false, backup_day: 1 });
    const [savingSettings, setSavingSettings] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, errorsRes, backupsRes, settingsRes] = await Promise.all([
                masterService.getStatistics(),
                masterService.getErrors({ lines: 100 }),
                masterService.getBackups(),
                masterService.getBackupSettings().catch(() => ({ success: false })),
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (errorsRes.success) {
                setErrors(errorsRes.data.entries || []);
                setErrorMeta(errorsRes.data);
            }
            if (backupsRes.success) setBackups(backupsRes.data || []);
            if (settingsRes.success) setBackupSettings(settingsRes.data);
        } catch (error) {
            toast.error('Gagal memuat data master panel');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setCreatingBackup(true);
        try {
            const res = await masterService.createBackup();
            if (res.success) {
                toast.success(res.message);
                const backupsRes = await masterService.getBackups();
                if (backupsRes.success) setBackups(backupsRes.data || []);
            } else {
                toast.error(res.message || 'Gagal membuat backup');
            }
        } catch (error) {
            toast.error('Gagal membuat backup database');
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            await masterService.downloadBackup(filename);
            toast.success('Backup berhasil didownload');
        } catch (error) {
            toast.error('Gagal download backup');
        }
    };

    const handleDeleteBackup = (filename) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Backup',
            message: `Hapus backup "${filename}"?`,
            onConfirm: async () => {
                try {
                    await masterService.deleteBackup(filename);
                    toast.success('Backup berhasil dihapus');
                    setBackups(prev => prev.filter(b => b.filename !== filename));
                } catch (error) {
                    toast.error('Gagal menghapus backup');
                }
            },
        });
    };

    const handleClearLogs = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Semua Log',
            message: 'Semua log error akan dihapus permanen. Lanjutkan?',
            onConfirm: async () => {
                setClearingLogs(true);
                try {
                    await masterService.clearErrors();
                    setErrors([]);
                    setErrorMeta({ file_size: 0, file_size_mb: 0 });
                    toast.success('Log berhasil dibersihkan');
                } catch (error) {
                    toast.error('Gagal menghapus log');
                } finally {
                    setClearingLogs(false);
                }
            },
        });
    };

    const filteredErrors = errorFilter
        ? errors.filter(e => e.level === errorFilter)
        : errors;

    const errorCounts = errors.reduce((acc, e) => {
        acc[e.level] = (acc[e.level] || 0) + 1;
        return acc;
    }, {});

    const getLevelColor = (level) => {
        const colors = {
            ERROR: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
            CRITICAL: { bg: 'rgba(220, 38, 38, 0.15)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)' },
            WARNING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
            INFO: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
            DEBUG: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' },
        };
        return colors[level] || colors.DEBUG;
    };

    const tabs = [
        { id: 'overview', label: 'System Overview', icon: Server },
        { id: 'errors', label: 'Error Logs', icon: AlertTriangle },
        { id: 'backups', label: 'Database Backup', icon: Database },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Shield style={{ color: 'var(--accent-color)' }} />Master Panel
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Diagnostik sistem & manajemen database</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card p-5"><Skeleton className="h-16 w-full" /></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Shield style={{ color: 'var(--accent-color)' }} />Master Panel
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Diagnostik sistem & manajemen database</p>
                </div>
                <button onClick={fetchAll} className="btn btn-outline flex items-center gap-2">
                    <RefreshCw size={18} />Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="card p-1.5">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all"
                            style={{
                                background: activeTab === tab.id ? 'var(--accent-color)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            <tab.icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Server Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InfoCard icon={Cpu} label="PHP Version" value={stats?.php_version} color="from-blue-500 to-blue-600" />
                        <InfoCard icon={Globe} label="Laravel Version" value={`v${stats?.laravel_version}`} color="from-red-500 to-red-600" />
                        <InfoCard icon={HardDrive} label="Database Size" value={`${stats?.db_size_mb} MB`} color="from-amber-500 to-amber-600" />
                        <InfoCard icon={Server} label="Storage Usage" value={`${stats?.storage_size_mb} MB`} color="from-green-500 to-green-600" />
                    </div>

                    {/* App Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <MiniCard icon={GraduationCap} label="Siswa" value={stats?.total_students} />
                        <MiniCard icon={Users} label="Guru" value={stats?.total_teachers} />
                        <MiniCard icon={BookOpen} label="Kelas" value={stats?.total_classes} />
                        <MiniCard icon={Cpu} label="Perangkat" value={stats?.total_devices} />
                        <MiniCard icon={Activity} label="Log Hari Ini" value={stats?.total_logs_today} />
                    </div>

                    {/* Users by Role */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Users size={20} />User Per Role
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {stats?.users_by_role && Object.entries(stats.users_by_role).map(([role, count]) => (
                                <div key={role} className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-page)' }}>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>{count}</p>
                                    <p className="text-xs uppercase font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {role.replace('_', ' ')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Environment */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Server size={20} />Environment
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <EnvRow label="App Environment" value={stats?.app_env} />
                            <EnvRow label="Debug Mode" value={stats?.app_debug ? 'ON' : 'OFF'} warn={stats?.app_debug} />
                            <EnvRow label="Timezone" value={stats?.timezone} />
                            <EnvRow label="Server Time" value={stats?.server_time} />
                            <EnvRow label="Database" value={stats?.db_name} />
                            <EnvRow label="Total Logs" value={stats?.total_logs_all?.toLocaleString()} />
                        </div>
                    </div>

                    {/* Table Sizes */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Database size={20} />Database Tables
                        </h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Table</th><th>Rows</th><th>Size</th></tr>
                                </thead>
                                <tbody>
                                    {stats?.db_tables?.map(t => (
                                        <tr key={t.name}>
                                            <td><code className="text-sm">{t.name}</code></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{t.rows?.toLocaleString()}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{t.size_kb} KB</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== ERRORS TAB ==================== */}
            {activeTab === 'errors' && (
                <div className="space-y-4">
                    {/* Error Summary */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="card p-3 flex items-center gap-2">
                            <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Log: {errorMeta.file_size_mb || 0} MB
                            </span>
                        </div>
                        {Object.entries(errorCounts).map(([level, count]) => {
                            const c = getLevelColor(level);
                            return (
                                <button
                                    key={level}
                                    onClick={() => setErrorFilter(errorFilter === level ? '' : level)}
                                    className="px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                                    style={{
                                        background: errorFilter === level ? c.bg : 'var(--bg-card)',
                                        color: errorFilter === level ? c.text : 'var(--text-secondary)',
                                        borderColor: errorFilter === level ? c.border : 'var(--border-color)',
                                    }}
                                >
                                    {level}: {count}
                                </button>
                            );
                        })}
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={async () => {
                                    const res = await masterService.getErrors({ lines: 100, level: errorFilter || undefined });
                                    if (res.success) { setErrors(res.data.entries || []); setErrorMeta(res.data); }
                                }}
                                className="btn btn-outline"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={handleClearLogs} disabled={clearingLogs} className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                                {clearingLogs ? <Loader2 className="animate-spin" size={16} /> : <Eraser size={16} />}
                                <span>Hapus Log</span>
                            </button>
                        </div>
                    </div>

                    {/* Error Entries */}
                    <div className="card">
                        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                            {filteredErrors.length > 0 ? (
                                [...filteredErrors].reverse().map((entry, idx) => {
                                    const c = getLevelColor(entry.level);
                                    return (
                                        <div key={idx} className="p-4 hover:opacity-90 transition-opacity">
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className="px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 mt-0.5"
                                                    style={{ background: c.bg, color: c.text }}
                                                >
                                                    {entry.level}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                                                        {entry.message}
                                                    </p>
                                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                        <Clock size={12} />{entry.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                                    <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                                    <p>Tidak ada error log</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BACKUPS TAB ==================== */}
            {activeTab === 'backups' && (
                <div className="space-y-4">
                    {/* Schedule Settings */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Calendar size={20} />Jadwal Auto Backup
                        </h3>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Auto Backup</span>
                                <button
                                    type="button"
                                    onClick={() => setBackupSettings(s => ({ ...s, backup_enabled: !s.backup_enabled }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!backupSettings.backup_enabled ? 'bg-gray-300' : ''}`}
                                    style={{ background: backupSettings.backup_enabled ? 'var(--accent-color)' : undefined }}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${backupSettings.backup_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Setiap tanggal</span>
                                <div style={{ width: '100px' }}>
                                    <CustomSelect
                                        options={Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))}
                                        value={backupSettings.backup_day}
                                        onChange={(val) => setBackupSettings(s => ({ ...s, backup_day: parseInt(val) }))}
                                        placeholder="Tanggal"
                                    />
                                </div>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>setiap bulan (jam 02:00)</span>
                            </div>
                            <button
                                onClick={async () => {
                                    setSavingSettings(true);
                                    try {
                                        const res = await masterService.updateBackupSettings(backupSettings);
                                        if (res.success) toast.success(res.message);
                                    } catch { toast.error('Gagal menyimpan pengaturan'); }
                                    finally { setSavingSettings(false); }
                                }}
                                disabled={savingSettings}
                                className="btn btn-primary"
                            >
                                {savingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                <span>Simpan</span>
                            </button>
                        </div>
                    </div>

                    {/* Manual Backup */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Semua backup tersimpan permanen. Hapus manual jika tidak diperlukan.
                        </p>
                        <button
                            onClick={handleCreateBackup}
                            disabled={creatingBackup}
                            className="btn btn-primary"
                        >
                            {creatingBackup ? (
                                <><Loader2 className="animate-spin" size={18} /><span>Membuat Backup...</span></>
                            ) : (
                                <><Plus size={18} /><span>Buat Backup Baru</span></>
                            )}
                        </button>
                    </div>

                    {backups.length > 0 ? (
                        <div className="grid gap-3">
                            {backups.map(backup => (
                                <div key={backup.filename} className="card p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                            <Database size={24} style={{ color: 'var(--accent-color)' }} />
                                        </div>
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{backup.filename}</p>
                                            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                <span className="flex items-center gap-1"><HardDrive size={14} />{backup.size_mb > 1 ? `${backup.size_mb} MB` : `${backup.size_kb} KB`}</span>
                                                <span className="flex items-center gap-1"><Clock size={14} />{backup.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDownloadBackup(backup.filename)} className="btn btn-outline" title="Download">
                                            <Download size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteBackup(backup.filename)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} title="Hapus">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                            <Database size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Belum ada backup database</p>
                            <p className="text-sm mt-1">Klik "Buat Backup Baru" untuk memulai</p>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}

// Sub-components
function InfoCard({ icon: Icon, label, value, color }) {
    return (
        <div className="stat-card" style={{ background: `linear-gradient(135deg, var(--bg-card), var(--bg-page))` }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value || '-'}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color}`}>
                    <Icon size={22} className="text-white" />
                </div>
            </div>
        </div>
    );
}

function MiniCard({ icon: Icon, label, value }) {
    return (
        <div className="card p-4 text-center">
            <Icon size={22} className="mx-auto mb-2" style={{ color: 'var(--accent-color)' }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value || 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        </div>
    );
}

function EnvRow({ label, value, warn }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-page)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span
                className="text-sm font-medium px-2 py-0.5 rounded-lg"
                style={{
                    color: warn ? '#ef4444' : 'var(--text-primary)',
                    background: warn ? 'rgba(239,68,68,0.1)' : 'transparent',
                }}
            >
                {value || '-'}
            </span>
        </div>
    );
}
