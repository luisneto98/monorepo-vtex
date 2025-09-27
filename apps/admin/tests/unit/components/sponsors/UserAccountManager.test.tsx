import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserAccountManager } from '../../../../src/components/sponsors/UserAccountManager';
import * as userAccountsService from '../../../../src/services/user-accounts.service';

vi.mock('../../../../src/services/user-accounts.service');

describe('UserAccountManager', () => {
  const mockSponsor = {
    _id: '1',
    name: 'Test Sponsor',
    adminEmail: 'admin@sponsor.com',
    slug: 'test-sponsor'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account status when no account exists', () => {
    render(<UserAccountManager sponsor={mockSponsor} />);

    expect(screen.getByText(/no account created/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders account status when account exists', () => {
    render(<UserAccountManager sponsor={mockSponsor} accountId="user-123" />);

    expect(screen.getByText(/account created/i)).toBeInTheDocument();
    expect(screen.getByText(/user-123/i)).toBeInTheDocument();
  });

  it('handles account creation', async () => {
    const createAccountSpy = vi.spyOn(userAccountsService, 'createSponsorAccount').mockResolvedValue({
      userId: 'new-user-123',
      temporaryPassword: 'temp-pass-123',
      activationLink: 'https://activate.com/123'
    });

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(createAccountSpy).toHaveBeenCalledWith({
        sponsorId: '1',
        adminEmail: 'admin@sponsor.com',
        sponsorName: 'Test Sponsor'
      });
    });

    expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/new-user-123/i)).toBeInTheDocument();
  });

  it('displays temporary password after creation', async () => {
    vi.spyOn(userAccountsService, 'createSponsorAccount').mockResolvedValue({
      userId: 'new-user-123',
      temporaryPassword: 'SecurePass123!',
      activationLink: 'https://activate.com/123'
    });

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/SecurePass123!/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /copy password/i })).toBeInTheDocument();
  });

  it('handles password copy to clipboard', async () => {
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    });

    vi.spyOn(userAccountsService, 'createSponsorAccount').mockResolvedValue({
      userId: 'new-user-123',
      temporaryPassword: 'SecurePass123!',
      activationLink: 'https://activate.com/123'
    });

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: /copy password/i });
      fireEvent.click(copyButton);
    });

    expect(mockWriteText).toHaveBeenCalledWith('SecurePass123!');
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });

  it('displays activation link', async () => {
    vi.spyOn(userAccountsService, 'createSponsorAccount').mockResolvedValue({
      userId: 'new-user-123',
      temporaryPassword: 'SecurePass123!',
      activationLink: 'https://activate.com/123'
    });

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/activation link/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /activate account/i })).toHaveAttribute(
        'href',
        'https://activate.com/123'
      );
    });
  });

  it('handles account creation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(userAccountsService, 'createSponsorAccount').mockRejectedValue(
      new Error('Email already exists')
    );

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles password reset', async () => {
    const resetPasswordSpy = vi.spyOn(userAccountsService, 'resetSponsorPassword').mockResolvedValue({
      temporaryPassword: 'NewPass456!',
      resetLink: 'https://reset.com/456'
    });

    render(<UserAccountManager sponsor={mockSponsor} accountId="user-123" />);

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(resetPasswordSpy).toHaveBeenCalledWith('user-123');
    });

    expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/NewPass456!/)).toBeInTheDocument();
  });

  it('handles account deactivation', async () => {
    const deactivateSpy = vi.spyOn(userAccountsService, 'deactivateSponsorAccount').mockResolvedValue(undefined);

    render(<UserAccountManager sponsor={mockSponsor} accountId="user-123" />);

    const deactivateButton = screen.getByRole('button', { name: /deactivate account/i });
    fireEvent.click(deactivateButton);

    // Confirm deactivation
    const confirmButton = await screen.findByRole('button', { name: /confirm deactivation/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deactivateSpy).toHaveBeenCalledWith('user-123');
    });

    expect(screen.getByText(/account deactivated/i)).toBeInTheDocument();
  });

  it('handles account reactivation', async () => {
    const reactivateSpy = vi.spyOn(userAccountsService, 'reactivateSponsorAccount').mockResolvedValue({
      temporaryPassword: 'ReactivatePass789!',
      activationLink: 'https://reactivate.com/789'
    });

    render(<UserAccountManager sponsor={mockSponsor} accountId="user-123" isDeactivated />);

    const reactivateButton = screen.getByRole('button', { name: /reactivate account/i });
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      expect(reactivateSpy).toHaveBeenCalledWith('user-123');
    });

    expect(screen.getByText(/account reactivated/i)).toBeInTheDocument();
    expect(screen.getByText(/ReactivatePass789!/)).toBeInTheDocument();
  });

  it('sends welcome email', async () => {
    const sendEmailSpy = vi.spyOn(userAccountsService, 'sendWelcomeEmail').mockResolvedValue(undefined);

    vi.spyOn(userAccountsService, 'createSponsorAccount').mockResolvedValue({
      userId: 'new-user-123',
      temporaryPassword: 'SecurePass123!',
      activationLink: 'https://activate.com/123'
    });

    render(<UserAccountManager sponsor={mockSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      const sendEmailButton = screen.getByRole('button', { name: /send welcome email/i });
      fireEvent.click(sendEmailButton);
    });

    expect(sendEmailSpy).toHaveBeenCalledWith({
      userId: 'new-user-123',
      email: 'admin@sponsor.com',
      sponsorName: 'Test Sponsor'
    });

    expect(screen.getByText(/welcome email sent/i)).toBeInTheDocument();
  });

  it('displays account activity status', () => {
    render(
      <UserAccountManager
        sponsor={mockSponsor}
        accountId="user-123"
        lastLogin="2025-01-15T10:00:00Z"
      />
    );

    expect(screen.getByText(/last login/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-01-15/i)).toBeInTheDocument();
  });

  it('validates email before account creation', async () => {
    const invalidSponsor = { ...mockSponsor, adminEmail: 'invalid-email' };

    render(<UserAccountManager sponsor={invalidSponsor} />);

    const createButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(userAccountsService.createSponsorAccount).not.toHaveBeenCalled();
  });
});