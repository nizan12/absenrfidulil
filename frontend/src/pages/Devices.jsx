import { useState, useEffect } from 'react';
import { deviceService, locationService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Plus, Search, Edit2, Trash2, X, Loader2, Cpu, MapPin, Wifi, WifiOff, Clock, LayoutGrid, List, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Devices() {
    const [devices, setDevices] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [formData, setFormData] = useState({ device_code: '', name: '', location_id: '', type: 'gate_in', tap_delay_seconds: 300 });
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

    useEffect(() => { fetchDevices(); fetchLocations(); }, []);

    useEffect(() => {
        if (selectedItems.length > 0 && !showFloatingBar) {
            setShowFloatingBar(true);
            setIsClosingBar(false);
        } else if (selectedItems.length === 0 && showFloatingBar) {
            setIsClosingBar(true);
            setTimeout(() => { setShowFloatingBar(false); setIsClosingBar(false); }, 300);
        }
    }, [selectedItems, showFloatingBar]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const response = await deviceService.getAll(params);
            if (response.success) setDevices(response.data || []);
        } catch (error) { toast.error('Gagal memuat data perangkat'); }
        finally { setLoading(false); }
    };

    const fetchLocations = async () => {
        try {
            const response = await locationService.getAll();
            if (response.success) setLocations(response.data);
        } catch (error) { console.error('Error fetching locations:', error); }
    };

    // Client-side filtering and pagination
    const filteredDevices = devices.filter(d =>
        !search || d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.device_code?.toLowerCase().includes(search.toLowerCase())
    );
    const totalItems = filteredDevices.length;
    const paginatedDevices = filteredDevices.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Reset to page 1 when search changes
    useEffect(() => { setCurrentPage(1); }, [search]);

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === devices.length) setSelectedItems([]);
        else setSelectedItems(devices.map(d => d.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Perangkat',
            message: `Hapus ${selectedItems.length} perangkat yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => deviceService.delete(id)));
                    toast.success(`${selectedItems.length} perangkat berhasil dihapus`);
                    setSelectedItems([]);
                    fetchDevices();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (device = null) => {
        if (device) {
            setEditingDevice(device);
            setFormData({ device_code: device.device_code || '', name: device.name || '', location_id: device.location_id || '', type: device.type || 'gate_in', tap_delay_seconds: device.tap_delay_seconds || 300 });
        } else {
            setEditingDevice(null);
            setFormData({ device_code: '', name: '', location_id: '', type: 'gate_in', tap_delay_seconds: 300 });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingDevice(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = { ...formData, location_id: formData.location_id || null };
            if (editingDevice) { await deviceService.update(editingDevice.id, submitData); toast.success('Perangkat berhasil diperbarui'); }
            else { await deviceService.create(submitData); toast.success('Perangkat berhasil ditambahkan'); }
            closeModal();
            fetchDevices();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (device) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Perangkat',
            message: `Hapus perangkat "${device.name}"?`,
            onConfirm: async () => {
                try { await deviceService.delete(device.id); toast.success('Perangkat berhasil dihapus'); fetchDevices(); }
                catch (error) { toast.error('Gagal menghapus'); }
            }
        });
    };

    const handleSearch = (e) => { e.preventDefault(); fetchDevices(); };

    const getTypeLabel = (type) => ({ gate_in: 'Gerbang Masuk', gate_out: 'Gerbang Keluar', classroom: 'Ruang Kelas' }[type] || type);
    const getTypeColor = (type) => ({ gate_in: 'bg-green-100 text-green-700', gate_out: 'bg-red-100 text-red-700', classroom: 'bg-blue-100 text-blue-700' }[type] || 'bg-gray-100 text-gray-700');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Cpu className="text-primary-600" />Perangkat ESP32</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola perangkat RFID reader</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Tambah Perangkat</span></button>
            </div>

            <div className="card p-4">
                <div className="flex gap-4 items-center">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau kode perangkat..." className="input pl-10" />
                        </div>
                        <button type="submit" className="btn btn-primary"><Search size={20} /><span>Cari</span></button>
                    </form>
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                </div>
            </div>

            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={8} />
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedDevices.length > 0 ? paginatedDevices.map((device) => (
                            <div key={device.id} className="card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="checkbox" checked={selectedItems.includes(device.id)} onChange={() => toggleSelectItem(device.id)} />
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            {device.is_active ? <Wifi className="text-green-600" size={20} /> : <WifiOff className="text-gray-400" size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{device.name}</h3>
                                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{device.device_code}</p>
                                        </div>
                                    </div>
                                    <div className="inline-flex flex-row items-center p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                        <button onClick={() => openModal(device)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                        <button onClick={() => handleDelete(device)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><MapPin size={16} style={{ color: 'var(--text-muted)' }} /><span>{device.location?.name || 'Tidak ada lokasi'}</span></div>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Clock size={16} style={{ color: 'var(--text-muted)' }} /><span>Delay: {device.tap_delay_seconds || 300} detik</span></div>
                                </div>
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}><span className={`badge ${getTypeColor(device.type)}`}>{getTypeLabel(device.type)}</span></div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><Cpu size={48} className="mx-auto mb-3 opacity-30" /><p>Belum ada perangkat terdaftar</p></div>
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
                            <thead><tr><th><input type="checkbox" className="checkbox" checked={filteredDevices.length > 0 && selectedItems.length === filteredDevices.length} onChange={toggleSelectAll} /></th><th>Status</th><th>Nama</th><th>Kode</th><th>Lokasi</th><th>Tipe</th><th>Delay</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {paginatedDevices.length > 0 ? paginatedDevices.map((device) => (
                                    <tr key={device.id}>
                                        <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(device.id)} onChange={() => toggleSelectItem(device.id)} /></td>
                                        <td>{device.is_active ? <span className="badge badge-success w-fit whitespace-nowrap"><Wifi size={14} /> Online</span> : <span className="badge badge-secondary w-fit whitespace-nowrap"><WifiOff size={14} /> Offline</span>}</td>
                                        <td className="font-medium whitespace-nowrap">{device.name}</td>
                                        <td className="font-mono text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{device.device_code}</td>
                                        <td className="whitespace-nowrap">{device.location?.name || '-'}</td>
                                        <td><span className={`badge whitespace-nowrap ${getTypeColor(device.type)}`}>{getTypeLabel(device.type)}</span></td>
                                        <td className="whitespace-nowrap">{device.tap_delay_seconds || 300}s</td>
                                        <td>
                                            <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                <button onClick={() => openModal(device)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                <button onClick={() => handleDelete(device)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={8} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Belum ada perangkat terdaftar</td></tr>}
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

            <Modal isOpen={showModal} onClose={closeModal} title={editingDevice ? 'Edit Perangkat' : 'Tambah Perangkat'}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="form-label">Kode Perangkat</label><input type="text" value={formData.device_code} onChange={(e) => setFormData({ ...formData, device_code: e.target.value })} className="input" required placeholder="Contoh: ESP32-GATE-01" /></div>
                    <div><label className="form-label">Nama Perangkat</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="Contoh: Reader Gerbang Utama" /></div>
                    <div><label className="form-label">Lokasi</label>
                        <CustomSelect
                            options={locations.map(loc => ({ value: loc.id, label: loc.name }))}
                            value={formData.location_id}
                            onChange={(val) => setFormData({ ...formData, location_id: val })}
                            placeholder="Pilih Lokasi"
                        />
                    </div>
                    <div><label className="form-label">Tipe</label>
                        <CustomSelect
                            options={[
                                { value: 'gate_in', label: 'Gerbang Masuk' },
                                { value: 'gate_out', label: 'Gerbang Keluar' },
                                { value: 'classroom', label: 'Ruang Kelas' },
                            ]}
                            value={formData.type}
                            onChange={(val) => setFormData({ ...formData, type: val })}
                            placeholder="Pilih Tipe"
                        />
                    </div>
                    <div><label className="form-label">Delay Tap (detik)</label><input type="number" value={formData.tap_delay_seconds} onChange={(e) => setFormData({ ...formData, tap_delay_seconds: parseInt(e.target.value) })} className="input" min="0" placeholder="300" /><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Jeda waktu minimal antara tap (default: 300 detik = 5 menit)</p></div>
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
            {
                showFloatingBar && (
                    <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
                        <div className={`floating-bar pointer-events-auto ${isClosingBar ? 'animate-float-down-center' : 'animate-float-up-center'}`}>
                            <div className="floating-bar-count">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                    <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{selectedItems.length}</span>
                                </div>
                                <span className="count-text text-sm" style={{ color: 'var(--text-secondary)' }}>dipilih</span>
                            </div>
                            <button onClick={() => {
                                const selectedData = devices.filter(d => selectedItems.includes(d.id));
                                const csvContent = [
                                    ['Kode Perangkat', 'Nama', 'Lokasi', 'Tipe', 'Status', 'Delay'],
                                    ...selectedData.map(d => [d.device_code, d.name, d.location?.name || '', d.type, d.is_active ? 'Online' : 'Offline', d.tap_delay_seconds || 300])
                                ].map(row => row.join(',')).join('\n');
                                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `perangkat_export_${new Date().toISOString().slice(0, 10)}.csv`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                toast.success(`${selectedData.length} perangkat berhasil diexport`);
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
                )
            }
        </div >
    );
}
