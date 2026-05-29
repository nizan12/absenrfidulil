import { useState, useEffect } from 'react';
import { settingService } from '../services/dataService';
import { Skeleton } from '../components/ui/Skeleton';
import { Settings as SettingsIcon, Save, Loader2, Bell, Clock, Building, Key, RefreshCw, Eye, EyeOff, ImageIcon, Upload, AlertTriangle, Calendar, Check, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showFonnteToken, setShowFonnteToken] = useState(false);
    const [showEspApiKey, setShowEspApiKey] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await settingService.getAll();
            if (response.success) {
                setSettings(response.data || {});
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Gagal memuat pengaturan');
        }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingService.update(settings);
            toast.success('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Gagal menyimpan pengaturan');
        }
        finally { setSaving(false); }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const generateApiKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        updateSetting('esp_api_key', key);
        toast.success('API Key baru berhasil dibuat! Jangan lupa simpan dan update di ESP32.');
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran logo maksimal 2MB');
            return;
        }

        setUploadingLogo(true);
        try {
            console.log('Uploading logo...', file.name, file.size);
            const response = await settingService.uploadLogo(file);
            console.log('Upload response:', response);
            if (response.success && response.data?.path) {
                const newPath = response.data.path;
                setSettings(prev => ({ ...prev, institution_logo: newPath }));
                setLogoPreview(URL.createObjectURL(file));
                toast.success('Logo berhasil diupload');
                // Notify other components (Sidebar) about the logo change
                window.dispatchEvent(new CustomEvent('settings-updated', {
                    detail: { institution_logo: newPath }
                }));
            } else {
                console.error('Upload response tidak valid:', response);
                toast.error(response.message || 'Upload gagal - response tidak valid');
            }
        } catch (error) {
            console.error('Upload error:', error.response || error);
            toast.error(error.response?.data?.message || 'Gagal upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><SettingsIcon className="text-primary-600" />Pengaturan</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Konfigurasi sistem absensi RFID</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-6">
                            <Skeleton className="h-6 w-48 mb-6" />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><SettingsIcon className="text-primary-600" />Pengaturan</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Konfigurasi sistem absensi RFID</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>Simpan Perubahan</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Institusi */}
                <div className="card p-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Building size={20} />Informasi Institusi</h2>
                    <div className="space-y-4">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Logo Institusi</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                    {logoPreview || settings.institution_logo ? (
                                        <img src={logoPreview || `${apiBase}/storage/${settings.institution_logo}?t=${Date.now()}`} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon size={32} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                                        {uploadingLogo ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                        <span>{uploadingLogo ? 'Mengupload...' : 'Upload Logo'}</span>
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                                    </label>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Format: JPG, PNG (maks 2MB)</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nama Institusi</label>
                            <input type="text" value={settings.institution_name || ''} onChange={(e) => updateSetting('institution_name', e.target.value)} className="input" placeholder="Nama sekolah/institusi" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Alamat</label>
                            <textarea value={settings.institution_address || ''} onChange={(e) => updateSetting('institution_address', e.target.value)} className="input" rows={2} placeholder="Alamat lengkap" />
                        </div>
                    </div>
                </div>

                {/* Fonnte API */}
                <div className="card p-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Bell size={20} />Konfigurasi WhatsApp (Fonnte)</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fonnte API Token</label>
                            <div className="relative">
                                <input
                                    type={showFonnteToken ? "text" : "password"}
                                    value={settings.fonnte_api_token || ''}
                                    onChange={(e) => updateSetting('fonnte_api_token', e.target.value)}
                                    className="input pr-10"
                                    placeholder="Token dari Fonnte.com"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowFonnteToken(!showFonnteToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={showFonnteToken ? "Sembunyikan" : "Tampilkan"}
                                >
                                    {showFonnteToken ? <EyeOff size={18} style={{ color: 'var(--text-muted)' }} /> : <Eye size={18} style={{ color: 'var(--text-muted)' }} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">No HP Kepala Sekolah</label>
                            <input type="text" value={settings.principal_phone || ''} onChange={(e) => updateSetting('principal_phone', e.target.value)} className="input" placeholder="628xxx (format internasional)" />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Untuk notifikasi kehadiran guru</p>
                        </div>
                    </div>
                </div>

                {/* Tap Delay */}
                <div className="card p-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Clock size={20} />Pengaturan Tap RFID</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Default Delay Tap (detik)</label>
                            <input type="number" value={settings.default_tap_delay || 300} onChange={(e) => updateSetting('default_tap_delay', e.target.value)} className="input" min={0} />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Jeda waktu antara tap pertama dan kedua (default 300 = 5 menit)</p>
                        </div>
                    </div>
                </div>

                {/* ESP32 API */}
                <div className="card p-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Key size={20} />Keamanan ESP32</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">ESP32 API Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showEspApiKey ? "text" : "password"}
                                        value={settings.esp_api_key || ''}
                                        onChange={(e) => updateSetting('esp_api_key', e.target.value)}
                                        className="input font-mono pr-10 w-full"
                                        placeholder="Kunci API untuk ESP32"
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEspApiKey(!showEspApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title={showEspApiKey ? "Sembunyikan" : "Tampilkan"}
                                    >
                                        {showEspApiKey ? <EyeOff size={18} style={{ color: 'var(--text-muted)' }} /> : <Eye size={18} style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                </div>
                                <button type="button" onClick={generateApiKey} className="btn btn-secondary" title="Generate API Key baru">
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Klik tombol Generate untuk membuat API Key baru. Salin kunci ini ke ESP32 Anda.</p>
                        </div>
                    </div>
                </div>

                {/* Aturan Keterlambatan */}
                <div className="card p-6 lg:col-span-2">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                        <AlertTriangle size={20} />Aturan Keterlambatan
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                        Konfigurasi batas jam masuk dan toleransi keterlambatan untuk siswa
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Non-Boarding Limit */}
                        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                                    <Clock size={16} style={{ color: 'var(--accent-color)' }} />
                                </div>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Non-Boarding</span>
                            </div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Batas Jam Masuk</label>
                            <input
                                type="time"
                                value={settings.late_time_regular || '07:30'}
                                onChange={(e) => updateSetting('late_time_regular', e.target.value)}
                                className="input"
                            />
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Siswa yang datang melebihi jam ini akan dianggap <strong>terlambat</strong>
                            </p>
                        </div>

                        {/* Boarding Limit */}
                        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, #f59e0b 15%, transparent)' }}>
                                    <Clock size={16} style={{ color: '#f59e0b' }} />
                                </div>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Boarding / Asrama</span>
                            </div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Batas Jam Kembali</label>
                            <input
                                type="time"
                                value={settings.late_time_boarding || '17:00'}
                                onChange={(e) => updateSetting('late_time_boarding', e.target.value)}
                                className="input"
                            />
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Siswa boarding yang kembali melebihi jam ini dianggap <strong>pulang terlambat</strong>
                            </p>
                        </div>

                        {/* Tolerance */}
                        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, #10b981 15%, transparent)' }}>
                                    <AlertTriangle size={16} style={{ color: '#10b981' }} />
                                </div>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Toleransi</span>
                            </div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Toleransi Keterlambatan (menit)</label>
                            <input
                                type="number"
                                value={settings.late_tolerance_minutes || 15}
                                onChange={(e) => updateSetting('late_tolerance_minutes', e.target.value)}
                                className="input"
                                min={0}
                                max={60}
                            />
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Jeda setelah batas waktu sebelum dianggap benar-benar terlambat
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--text-secondary)' }}>
                        <strong>Contoh:</strong> Jika batas masuk 07:30 dengan toleransi 15 menit:
                        <span className="inline-flex items-center gap-1 ml-1"><Check size={12} style={{ color: '#10b981' }} /> ≤07:30 = Tepat Waktu</span> •
                        <span className="inline-flex items-center gap-1 ml-1"><AlertTriangle size={12} style={{ color: '#f59e0b' }} /> 07:31-07:45 = Toleransi</span> •
                        <span className="inline-flex items-center gap-1 ml-1"><Ban size={12} style={{ color: '#ef4444' }} /> &gt;07:45 = Terlambat</span>
                    </div>
                </div>

                {/* Hari Libur Mingguan */}
                <div className="card p-6 lg:col-span-2">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                        <Calendar size={20} />Hari Libur Mingguan
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                        Pilih hari-hari yang bukan hari sekolah (digunakan untuk perhitungan rekap kehadiran)
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: '0', label: 'Minggu' },
                            { value: '1', label: 'Senin' },
                            { value: '2', label: 'Selasa' },
                            { value: '3', label: 'Rabu' },
                            { value: '4', label: 'Kamis' },
                            { value: '5', label: 'Jumat' },
                            { value: '6', label: 'Sabtu' },
                        ].map(day => {
                            const currentOffDays = (settings.school_off_days || '0,6').split(',').map(d => d.trim());
                            const isOff = currentOffDays.includes(day.value);

                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={async () => {
                                        let newDays;
                                        if (isOff) {
                                            newDays = currentOffDays.filter(d => d !== day.value);
                                        } else {
                                            newDays = [...currentOffDays, day.value];
                                        }
                                        const newValue = newDays.filter(d => d !== '').join(',');
                                        updateSetting('school_off_days', newValue);
                                        try {
                                            await settingService.update({ school_off_days: newValue });
                                        } catch (e) {
                                            toast.error('Gagal menyimpan hari libur');
                                        }
                                    }}
                                    className="px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center gap-1.5"
                                    style={{
                                        borderColor: isOff ? '#ef4444' : '#10b981',
                                        background: isOff ? 'color-mix(in srgb, #ef4444 10%, transparent)' : 'color-mix(in srgb, #10b981 10%, transparent)',
                                        color: isOff ? '#ef4444' : '#10b981',
                                    }}
                                >
                                    {isOff ? <Ban size={14} /> : <Check size={14} />}
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)', color: 'var(--text-secondary)' }}>
                        <strong>Keterangan:</strong> Hari bertanda merah akan <strong>tidak dihitung</strong> sebagai hari sekolah di rekap kehadiran. Klik untuk toggle.
                    </div>
                </div>
            </div>
        </div>
    );
}

