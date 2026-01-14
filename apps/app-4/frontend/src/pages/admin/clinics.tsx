import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
    listClinics,
    createClinic,
    updateClinic,
    deleteClinic,
    setClinicPremium,
    Clinic,
    CreateClinicInput,
    parseSpecialties
} from '@/api/clinics';
import {
    Building2,
    Search,
    Plus,
    Edit,
    Trash2,
    Star,
    MapPin,
    Phone,
    Globe,
    Loader2,
    AlertCircle,
    Crown,
    CheckCircle,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export default function AdminClinicsPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
    const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<CreateClinicInput & { is_premium?: boolean; is_featured?: boolean }>({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        email: '',
        website: '',
        latitude: 0,
        longitude: 0,
        specialties: []
    });
    const [isPremium, setIsPremium] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadClinics();
    }, [isAuthenticated, role, page]);

    const loadClinics = async () => {
        try {
            setLoading(true);
            const data = await listClinics(page, 10);
            setClinics(Array.isArray(data) ? data : data.clinics || []);
            setTotalPages(Math.ceil((Array.isArray(data) ? data.length : data.total || 0) / 10));
        } catch (err) {
            setError('Erro ao carregar clínicas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingClinic) {
                await updateClinic(editingClinic.id, formData);
            } else {
                await createClinic(formData);
            }
            setShowCreateModal(false);
            setEditingClinic(null);
            resetForm();
            loadClinics();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar clínica');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClinic) return;
        try {
            await deleteClinic(deletingClinic.id);
            setDeletingClinic(null);
            loadClinics();
        } catch (err) {
            console.error(err);
            alert('Erro ao deletar clínica');
        }
    };

    const handleTogglePremium = async (clinic: Clinic) => {
        try {
            await setClinicPremium(clinic.id, !clinic.is_premium);
            loadClinics();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            phone: '',
            email: '',
            website: '',
            latitude: 0,
            longitude: 0,
            specialties: []
        });
        setIsPremium(false);
        setIsFeatured(false);
    };

    const openEditModal = (clinic: Clinic) => {
        setFormData({
            name: clinic.name,
            description: clinic.description || '',
            address: clinic.address,
            city: clinic.city,
            state: clinic.state,
            zip_code: clinic.zip_code || '',
            phone: clinic.phone || '',
            email: clinic.email || '',
            website: clinic.website || '',
            latitude: clinic.latitude,
            longitude: clinic.longitude,
            specialties: parseSpecialties(clinic.specialties)
        });
        setIsPremium(clinic.is_premium);
        setIsFeatured(clinic.featured_order > 0);
        setEditingClinic(clinic);
        setShowCreateModal(true);
    };

    const filteredClinics = clinics.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Head>
                <title>Gestão de Clínicas | Admin | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Building2 className="w-7 h-7 text-cyan-600" />
                            Gestão de Clínicas
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {clinics.length} clínicas parceiras
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingClinic(null);
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Clínica
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou cidade..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Clinics Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                    </div>
                ) : filteredClinics.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma clínica encontrada</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClinics.map((clinic) => (
                            <div
                                key={clinic.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl border ${
                                    clinic.is_premium 
                                        ? 'border-amber-400 ring-2 ring-amber-400/20' 
                                        : 'border-gray-200 dark:border-gray-700'
                                } p-4 relative`}
                            >
                                {clinic.is_premium && (
                                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {clinic.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {clinic.city}, {clinic.state}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-medium">{clinic.average_rating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                </div>

                                {clinic.specialties && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {parseSpecialties(clinic.specialties).slice(0, 3).map((spec: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                                                {spec}
                                            </span>
                                        ))}
                                        {parseSpecialties(clinic.specialties).length > 3 && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded text-xs">
                                                +{parseSpecialties(clinic.specialties).length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {clinic.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {clinic.phone}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleTogglePremium(clinic)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            clinic.is_premium
                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {clinic.is_premium ? 'Premium ✓' : 'Tornar Premium'}
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(clinic)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-cyan-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingClinic(clinic)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-500">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingClinic ? 'Editar Clínica' : 'Nova Clínica'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingClinic(null);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Endereço *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Cidade *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Estado *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        CEP
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Latitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Longitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Especialidades (separadas por vírgula)
                                </label>
                                <input
                                    type="text"
                                    value={formData.specialties?.join(', ') || ''}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="Cardiologia, Ortopedia, Pediatria..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Premium</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Destaque</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingClinic(null);
                                    }}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingClinic ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingClinic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Tem certeza que deseja excluir a clínica <strong>{deletingClinic.name}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingClinic(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
