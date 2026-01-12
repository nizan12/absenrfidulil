import { useState, useEffect } from 'react';
import { parentService, studentService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import { Plus, Search, Edit2, Trash2, Loader2, UserPlus, Phone, LayoutGrid, List, X, Camera, Download, CircleUser } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Parents() {
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [formData, setFormData] = useState({ student_id: '', name: '', phone: '', relationship: 'ayah', receive_notification: true });
    const [submitting, setSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

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

    useEffect(() => { fetchParents(); fetchStudents(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchParents(1);
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

    const fetchParents = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            const response = await parentService.getAll(params);
            if (response.success) {
                setParents(response.data.data || response.data || []);
                if (response.data.current_page) setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page, total: response.data.total });
            }
        } catch (error) { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    const fetchStudents = async () => {
        try {
            const response = await studentService.getAll({ per_page: 1000 });
            if (response.success) setStudents(response.data.data || response.data || []);
        } catch (error) { console.error(error); }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === parents.length) setSelectedItems([]);
        else setSelectedItems(parents.map(p => p.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Data',
            message: `Hapus ${selectedItems.length} data orang tua yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => parentService.delete(id)));
                    toast.success(`${selectedItems.length} data berhasil dihapus`);
                    setSelectedItems([]);
                    fetchParents();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (parent = null) => {
        setEditingParent(parent);
        setFormData(parent ? { student_id: parent.student_id, name: parent.name, phone: parent.phone, relationship: parent.relationship, receive_notification: parent.receive_notification } : { student_id: '', name: '', phone: '', relationship: 'ayah', receive_notification: true });
        setPhotoFile(null);
        const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
        setPhotoPreview(parent?.photo ? `${apiBase}/storage/${parent.photo}` : null);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setPhotoFile(null); setPhotoPreview(null); };

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
            data.append('student_id', formData.student_id);
            data.append('name', formData.name);
            data.append('phone', formData.phone);
            data.append('relationship', formData.relationship);
            data.append('receive_notification', formData.receive_notification ? '1' : '0');
            if (photoFile) data.append('photo', photoFile);

            if (editingParent) {
                data.append('_method', 'PUT');
                await parentService.update(editingParent.id, data);
                toast.success('Data berhasil diperbarui');
            } else {
                await parentService.create(data);
                toast.success('Data berhasil ditambahkan');
            }
            closeModal();
            fetchParents();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (parent) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Data',
            message: `Hapus data "${parent.name}"?`,
            onConfirm: async () => {
                try { await parentService.delete(parent.id); toast.success('Data berhasil dihapus'); fetchParents(); }
                catch (error) { toast.error('Gagal menghapus'); }
            }
        });
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <CircleUser className="text-primary-600" />Data Orang Tua
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola data orang tua/wali siswa</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah</span></button>
            </div>

            <div className="card p-4">
                <div className="flex gap-4 items-center">
                    <form onSubmit={(e) => { e.preventDefault(); fetchParents(); }} className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau telepon..." className="input pl-10" />
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
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={7} />
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {parents.length > 0 ? parents.map((p) => (
                            <div key={p.id} className="card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="checkbox" checked={selectedItems.includes(p.id)} onChange={() => toggleSelectItem(p.id)} />
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                                            <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>{getInitials(p.name)}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                                            <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.relationship}</p>
                                        </div>
                                    </div>
                                    <div className="inline-flex flex-row items-center p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                        <button onClick={() => openModal(p)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                        <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Phone size={14} /> {p.phone}</div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Siswa: {p.student?.name || '-'}</p>
                                    <span className={`badge ${p.receive_notification ? 'badge-success' : 'badge-danger'}`}>{p.receive_notification ? 'WA Aktif' : 'WA Nonaktif'}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><UserPlus size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada data</p></div>
                        )}
                    </div>
                    {pagination && (
                        <div className="card mt-4">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalItems={pagination.total}
                                perPage={perPage}
                                onPageChange={(page) => fetchParents(page)}
                                onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th><input type="checkbox" className="checkbox" checked={parents.length > 0 && selectedItems.length === parents.length} onChange={toggleSelectAll} /></th><th>Nama</th><th>Telepon</th><th>Hubungan</th><th>Siswa</th><th>WA</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {parents.length > 0 ? parents.map((p) => (
                                    <tr key={p.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(p.id)} onChange={() => toggleSelectItem(p.id)} /></td>
                                        <td>
                                            <div className="flex items-center gap-3 whitespace-nowrap">
                                                {p.photo ? (
                                                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${p.photo}`} alt={p.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-color-light)' }}>
                                                        <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{getInitials(p.name)}</span>
                                                    </div>
                                                )}
                                                <span>{p.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="flex items-center gap-1 whitespace-nowrap"><Phone size={14} />{p.phone}</span></td>
                                        <td className="capitalize whitespace-nowrap">{p.relationship}</td>
                                        <td className="whitespace-nowrap">{p.student?.name || '-'}</td>
                                        <td><span className={`badge ${p.receive_notification ? 'badge-success' : 'badge-danger'}`}>{p.receive_notification ? 'Aktif' : 'Nonaktif'}</span></td>
                                        <td>
                                            <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(p)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Tidak ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {pagination && (
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalItems={pagination.total}
                            perPage={perPage}
                            onPageChange={(page) => fetchParents(page)}
                            onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                        />
                    )}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingParent ? 'Edit Orang Tua' : 'Tambah Orang Tua'}>
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
                    <div><label className="form-label">Siswa</label>
                        <CustomSelect
                            options={students.map(s => ({ value: s.id, label: `${s.name} - ${s.class?.name || ''}` }))}
                            value={formData.student_id}
                            onChange={(val) => setFormData({ ...formData, student_id: val })}
                            placeholder="Pilih Siswa"
                            searchable={true}
                        />
                    </div>
                    <div><label className="form-label">Nama</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required /></div>
                    <div><label className="form-label">Telepon</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" required placeholder="08xxx" /></div>
                    <div><label className="form-label">Hubungan</label>
                        <CustomSelect
                            options={[
                                { value: 'ayah', label: 'Ayah' },
                                { value: 'ibu', label: 'Ibu' },
                                { value: 'wali', label: 'Wali' },
                            ]}
                            value={formData.relationship}
                            onChange={(val) => setFormData({ ...formData, relationship: val })}
                            placeholder="Pilih Hubungan"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="receive_notification" className="text-sm" style={{ color: 'var(--text-primary)' }}>Terima notifikasi WhatsApp</label>
                        <button type="button" onClick={() => setFormData({ ...formData, receive_notification: !formData.receive_notification })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.receive_notification ? '' : 'bg-gray-300'}`} style={{ background: formData.receive_notification ? 'var(--accent-color)' : undefined }}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.receive_notification ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Batal</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>

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
                            const selectedData = parents.filter(p => selectedItems.includes(p.id));
                            const csvContent = [
                                ['Nama', 'Telepon', 'Hubungan', 'Siswa', 'Notifikasi WA'],
                                ...selectedData.map(p => [p.name, p.phone || '', p.relationship, p.student?.name || '', p.receive_notification ? 'Aktif' : 'Nonaktif'])
                            ].map(row => row.join(',')).join('\n');
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `orangtua_export_${new Date().toISOString().slice(0, 10)}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            toast.success(`${selectedData.length} orang tua berhasil diexport`);
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
