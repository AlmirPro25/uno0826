
import { useState } from 'react';
import { ConciergeService } from '@/services/api/concierge.service';
import { useUIStore } from '@/stores/useUIStore';
import type { CreateInquiryDTO } from '../../../../shared/types';

export const useInquiry = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess } = useUIStore();

  const submitInquiry = async (data: CreateInquiryDTO) => {
    setIsSubmitting(true);
    try {
      await ConciergeService.sendInquiry(data);
      showSuccess(`Sua solicitação para a unidade #${data.machine_id} foi enviada ao Concierge.`);
      return true;
    } catch (error) {
      // Erro já tratado pelo store UI via Axios Interceptor
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitInquiry,
    isSubmitting
  };
};
