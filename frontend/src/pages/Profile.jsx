import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { User, Save, Loader2, Mail, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
    const { user, updateUserProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

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

        if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (formData.new_password && formData.current_password) {
                data.append('current_password', formData.current_password);
                data.append('password', formData.new_password);
                data.append('password_confirmation', formData.new_password_confirmation);
            }
            if (photoFile) {
                data.append('photo', photoFile);
            }

            const response = await authService.updateProfile(data);
            if (response.success) {
                updateUserProfile(response.user);
                toast.success('Profil berhasil diperbarui');
                setFormData(prev => ({ ...prev, current_password: '', new_password: '', new_password_confirmation: '' }));
                setPhotoFile(null);
                setPhotoPreview(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setSaving(false);
        }
    };

    const getRoleLabel = (role) => {
        const roles = { super_admin: 'Super Admin', kepala_sekolah: 'Kepala Sekolah', staff_admin: 'Staff Admin', guru_piket: 'Guru Piket', operator: 'Operator' };
        return roles[role] || role;
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><User className="text-primary-600" />Profil Saya</h1>
                <p className="text-gray-500 dark:text-gray-400">Kelola informasi akun Anda</p>
            </div>

            {/* Profile Card */}
            <div className="card p-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {photoPreview || user?.photo ? (
                            <img
                                src={photoPreview || `${apiBase}/storage/${user.photo}`}
                                alt={user?.name}
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-color), var(--accent-color-dark, var(--accent-color)))' }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md" style={{ background: 'var(--accent-color)' }}>
                            <Camera size={16} className="text-white" />
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <span className="badge badge-info mt-2">{getRoleLabel(user?.role)}</span>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Edit Profil</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={formData.email} className="input bg-gray-100 dark:bg-gray-700" disabled />
                        <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Ubah Password</h3>
                <p className="text-sm text-gray-500 -mt-4">Kosongkan jika tidak ingin mengubah password</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Password Saat Ini</label>
                        <input type="password" value={formData.current_password} onChange={(e) => setFormData({ ...formData, current_password: e.target.value })} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password Baru</label>
                        <input type="password" value={formData.new_password} onChange={(e) => setFormData({ ...formData, new_password: e.target.value })} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
                        <input type="password" value={formData.new_password_confirmation} onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })} className="input" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>Simpan Perubahan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
