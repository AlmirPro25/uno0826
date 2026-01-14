
import apiClient from '@/lib/api';
import { BetaSubscriptionRequest, BetaSubscriptionResponse } from '@/types/api';

/**
 * API client for Beta Subscription related operations.
 */
export const betaService = {
  /**
   * Subscribes a user to the beta program.
   * @param data - Name and email for beta subscription.
   * @returns Confirmation message and subscription ID.
   */
  subscribe: async (data: BetaSubscriptionRequest): Promise<BetaSubscriptionResponse> => {
    const response = await apiClient.post<BetaSubscriptionResponse>('/beta/subscribe', data);
    return response.data;
  },
};
