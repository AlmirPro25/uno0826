import api from './axios';

export interface ScheduleBlock {
  id: number;
  doctorId: number;
  startTime: string;
  endTime: string;
  reason: string;
  recurring: boolean;
  createdAt: string;
  doctor?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateScheduleBlockRequest {
  startTime: string;
  endTime: string;
  reason: string;
  recurring: boolean;
}

export interface UpdateScheduleBlockRequest {
  startTime?: string;
  endTime?: string;
  reason?: string;
  recurring?: boolean;
}

// Get all schedule blocks for the authenticated doctor
export const getMyScheduleBlocks = async (): Promise<ScheduleBlock[]> => {
  const response = await api.get('/schedule-blocks/my-blocks');
  return response.data;
};

// Get a specific schedule block
export const getScheduleBlock = async (id: number): Promise<ScheduleBlock> => {
  const response = await api.get(`/schedule-blocks/${id}`);
  return response.data;
};

// Create a new schedule block
export const createScheduleBlock = async (data: CreateScheduleBlockRequest): Promise<ScheduleBlock> => {
  const response = await api.post('/schedule-blocks', data);
  return response.data;
};

// Update a schedule block
export const updateScheduleBlock = async (id: number, data: UpdateScheduleBlockRequest): Promise<ScheduleBlock> => {
  const response = await api.put(`/schedule-blocks/${id}`, data);
  return response.data;
};

// Delete a schedule block
export const deleteScheduleBlock = async (id: number): Promise<void> => {
  await api.delete(`/schedule-blocks/${id}`);
};

// Get schedule blocks for a specific doctor (for patients)
export const getDoctorScheduleBlocks = async (
  doctorId: number,
  startDate?: string,
  endDate?: string
): Promise<ScheduleBlock[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const url = `/doctors/${doctorId}/schedule-blocks${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

// Check if a time slot is blocked for a doctor
export const checkTimeBlocked = async (
  doctorId: number,
  startTime: string,
  endTime: string
): Promise<{ blocked: boolean }> => {
  const response = await api.get(`/doctors/${doctorId}/check-blocked`, {
    params: { startTime, endTime }
  });
  return response.data;
};

// Block reason labels in Portuguese
export const blockReasonLabels: Record<string, string> = {
  lunch: 'Almoço',
  vacation: 'Férias',
  meeting: 'Reunião',
  personal: 'Pessoal',
  other: 'Outro'
};

// Get label for a block reason
export const getBlockReasonLabel = (reason: string): string => {
  return blockReasonLabels[reason] || reason;
};
