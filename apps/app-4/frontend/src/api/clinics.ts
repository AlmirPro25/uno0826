import { axiosInstance } from './axios';

// Types
export interface Clinic {
    id: number;
    name: string;
    description: string;
    cnpj?: string;
    phone: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    neighborhood: string;
    latitude: number;
    longitude: number;
    specialties: string; // JSON array
    opening_hours?: string; // JSON object
    accepts_insurance: boolean;
    insurance_list?: string; // JSON array
    is_premium: boolean;
    premium_until?: string;
    featured_order: number;
    logo_url?: string;
    banner_url?: string;
    highlight_color?: string;
    average_rating: number;
    total_reviews: number;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface ClinicReview {
    id: number;
    clinic_id: number;
    patient_id: number;
    rating: number;
    comment: string;
    created_at: string;
    patient?: {
        id: number;
        full_name: string;
    };
}

export interface CreateClinicInput {
    name: string;
    description?: string;
    cnpj?: string;
    phone: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip_code?: string;
    neighborhood?: string;
    latitude: number;
    longitude: number;
    specialties: string[];
    accepts_insurance?: boolean;
    insurance_list?: string[];
    logo_url?: string;
}

// API Functions

/**
 * List all clinics with pagination
 */
export const listClinics = async (page = 1, pageSize = 20): Promise<{ clinics: Clinic[]; total: number }> => {
    const response = await axiosInstance.get(`/clinics?page=${page}&page_size=${pageSize}`);
    return response.data;
};

/**
 * Get a specific clinic by ID
 */
export const getClinic = async (id: number): Promise<Clinic> => {
    const response = await axiosInstance.get(`/clinics/${id}`);
    return response.data;
};

/**
 * Find clinics near a location
 */
export const findNearbyClinics = async (
    lat: number,
    lng: number,
    radiusKm = 10,
    specialty?: string,
    limit = 20
): Promise<Clinic[]> => {
    const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radiusKm.toString(),
        limit: limit.toString(),
    });
    if (specialty) params.append('specialty', specialty);
    
    const response = await axiosInstance.get(`/clinics/nearby?${params.toString()}`);
    return response.data;
};

/**
 * Search clinics by name, specialty, or city
 */
export const searchClinics = async (query: string, page = 1, pageSize = 20): Promise<{ clinics: Clinic[]; total: number }> => {
    const response = await axiosInstance.get(`/clinics/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`);
    return response.data;
};

/**
 * Find clinics by specialty
 */
export const findBySpecialty = async (specialty: string, page = 1, pageSize = 20): Promise<{ clinics: Clinic[]; total: number }> => {
    const response = await axiosInstance.get(`/clinics/specialty/${encodeURIComponent(specialty)}?page=${page}&page_size=${pageSize}`);
    return response.data;
};

/**
 * Find clinics by city
 */
export const findByCity = async (city: string, page = 1, pageSize = 20): Promise<{ clinics: Clinic[]; total: number }> => {
    const response = await axiosInstance.get(`/clinics/city/${encodeURIComponent(city)}?page=${page}&page_size=${pageSize}`);
    return response.data;
};

/**
 * Get premium/featured clinics
 */
export const getPremiumClinics = async (limit = 10): Promise<Clinic[]> => {
    const response = await axiosInstance.get(`/clinics/premium?limit=${limit}`);
    return response.data;
};

/**
 * Get reviews for a clinic
 */
export const getClinicReviews = async (clinicId: number, page = 1, pageSize = 20): Promise<{ reviews: ClinicReview[]; total: number }> => {
    const response = await axiosInstance.get(`/clinics/${clinicId}/reviews?page=${page}&page_size=${pageSize}`);
    return response.data;
};

/**
 * Create a review for a clinic (patient only)
 */
export const createClinicReview = async (clinicId: number, rating: number, comment: string): Promise<ClinicReview> => {
    const response = await axiosInstance.post(`/clinics/${clinicId}/reviews`, { rating, comment });
    return response.data;
};

/**
 * Create a new clinic (admin only)
 */
export const createClinic = async (data: CreateClinicInput): Promise<Clinic> => {
    const response = await axiosInstance.post('/clinics', data);
    return response.data;
};

/**
 * Update a clinic
 */
export const updateClinic = async (id: number, data: Partial<CreateClinicInput>): Promise<Clinic> => {
    const response = await axiosInstance.put(`/clinics/${id}`, data);
    return response.data;
};

/**
 * Delete a clinic
 */
export const deleteClinic = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/clinics/${id}`);
};

/**
 * Set premium status (admin only)
 */
export const setClinicPremium = async (id: number, isPremium: boolean, featuredOrder = 0): Promise<void> => {
    await axiosInstance.put(`/clinics/${id}/premium`, { is_premium: isPremium, featured_order: featuredOrder });
};

// Helper functions

/**
 * Parse specialties JSON string to array
 */
export const parseSpecialties = (specialtiesJson: string): string[] => {
    try {
        return JSON.parse(specialtiesJson);
    } catch {
        return [];
    }
};

/**
 * Parse insurance list JSON string to array
 */
export const parseInsuranceList = (insuranceJson: string): string[] => {
    try {
        return JSON.parse(insuranceJson);
    } catch {
        return [];
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
};
