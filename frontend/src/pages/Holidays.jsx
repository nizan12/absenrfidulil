import { useState, useEffect, useMemo } from 'react';
import { holidayService } from '../services/dataService';
import { Skeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import {
    CalendarOff,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Loader2,
    CalendarRange,
    Info,
    Download,
    Check,
    Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function Holidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [nationalHolidays, setNationalHolidays] = useState([]);
    const [selectedImports, setSelectedImports] = useState([]);
    const [importLoading, setImportLoading] = useState(false);

    // Single add form
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '', description: '' });

    // Range add form
    const [rangeForm, setRangeForm] = useState({ date_from: '', date_to: '', name: '', description: '' });

    useEffect(() => {
        fetchHolidays();
    }, [currentMonth, currentYear]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const response = await holidayService.getByMonth(currentMonth, currentYear);
            if (response.success) {
                setHolidays(response.data || []);
            }
        } catch (error) {
            console.error('Error loading holidays:', error);
            toast.error('Gagal memuat data hari libur');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newHoliday.date || !newHoliday.name) {
            toast.error('Tanggal dan nama harus diisi');
            return;
        }
        setSaving(true);
        try {
            const response = await holidayService.create(newHoliday);
            if (response.success) {
                toast.success('Hari libur berhasil ditambahkan');
                setNewHoliday({ date: '', name: '', description: '' });
                setShowAddModal(false);
                fetchHolidays();
            }
        } catch (error) {
            if (error.response?.status === 422) {
                toast.error('Tanggal tersebut sudah terdaftar sebagai hari libur');
            } else {
                toast.error('Gagal menambahkan hari libur');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBulkAdd = async () => {
        if (!rangeForm.date_from || !rangeForm.date_to || !rangeForm.name) {
            toast.error('Semua field wajib harus diisi');
            return;
        }

        const from = new Date(rangeForm.date_from);
        const to = new Date(rangeForm.date_to);
        if (from > to) {
            toast.error('Tanggal mulai harus sebelum tanggal akhir');
            return;
        }

        // Generate date range
        const holidayList = [];
        const current = new Date(from);
        while (current <= to) {
            holidayList.push({
                date: current.toISOString().split('T')[0],
                name: rangeForm.name,
                description: rangeForm.description || null,
            });
            current.setDate(current.getDate() + 1);
        }

        setSaving(true);
        try {
            const response = await holidayService.bulkStore(holidayList);
            if (response.success) {
                toast.success(response.message);
                setRangeForm({ date_from: '', date_to: '', name: '', description: '' });
                setShowRangeModal(false);
                fetchHolidays();
            }
        } catch (error) {
            toast.error('Gagal menambahkan hari libur');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await holidayService.delete(id);
            if (response.success) {
                toast.success('Hari libur berhasil dihapus');
                setDeleteId(null);
                fetchHolidays();
            }
        } catch (error) {
            toast.error('Gagal menghapus hari libur');
        }
    };

    // Fetch national holidays from API
    const fetchNationalHolidays = async () => {
        setImportLoading(true);
        try {
            const res = await fetch(`https://libur.absenulilalbab.com/api/holidays?year=${currentYear}`);
            const json = await res.json();
            const data = json.data || [];
            setNationalHolidays(data);
            // Select all by default
            setSelectedImports(data.map((_, i) => i));
        } catch (error) {
            console.error('Error fetching national holidays:', error);
            toast.error('Gagal mengambil data libur nasional');
        } finally {
            setImportLoading(false);
        }
    };

    const handleOpenImport = () => {
        setShowImportModal(true);
        fetchNationalHolidays();
    };

    const toggleImportSelect = (index) => {
        setSelectedImports(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleSelectAll = () => {
        if (selectedImports.length === nationalHolidays.length) {
            setSelectedImports([]);
        } else {
            setSelectedImports(nationalHolidays.map((_, i) => i));
        }
    };

    const handleImportNational = async () => {
        if (selectedImports.length === 0) {
            toast.error('Pilih minimal 1 hari libur');
            return;
        }

        const holidayList = selectedImports.map(i => ({
            date: nationalHolidays[i].date,
            name: nationalHolidays[i].name,
            description: nationalHolidays[i].is_national_holiday ? 'Libur Nasional' : 'Cuti Bersama',
        }));

        setSaving(true);
        try {
            const response = await holidayService.bulkStore(holidayList);
            if (response.success) {
                toast.success(response.message);
                setShowImportModal(false);
                fetchHolidays();
            }
        } catch (error) {
            toast.error('Gagal mengimport hari libur');
        } finally {
            setSaving(false);
        }
    };

    // Calendar data
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        const startDay = firstDay.getDay(); // 0=Sunday
        const totalDays = lastDay.getDate();

        const days = [];
        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        // Actual days
        for (let d = 1; d <= totalDays; d++) {
            days.push(d);
        }
        return days;
    }, [currentMonth, currentYear]);

    const holidayMap = useMemo(() => {
        const map = {};
        holidays.forEach(h => {
            const day = new Date(h.date).getDate();
            map[day] = h;
        });
        return map;
    }, [holidays]);

    const prevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const isWeekend = (day) => {
        if (!day) return false;
        const date = new Date(currentYear, currentMonth - 1, day);
        const dow = date.getDay();
        return dow === 0 || dow === 6;
    };

    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        return day === today.getDate() &&
            currentMonth === today.getMonth() + 1 &&
            currentYear === today.getFullYear();
    };

    const handleCalendarDayClick = (day) => {
        if (!day) return;
        if (holidayMap[day]) return;
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setNewHoliday({ date: dateStr, name: '', description: '' });
        setShowAddModal(true);
    };

    if (loading && holidays.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <CalendarOff className="text-primary-600" />Kalender Libur
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Kelola hari libur sekolah</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 card p-6">
                        <Skeleton className="h-8 w-48 mb-6" />
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(35)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    </div>
                    <div className="card p-6">
                        <Skeleton className="h-6 w-36 mb-4" />
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
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
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <CalendarOff className="text-primary-600" />Kalender Libur
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola hari libur sekolah</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleOpenImport} className="btn btn-secondary">
                        <Download size={20} />
                        <span>Import Nasional</span>
                    </button>
                    <button onClick={() => setShowRangeModal(true)} className="btn btn-secondary">
                        <CalendarRange size={20} />
                        <span>Tambah Range</span>
                    </button>
                    <button onClick={() => {
                        setNewHoliday({ date: '', name: '', description: '' });
                        setShowAddModal(true);
                    }} className="btn btn-primary">
                        <Plus size={20} />
                        <span>Tambah Libur</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-2 card p-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="btn btn-secondary p-2">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </h2>
                        <button onClick={nextMonth} className="btn btn-secondary p-2">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_NAMES.map((name, i) => (
                            <div key={name} className="text-center text-xs font-semibold py-2"
                                style={{ color: i === 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const holiday = day ? holidayMap[day] : null;
                            const weekend = isWeekend(day);
                            const today = isToday(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleCalendarDayClick(day)}
                                    className={`relative min-h-[60px] p-1.5 rounded-lg border transition-all ${day ? 'cursor-pointer hover:border-[var(--accent-color)]' : ''
                                        } ${today ? 'ring-2 ring-[var(--accent-color)]' : ''}`}
                                    style={{
                                        borderColor: holiday ? '#ef4444' : 'var(--border-color)',
                                        background: holiday
                                            ? 'color-mix(in srgb, #ef4444 10%, transparent)'
                                            : weekend && day
                                                ? 'color-mix(in srgb, var(--text-muted) 5%, transparent)'
                                                : 'transparent',
                                    }}
                                >
                                    {day && (
                                        <>
                                            <span className={`text-sm font-medium ${holiday ? 'text-red-500' : weekend ? 'text-red-400' : ''}`}
                                                style={!holiday && !weekend ? { color: 'var(--text-primary)' } : undefined}>
                                                {day}
                                            </span>
                                            {holiday && (
                                                <p className="text-[9px] leading-tight mt-0.5 line-clamp-2" style={{ color: '#ef4444' }}>
                                                    {holiday.name}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded border-2" style={{ borderColor: '#ef4444', background: 'color-mix(in srgb, #ef4444 10%, transparent)' }}></div>
                            <span>Hari Libur</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' }}></div>
                            <span>Weekend</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded ring-2 ring-[var(--accent-color)]"></div>
                            <span>Hari Ini</span>
                        </div>
                    </div>
                </div>

                {/* Holiday List Sidebar */}
                <div className="card p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                        <Calendar size={18} />
                        Daftar Libur — {MONTH_NAMES[currentMonth - 1]}
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="text-center py-8">
                            <CalendarOff size={40} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                Tidak ada hari libur di bulan ini
                            </p>
                            <button onClick={() => {
                                setNewHoliday({ date: '', name: '', description: '' });
                                setShowAddModal(true);
                            }} className="btn btn-secondary mt-3 text-xs">
                                <Plus size={14} />
                                <span>Tambah Libur</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {holidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map(holiday => (
                                <div key={holiday.id}
                                    className="flex items-start justify-between p-3 rounded-lg border transition-all hover:shadow-sm"
                                    style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-red-600"
                                                style={{ background: 'color-mix(in srgb, #ef4444 12%, transparent)' }}>
                                                {new Date(holiday.date).getDate()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {holiday.name}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(holiday.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteId(holiday.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                        title="Hapus"
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    {holidays.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg text-xs flex items-start gap-2"
                            style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--text-secondary)' }}>
                            <Info size={14} className="flex-shrink-0 mt-0.5" />
                            <span>Total <strong>{holidays.length}</strong> hari libur di bulan {MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Single Holiday Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Hari Libur" size="md">
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tanggal *</label>
                        <input
                            type="date"
                            value={newHoliday.date}
                            onChange={(e) => setNewHoliday(p => ({ ...p, date: e.target.value }))}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Hari Libur *</label>
                        <input
                            type="text"
                            value={newHoliday.name}
                            onChange={(e) => setNewHoliday(p => ({ ...p, name: e.target.value }))}
                            className="input"
                            placeholder="cth: Hari Raya Idul Fitri"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Keterangan</label>
                        <textarea
                            value={newHoliday.description}
                            onChange={(e) => setNewHoliday(p => ({ ...p, description: e.target.value }))}
                            className="input"
                            rows={2}
                            placeholder="Keterangan tambahan (opsional)"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button onClick={handleAdd} disabled={saving} className="btn btn-primary flex-1">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            <span>Simpan</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Range Holiday Modal */}
            <Modal isOpen={showRangeModal} onClose={() => setShowRangeModal(false)} title="Tambah Libur (Range Tanggal)" size="md">
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Dari Tanggal *</label>
                            <input
                                type="date"
                                value={rangeForm.date_from}
                                onChange={(e) => setRangeForm(p => ({ ...p, date_from: e.target.value }))}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sampai Tanggal *</label>
                            <input
                                type="date"
                                value={rangeForm.date_to}
                                onChange={(e) => setRangeForm(p => ({ ...p, date_to: e.target.value }))}
                                className="input"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Hari Libur *</label>
                        <input
                            type="text"
                            value={rangeForm.name}
                            onChange={(e) => setRangeForm(p => ({ ...p, name: e.target.value }))}
                            className="input"
                            placeholder="cth: Libur Semester"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Keterangan</label>
                        <textarea
                            value={rangeForm.description}
                            onChange={(e) => setRangeForm(p => ({ ...p, description: e.target.value }))}
                            className="input"
                            rows={2}
                            placeholder="Keterangan tambahan (opsional)"
                        />
                    </div>
                    {rangeForm.date_from && rangeForm.date_to && new Date(rangeForm.date_from) <= new Date(rangeForm.date_to) && (
                        <div className="p-3 rounded-lg text-xs" style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--text-secondary)' }}>
                            <Info size={12} className="inline mr-1" />
                            Akan menambahkan <strong>{Math.ceil((new Date(rangeForm.date_to) - new Date(rangeForm.date_from)) / (1000 * 60 * 60 * 24)) + 1}</strong> hari libur
                        </div>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowRangeModal(false)} className="btn btn-secondary flex-1">Batal</button>
                        <button onClick={handleBulkAdd} disabled={saving} className="btn btn-primary flex-1">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <CalendarRange size={18} />}
                            <span>Simpan Range</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Hari Libur?" size="sm">
                <div className="p-6">
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setDeleteId(null)} className="btn btn-secondary flex-1">Batal</button>
                        <button onClick={() => handleDelete(deleteId)} className="btn flex-1" style={{ background: '#ef4444', color: 'white' }}>
                            <Trash2 size={16} />
                            <span>Hapus</span>
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Import National Holidays Modal */}
            <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Libur Nasional" size="lg">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm" style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--text-secondary)' }}>
                        <Globe size={16} className="flex-shrink-0" />
                        <span>Data dari <strong>libur.absenulilalbab.com</strong> — Hari libur nasional & cuti bersama tahun {currentYear}</span>
                    </div>

                    {importLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-color)' }} />
                        </div>
                    ) : nationalHolidays.length === 0 ? (
                        <div className="text-center py-8">
                            <CalendarOff size={40} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada data hari libur</p>
                        </div>
                    ) : (
                        <>
                            {/* Select All */}
                            <div className="flex items-center justify-between mb-3">
                                <button onClick={toggleSelectAll} className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--accent-color)' }}>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedImports.length === nationalHolidays.length ? '' : ''}`}
                                        style={{
                                            borderColor: selectedImports.length === nationalHolidays.length ? 'var(--accent-color)' : 'var(--border-color)',
                                            background: selectedImports.length === nationalHolidays.length ? 'var(--accent-color)' : 'transparent',
                                        }}>
                                        {selectedImports.length === nationalHolidays.length && <Check size={12} color="white" />}
                                    </div>
                                    Pilih Semua ({selectedImports.length}/{nationalHolidays.length})
                                </button>
                            </div>

                            {/* Holiday List */}
                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                                {nationalHolidays.map((h, idx) => (
                                    <div key={idx}
                                        onClick={() => toggleImportSelect(idx)}
                                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
                                        style={{
                                            borderColor: selectedImports.includes(idx) ? 'var(--accent-color)' : 'var(--border-color)',
                                            background: selectedImports.includes(idx) ? 'color-mix(in srgb, var(--accent-color) 5%, transparent)' : 'var(--bg-page)',
                                        }}>
                                        {/* Checkbox */}
                                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{
                                                borderColor: selectedImports.includes(idx) ? 'var(--accent-color)' : 'var(--border-color)',
                                                background: selectedImports.includes(idx) ? 'var(--accent-color)' : 'transparent',
                                            }}>
                                            {selectedImports.includes(idx) && <Check size={12} color="white" />}
                                        </div>

                                        {/* Date badge */}
                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold flex-shrink-0"
                                            style={{
                                                background: h.is_national_holiday ? 'color-mix(in srgb, #ef4444 12%, transparent)' : 'color-mix(in srgb, #f59e0b 12%, transparent)',
                                                color: h.is_national_holiday ? '#ef4444' : '#f59e0b',
                                            }}>
                                            {new Date(h.date).getDate()}/{new Date(h.date).getMonth() + 1}
                                        </span>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{h.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Badge */}
                                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                                            style={{
                                                background: h.is_national_holiday ? 'color-mix(in srgb, #ef4444 12%, transparent)' : 'color-mix(in srgb, #f59e0b 12%, transparent)',
                                                color: h.is_national_holiday ? '#ef4444' : '#f59e0b',
                                            }}>
                                            {h.is_national_holiday ? 'Nasional' : 'Cuti Bersama'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button onClick={() => setShowImportModal(false)} className="btn btn-secondary flex-1">Batal</button>
                                <button onClick={handleImportNational} disabled={saving || selectedImports.length === 0} className="btn btn-primary flex-1">
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    <span>Import {selectedImports.length} Libur</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
