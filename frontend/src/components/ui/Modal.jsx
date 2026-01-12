import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}) {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
                document.body.style.overflow = '';
            }, 200);
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200);
    };

    const handleBackdropClick = (e) => {
        // Close when clicking on backdrop (outside modal content)
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!shouldRender) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-4xl',
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={`relative w-full ${sizeClasses[size]} ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {title}
                        </h2>
                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full transition-all hover:scale-110"
                                style={{
                                    background: 'var(--bg-page)',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body - scrollable */}
                <div style={{ overflow: 'auto', flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
