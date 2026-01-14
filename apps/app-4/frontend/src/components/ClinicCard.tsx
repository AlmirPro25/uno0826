import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    MapPin, Star, Clock, Phone, Globe,
    Users, Award, ChevronRight, Heart,
    Navigation, Calendar
} from 'lucide-react';

interface Clinic {
    id: number;
    name: string;
    address: string;
    city: string;
    phone?: string;
    website?: string;
    rating: number;
    reviewCount: number;
    specialties: string[];
    distance?: number;
    isPremium?: boolean;
    isFeatured?: boolean;
    openNow?: boolean;
    openHours?: string;
    doctorCount?: number;
    imageUrl?: string;
}

interface ClinicCardProps {
    clinic: Clinic;
    variant?: 'default' | 'compact' | 'featured';
    onSchedule?: (clinicId: number) => void;
    onFavorite?: (clinicId: number) => void;
}

export function ClinicCard({ 
    clinic, 
    variant = 'default',
    onSchedule,
    onFavorite
}: ClinicCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        onFavorite?.(clinic.id);
    };

    const formatDistance = (distance?: number) => {
        if (!distance) return null;
        if (distance < 1) return `${Math.round(distance * 1000)}m`;
        return `${distance.toFixed(1)}km`;
    };

    if (variant === 'compact') {
        return (
            <Link href={`/clinics/${clinic.id}`}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-all cursor-pointer"
                >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {clinic.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                {clinic.name}
                            </p>
                            {clinic.isPremium && (
                                <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{clinic.rating.toFixed(1)}</span>
                            {clinic.distance && (
                                <>
                                    <span>•</span>
                                    <span>{formatDistance(clinic.distance)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
            </Link>
        );
    }

    if (variant === 'featured') {
        return (
            <Link href={`/clinics/${clinic.id}`}>
                <motion.div
                    whileHover={{ y: -4 }}
                    className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl overflow-hidden text-white"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>

                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Award className="w-5 h-5 text-amber-300" />
                                    <span className="text-xs font-medium text-cyan-100">Destaque</span>
                                </div>
                                <h3 className="text-xl font-bold">{clinic.name}</h3>
                            </div>
                            <button
                                onClick={handleFavorite}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm text-cyan-100">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                                <span className="font-medium text-white">{clinic.rating.toFixed(1)}</span>
                                <span>({clinic.reviewCount})</span>
                            </div>
                            {clinic.distance && (
                                <div className="flex items-center gap-1">
                                    <Navigation className="w-4 h-4" />
                                    <span>{formatDistance(clinic.distance)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-cyan-100 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{clinic.address}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {clinic.specialties.slice(0, 3).map((spec, i) => (
                                <span 
                                    key={i}
                                    className="px-2 py-1 bg-white/20 rounded-full text-xs"
                                >
                                    {spec}
                                </span>
                            ))}
                            {clinic.specialties.length > 3 && (
                                <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                    +{clinic.specialties.length - 3}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onSchedule?.(clinic.id);
                            }}
                            className="w-full py-3 bg-white text-cyan-600 rounded-xl font-medium hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Agendar Consulta
                        </button>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Default variant
    return (
        <Link href={`/clinics/${clinic.id}`}>
            <motion.div
                whileHover={{ y: -2 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                    clinic.isPremium 
                        ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-cyan-500'
                }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl ${
                                clinic.isPremium 
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                                    : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                            }`}>
                                {clinic.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {clinic.name}
                                    </h3>
                                    {clinic.isPremium && (
                                        <Award className="w-4 h-4 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {clinic.rating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-500">({clinic.reviewCount})</span>
                                    </div>
                                    {clinic.openNow !== undefined && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                            clinic.openNow 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {clinic.openNow ? 'Aberto' : 'Fechado'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleFavorite}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <Heart className={`w-5 h-5 ${
                                isFavorite 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-400'
                            }`} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{clinic.address}, {clinic.city}</span>
                        </div>
                        {clinic.openHours && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{clinic.openHours}</span>
                            </div>
                        )}
                        {clinic.distance && (
                            <div className="flex items-center gap-2">
                                <Navigation className="w-4 h-4" />
                                <span>{formatDistance(clinic.distance)} de distância</span>
                            </div>
                        )}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {clinic.specialties.slice(0, 4).map((spec, i) => (
                            <span 
                                key={i}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs"
                            >
                                {spec}
                            </span>
                        ))}
                        {clinic.specialties.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg text-xs">
                                +{clinic.specialties.length - 4}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    {clinic.doctorCount && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Users className="w-4 h-4" />
                            <span>{clinic.doctorCount} médicos disponíveis</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onSchedule?.(clinic.id);
                        }}
                        className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Agendar
                    </button>
                    {clinic.phone && (
                        <a
                            href={`tel:${clinic.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                        >
                            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </a>
                    )}
                    {clinic.website && (
                        <a
                            href={clinic.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                        >
                            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </a>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}

export default ClinicCard;
