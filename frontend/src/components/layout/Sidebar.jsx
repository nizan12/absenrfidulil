import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { settingService } from '../../services/dataService';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    FolderTree,
    Cpu,
    MapPin,
    Eye,
    FileSpreadsheet,
    Bell,
    Settings,
    Sun,
    Moon,
    X,
    UserCog,
    Palette,
    UserCircle,
    Check,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

// Role permissions: define which menus each role can access
const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'kepala_sekolah', 'staff_admin', 'guru_piket', 'operator'] },
    { path: '/students', icon: GraduationCap, label: 'Data Siswa', roles: ['super_admin', 'kepala_sekolah', 'staff_admin'] },
    { path: '/teachers', icon: UserCog, label: 'Data Guru', roles: ['super_admin', 'kepala_sekolah', 'staff_admin'] },
    { path: '/classes', icon: BookOpen, label: 'Manajemen Kelas', roles: ['super_admin', 'kepala_sekolah', 'staff_admin'] },
    { path: '/categories', icon: FolderTree, label: 'Kategori', roles: ['super_admin', 'kepala_sekolah', 'staff_admin'] },
    { path: '/parents', icon: UserCircle, label: 'Orang Tua', roles: ['super_admin', 'kepala_sekolah', 'staff_admin'] },
    { path: '/users', icon: Users, label: 'Data Admin', roles: ['super_admin'] },
    { path: '/devices', icon: Cpu, label: 'Manajemen Alat', roles: ['super_admin', 'staff_admin', 'operator'] },
    { path: '/locations', icon: MapPin, label: 'Lokasi', roles: ['super_admin', 'staff_admin', 'operator'] },
    { path: '/live-monitor', icon: Eye, label: 'Live Monitor', roles: ['super_admin', 'kepala_sekolah', 'staff_admin', 'guru_piket', 'operator'] },
    { path: '/recap', icon: FileSpreadsheet, label: 'Rekapitulasi', roles: ['super_admin', 'kepala_sekolah', 'staff_admin', 'guru_piket'] },
    { path: '/notifications', icon: Bell, label: 'Notifikasi WA', roles: ['super_admin', 'staff_admin'] },
    { path: '/settings', icon: Settings, label: 'Pengaturan', roles: ['super_admin'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
    const { theme, setTheme, accentColor, setAccentColor, accentColors } = useTheme();
    const { user } = useAuth();
    const [showStylePanel, setShowStylePanel] = useState(false);
    const [appSettings, setAppSettings] = useState({});

    // Filter menu items based on user role
    const filteredMenuItems = menuItems.filter(item => {
        if (!user?.role) return false;
        return item.roles.includes(user.role);
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingService.getAll();
                if (response.success) setAppSettings(response.data || {});
            } catch (error) { console.error('Error fetching settings:', error); }
        };
        fetchSettings();
    }, []);

    const getLogoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}/storage/${path}`;
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-64
                    border-r transform transition-transform duration-200 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
                {/* Header */}
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="h-10 flex-shrink-0">
                        {appSettings.institution_logo ? (
                            <img
                                src={getLogoUrl(appSettings.institution_logo)}
                                alt="Logo"
                                className="h-full w-auto object-contain"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : (
                            <img
                                src="/logo-sekolah.png"
                                alt="Logo"
                                className="h-full w-auto object-contain"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        )}
                        <div className="hidden w-10 h-10 rounded-lg items-center justify-center bg-blue-600 text-white font-bold">
                            {(appSettings.institution_name || 'A')[0].toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 hover:opacity-70 rounded"
                    >
                        <X size={18} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
                    {filteredMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setIsOpen(false);
                                }
                            }}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer - Personalize Style Button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                    <button
                        onClick={() => setShowStylePanel(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-80 rounded-lg transition-colors text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <Palette size={18} />
                        <span className="uppercase text-xs font-medium tracking-wide">Personalize Style</span>
                    </button>
                </div>
            </aside>

            {/* Personalize Style Panel - Above button */}
            {showStylePanel && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[55]"
                        onClick={() => setShowStylePanel(false)}
                    />

                    {/* Panel - positioned above button inside sidebar */}
                    <div
                        className="fixed bottom-16 left-3 w-[232px] z-[60] rounded-2xl shadow-xl border animate-modal-in"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 space-y-5">
                            {/* Theme Toggle */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    Tampilan
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className="flex items-center justify-center py-3 px-4 rounded-xl transition-all border-2"
                                        style={{
                                            borderColor: theme === 'light' ? 'var(--accent-color)' : 'var(--border-color)',
                                            color: theme === 'light' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                            background: theme === 'light' ? 'var(--accent-color-light)' : 'transparent'
                                        }}
                                    >
                                        <Sun size={22} />
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className="flex items-center justify-center py-3 px-4 rounded-xl transition-all border-2"
                                        style={{
                                            borderColor: theme === 'dark' ? 'var(--accent-color)' : 'var(--border-color)',
                                            color: theme === 'dark' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                            background: theme === 'dark' ? 'var(--accent-color-light)' : 'transparent'
                                        }}
                                    >
                                        <Moon size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Accent Color */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    Warna Aksen
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(accentColors).map(([key, color]) => (
                                        <button
                                            key={key}
                                            onClick={() => setAccentColor(key)}
                                            className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all border-2"
                                            style={{
                                                borderColor: accentColor === key ? color.primary : 'var(--border-color)',
                                                background: accentColor === key ? `${color.primary}15` : 'transparent'
                                            }}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: color.primary }}
                                            />
                                            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                                {color.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
