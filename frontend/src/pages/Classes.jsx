import { useState, useEffect } from 'react';
import { classService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import CustomSelect from '../components/ui/CustomSelect';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    BookOpen,
    Users,
    LayoutGrid,
    List,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', grade: '', major: '' });
    const [submitting, setSubmitting] = useState(false);

    // Multi-select states
    const [selectedItems, setSelectedItems] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const [isClosingBar, setIsClosingBar] = useState(false);

    useEffect(() => { fetchClasses(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClasses(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, perPage]);

    useEffect(() => {
        if (selectedItems.length > 0 && !showFloatingBar) {
            setShowFloatingBar(true);
            setIsClosingBar(false);
        } else if (selectedItems.length === 0 && showFloatingBar) {
            setIsClosingBar(true);
            setTimeout(() => { setShowFloatingBar(false); setIsClosingBar(false); }, 300);
        }
    }, [selectedItems, showFloatingBar]);

    const fetchClasses = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            const response = await classService.getAll(params);
            if (response.success) {
                setClasses(response.data.data || response.data || []);
                if (response.data.current_page) setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page, total: response.data.total });
            }
        } catch (error) { toast.error('Gagal memuat data kelas'); }
        finally { setLoading(false); }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === classes.length) setSelectedItems([]);
        else setSelectedItems(classes.map(c => c.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Kelas',
            message: `Hapus ${selectedItems.length} kelas yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => classService.delete(id)));
                    toast.success(`${selectedItems.length} kelas berhasil dihapus`);
                    setSelectedItems([]);
                    fetchClasses();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (classItem = null) => {
        if (classItem) {
            setEditingClass(classItem);
            setFormData({ name: classItem.name || '', grade: classItem.grade || '', major: classItem.major || '' });
        } else {
            setEditingClass(null);
            setFormData({ name: '', grade: '', major: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingClass(null); setFormData({ name: '', grade: '', major: '' }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingClass) { await classService.update(editingClass.id, formData); toast.success('Kelas berhasil diperbarui'); }
            else { await classService.create(formData); toast.success('Kelas berhasil ditambahkan'); }
            closeModal();
            fetchClasses();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (classItem) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kelas',
            message: `Hapus kelas "${classItem.name}"?`,
            onConfirm: async () => {
                try { await classService.delete(classItem.id); toast.success('Kelas berhasil dihapus'); fetchClasses(); }
                catch (error) { toast.error('Gagal menghapus kelas'); }
            }
        });
    };

    const handleSearch = (e) => { e.preventDefault(); fetchClasses(); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <BookOpen className="text-primary-600" />Manajemen Kelas
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola data kelas sekolah</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah Kelas</span></button>
            </div>

            {/* Search & View Toggle */}
            <div className="card p-4">
                <div className="flex gap-4 items-center">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama kelas..." className="input pl-10" />
                        </div>
                        <button type="submit" className="btn btn-primary"><Search size={20} /><span>Cari</span></button>
                    </form>
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={6} />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {classes.length > 0 ? classes.map((classItem) => (
                        <div key={classItem.id} className="card p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="checkbox" checked={selectedItems.includes(classItem.id)} onChange={() => toggleSelectItem(classItem.id)} />
                                    <div>
                                        <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{classItem.name}</h3>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {classItem.grade && `Tingkat: ${classItem.grade}`}{classItem.grade && classItem.major && ' • '}{classItem.major && `Jurusan: ${classItem.major}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                    <button onClick={() => openModal(classItem)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                    <button onClick={() => handleDelete(classItem)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
                                <Users size={18} style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{classItem.students_count || 0} siswa</span>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><BookOpen size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada data kelas</p></div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" className="checkbox" checked={classes.length > 0 && selectedItems.length === classes.length} onChange={toggleSelectAll} /></th>
                                    <th>Nama Kelas</th><th>Tingkat</th><th>Jurusan</th><th>Jumlah Siswa</th><th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.length > 0 ? classes.map((classItem) => (
                                    <tr key={classItem.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(classItem.id)} onChange={() => toggleSelectItem(classItem.id)} /></td>
                                        <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}><BookOpen size={16} style={{ color: 'var(--accent-color)' }} /></div><span className="font-medium">{classItem.name}</span></div></td>
                                        <td>{classItem.grade || '-'}</td>
                                        <td>{classItem.major || '-'}</td>
                                        <td><span className="badge badge-info flex items-center gap-1 w-fit"><Users size={14} /> {classItem.students_count || 0} siswa</span></td>
                                        <td>
                                            <div className="flex items-center gap-1 p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(classItem)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(classItem)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Belum ada data kelas</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {pagination && pagination.lastPage > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                    Total: {pagination.total} kelas
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Tampilkan:</span>
                                    <CustomSelect
                                        options={[
                                            { value: 10, label: '10' },
                                            { value: 25, label: '25' },
                                            { value: 50, label: '50' },
                                            { value: 100, label: '100' },
                                            { value: 9999, label: 'Semua' },
                                        ]}
                                        value={perPage}
                                        onChange={setPerPage}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchClasses(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-2 text-sm flex items-center">
                                    {pagination.currentPage} / {pagination.lastPage}
                                </span>
                                <button
                                    onClick={() => fetchClasses(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.lastPage}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                    {pagination && pagination.lastPage > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                    Total: {pagination.total} kelas
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Tampilkan:</span>
                                    <CustomSelect
                                        options={[
                                            { value: 10, label: '10' },
                                            { value: 25, label: '25' },
                                            { value: 50, label: '50' },
                                            { value: 100, label: '100' },
                                            { value: 9999, label: 'Semua' },
                                        ]}
                                        value={perPage}
                                        onChange={setPerPage}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchClasses(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-2 text-sm flex items-center">
                                    {pagination.currentPage} / {pagination.lastPage}
                                </span>
                                <button
                                    onClick={() => fetchClasses(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.lastPage}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={showModal} onClose={closeModal} title={editingClass ? 'Edit Kelas' : 'Tambah Kelas'}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="form-label">Nama Kelas</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="Contoh: X RPL 1" /></div>
                    <div><label className="form-label">Tingkat</label>
                        <CustomSelect
                            options={[
                                { value: 'X', label: 'X (Sepuluh)' },
                                { value: 'XI', label: 'XI (Sebelas)' },
                                { value: 'XII', label: 'XII (Dua Belas)' },
                            ]}
                            value={formData.grade}
                            onChange={(val) => setFormData({ ...formData, grade: val })}
                            placeholder="Pilih Tingkat"
                        />
                    </div>
                    <div><label className="form-label">Jurusan</label><input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} className="input" placeholder="Contoh: RPL, TKJ, MM" /></div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />

            {/* Floating Action Bar */}
            {showFloatingBar && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
                    <div className={`rounded-full shadow-2xl border px-6 py-3 flex items-center gap-4 pointer-events-auto ${isClosingBar ? 'animate-float-down-center' : 'animate-float-up-center'}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-2 pr-4 border-r" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{selectedItems.length}</span>
                            </div>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>dipilih</span>
                        </div>
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={18} /><span className="text-sm font-medium">Hapus</span>
                        </button>
                        <button onClick={clearSelection} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <X size={18} /><span className="text-sm font-medium">Batal</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
