import { useState, useEffect, useRef } from 'react';
import { studentService, classService, categoryService } from '../services/dataService';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import CustomSelect from '../components/ui/CustomSelect';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    LayoutGrid,
    List,
    Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        rfid_uid: '',
        nis: '',
        name: '',
        class_id: '',
        category_id: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const [isClosingBar, setIsClosingBar] = useState(false);
    const fileInputRef = useRef(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Handle floating bar visibility with animation
    useEffect(() => {
        if (selectedStudents.length > 0) {
            setShowFloatingBar(true);
            setIsClosingBar(false);
        } else if (showFloatingBar) {
            // Start closing animation
            setIsClosingBar(true);
            const timer = setTimeout(() => {
                setShowFloatingBar(false);
                setIsClosingBar(false);
            }, 200); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [selectedStudents.length]);

    useEffect(() => {
        fetchStudents();
        fetchClasses();
        fetchCategories();
    }, []);

    // Auto-search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, filterClass, filterCategory, perPage]);

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (search) params.search = search;
            if (filterClass) params.class_id = filterClass;
            if (filterCategory) params.category_id = filterCategory;

            const response = await studentService.getAll(params);
            if (response.success) {
                setStudents(response.data.data || []);
                setPagination({
                    currentPage: response.data.current_page,
                    lastPage: response.data.last_page,
                    total: response.data.total,
                });
            }
        } catch (error) {
            toast.error('Gagal memuat data siswa');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await classService.getAll();
            if (response.success) setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            if (response.success) setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const openModal = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                rfid_uid: student.rfid_uid || '',
                nis: student.nis || '',
                name: student.name || '',
                class_id: student.class_id || '',
                category_id: student.category_id || '',
            });
            const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
            setPhotoPreview(student.photo ? `${apiBase}/storage/${student.photo}` : null);
        } else {
            setEditingStudent(null);
            setFormData({ rfid_uid: '', nis: '', name: '', class_id: '', category_id: '' });
            setPhotoPreview(null);
        }
        setPhotoFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
        setFormData({ rfid_uid: '', nis: '', name: '', class_id: '', category_id: '' });
        setPhotoFile(null);
        setPhotoPreview(null);
    };

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
        setSubmitting(true);

        try {
            // Use FormData for file upload
            const data = new FormData();
            data.append('rfid_uid', formData.rfid_uid);
            data.append('nis', formData.nis);
            data.append('name', formData.name);
            data.append('class_id', formData.class_id);
            if (formData.category_id) data.append('category_id', formData.category_id);
            if (photoFile) data.append('photo', photoFile);

            if (editingStudent) {
                data.append('_method', 'PUT');
                await studentService.update(editingStudent.id, data);
                toast.success('Siswa berhasil diperbarui');
            } else {
                await studentService.create(data);
                toast.success('Siswa berhasil ditambahkan');
            }
            closeModal();
            fetchStudents();
        } catch (error) {
            const message = error.response?.data?.message || 'Terjadi kesalahan';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (student) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Siswa',
            message: `Hapus siswa "${student.name}"?`,
            onConfirm: async () => {
                try {
                    await studentService.delete(student.id);
                    toast.success('Siswa berhasil dihapus');
                    fetchStudents();
                } catch (error) {
                    toast.error('Gagal menghapus siswa');
                }
            }
        });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    };

    const getAvatarColor = () => {
        // Use theme accent color
        return {
            background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)',
            color: 'var(--accent-color)'
        };
    };

    // Selection Functions
    const toggleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id)
                ? prev.filter(sId => sId !== id)
                : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Banyak Siswa',
            message: `Hapus ${selectedStudents.length} siswa yang dipilih?`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedStudents.map(id => studentService.delete(id)));
                    toast.success(`${selectedStudents.length} siswa berhasil dihapus`);
                    setSelectedStudents([]);
                    fetchStudents();
                } catch (error) {
                    toast.error('Gagal menghapus beberapa siswa');
                }
            }
        });
    };

    const clearSelection = () => {
        setSelectedStudents([]);
    };

    // Import Excel Functions
    const openImportModal = () => {
        setShowImportModal(true);
        setImportFile(null);
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
                'application/vnd.ms-excel', // xls
                'text/csv', // csv
                'application/csv', // csv alternative
            ];
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

            if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                toast.error('File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)');
                return;
            }
            setImportFile(file);
        }
    };

    const handleDownloadTemplate = () => {
        // Generate CSV with reference data included
        const templateData = [
            ['=== TEMPLATE IMPORT SISWA ===', '', '', '', '', '', '', ''],
            ['RFID UID', 'NIS', 'Nama Siswa', 'Kelas', 'Kategori', 'Nama Ortu', 'No HP Ortu', 'Hubungan'],
            ['A1B2C3D4', '12345', 'Ahmad Rizki', 'X RPL 1', 'Reguler', 'Budi Santoso', '08123456789', 'ayah'],
            ['E5F6G7H8', '12346', 'Siti Nurhaliza', 'X RPL 2', 'Full Day', 'Dewi Rahayu', '08987654321', 'ibu'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['=== DAFTAR KELAS ===', '', '', '', '', '', '', ''],
            ...classes.map(c => [c.name, '', '', '', '', '', '', '']),
            ['', '', '', '', '', '', '', ''],
            ['=== DAFTAR KATEGORI ===', '', '', '', '', '', '', ''],
            ...categories.map(c => [c.name, '', '', '', '', '', '', '']),
            ['', '', '', '', '', '', '', ''],
            ['=== DAFTAR HUBUNGAN ===', '', '', '', '', '', '', ''],
            ['ayah', 'Ayah kandung siswa', '', '', '', '', '', ''],
            ['ibu', 'Ibu kandung siswa', '', '', '', '', '', ''],
            ['wali', 'Wali atau pengasuh siswa', '', '', '', '', '', ''],
        ];

        const csvContent = templateData.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `template_import_siswa_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Template CSV berhasil diunduh');
    };

    const handleImport = async () => {
        if (!importFile) {
            toast.error('Pilih file Excel terlebih dahulu');
            return;
        }

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await studentService.import(formData);
            if (response.success) {
                toast.success(`Berhasil mengimpor ${response.data?.imported || 0} siswa`);
                closeImportModal();
                fetchStudents();
            } else {
                toast.error(response.message || 'Gagal mengimpor data');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Gagal mengimpor data';
            toast.error(message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
                    <p className="text-gray-500 text-sm">Kelola informasi lengkap seluruh siswa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={openImportModal} className="btn btn-outline">
                        <Upload size={18} />
                        <span>Import Excel</span>
                    </button>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <Plus size={18} />
                        <span>Tambah Siswa</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="form-label">Cari Siswa</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nama Siswa..."
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Filter Kelas</label>
                            <CustomSelect
                                options={[{ value: '', label: 'Semua Kelas' }, ...classes.map(cls => ({ value: cls.id, label: cls.name }))]}
                                value={filterClass}
                                onChange={setFilterClass}
                                placeholder="Semua Kelas"
                            />
                        </div>
                        <div>
                            <label className="form-label">Filter Kategori</label>
                            <CustomSelect
                                options={[{ value: '', label: 'Semua Kategori' }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))]}
                                value={filterCategory}
                                onChange={setFilterCategory}
                                placeholder="Semua Kategori"
                            />
                        </div>
                    </div>
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`} style={{ background: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--bg-card)' }}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-3 transition-colors ${viewMode === 'table' ? 'text-white' : ''}`} style={{ background: viewMode === 'table' ? 'var(--accent-color)' : 'var(--bg-card)' }}><List size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                viewMode === 'grid' ? <CardSkeleton /> : <TableSkeleton columns={5} />
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {students.length > 0 ? students.map((student) => (
                            <div key={student.id} className="card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleSelectStudent(student.id)} />
                                        {student.photo ? (
                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${student.photo}`} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="avatar" style={getAvatarColor()}>{getInitials(student.name)}</div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                            <p className="text-xs text-gray-500">NIS: {student.nis}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModal(student)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 size={16} className="text-blue-600" /></button>
                                        <button onClick={() => handleDelete(student)} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 size={16} className="text-red-600" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded block">{student.rfid_uid}</code>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="badge badge-primary">★ {student.class?.name || '-'}</span>
                                        <span className="badge badge-secondary">◇ {student.category?.name || 'FULL DAY'}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-gray-500">Tidak ada data siswa</div>
                        )}
                    </div>
                    {pagination && pagination.lastPage > 1 && (
                        <div className="card p-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">Total: {pagination.total} siswa</p>
                            <div className="flex gap-2">
                                <button onClick={() => fetchStudents(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="btn btn-secondary text-sm disabled:opacity-50">Prev</button>
                                <span className="px-3 py-2 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
                                <button onClick={() => fetchStudents(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} className="btn btn-secondary text-sm disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Table View */
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="w-12">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={students.length > 0 && selectedStudents.length === students.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Siswa</th>
                                    <th>RFID</th>
                                    <th>Kelas & Kategori</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => toggleSelectStudent(student.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    {student.photo ? (
                                                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${student.photo}`} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="avatar" style={getAvatarColor()}>
                                                            {getInitials(student.name)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {student.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            ID: {student.nis}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                                                    {student.rfid_uid}
                                                </code>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <span className="badge badge-primary">
                                                        ★ {student.class?.name || '-'}
                                                    </span>
                                                    <p className="text-sm text-gray-500">
                                                        ◇ {student.category?.name || 'FULL DAY'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-1">
                                                    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                                                        <button
                                                            onClick={() => openModal(student)}
                                                            className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} className="text-blue-600" />
                                                        </button>
                                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                                        <button
                                                            onClick={() => handleDelete(student)}
                                                            className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={14} className="text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-500">
                                            Tidak ada data siswa
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.lastPage > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                    Total: {pagination.total} siswa
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Tampilkan:</span>
                                    <CustomSelect
                                        options={[
                                            { value: 10, label: '10' },
                                            { value: 25, label: '25' },
                                            { value: 50, label: '50' },
                                            { value: 100, label: '100' },
                                            { value: 9999, label: 'Semua' },
                                        ]}
                                        value={perPage}
                                        onChange={setPerPage}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchStudents(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-2 text-sm flex items-center">
                                    {pagination.currentPage} / {pagination.lastPage}
                                </span>
                                <button
                                    onClick={() => fetchStudents(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.lastPage}
                                    className="btn btn-secondary text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
            >
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
                    <div>
                        <label className="form-label">RFID UID</label>
                        <input
                            type="text"
                            value={formData.rfid_uid}
                            onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value })}
                            className="input"
                            required
                            placeholder="Contoh: A1B2C3D4"
                        />
                    </div>
                    <div>
                        <label className="form-label">NIS</label>
                        <input
                            type="text"
                            value={formData.nis}
                            onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                            className="input"
                            required
                            placeholder="Nomor Induk Siswa"
                        />
                    </div>
                    <div>
                        <label className="form-label">Nama Lengkap</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            required
                            placeholder="Nama lengkap siswa"
                        />
                    </div>
                    <div>
                        <label className="form-label">Kelas</label>
                        <CustomSelect
                            options={classes.map(cls => ({ value: cls.id, label: cls.name }))}
                            value={formData.class_id}
                            onChange={(val) => setFormData({ ...formData, class_id: val })}
                            placeholder="Pilih Kelas"
                            searchable={true}
                        />
                    </div>
                    <div>
                        <label className="form-label">Kategori</label>
                        <CustomSelect
                            options={[{ value: '', label: 'Tidak Ada' }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))]}
                            value={formData.category_id}
                            onChange={(val) => setFormData({ ...formData, category_id: val })}
                            placeholder="Pilih Kategori"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                            Batal
                        </button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal
                isOpen={showImportModal}
                onClose={closeImportModal}
                title="Import Data Siswa"
                size="lg"
            >
                <div className="p-4 space-y-4">
                    {/* Download Template */}
                    <div className="rounded-lg p-4" style={{ background: 'var(--accent-color-light, #eff6ff)' }}>
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                            <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--accent-color)' }}>
                                    Download template terlebih dahulu
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--accent-color)', opacity: 0.8 }}>
                                    Template sudah termasuk kolom data orang tua (Ayah & Ibu) untuk memudahkan input sekaligus.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-white text-sm rounded-lg transition-colors"
                                    style={{ background: 'var(--accent-color)' }}
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="form-label">Pilih File Excel</label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${importFile
                                ? 'border-green-300 bg-green-50'
                                : ''
                                }`}
                            style={!importFile ? { borderColor: 'var(--border-color)' } : undefined}
                            onClick={() => fileInputRef.current?.click()}
                            onMouseEnter={(e) => { if (!importFile) e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                            onMouseLeave={(e) => { if (!importFile) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {importFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle size={32} className="text-green-600" />
                                    <p className="font-medium text-gray-900 dark:text-white">{importFile.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(importFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload size={32} className="text-gray-400" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Klik untuk pilih file atau drag & drop
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Format: .xlsx, .xls, .csv
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-slate-700">
                    <button type="button" onClick={closeImportModal} className="btn btn-secondary flex-1">
                        Batal
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing || !importFile}
                        className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Mengimpor...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                <span>Import Data</span>
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            {/* Floating Action Bar */}
            {showFloatingBar && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
                    <div className={`rounded-full shadow-2xl border px-6 py-3 flex items-center gap-4 pointer-events-auto ${isClosingBar ? 'animate-float-down-center' : 'animate-float-up-center'}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-2 pr-4 border-r" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-color-light)' }}>
                                <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>{selectedStudents.length}</span>
                            </div>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>dipilih</span>
                        </div>

                        <button
                            onClick={() => {
                                // Export selected students to CSV
                                const selectedData = students.filter(s => selectedStudents.includes(s.id));
                                const csvContent = [
                                    ['RFID UID', 'NIS', 'Nama', 'Kelas', 'Kategori'],
                                    ...selectedData.map(s => [
                                        s.rfid_uid,
                                        s.nis,
                                        s.name,
                                        s.class?.name || '',
                                        s.category?.name || ''
                                    ])
                                ].map(row => row.join(',')).join('\n');

                                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `siswa_export_${new Date().toISOString().slice(0, 10)}.csv`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                toast.success(`${selectedData.length} siswa berhasil diexport`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                        >
                            <Download size={18} />
                            <span className="text-sm font-medium">Export</span>
                        </button>

                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                            <Trash2 size={18} />
                            <span className="text-sm font-medium">Hapus</span>
                        </button>

                        <button
                            onClick={clearSelection}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X size={18} />
                            <span className="text-sm font-medium">Batal</span>
                        </button>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}
