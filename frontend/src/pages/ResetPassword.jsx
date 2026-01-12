import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Fingerprint } from 'lucide-react';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/public/settings');
                if (response.data.success) {
                    setSettings(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setSettingsLoaded(true);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!token || !email) {
            setError('Link reset password tidak valid');
        }
    }, [token, email]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirmation) {
            setError('Password tidak cocok');
            return;
        }

        if (password.length < 8) {
            setError('Password minimal 8 karakter');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/reset-password', {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mereset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-body)' }}>
            <div className="w-full max-w-md">
                {/* Header with Logo */}
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
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Reset Password
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
                        Buat password baru untuk akun Anda
                    </p>
                </div>

                {/* Card */}
                <div className="card p-6">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Password Berhasil Direset!
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
                                Mengalihkan ke halaman login...
                            </p>
                            <Link
                                to="/login"
                                className="btn btn-primary"
                            >
                                Login Sekarang
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {token && email ? (
                                <>
                                    <div>
                                        <label className="form-label">Password Baru</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="input input-lg pr-12"
                                                placeholder="Minimal 8 karakter"
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Konfirmasi Password</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            className="input input-lg"
                                            placeholder="Ulangi password"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full py-3 text-base"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
                                        Link reset password tidak valid atau sudah kadaluarsa.
                                    </p>
                                    <Link
                                        to="/forgot-password"
                                        className="btn btn-primary"
                                    >
                                        Request Link Baru
                                    </Link>
                                </div>
                            )}

                            <div className="text-center pt-2">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <ArrowLeft size={14} />
                                    Kembali ke Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                    © 2026 {settingsLoaded ? (settings.institution_name) : ''}. All rights reserved.
                </p>
            </div>
        </div>
    );
}
