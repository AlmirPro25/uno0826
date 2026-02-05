
/**
 * LUXE DIGITAL SCHEMA DEFINITIONS
 * Source of Truth for Database Models and API Contracts.
 */

export interface Machine {
  id: number;
  marque: string;         // Ex: Rolls-Royce
  model: string;          // Ex: Phantom VIII
  year: number;
  price: number;
  engine: string;         // Ex: 6.75L V12 Twin-Turbo
  power_hp: number;       // Ex: 563
  zero_to_sixty: number;  // Ex: 5.1
  image_url: string;
  description: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  created_at: string;     // ISO Date String
}

export interface Inquiry {
  id: number;
  machine_id: number;
  client_name: string;
  contact_info: string;
  message?: string;
  timestamp: string;
}

// API DTOs (Data Transfer Objects)
export interface CreateInquiryDTO {
  machine_id: number;
  client_name: string;
  contact_info: string;
  message?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface APIError {
  success: false;
  error: string;
  code?: string;
}
