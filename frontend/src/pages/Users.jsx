import { useState, useEffect } from 'react';
import { userService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import CustomSelect from '../components/ui/CustomSelect';
import Pagination from '../components/ui/Pagination';
import { Plus, Search, Edit2, Trash2, Loader2, Users, Mail, Phone, LayoutGrid, List, X, Camera, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const roles = [
    { value: 'super_admin', label: 'SUPER ADMIN', color: 'text-gray-500' },
    { value: 'kepala_sekolah', label: 'KEPALA SEKOLAH', color: 'text-blue-600' },
    { value: 'staff_admin', label: 'STAFF ADMIN', color: 'text-blue-600' },
    { value: 'guru_piket', label: 'GURU PIKET', color: 'text-blue-600' },
    { value: 'operator', label: 'OPERATOR', color: 'text-green-600' },
];

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'staff_admin' });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('table');

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

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => { fetchUsers(1); }, 300);
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

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            const response = await userService.getAll(params);
            if (response.success) {
                setUsers(response.data.data || response.data || []);
                if (response.data.current_page) setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page, total: response.data.total });
            }
        } catch (error) { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === users.length) setSelectedItems([]);
        else setSelectedItems(users.map(u => u.id));
    };

    const clearSelection = () => setSelectedItems([]);

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak User',
            message: `Hapus ${selectedItems.length} user yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedItems.map(id => userService.delete(id)));
                    toast.success(`${selectedItems.length} user berhasil dihapus`);
                    setSelectedItems([]);
                    fetchUsers();
                } catch (error) { toast.error('Gagal menghapus beberapa data'); }
            }
        });
    };

    const openModal = (user = null) => {
        setEditingUser(user);
        setFormData(user ? { name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role } : { name: '', email: '', phone: '', password: '', role: 'staff_admin' });
        setPhotoFile(null);
        const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
        setPhotoPreview(user?.photo ? `${apiBase}/storage/${user.photo}` : null);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

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

        // Validate password minimum 8 characters for new user
        if (!editingUser && formData.password.length < 8) {
            toast.error('Password minimal 8 karakter');
            return;
        }
        // Validate password if provided during edit
        if (editingUser && formData.password && formData.password.length < 8) {
            toast.error('Password minimal 8 karakter');
            return;
        }

        setSubmitting(true);
        try {
            // Use FormData for file upload
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            if (formData.phone) data.append('phone', formData.phone);
            if (formData.password) data.append('password', formData.password);
            data.append('role', formData.role);
            if (photoFile) data.append('photo', photoFile);

            if (editingUser) {
                data.append('_method', 'PUT'); // Laravel method spoofing for FormData
                await userService.update(editingUser.id, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('User berhasil diperbarui');
            }
            else {
                await userService.create(data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('User berhasil ditambahkan');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) { toast.error(error.response?.data?.message || 'Terjadi kesalahan'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = (user) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus User',
            message: `Hapus user "${user.name}"?`,
            onConfirm: async () => {
                try { await userService.delete(user.id); toast.success('User berhasil dihapus'); fetchUsers(); }
                catch (error) { toast.error(error.response?.data?.message || 'Gagal menghapus'); }
            }
        });
    };

    const getRoleInfo = (role) => roles.find(r => r.value === role) || { label: role, color: 'text-gray-500' };
    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const getAvatarColor = () => {
        // Use theme accent color for all avatars
        return {
            background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
            color: 'var(--accent-color)'
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users className="text-primary-600" />Manajemen Admin</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola akses personil dan notifikasi pimpinan.</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={20} /><span>Registrasi Baru</span></button>
            </div>

            <div className="card p-4">
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari Nama atau Email..." className="input pl-10" />
                    </div>
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                </div>
            </div>

            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={5} />
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.length > 0 ? users.map((user) => {
                            const roleInfo = getRoleInfo(user.role);
                            return (
                                <div key={user.id} className="card p-5 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <input type="checkbox" className="checkbox mt-1" checked={selectedItems.includes(user.id)} onChange={() => toggleSelectItem(user.id)} />
                                        {user.photo ? (
                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${user.photo}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm" style={getAvatarColor(user.role)}>{getInitials(user.name)}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</h3>
                                            <p className={`text-xs font-medium ${roleInfo.color}`}>{roleInfo.label}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Mail size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} /><span className="truncate">{user.email}</span></div>
                                        {user.phone && <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-color)' }}><Phone size={14} className="flex-shrink-0" /><span>{user.phone}</span></div>}
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <button onClick={() => openModal(user)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}><Edit2 size={14} /><span>Edit</span></button>
                                        <button onClick={() => handleDelete(user)} className="p-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} className="text-red-500" /></button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-secondary)' }}><Users size={48} className="mx-auto mb-3 opacity-30" /><p>Tidak ada data user</p></div>
                        )}
                    </div>
                    {pagination && (
                        <div className="card mt-4">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalItems={pagination.total}
                                perPage={perPage}
                                onPageChange={(page) => fetchUsers(page)}
                                onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th><input type="checkbox" className="checkbox" checked={users.length > 0 && selectedItems.length === users.length} onChange={toggleSelectAll} /></th><th>User</th><th>Email</th><th>Role</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {users.length > 0 ? users.map((user) => {
                                    const roleInfo = getRoleInfo(user.role);
                                    return (
                                        <tr key={user.id}>
                                            <td><input type="checkbox" className="checkbox" checked={selectedItems.includes(user.id)} onChange={() => toggleSelectItem(user.id)} /></td>
                                            <td><div className="flex items-center gap-3 whitespace-nowrap">{user.photo ? <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${user.photo}`} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0" style={getAvatarColor(user.role)}>{getInitials(user.name)}</div>}<span className="font-medium">{user.name}</span></div></td>
                                            <td className="whitespace-nowrap">{user.email}</td>
                                            <td><span className={`text-xs font-medium whitespace-nowrap ${roleInfo.color}`}>{roleInfo.label}</span></td>
                                            <td>
                                                <div className="inline-flex flex-row items-center p-1 rounded-lg border w-fit" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                    <button onClick={() => openModal(user)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"><Edit2 size={14} className="text-blue-600" /></button>
                                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                    <button onClick={() => handleDelete(user)} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"><Trash2 size={14} className="text-red-500" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Tidak ada data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {pagination && (
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalItems={pagination.total}
                            perPage={perPage}
                            onPageChange={(page) => fetchUsers(page)}
                            onPerPageChange={(newPerPage) => setPerPage(newPerPage)}
                        />
                    )}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingUser ? 'Edit User' : 'Registrasi User Baru'}>
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
                    <div><label className="form-label">Nama Lengkap</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="Masukkan nama lengkap" /></div>
                    <div><label className="form-label">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" required placeholder="contoh@email.com" /></div>
                    <div><label className="form-label">No. Telepon</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" placeholder="628xxx (opsional)" /></div>
                    <div>
                        <label className="form-label">Password {editingUser && '(kosongkan jika tidak diubah)'}</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`input ${formData.password && formData.password.length < 8 ? 'border-red-500' : ''}`} {...(!editingUser && { required: true })} placeholder="••••••••" />
                        {formData.password && formData.password.length > 0 && formData.password.length < 8 && (
                            <p className="text-red-500 text-sm mt-1">Password minimal 8 karakter ({formData.password.length}/8)</p>
                        )}
                    </div>
                    <div><label className="form-label">Role</label>
                        <CustomSelect
                            options={roles}
                            value={formData.role}
                            onChange={(val) => setFormData({ ...formData, role: val })}
                            placeholder="Pilih Role"
                        />
                    </div>
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
                            const selectedData = users.filter(u => selectedItems.includes(u.id));
                            const csvContent = [
                                ['Nama', 'Email', 'Role'],
                                ...selectedData.map(u => [u.name, u.email, u.role])
                            ].map(row => row.join(',')).join('\n');
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `user_export_${new Date().toISOString().slice(0, 10)}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            toast.success(`${selectedData.length} user berhasil diexport`);
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
