import React, { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

// Generate barcode pattern from RFID
const generateBarcodePattern = (rfid) => {
    if (!rfid) return Array(25).fill({ width: 2 });
    const str = String(rfid);
    const pattern = [];
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        pattern.push({ width: 1 + (charCode % 2) });
        pattern.push({ width: 1, space: true });
    }
    while (pattern.length < 40) {
        pattern.push({ width: 1 + (pattern.length % 2) });
        pattern.push({ width: 1, space: true });
    }
    return pattern;
};

const StudentIdCard = forwardRef(({ student, settings, onDownload }, ref) => {
    const cardRef = useRef(null);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [photoLoaded, setPhotoLoaded] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [photoError, setPhotoError] = useState(false);

    const photoUrl = student.photo ? `${API_URL}/storage/${student.photo}` : null;
    const logoUrl = settings?.institution_logo ? `${API_URL}/storage/${settings.institution_logo}` : null;
    const institutionName = settings?.institution_name || 'Sekolah';
    const rfidNumber = student.rfid_card_number || student.rfid_uid || '';
    const barcodePattern = generateBarcodePattern(rfidNumber);

    const downloadCard = async () => {
        if (!cardRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `ID_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            if (onDownload) onDownload();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useImperativeHandle(ref, () => ({ downloadCard }));

    return (
        <div className="flex flex-col items-center gap-4 p-4 w-full">
            {/* Card Container - Standard ID Card Ratio (85.6mm x 53.98mm = ~1.586:1) */}
            <div
                ref={cardRef}
                style={{
                    width: '340px',
                    height: '214px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '10px',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                }}
            >
                {/* Top accent bar - gradient */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
                }} />

                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px 8px',
                    gap: '10px',
                    borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
                }}>
                    {/* Logo */}
                    <div style={{ width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {logoUrl && !logoError ? (
                            <img
                                src={logoUrl}
                                alt=""
                                style={{ width: '36px', height: '36px', objectFit: 'contain', display: logoLoaded ? 'block' : 'none' }}
                                onLoad={() => setLogoLoaded(true)}
                                onError={() => setLogoError(true)}
                            />
                        ) : null}
                        {(!logoUrl || logoError || !logoLoaded) && <span style={{ fontSize: '28px' }}>🎓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#1e40af',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            lineHeight: '1.3',
                        }}>
                            {institutionName}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '500' }}>Kartu Identitas Siswa</div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', padding: '12px 16px', gap: '14px' }}>
                    {/* Photo */}
                    <div style={{
                        width: '70px',
                        height: '85px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #cbd5e1',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}>
                        {photoUrl && !photoError ? (
                            <img
                                src={photoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: photoLoaded ? 'block' : 'none' }}
                                onLoad={() => setPhotoLoaded(true)}
                                onError={() => setPhotoError(true)}
                            />
                        ) : null}
                        {(!photoUrl || photoError || !photoLoaded) && (
                            <div style={{
                                width: '100%', height: '100%',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', fontWeight: '700', color: 'white',
                            }}>
                                {student.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {/* Student Name */}
                        <div style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#0f172a',
                            marginBottom: '8px',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {student.name}
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                                <span style={{ width: '45px', color: '#64748b', fontWeight: '600' }}>NIS</span>
                                <span style={{ color: '#0f172a', fontWeight: '600' }}>{student.nis}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                                <span style={{ width: '45px', color: '#64748b', fontWeight: '600' }}>Kelas</span>
                                <span style={{ color: '#0f172a', fontWeight: '600' }}>{student.class?.name || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                                <span style={{ width: '45px', color: '#64748b', fontWeight: '600' }}>RFID</span>
                                <span style={{ color: '#0f172a', fontWeight: '600', fontFamily: 'monospace' }}>{rfidNumber || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barcode Footer */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '6px 16px 10px',
                    background: 'linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,1) 100%)',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {/* Barcode */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '20px' }}>
                        {barcodePattern.slice(0, 50).map((bar, i) => (
                            <div key={i} style={{
                                width: `${bar.width}px`,
                                height: bar.space ? '0' : `${12 + (i % 3) * 3}px`,
                                backgroundColor: bar.space ? 'transparent' : '#1e293b',
                            }} />
                        ))}
                    </div>
                    <div style={{
                        fontSize: '8px',
                        color: '#64748b',
                        marginTop: '3px',
                        fontFamily: 'monospace',
                        letterSpacing: '2px',
                        fontWeight: '500',
                    }}>
                        {rfidNumber || 'NO-RFID'}
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <button onClick={downloadCard} className="btn btn-primary flex items-center gap-2">
                <Download size={18} />
                Download Kartu
            </button>
        </div>
    );
});

StudentIdCard.displayName = 'StudentIdCard';
export default StudentIdCard;
