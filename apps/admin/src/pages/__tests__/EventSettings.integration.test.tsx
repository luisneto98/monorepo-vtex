import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventSettings from '../EventSettings';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/useToast';

vi.mock('@/services/api.service');
vi.mock('@/hooks/useToast');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const mockEventSettings = {
  _id: '1',
  eventName: {
    pt: 'VTEX Day 2026',
    en: 'VTEX Day 2026',
    es: 'VTEX Day 2026'
  },
  startDate: '2026-05-15',
  endDate: '2026-05-17',
  venue: {
    name: 'São Paulo Expo',
    address: {
      street: 'Rodovia dos Imigrantes',
      number: '1,5 KM',
      complement: '',
      neighborhood: 'Vila Água Funda',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04329-100',
      country: 'Brasil'
    },
    coordinates: {
      latitude: -23.6321,
      longitude: -46.6305
    }
  },
  contactInfo: {
    email: 'info@vtexday.com.br',
    phone: '+55 11 98765-4321',
    whatsapp: '+55 11 98765-4321'
  },
  socialMedia: {
    facebook: 'https://facebook.com/vtexday',
    twitter: 'https://twitter.com/vtexday',
    instagram: 'https://instagram.com/vtexday',
    linkedin: 'https://linkedin.com/company/vtex',
    youtube: 'https://youtube.com/@vtexday'
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('EventSettings Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();

    (apiService.get as any).mockResolvedValue({
      data: { success: true, data: mockEventSettings }
    });

    (apiService.put as any).mockResolvedValue({
      data: { success: true, data: mockEventSettings }
    });

    (toast as any).mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EventSettings />
      </QueryClientProvider>
    );
  };

  it('loads and displays event settings on mount', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    expect(apiService.get).toHaveBeenCalledWith('/event-settings');

    const basicTab = screen.getByRole('tab', { name: /Informações Básicas/i });
    fireEvent.click(basicTab);

    await waitFor(() => {
      const ptInput = screen.getByLabelText(/Nome em Português/i) as HTMLInputElement;
      expect(ptInput.value).toBe('VTEX Day 2026');
    });
  });

  it('submits form with updated data', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const basicTab = screen.getByRole('tab', { name: /Informações Básicas/i });
    fireEvent.click(basicTab);

    const ptInput = screen.getByLabelText(/Nome em Português/i) as HTMLInputElement;
    await user.clear(ptInput);
    await user.type(ptInput, 'VTEX Day 2026 - Updated');

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/event-settings',
        expect.objectContaining({
          eventName: expect.objectContaining({
            pt: 'VTEX Day 2026 - Updated'
          })
        })
      );
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Configurações salvas',
      description: 'As configurações do evento foram atualizadas com sucesso.'
    });
  });

  it('handles API errors gracefully', async () => {
    (apiService.put as any).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações. Tente novamente.',
        variant: 'destructive'
      });
    });
  });

  it('validates form before submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const contactTab = screen.getByRole('tab', { name: /Contato/i });
    fireEvent.click(contactTab);

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
    });

    expect(apiService.put).not.toHaveBeenCalled();
  });

  it('resets form to last saved state', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const basicTab = screen.getByRole('tab', { name: /Informações Básicas/i });
    fireEvent.click(basicTab);

    const ptInput = screen.getByLabelText(/Nome em Português/i) as HTMLInputElement;
    const originalValue = ptInput.value;

    await user.clear(ptInput);
    await user.type(ptInput, 'Modified Value');
    expect(ptInput.value).toBe('Modified Value');

    const resetButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(ptInput.value).toBe(originalValue);
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Formulário resetado',
      description: 'As alterações foram descartadas.'
    });
  });

  it('navigates through all tabs correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const tabs = [
      { name: /Informações Básicas/i, content: /Nome em Português/i },
      { name: /Local/i, content: /CEP/i },
      { name: /Contato/i, content: /Email/i },
      { name: /Redes Sociais/i, content: /Facebook/i }
    ];

    for (const tab of tabs) {
      const tabElement = screen.getByRole('tab', { name: tab.name });
      fireEvent.click(tabElement);

      await waitFor(() => {
        expect(screen.getByLabelText(tab.content)).toBeInTheDocument();
      });
    }
  });

  it('shows loading state while updating', async () => {
    let resolveUpdate: any;
    const updatePromise = new Promise(resolve => {
      resolveUpdate = resolve;
    });

    (apiService.put as any).mockReturnValue(updatePromise);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Salvando.../i)).toBeInTheDocument();
    });

    resolveUpdate({ data: { success: true, data: mockEventSettings } });

    await waitFor(() => {
      expect(screen.queryByText(/Salvando.../i)).not.toBeInTheDocument();
    });
  });

  it('handles date validation correctly', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const basicTab = screen.getByRole('tab', { name: /Informações Básicas/i });
    fireEvent.click(basicTab);

    const startDateInput = screen.getByLabelText(/Data de Início/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/Data de Término/i) as HTMLInputElement;

    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-05-20');

    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-05-19');

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Data de término deve ser após a data de início/i)).toBeInTheDocument();
    });
  });

  it('handles venue address autofill from CEP', async () => {
    const user = userEvent.setup();

    vi.mock('@/utils/cep-formatter', () => ({
      fetchAddressByCEP: vi.fn().mockResolvedValue({
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP'
      })
    }));

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const venueTab = screen.getByRole('tab', { name: /Local/i });
    fireEvent.click(venueTab);

    const cepInput = screen.getByLabelText(/CEP/i) as HTMLInputElement;
    await user.type(cepInput, '01310100');

    fireEvent.blur(cepInput);

    await waitFor(() => {
      const streetInput = screen.getByLabelText(/Rua/i) as HTMLInputElement;
      expect(streetInput.value).toContain('Paulista');
    }, { timeout: 3000 });
  });

  it('validates social media URLs', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const socialTab = screen.getByRole('tab', { name: /Redes Sociais/i });
    fireEvent.click(socialTab);

    const facebookInput = screen.getByLabelText(/Facebook/i) as HTMLInputElement;
    await user.type(facebookInput, 'not-a-valid-url');

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/URL inválida/i)).toBeInTheDocument();
    });
  });

  it('preserves form data across tab navigation', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });

    const basicTab = screen.getByRole('tab', { name: /Informações Básicas/i });
    fireEvent.click(basicTab);

    const ptInput = screen.getByLabelText(/Nome em Português/i) as HTMLInputElement;
    await user.clear(ptInput);
    await user.type(ptInput, 'Test Event Name');

    const venueTab = screen.getByRole('tab', { name: /Local/i });
    fireEvent.click(venueTab);

    fireEvent.click(basicTab);

    expect(ptInput.value).toBe('Test Event Name');
  });
});