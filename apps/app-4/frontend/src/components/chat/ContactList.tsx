import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, UserPlus, Users, Building2, Star,
    Check, X, Loader2, Filter, ChevronRight
} from 'lucide-react';

interface Contact {
    id: number;
    name: string;
    role: 'doctor' | 'patient' | 'clinic';
    specialty?: string;
    avatar?: string;
    online?: boolean;
    isFollowing?: boolean;
    rating?: number;
    lastSeen?: Date;
}

interface ContactListProps {
    contacts: Contact[];
    onSelectContact: (contact: Contact) => void;
    onAddContact?: (contactId: number) => void;
    onRemoveContact?: (contactId: number) => void;
    onFollowClinic?: (clinicId: number) => void;
    loading?: boolean;
}

export function ContactList({
    contacts,
    onSelectContact,
    onAddContact,
    onRemoveContact,
    onFollowClinic,
    loading = false
}: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'doctors' | 'clinics' | 'online'>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        switch (filter) {
            case 'doctors': return contact.role === 'doctor';
            case 'clinics': return contact.role === 'clinic';
            case 'online': return contact.online;
            default: return true;
        }
    });

    const doctors = filteredContacts.filter(c => c.role === 'doctor');
    const clinics = filteredContacts.filter(c => c.role === 'clinic');

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const formatLastSeen = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `há ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `há ${hours}h`;
        return `há ${Math.floor(hours / 24)}d`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Contatos
                    </h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                    >
                        <UserPlus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar contatos..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'Todos' },
                        { key: 'doctors', label: 'Médicos', icon: Users },
                        { key: 'clinics', label: 'Clínicas', icon: Building2 },
                        { key: 'online', label: 'Online' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filter === f.key
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <Users className="w-12 h-12 mb-3 opacity-50" />
                        <p>Nenhum contato encontrado</p>
                    </div>
                ) : (
                    <>
                        {/* Doctors Section */}
                        {doctors.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Médicos ({doctors.length})
                                    </p>
                                </div>
                                {doctors.map(contact => (
                                    <ContactItem
                                        key={contact.id}
                                        contact={contact}
                                        onSelect={() => onSelectContact(contact)}
                                        onRemove={() => onRemoveContact?.(contact.id)}
                                        getInitials={getInitials}
                                        formatLastSeen={formatLastSeen}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Clinics Section */}
                        {clinics.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Clínicas ({clinics.length})
                                    </p>
                                </div>
                                {clinics.map(contact => (
                                    <ContactItem
                                        key={contact.id}
                                        contact={contact}
                                        onSelect={() => onSelectContact(contact)}
                                        onFollow={() => onFollowClinic?.(contact.id)}
                                        getInitials={getInitials}
                                        formatLastSeen={formatLastSeen}
                                        isClinic
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Contact Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddContactModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={onAddContact}
                        onFollow={onFollowClinic}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Contact Item Component
function ContactItem({
    contact,
    onSelect,
    onRemove,
    onFollow,
    getInitials,
    formatLastSeen,
    isClinic = false
}: {
    contact: Contact;
    onSelect: () => void;
    onRemove?: () => void;
    onFollow?: () => void;
    getInitials: (name: string) => string;
    formatLastSeen: (date?: Date) => string;
    isClinic?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 group"
            onClick={onSelect}
        >
            {/* Avatar */}
            <div className="relative">
                {contact.avatar ? (
                    <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        isClinic 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}>
                        {isClinic ? <Building2 className="w-6 h-6" /> : getInitials(contact.name)}
                    </div>
                )}
                {contact.online && !isClinic && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {contact.name}
                    </p>
                    {contact.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs">{contact.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                    {contact.specialty || (isClinic ? 'Clínica' : '')}
                </p>
                {!isClinic && !contact.online && contact.lastSeen && (
                    <p className="text-xs text-gray-400">
                        Visto {formatLastSeen(contact.lastSeen)}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isClinic ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFollow?.();
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            contact.isFollowing
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-cyan-500 text-white hover:bg-cyan-600'
                        }`}
                    >
                        {contact.isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove?.();
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
        </motion.div>
    );
}

// Add Contact Modal
function AddContactModal({
    onClose,
    onAdd,
    onFollow
}: {
    onClose: () => void;
    onAdd?: (contactId: number) => void;
    onFollow?: (clinicId: number) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'doctors' | 'clinics'>('doctors');
    const [results, setResults] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        
        // Simulated search - replace with actual API call
        setTimeout(() => {
            setResults([
                {
                    id: 100,
                    name: searchType === 'doctors' ? 'Dr. Carlos Mendes' : 'Clínica São Lucas',
                    role: searchType === 'doctors' ? 'doctor' : 'clinic',
                    specialty: searchType === 'doctors' ? 'Cardiologia' : 'Multiclínica',
                    rating: 4.8,
                    online: true
                },
                {
                    id: 101,
                    name: searchType === 'doctors' ? 'Dra. Ana Paula' : 'Hospital Santa Maria',
                    role: searchType === 'doctors' ? 'doctor' : 'clinic',
                    specialty: searchType === 'doctors' ? 'Dermatologia' : 'Hospital Geral',
                    rating: 4.9,
                    online: false
                }
            ]);
            setLoading(false);
        }, 500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Adicionar Contato
                        </h3>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Type Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSearchType('doctors')}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                searchType === 'doctors'
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Médicos
                        </button>
                        <button
                            onClick={() => setSearchType('clinics')}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                searchType === 'clinics'
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <Building2 className="w-4 h-4 inline mr-2" />
                            Clínicas
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={`Buscar ${searchType === 'doctors' ? 'médicos' : 'clínicas'}...`}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Busque por {searchType === 'doctors' ? 'médicos' : 'clínicas'}</p>
                        </div>
                    ) : (
                        results.map(result => (
                            <div
                                key={result.id}
                                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                    result.role === 'clinic'
                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                }`}>
                                    {result.role === 'clinic' ? (
                                        <Building2 className="w-6 h-6" />
                                    ) : (
                                        result.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {result.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{result.specialty}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (result.role === 'clinic') {
                                            onFollow?.(result.id);
                                        } else {
                                            onAdd?.(result.id);
                                        }
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600"
                                >
                                    {result.role === 'clinic' ? 'Seguir' : 'Adicionar'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ContactList;
