const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface CreateSponsorAccountRequest {
  sponsorId: string;
  adminEmail: string;
  sponsorName: string;
}

export interface CreateSponsorAccountResponse {
  success: boolean;
  data: {
    userId: string;
    temporaryPassword: string;
    activationLink: string;
    emailSent: boolean;
  };
  message?: string;
}

export interface AccountStatus {
  userId: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  passwordChangeRequired: boolean;
}

export class UserAccountsService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async createSponsorAccount(
    request: CreateSponsorAccountRequest,
  ): Promise<CreateSponsorAccountResponse> {
    const response = await fetch(`${API_URL}/auth/create-sponsor-account`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sponsor account');
    }

    return response.json();
  }

  static async resendWelcomeEmail(userId: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_URL}/auth/resend-welcome-email`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend welcome email');
    }

    return response.json();
  }

  static async resetSponsorPassword(userId: string): Promise<CreateSponsorAccountResponse> {
    const response = await fetch(`${API_URL}/auth/reset-sponsor-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset sponsor password');
    }

    return response.json();
  }

  static async getAccountStatus(sponsorId: string): Promise<AccountStatus | null> {
    const response = await fetch(`${API_URL}/auth/sponsor-account-status/${sponsorId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (response.status === 404) {
      return null; // No account exists
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch account status');
    }

    return response.json();
  }

  static async deactivateAccount(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/deactivate-account/${userId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate account');
    }

    return response.json();
  }

  static async activateAccount(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/activate-account/${userId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to activate account');
    }

    return response.json();
  }

  /**
   * Generate a secure temporary password
   */
  static generateTemporaryPassword(): string {
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';

    // Ensure at least one character from each type
    const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';

    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
