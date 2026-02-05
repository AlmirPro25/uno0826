
// Mirroring the Backend Schema exactly
export interface Machine {
  id: number;
  marque: string;
  model: string;
  year: number;
  price: number;
  engine: string;
  power_hp: number;
  zero_to_sixty: number;
  image_url: string;
  description: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  created_at: string;
}

export interface InquiryPayload {
  machine_id: number;
  client_name: string;
  contact_info: string;
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

===FILE: frontend/src/lib/utils.ts===
LANGUAGE: typescript
