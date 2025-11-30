import { apiClient } from './api';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'commission_deduction' | 'withdrawal' | 'top_up' | 'credit';
  description: string;
  status?: 'pending' | 'completed' | 'failed';
  bank_details?: any;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface WalletData {
  balance: number;
  recent_transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface WalletResponse {
  success: boolean;
  data: WalletData;
}

export interface WithdrawRequest {
  amount: number;
  bank_details?: {
    account_number?: string;
    account_name?: string;
    bank_name?: string;
  };
}

export interface WithdrawResponse {
  success: boolean;
  data: {
    balance: number;
    transaction: WalletTransaction;
  };
}

export const walletService = {
  async getWallet(page: number = 1, limit: number = 20): Promise<WalletResponse> {
    const response = await apiClient.get<WalletResponse>('/mechanic/wallet', {
      params: { page, limit },
    });
    return response.data;
  },

  async withdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
    const response = await apiClient.post<WithdrawResponse>(
      '/mechanic/wallet/withdraw',
      request
    );
    return response.data;
  },
};

