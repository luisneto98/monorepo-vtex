import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SponsorForm } from '../../../../src/components/sponsors/SponsorForm';
import * as sponsorTiersService from '../../../../src/services/sponsor-tiers.service';

vi.mock('../../../../src/services/sponsor-tiers.service');

describe('SponsorForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTiers = [
    {
      _id: '1',
      name: 'gold',
      displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
      order: 1,
      maxPosts: 10
    },
    {
      _id: '2',
      name: 'silver',
      displayName: { 'pt-BR': 'Prata', en: 'Silver' },
      order: 2,
      maxPosts: 5
    }
  ];

  const defaultSponsor = {
    _id: '1',
    name: 'Test Sponsor',
    slug: 'test-sponsor',
    description: { 'pt-BR': 'Descrição teste', en: 'Test description' },
    logoUrl: 'https://example.com/logo.png',
    tier: 'gold',
    orderInTier: 1,
    websiteUrl: 'https://sponsor.com',
    standLocation: 'Hall A',
    adminEmail: 'admin@sponsor.com',
    contactEmail: 'contact@sponsor.com',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/sponsor',
      instagram: 'https://instagram.com/sponsor',
      facebook: 'https://facebook.com/sponsor'
    },
    maxPosts: 15,
    postsUsed: 0,
    tags: ['tech', 'innovation'],
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);
  });

  it('renders all form fields', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/sponsor name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stand location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max posts/i)).toBeInTheDocument();
    });
  });

  it('loads tier options', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      const tierSelect = screen.getByLabelText(/tier/i);
      fireEvent.click(tierSelect);
    });

    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
  });

  it('populates form with existing sponsor data', async () => {
    render(<SponsorForm sponsor={defaultSponsor} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Sponsor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-sponsor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://sponsor.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@sponsor.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hall A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });
  });

  it('auto-generates slug from name', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/sponsor name/i);
    fireEvent.change(nameInput, { target: { value: 'My New Sponsor' } });

    await waitFor(() => {
      const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement;
      expect(slugInput.value).toBe('my-new-sponsor');
    });
  });

  it('inherits maxPosts from selected tier', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      const tierSelect = screen.getByLabelText(/tier/i);
      fireEvent.change(tierSelect, { target: { value: 'silver' } });
    });

    const maxPostsInput = screen.getByLabelText(/max posts/i) as HTMLInputElement;
    expect(maxPostsInput.value).toBe('5');
  });

  it('validates required fields', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const adminEmailInput = screen.getByLabelText(/admin email/i);
    fireEvent.change(adminEmailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('validates URL format', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const websiteInput = screen.getByLabelText(/website url/i);
    fireEvent.change(websiteInput, { target: { value: 'not-a-url' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
  });

  it('validates social links format', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const linkedinInput = screen.getByLabelText(/linkedin/i);
    fireEvent.change(linkedinInput, { target: { value: 'invalid-url' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*linkedin/i)).toBeInTheDocument();
    });
  });

  it('handles description in multiple languages', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Portuguese tab
    const ptTab = screen.getByRole('tab', { name: /português/i });
    fireEvent.click(ptTab);

    const ptDescription = screen.getByPlaceholderText(/descrição em português/i);
    fireEvent.change(ptDescription, { target: { value: 'Descrição PT' } });

    // English tab
    const enTab = screen.getByRole('tab', { name: /english/i });
    fireEvent.click(enTab);

    const enDescription = screen.getByPlaceholderText(/description in english/i);
    fireEvent.change(enDescription, { target: { value: 'Description EN' } });

    expect(ptDescription).toHaveValue('Descrição PT');
  });

  it('submits form with valid data', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      screen.getByLabelText(/sponsor name/i);
    });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/sponsor name/i), { target: { value: 'New Sponsor' } });
    fireEvent.change(screen.getByLabelText(/website url/i), { target: { value: 'https://newsponsor.com' } });
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@newsponsor.com' } });

    const tierSelect = screen.getByLabelText(/tier/i);
    fireEvent.change(tierSelect, { target: { value: 'gold' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Sponsor',
        slug: 'new-sponsor',
        websiteUrl: 'https://newsponsor.com',
        adminEmail: 'admin@newsponsor.com',
        tier: 'gold'
      }));
    });
  });

  it('handles cancel button', () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles tag input', async () => {
    render(<SponsorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const tagInput = screen.getByLabelText(/tags/i);
    fireEvent.change(tagInput, { target: { value: 'tech' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('tech')).toBeInTheDocument();
    });
  });

  it('toggles visibility switch', async () => {
    render(<SponsorForm sponsor={defaultSponsor} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const visibilitySwitch = screen.getByRole('switch', { name: /visible/i });
    expect(visibilitySwitch).toBeChecked();

    fireEvent.click(visibilitySwitch);
    expect(visibilitySwitch).not.toBeChecked();
  });
});