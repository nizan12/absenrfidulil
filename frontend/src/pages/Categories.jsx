import { useState, useEffect } from 'react';
import { categoryService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import { Plus, Edit2, Trash2, Loader2, FolderTree, Users, LayoutGrid, List, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
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

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCategories(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [perPage]);

    useEffect(() => {
        if (selectedItems.length > 0 && !showFloatingBar) {
            setShowFloatingBar(true);
            setIsClosingBar(false);
        } else if (selectedItems.length === 0 && showFloatingBar) {
            setIsClosingBar(true);
            setTimeout(() => { setShowFloatingBar(false); setIsClosingBar(false); }, 300);
        }
    }, [selectedItems, showFloatingBar]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll();
            if (response.success) {
                setCategories(response.data || []);
            }
        } catch (error) { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    // Client-side pagination
    const totalItems = categories.length;
    const paginatedCategories = categories.slice((currentPage - 1) * perPage, currentPage * perPage);

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === categories.length) setSelectedItems([]);
        else setSelectedItems(categories.map(c => c.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Kategori',
            message: `Hapus ${selectedItems.length} kategori yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => categoryService.delete(id)));
                    toast.success(`${selectedItems.length} kategori berhasil dihapus`);
                    setSelectedItems([]);
                    fetchCategories();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (category = null) => {
        setEditingCategory(category);
        setFormData(category ? { name: category.name, description: category.description || '' } : { name: '', description: '' });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCategory) { await categoryService.update(editingCategory.id, formData); toast.success('Kategori berhasil diperbarui'); }
            else { await categoryService.create(formData); toast.success('Kategori berhasil ditambahkan'); }
            setShowModal(false);
            fetchCategories();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (category) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kategori',
            message: `Hapus kategori "${category.name}"?`,
            onConfirm: async () => {
                try { await categoryService.delete(category.id); toast.success('Kategori berhasil dihapus'); fetchCategories(); }
                catch (error) { toast.error('Gagal menghapus'); }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <FolderTree className="text-primary-600" />Kategori Siswa
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola kategori siswa (Reguler, Beasiswa, dll)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                    <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah Kategori</span></button>
                </div>
            </div>

            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={5} />
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
                            <div key={cat.id} className="card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="checkbox" checked={selectedItems.includes(cat.id)} onChange={() => toggleSelectItem(cat.id)} />
                                        <div>
                                            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.description || 'Tidak ada deskripsi'}</p>
                                        </div>
                                    </div>
                                    <div className="inline-flex flex-row items-center p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                        <button onClick={() => openModal(cat)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                        <button onClick={() => handleDelete(cat)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
                                    <Users size={18} style={{ color: 'var(--text-muted)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.students_count || 0} siswa</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><FolderTree size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada kategori</p></div>
                        )}
                    </div>
                    {totalItems > 0 && (
                        <div className="card mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalItems}
                                perPage={perPage}
                                onPageChange={setCurrentPage}
                                onPerPageChange={setPerPage}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th><input type="checkbox" className="checkbox" checked={categories.length > 0 && selectedItems.length === categories.length} onChange={toggleSelectAll} /></th><th>Nama Kategori</th><th>Deskripsi</th><th>Jumlah Siswa</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(cat.id)} onChange={() => toggleSelectItem(cat.id)} /></td>
                                        <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}><FolderTree size={16} style={{ color: 'var(--accent-color)' }} /></div><span className="font-medium">{cat.name}</span></div></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{cat.description || '-'}</td>
                                        <td><span className="badge badge-info w-fit"><Users size={14} /> {cat.students_count || 0} siswa</span></td>
                                        <td>
                                            <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(cat)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(cat)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Belum ada kategori</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                            onPerPageChange={setPerPage}
                        />
                    )}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="form-label">Nama Kategori</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="Contoh: Beasiswa" /></div>
                    <div><label className="form-label">Deskripsi</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" rows={3} placeholder="Deskripsi kategori" /></div>
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
