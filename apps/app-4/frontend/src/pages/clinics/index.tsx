import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Input } from '@/components/ui/shadcn/Input';
import { Button } from '@/components/ui/shadcn/Button';
import { MapPin, Phone, Search, Navigation, Star, Shield, Loader2, Building2, Filter } from 'lucide-react';
import { ClinicCard } from '@/components/ClinicCard';
import { 
    listClinics, 
    findNearbyClinics, 
    searchClinics, 
    getPremiumClinics,
    Clinic, 
    parseSpecialties,
    calculateDistance,
    formatDistance
} from '@/api/clinics';

const LIBRARIES: ("places" | "geometry")[] = ["places"];

// Fallback mock data for when backend is not available
const MOCK_CLINICS: Clinic[] = [
    {
        id: 1,
        name: "MediSync Centro",
        description: "Clínica completa no coração de São Paulo",
        phone: "(11) 3333-4444",
        email: "centro@medisync.com",
        address: "Av. Paulista, 1000 - Bela Vista",
        city: "São Paulo",
        state: "SP",
        zip_code: "01310-100",
        neighborhood: "Bela Vista",
        latitude: -23.561414,
        longitude: -46.655881,
        specialties: '["Cardiologia", "Clínico Geral", "Pediatria"]',
        accepts_insurance: true,
        is_premium: true,
        featured_order: 10,
        average_rating: 4.8,
        total_reviews: 127,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: "MediSync Sul",
        description: "Especializada em ortopedia e fisioterapia",
        phone: "(11) 5555-6666",
        email: "sul@medisync.com",
        address: "Rua Domingos de Morais, 2564 - Vila Mariana",
        city: "São Paulo",
        state: "SP",
        zip_code: "04036-100",
        neighborhood: "Vila Mariana",
        latitude: -23.598687,
        longitude: -46.636605,
        specialties: '["Ortopedia", "Fisioterapia", "Reumatologia"]',
        accepts_insurance: true,
        is_premium: false,
        featured_order: 0,
        average_rating: 4.5,
        total_reviews: 89,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        name: "MediSync Pinheiros",
        description: "Dermatologia e estética avançada",
        phone: "(11) 3030-2020",
        email: "pinheiros@medisync.com",
        address: "Av. Brigadeiro Faria Lima, 2277 - Pinheiros",
        city: "São Paulo",
        state: "SP",
        zip_code: "01452-000",
        neighborhood: "Pinheiros",
        latitude: -23.569420,
        longitude: -46.693439,
        specialties: '["Dermatologia", "Estética", "Cirurgia Plástica"]',
        accepts_insurance: true,
        is_premium: true,
        featured_order: 5,
        average_rating: 4.9,
        total_reviews: 203,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export default function ClinicsPage() {
    const router = useRouter();
    const { specialty, lat, lng } = router.query;

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
        libraries: LIBRARIES,
    });

    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [premiumClinics, setPremiumClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");

    // Load clinics on mount
    useEffect(() => {
        loadClinics();
        loadPremiumClinics();
    }, []);

    // Handle query params (from triage redirect)
    useEffect(() => {
        if (specialty) {
            setSelectedSpecialty(specialty as string);
        }
        if (lat && lng) {
            setUserLocation({
                lat: parseFloat(lat as string),
                lng: parseFloat(lng as string)
            });
        }
    }, [specialty, lat, lng]);

    // Reload when location or specialty changes
    useEffect(() => {
        if (userLocation || selectedSpecialty) {
            loadClinics();
        }
    }, [userLocation, selectedSpecialty]);

    const loadClinics = async () => {
        try {
            setLoading(true);
            let data: Clinic[];

            if (userLocation) {
                // Find nearby clinics
                data = await findNearbyClinics(
                    userLocation.lat,
                    userLocation.lng,
                    15, // 15km radius
                    selectedSpecialty || undefined,
                    50
                );
            } else if (searchTerm) {
                const result = await searchClinics(searchTerm);
                data = result.clinics;
            } else {
                const result = await listClinics(1, 50);
                data = result.clinics;
            }

            setClinics(data.length > 0 ? data : MOCK_CLINICS);
        } catch (error) {
            console.warn('Using mock data:', error);
            setClinics(MOCK_CLINICS);
        } finally {
            setLoading(false);
        }
    };

    const loadPremiumClinics = async () => {
        try {
            const data = await getPremiumClinics(5);
            setPremiumClinics(data);
        } catch {
            setPremiumClinics(MOCK_CLINICS.filter(c => c.is_premium));
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadClinics();
            return;
        }
        try {
            setLoading(true);
            const result = await searchClinics(searchTerm);
            setClinics(result.clinics.length > 0 ? result.clinics : MOCK_CLINICS);
        } catch {
            setClinics(MOCK_CLINICS);
        } finally {
            setLoading(false);
        }
    };

    const handleGetUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    alert("Não foi possível obter sua localização.");
                }
            );
        }
    };

    const center = useMemo(() => {
        if (userLocation) return userLocation;
        if (clinics.length > 0) return { lat: clinics[0].latitude, lng: clinics[0].longitude };
        return { lat: -23.55052, lng: -46.633308 }; // São Paulo default
    }, [userLocation, clinics]);

    const filteredClinics = useMemo(() => {
        if (!searchTerm) return clinics;
        const term = searchTerm.toLowerCase();
        return clinics.filter(clinic =>
            clinic.name.toLowerCase().includes(term) ||
            parseSpecialties(clinic.specialties).some(s => s.toLowerCase().includes(term)) ||
            clinic.city.toLowerCase().includes(term) ||
            clinic.neighborhood.toLowerCase().includes(term)
        );
    }, [clinics, searchTerm]);

    const getDistanceFromUser = (clinic: Clinic): string | null => {
        if (!userLocation) return null;
        const dist = calculateDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude);
        return formatDistance(dist);
    };

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Head>
                <title>Rede Credenciada - MediSync</title>
            </Head>

            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <Building2 className="text-blue-600 w-6 h-6" />
                    <h1 className="text-xl font-bold text-gray-800">Rede de Clínicas</h1>
                    {selectedSpecialty && (
                        <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {selectedSpecialty}
                        </span>
                    )}
                </div>
                <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Sidebar List */}
                <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r overflow-y-auto flex flex-col z-20 shadow-lg">
                    {/* Search & Filters */}
                    <div className="p-4 border-b space-y-3 sticky top-0 bg-white z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por nome ou especialidade..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                className="flex-1 flex items-center gap-2 text-sm"
                                onClick={handleGetUserLocation}
                            >
                                <Navigation className="w-4 h-4" />
                                Minha localização
                            </Button>
                            {selectedSpecialty && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSpecialty("")}
                                    className="text-gray-500"
                                >
                                    <Filter className="w-4 h-4 mr-1" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Premium Clinics Banner */}
                    {premiumClinics.length > 0 && !searchTerm && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                            <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                Clínicas em Destaque
                            </h3>
                            <div className="space-y-3">
                                {premiumClinics.slice(0, 2).map(clinic => {
                                    const specialties = parseSpecialties(clinic.specialties);
                                    const distanceKm = userLocation 
                                        ? calculateDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude)
                                        : undefined;
                                    
                                    return (
                                        <ClinicCard
                                            key={clinic.id}
                                            clinic={{
                                                id: clinic.id,
                                                name: clinic.name,
                                                address: clinic.address,
                                                city: clinic.city,
                                                phone: clinic.phone,
                                                website: clinic.website,
                                                rating: clinic.average_rating,
                                                reviewCount: clinic.total_reviews,
                                                specialties: specialties,
                                                distance: distanceKm,
                                                isPremium: true,
                                                isFeatured: true,
                                            }}
                                            variant="featured"
                                            onSchedule={(clinicId) => router.push(`/clinics/${clinicId}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Clinics List */}
                    <div className="p-4 space-y-4 flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredClinics.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                Nenhuma clínica encontrada.
                            </div>
                        ) : (
                            filteredClinics.map(clinic => {
                                const distance = getDistanceFromUser(clinic);
                                const distanceKm = userLocation 
                                    ? calculateDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude)
                                    : undefined;
                                const specialties = parseSpecialties(clinic.specialties);
                                
                                return (
                                    <div 
                                        key={clinic.id}
                                        onClick={() => setSelectedClinic(clinic)}
                                        className={selectedClinic?.id === clinic.id ? 'ring-2 ring-cyan-500 rounded-2xl' : ''}
                                    >
                                        <ClinicCard
                                            clinic={{
                                                id: clinic.id,
                                                name: clinic.name,
                                                address: clinic.address,
                                                city: clinic.city,
                                                phone: clinic.phone,
                                                website: clinic.website,
                                                rating: clinic.average_rating,
                                                reviewCount: clinic.total_reviews,
                                                specialties: specialties,
                                                distance: distanceKm,
                                                isPremium: clinic.is_premium,
                                                isFeatured: clinic.featured_order > 0,
                                                openNow: undefined,
                                                openHours: undefined,
                                                doctorCount: undefined,
                                            }}
                                            variant="compact"
                                            onSchedule={(clinicId) => router.push(`/clinics/${clinicId}`)}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 w-full h-full relative">
                    <GoogleMap
                        zoom={13}
                        center={selectedClinic ? { lat: selectedClinic.latitude, lng: selectedClinic.longitude } : center}
                        mapContainerClassName="w-full h-full"
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                        }}
                    >
                        {/* User Location Marker */}
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                icon={{
                                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                }}
                            />
                        )}

                        {/* Clinic Markers */}
                        {filteredClinics.map(clinic => (
                            <Marker
                                key={clinic.id}
                                position={{ lat: clinic.latitude, lng: clinic.longitude }}
                                onClick={() => setSelectedClinic(clinic)}
                                icon={clinic.is_premium ? {
                                    url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                                } : undefined}
                            />
                        ))}

                        {/* Info Window */}
                        {selectedClinic && (
                            <InfoWindow
                                position={{ lat: selectedClinic.latitude, lng: selectedClinic.longitude }}
                                onCloseClick={() => setSelectedClinic(null)}
                            >
                                <div className="p-2 min-w-[220px]">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-1">
                                        {selectedClinic.name}
                                        {selectedClinic.is_premium && (
                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">{selectedClinic.address}</p>
                                    
                                    {selectedClinic.total_reviews > 0 && (
                                        <div className="flex items-center gap-1 text-xs mt-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span>{selectedClinic.average_rating.toFixed(1)}</span>
                                            <span className="text-gray-400">({selectedClinic.total_reviews})</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => router.push(`/clinics/${selectedClinic.id}`)}
                                            className="flex-1 text-center bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700"
                                        >
                                            Ver Detalhes
                                        </button>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedClinic.latitude},${selectedClinic.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-center bg-gray-100 text-gray-700 text-xs py-1.5 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                                        >
                                            <Navigation className="w-3 h-3" />
                                            Rota
                                        </a>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </div>
            </main>
        </div>
    );
}
