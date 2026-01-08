import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ trigger, children, align = 'right' }) {
    const alignClasses = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button as={Fragment}>
                {trigger}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95 -translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 -translate-y-2"
            >
                <Menu.Items
                    className={`absolute ${alignClasses[align]} mt-2 min-w-[12rem] origin-top-right 
                        rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl 
                        border border-white/50 dark:border-gray-700/50
                        shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden`}
                >
                    <div className="py-1">
                        {children}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

// Dropdown Item component
export function DropdownItem({ children, onClick, icon: Icon, danger = false }) {
    return (
        <Menu.Item>
            {({ active }) => (
                <button
                    onClick={onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150
                        ${active
                            ? danger
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : danger
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300'
                        }`}
                >
                    {Icon && <Icon size={18} />}
                    {children}
                </button>
            )}
        </Menu.Item>
    );
}

// Dropdown Divider
export function DropdownDivider() {
    return <div className="my-1 h-px bg-gray-200/50 dark:bg-gray-700/50" />;
}
