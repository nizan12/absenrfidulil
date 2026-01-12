import { useState, useEffect } from 'react';
import { teacherService } from '../services/dataService';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    UserCog,
    Phone,
    LayoutGrid,
    List,
    X,
    Camera,
    Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        rfid_uid: '',
        nip: '',
        name: '',
        phone: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Multi-select states
    const [selectedItems, setSelectedItems] = useState([]);
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const [isClosingBar, setIsClosingBar] = useState(false);

    useEffect(() => { fetchTeachers(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTeachers(1);
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

    const fetchTeachers = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            const response = await teacherService.getAll(params);
            if (response.success) {
                setTeachers(response.data.data || response.data || []);
                if (response.data.current_page) {
                    setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page, total: response.data.total });
                }
            }
        } catch (error) { toast.error('Gagal memuat data guru'); }
        finally { setLoading(false); }
    };

    const openModal = (teacher = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({ rfid_uid: teacher.rfid_uid || '', nip: teacher.nip || '', name: teacher.name || '', phone: teacher.phone || '' });
            const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
            setPhotoPreview(teacher.photo ? `${apiBase}/storage/${teacher.photo}` : null);
        } else {
            setEditingTeacher(null);
            setFormData({ rfid_uid: '', nip: '', name: '', phone: '' });
            setPhotoPreview(null);
        }
        setPhotoFile(null);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingTeacher(null); setPhotoFile(null); setPhotoPreview(null); };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran foto maksimal 2MB');
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('rfid_uid', formData.rfid_uid);
            data.append('nip', formData.nip);
            data.append('name', formData.name);
            if (formData.phone) data.append('phone', formData.phone);
            if (photoFile) data.append('photo', photoFile);

            if (editingTeacher) {
                data.append('_method', 'PUT');
                await teacherService.update(editingTeacher.id, data);
                toast.success('Guru berhasil diperbarui');
            }
            else { await teacherService.create(data); toast.success('Guru berhasil ditambahkan'); }
            closeModal();
            fetchTeachers();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (teacher) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Guru',
            message: `Hapus guru "${teacher.name}"?`,
            onConfirm: async () => {
                try {
                    await teacherService.delete(teacher.id);
                    toast.success('Guru berhasil dihapus');
                    fetchTeachers();
                } catch (error) {
                    toast.error('Gagal menghapus guru');
                }
            }
        });
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === teachers.length) setSelectedItems([]);
        else setSelectedItems(teachers.map(t => t.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Guru',
            message: `Hapus ${selectedItems.length} guru yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => teacherService.delete(id)));
                    toast.success(`${selectedItems.length} guru berhasil dihapus`);
                    setSelectedItems([]);
                    fetchTeachers();
                } catch (error) { toast.error('Gagal menghapus beberapa data guru'); }
            }
        });
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCog className="text-primary-600" />Data Guru
                    </h1>
                    <p className="text-gray-500">Kelola data guru dan kartu RFID</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah Guru</span></button>
            </div>

            <div className="card p-4">
                <div className="flex gap-4 items-center">
                    <form onSubmit={(e) => { e.preventDefault(); fetchTeachers(); }} className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIP, atau RFID..." className="input pl-10" />
                        </div>
                        <button type="submit" className="btn btn-primary"><Search size={20} /></button>
                    </form>
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                </div>
            </div>

            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={6} />
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {teachers.length > 0 ? teachers.map((teacher) => (
                            <div key={teacher.id} className="card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="checkbox" checked={selectedItems.includes(teacher.id)} onChange={() => toggleSelectItem(teacher.id)} />
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                                            <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>{getInitials(teacher.name)}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                                            <p className="text-xs text-gray-500">NIP: {teacher.nip}</p>
                                        </div>
                                    </div>
                                    <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                        <button onClick={() => openModal(teacher)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                        <button onClick={() => handleDelete(teacher)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Phone size={14} /> {teacher.phone || '-'}
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono">RFID: {teacher.rfid_uid}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-gray-500"><UserCog size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada data guru</p></div>
                        )}
                    </div>
                    {pagination && (
                        <div className="card mt-4">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalItems={pagination.total}
                                perPage={perPage}
                                onPageChange={(page) => fetchTeachers(page)}
                                onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" className="checkbox" checked={teachers.length > 0 && selectedItems.length === teachers.length} onChange={toggleSelectAll} /></th>
                                    <th>Nama</th><th>NIP</th><th>RFID UID</th><th>Telepon</th><th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.length > 0 ? teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(teacher.id)} onChange={() => toggleSelectItem(teacher.id)} /></td>
                                        <td>
                                            <div className="flex items-center gap-3 min-w-[140px]">
                                                {teacher.photo ? (
                                                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${teacher.photo}`} alt={teacher.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-color-light)' }}>
                                                        <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{getInitials(teacher.name)}</span>
                                                    </div>
                                                )}
                                                <span className="truncate max-w-[120px]">{teacher.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{teacher.nip}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{teacher.rfid_uid}</td>
                                        <td>{teacher.phone || '-'}</td>
                                        <td>
                                            <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(teacher)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(teacher)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="text-center py-8 text-gray-500">Tidak ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {pagination && (
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalItems={pagination.total}
                            perPage={perPage}
                            onPageChange={(page) => fetchTeachers(page)}
                            onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                        />
                    )}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingTeacher ? 'Edit Guru' : 'Tambah Guru'}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={32} style={{ color: 'var(--text-muted)' }} />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md" style={{ background: 'var(--accent-color)' }}>
                                <Camera size={16} className="text-white" />
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Klik icon kamera untuk upload foto (maks 2MB)</p>
                    </div>
                    <div><label className="form-label">RFID UID</label><input type="text" value={formData.rfid_uid} onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value })} className="input" required /></div>
                    <div><label className="form-label">NIP</label><input type="text" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} className="input" required /></div>
                    <div><label className="form-label">Nama</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required /></div>
                    <div><label className="form-label">Telepon</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" placeholder="08xxx" /></div>
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
                    <div className={`floating-bar pointer-events-auto ${isClosingBar ? 'animate-float-down-center' : 'animate-float-up-center'}`}>
                        <div className="floating-bar-count">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{selectedItems.length}</span>
                            </div>
                            <span className="count-text text-sm" style={{ color: 'var(--text-secondary)' }}>dipilih</span>
                        </div>
                        <button onClick={() => {
                            const selectedData = teachers.filter(t => selectedItems.includes(t.id));
                            const csvContent = [
                                ['RFID UID', 'NIP', 'Nama', 'Telepon'],
                                ...selectedData.map(t => [t.rfid_uid, t.nip, t.name, t.phone || ''])
                            ].map(row => row.join(',')).join('\n');
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `guru_export_${new Date().toISOString().slice(0, 10)}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            toast.success(`${selectedData.length} guru berhasil diexport`);
                        }} className="floating-bar-btn export">
                            <Download size={18} /><span className="btn-text">Export</span>
                        </button>
                        <button onClick={handleBulkDelete} className="floating-bar-btn delete">
                            <Trash2 size={18} /><span className="btn-text">Hapus</span>
                        </button>
                        <button onClick={clearSelection} className="floating-bar-btn cancel">
                            <X size={18} /><span className="btn-text">Batal</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
