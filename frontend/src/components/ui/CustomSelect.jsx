import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function CustomSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Pilih opsi...',
    searchable = false,
    disabled = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Find selected option
    const selectedOption = options.find(opt =>
        (typeof opt === 'object' ? opt.value : opt) === value
    );

    const displayValue = selectedOption
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : placeholder;

    // Filter options based on search
    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'object' ? opt.label : opt;
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Calculate dropdown position with auto-flip
    const updateDropdownPosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 250; // Approximate max height of dropdown
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Flip to top if not enough space below and more space above
            const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

            setDropdownPosition({
                top: shouldFlipUp ? null : rect.bottom + 8,
                bottom: shouldFlipUp ? viewportHeight - rect.top + 8 : null,
                left: rect.left,
                width: rect.width,
                flipUp: shouldFlipUp,
            });
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Check if click is inside container OR inside dropdown
            const isInsideContainer = containerRef.current && containerRef.current.contains(e.target);
            const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);

            if (!isInsideContainer && !isInsideDropdown) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input when opened and update position
    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
            if (searchable && searchInputRef.current) {
                setTimeout(() => searchInputRef.current?.focus(), 10);
            }
        }
    }, [isOpen, searchable]);

    // Update position on scroll/resize
    useEffect(() => {
        if (isOpen) {
            const handleUpdate = () => updateDropdownPosition();
            window.addEventListener('scroll', handleUpdate, true);
            window.addEventListener('resize', handleUpdate);
            return () => {
                window.removeEventListener('scroll', handleUpdate, true);
                window.removeEventListener('resize', handleUpdate);
            };
        }
    }, [isOpen]);

    const handleSelect = (opt) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
        if (e.key === 'Enter' && filteredOptions.length === 1) {
            handleSelect(filteredOptions[0]);
        }
    };

    const handleToggle = () => {
        if (!disabled) {
            if (!isOpen) {
                updateDropdownPosition();
            }
            setIsOpen(!isOpen);
        }
    };

    // Portal dropdown
    const dropdown = isOpen && createPortal(
        <div
            ref={dropdownRef}
            className={`custom-select-dropdown ${dropdownPosition.flipUp ? 'flip-up' : ''}`}
            style={{
                position: 'fixed',
                ...(dropdownPosition.flipUp
                    ? { bottom: dropdownPosition.bottom }
                    : { top: dropdownPosition.top }
                ),
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: 250,
                zIndex: 9999,
            }}
        >
            {/* Search */}
            {searchable && (
                <div className="custom-select-search">
                    <Search size={16} className="custom-select-search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Cari..."
                        className="custom-select-search-input"
                    />
                </div>
            )}

            {/* Options */}
            <div className="custom-select-options">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt, index) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = optValue === value;

                        return (
                            <button
                                key={optValue ?? index}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(opt)}
                                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                            >
                                <span>{optLabel}</span>
                                {isSelected && <Check size={16} className="custom-select-check" />}
                            </button>
                        );
                    })
                ) : (
                    <div className="custom-select-empty">
                        Tidak ada opsi
                    </div>
                )}
            </div>
        </div>,
        document.body
    );

    return (
        <div ref={containerRef} className={`custom-select-container ${className}`}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
            >
                <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {displayValue}
                </span>
                <ChevronDown
                    size={18}
                    className={`custom-select-arrow ${isOpen ? 'rotate' : ''}`}
                />
            </button>

            {/* Dropdown rendered via portal */}
            {dropdown}
        </div>
    );
}
