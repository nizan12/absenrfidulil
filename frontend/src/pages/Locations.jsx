import { useState, useEffect } from 'react';
import { locationService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Plus, Edit2, Trash2, X, Loader2, MapPin, Cpu, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
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

    useEffect(() => { fetchLocations(); }, []);

    useEffect(() => {
        if (selectedItems.length > 0 && !showFloatingBar) {
            setShowFloatingBar(true);
            setIsClosingBar(false);
        } else if (selectedItems.length === 0 && showFloatingBar) {
            setIsClosingBar(true);
            setTimeout(() => { setShowFloatingBar(false); setIsClosingBar(false); }, 300);
        }
    }, [selectedItems, showFloatingBar]);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const response = await locationService.getAll();
            if (response.success) setLocations(response.data || []);
        } catch (error) { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === locations.length) setSelectedItems([]);
        else setSelectedItems(locations.map(l => l.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Lokasi',
            message: `Hapus ${selectedItems.length} lokasi yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => locationService.delete(id)));
                    toast.success(`${selectedItems.length} lokasi berhasil dihapus`);
                    setSelectedItems([]);
                    fetchLocations();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (location = null) => {
        setEditingLocation(location);
        setFormData(location ? { name: location.name, description: location.description || '' } : { name: '', description: '' });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingLocation) { await locationService.update(editingLocation.id, formData); toast.success('Lokasi berhasil diperbarui'); }
            else { await locationService.create(formData); toast.success('Lokasi berhasil ditambahkan'); }
            setShowModal(false);
            fetchLocations();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (location) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Lokasi',
            message: `Hapus lokasi "${location.name}"?`,
            onConfirm: async () => {
                try { await locationService.delete(location.id); toast.success('Lokasi berhasil dihapus'); fetchLocations(); }
                catch (error) { toast.error('Gagal menghapus'); }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><MapPin className="text-primary-600" />Lokasi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola lokasi penempatan perangkat RFID</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                    <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah Lokasi</span></button>
                </div>
            </div>

            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={5} />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.length > 0 ? locations.map((loc) => (
                        <div key={loc.id} className="card p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="checkbox" checked={selectedItems.includes(loc.id)} onChange={() => toggleSelectItem(loc.id)} />
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                        <MapPin size={20} style={{ color: 'var(--accent-color)' }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{loc.name}</h3>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{loc.description || 'Tidak ada deskripsi'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                    <button onClick={() => openModal(loc)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                    <button onClick={() => handleDelete(loc)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
                                <Cpu size={18} style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{loc.esp_devices_count || 0} perangkat</span>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><MapPin size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada lokasi</p></div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th><input type="checkbox" className="checkbox" checked={locations.length > 0 && selectedItems.length === locations.length} onChange={toggleSelectAll} /></th><th>Nama Lokasi</th><th>Deskripsi</th><th>Jumlah Perangkat</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {locations.length > 0 ? locations.map((loc) => (
                                    <tr key={loc.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(loc.id)} onChange={() => toggleSelectItem(loc.id)} /></td>
                                        <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}><MapPin size={16} style={{ color: 'var(--accent-color)' }} /></div><span className="font-medium">{loc.name}</span></div></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{loc.description || '-'}</td>
                                        <td><span className="badge badge-info flex items-center gap-1 w-fit"><Cpu size={14} /> {loc.esp_devices_count || 0} perangkat</span></td>
                                        <td>
                                            <div className="flex items-center gap-1 p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(loc)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(loc)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Belum ada lokasi</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="form-label">Nama Lokasi</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="Contoh: Gerbang Utama" /></div>
                    <div><label className="form-label">Deskripsi</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" rows={3} /></div>
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
