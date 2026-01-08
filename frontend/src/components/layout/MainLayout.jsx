import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, User, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main content */}
            <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between px-4 lg:px-6 py-3">
                        {/* Left - Toggle Sidebar */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:opacity-70"
                            title={sidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
                        >
                            {sidebarOpen ? (
                                <PanelLeftClose size={20} style={{ color: 'var(--text-secondary)' }} />
                            ) : (
                                <PanelLeft size={20} style={{ color: 'var(--text-secondary)' }} />
                            )}
                        </button>

                        {/* Right - User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 p-1.5 rounded-lg transition-colors hover:opacity-80"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {user?.name || 'Super Admin'}
                                    </p>
                                    <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                                        {user?.role?.replace('_', ' ') || 'Super Admin'}
                                    </p>
                                </div>
                                {user?.photo ? (
                                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${user.photo}`} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                        <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>
                                            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                                        </span>
                                    </div>
                                )}
                                <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 rounded-lg border shadow-lg py-1 z-50"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                >
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {user?.name || 'Super Admin'}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                            {user?.email || 'admin@sekolah.sch.id'}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                navigate('/profile');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <User size={16} />
                                            <span>Profil Saya</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                navigate('/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <Settings size={16} />
                                            <span>Pengaturan</span>
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t py-1" style={{ borderColor: 'var(--border-color)' }}>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            <span>Keluar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
