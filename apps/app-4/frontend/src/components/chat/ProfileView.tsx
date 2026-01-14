import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    X, Camera, Star, MapPin, Phone, Mail, Globe,
    Calendar, Clock, Award, Users, MessageSquare,
    Video, Heart, Share2, Flag, Ban, Building2,
    Stethoscope, GraduationCap, FileText
} from 'lucide-react';

interface ProfileData {
    id: number;
    name: string;
    role: 'doctor' | 'patient' | 'clinic';
    avatar?: string;
    coverImage?: string;
    specialty?: string;
    bio?: string;
    rating?: number;
    reviewCount?: number;
    online?: boolean;
    lastSeen?: Date;
    
    // Doctor specific
    crm?: string;
    experience?: number;
    education?: string[];
    languages?: string[];
    consultationPrice?: number;
    
    // Clinic specific
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
    openHours?: string;
    doctorCount?: number;
    specialties?: string[];
    
    // Stats
    totalConsultations?: number;
    totalPatients?: number;
    responseTime?: string;
    
    // Social
    isFollowing?: boolean;
    isContact?: boolean;
    mutualContacts?: number;
}

interface ProfileViewProps {
    profile: ProfileData;
    onClose: () => void;
    onMessage?: () => void;
    onCall?: (type: 'audio' | 'video') => void;
    onFollow?: () => void;
    onAddContact?: () => void;
    onSchedule?: () => void;
    onReport?: () => void;
    onBlock?: () => void;
    isOwnProfile?: boolean;
    onEditProfile?: () => void;
}

export function ProfileView({
    profile,
    onClose,
    onMessage,
    onCall,
    onFollow,
    onAddContact,
    onSchedule,
    onReport,
    onBlock,
    isOwnProfile = false,
    onEditProfile
}: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'photos'>('info');

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const formatLastSeen = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'online agora';
        if (minutes < 60) return `visto há ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `visto há ${hours}h`;
        return `visto há ${Math.floor(hours / 24)}d`;
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
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Cover & Avatar */}
                <div className="relative">
                    {/* Cover Image */}
                    <div className={`h-32 ${
                        profile.coverImage 
                            ? '' 
                            : profile.role === 'clinic'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    }`}>
                        {profile.coverImage && (
                            <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Avatar */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="relative">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                                />
                            ) : (
                                <div className={`w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-white text-2xl font-bold ${
                                    profile.role === 'clinic'
                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                }`}>
                                    {profile.role === 'clinic' ? (
                                        <Building2 className="w-10 h-10" />
                                    ) : (
                                        getInitials(profile.name)
                                    )}
                                </div>
                            )}
                            {profile.online && (
                                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-3 border-white dark:border-gray-800 rounded-full" />
                            )}
                            {isOwnProfile && (
                                <button className="absolute bottom-0 right-0 p-1.5 bg-cyan-500 rounded-full text-white">
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-14 px-6 pb-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile.name}
                    </h2>
                    
                    {profile.specialty && (
                        <p className="text-cyan-600 font-medium mt-1">
                            {profile.specialty}
                        </p>
                    )}

                    {/* Rating */}
                    {profile.rating && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {profile.rating.toFixed(1)}
                            </span>
                            {profile.reviewCount && (
                                <span className="text-gray-500 text-sm">
                                    ({profile.reviewCount} avaliações)
                                </span>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    <p className="text-sm text-gray-500 mt-1">
                        {profile.online ? (
                            <span className="text-emerald-500">● Online</span>
                        ) : (
                            formatLastSeen(profile.lastSeen)
                        )}
                    </p>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                            {profile.bio}
                        </p>
                    )}

                    {/* Mutual Contacts */}
                    {profile.mutualContacts && profile.mutualContacts > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                            <Users className="w-3 h-3 inline mr-1" />
                            {profile.mutualContacts} contatos em comum
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-4">
                    {isOwnProfile ? (
                        <button
                            onClick={onEditProfile}
                            className="w-full py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600"
                        >
                            Editar Perfil
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={onMessage}
                                className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Mensagem
                            </button>
                            {profile.role === 'clinic' ? (
                                <button
                                    onClick={onFollow}
                                    className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${
                                        profile.isFollowing
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            : 'bg-purple-500 text-white hover:bg-purple-600'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${profile.isFollowing ? 'fill-current' : ''}`} />
                                    {profile.isFollowing ? 'Seguindo' : 'Seguir'}
                                </button>
                            ) : (
                                <button
                                    onClick={onAddContact}
                                    className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${
                                        profile.isContact
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    {profile.isContact ? 'Contato' : 'Adicionar'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Secondary Actions */}
                    {!isOwnProfile && (
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={() => onCall?.('audio')}
                                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onCall?.('video')}
                                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                            {profile.role === 'doctor' && (
                                <button
                                    onClick={onSchedule}
                                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <Calendar className="w-5 h-5" />
                                </button>
                            )}
                            <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {['info', 'reviews', 'photos'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'info' ? 'Informações' : tab === 'reviews' ? 'Avaliações' : 'Fotos'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-60 overflow-y-auto">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {/* Doctor Info */}
                            {profile.role === 'doctor' && (
                                <>
                                    {profile.crm && (
                                        <InfoItem icon={FileText} label="CRM" value={profile.crm} />
                                    )}
                                    {profile.experience && (
                                        <InfoItem icon={Award} label="Experiência" value={`${profile.experience} anos`} />
                                    )}
                                    {profile.consultationPrice && (
                                        <InfoItem icon={Stethoscope} label="Consulta" value={`R$ ${profile.consultationPrice}`} />
                                    )}
                                    {profile.education && profile.education.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Formação</p>
                                                {profile.education.map((edu, i) => (
                                                    <p key={i} className="text-sm text-gray-900 dark:text-white">{edu}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Clinic Info */}
                            {profile.role === 'clinic' && (
                                <>
                                    {profile.address && (
                                        <InfoItem icon={MapPin} label="Endereço" value={`${profile.address}, ${profile.city}`} />
                                    )}
                                    {profile.phone && (
                                        <InfoItem icon={Phone} label="Telefone" value={profile.phone} />
                                    )}
                                    {profile.email && (
                                        <InfoItem icon={Mail} label="Email" value={profile.email} />
                                    )}
                                    {profile.website && (
                                        <InfoItem icon={Globe} label="Website" value={profile.website} />
                                    )}
                                    {profile.openHours && (
                                        <InfoItem icon={Clock} label="Horário" value={profile.openHours} />
                                    )}
                                    {profile.doctorCount && (
                                        <InfoItem icon={Users} label="Médicos" value={`${profile.doctorCount} disponíveis`} />
                                    )}
                                    {profile.specialties && profile.specialties.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <Stethoscope className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Especialidades</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {profile.specialties.map((spec, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-xs">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Stats */}
                            {(profile.totalConsultations || profile.totalPatients || profile.responseTime) && (
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {profile.totalConsultations && (
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {profile.totalConsultations}
                                            </p>
                                            <p className="text-xs text-gray-500">Consultas</p>
                                        </div>
                                    )}
                                    {profile.totalPatients && (
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {profile.totalPatients}
                                            </p>
                                            <p className="text-xs text-gray-500">Pacientes</p>
                                        </div>
                                    )}
                                    {profile.responseTime && (
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {profile.responseTime}
                                            </p>
                                            <p className="text-xs text-gray-500">Resposta</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="text-center py-8 text-gray-500">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma avaliação ainda</p>
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="text-center py-8 text-gray-500">
                            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma foto</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!isOwnProfile && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-6">
                        <button
                            onClick={onReport}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600"
                        >
                            <Flag className="w-4 h-4" />
                            Denunciar
                        </button>
                        <button
                            onClick={onBlock}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600"
                        >
                            <Ban className="w-4 h-4" />
                            Bloquear
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// Info Item Component
function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-400" />
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

export default ProfileView;
