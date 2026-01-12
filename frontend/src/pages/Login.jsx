import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Fingerprint } from 'lucide-react';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/public/settings');
                if (response.data.success) {
                    setSettings(response.data.data || {});
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setSettingsLoaded(true);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    {!settingsLoaded ? (
                        <div className="w-16 h-16 rounded-2xl mb-4 bg-gray-200 animate-pulse"></div>
                    ) : settings.institution_logo ? (
                        <img
                            src={`${API_URL}/storage/${settings.institution_logo}`}
                            alt="Logo"
                            className="h-16 w-auto object-contain mb-4"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                    ) : (
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Fingerprint size={32} className="text-white" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">{settingsLoaded ? (settings.institution_name || 'Absensi RFID') : ''}</h1>
                    <p className="text-gray-500 mt-1">Masuk ke dashboard Anda</p>
                </div>

                {/* Login Card */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input input-lg"
                                placeholder="nama@sekolah.sch.id"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input input-lg"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                Lupa Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 text-base"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    © 2026 {settingsLoaded ? (settings.institution_name) : ''}. All rights reserved.
                </p>
            </div>
        </div>
    );
}
