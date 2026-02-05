
import apiClient from '@/lib/axios';
import type { CreateInquiryDTO, APIResponse } from '../../../../shared/types';

export const ConciergeService = {
  /**
   * Envia uma solicitação de interesse para o Concierge Digital.
   */
  sendInquiry: async (data: CreateInquiryDTO): Promise<APIResponse<{ inquiry_id: number }>> => {
    const response = await apiClient.post<APIResponse<{ inquiry_id: number }>>('/concierge/inquire', data);
    return response.data;
  }
};
