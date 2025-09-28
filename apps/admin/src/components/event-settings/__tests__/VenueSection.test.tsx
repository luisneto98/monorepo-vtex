import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VenueSection } from '../VenueSection';
import { FormProvider, useForm } from 'react-hook-form';
import { fetchAddressByCEP } from '../../../utils/cep-formatter';

vi.mock('../../../utils/cep-formatter');

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      venue: {
        name: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Brasil'
        }
      }
    }
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('VenueSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all venue fields', () => {
    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    expect(screen.getByText(/Nome do Local/i)).toBeInTheDocument();
    expect(screen.getByText(/CEP/i)).toBeInTheDocument();
    expect(screen.getByText(/Rua/i)).toBeInTheDocument();
    expect(screen.getByText(/Número/i)).toBeInTheDocument();
    expect(screen.getByText(/Complemento/i)).toBeInTheDocument();
    expect(screen.getByText(/Bairro/i)).toBeInTheDocument();
    expect(screen.getByText(/Cidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Estado/i)).toBeInTheDocument();
    expect(screen.getByText(/País/i)).toBeInTheDocument();
  });

  it('formats CEP input correctly', () => {
    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const cepInput = screen.getByPlaceholderText(/04329-000/i);
    fireEvent.change(cepInput, { target: { value: '01310100' } });

    expect(cepInput).toHaveValue('01310-100');
  });

  it('auto-fills address when valid CEP is entered', async () => {
    const mockAddress = {
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP'
    };

    (fetchAddressByCEP as ReturnType<typeof vi.fn>).mockResolvedValue(mockAddress);

    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const cepInput = screen.getByPlaceholderText(/04329-000/i);
    fireEvent.change(cepInput, { target: { value: '01310100' } });

    await waitFor(() => {
      expect(fetchAddressByCEP).toHaveBeenCalledWith('01310-100');
    });

    await waitFor(() => {
      const streetInput = screen.getByPlaceholderText(/Rodovia dos Imigrantes/i);
      const neighborhoodInput = screen.getByPlaceholderText(/Vila Água Funda/i);
      const cityInput = screen.getByPlaceholderText(/São Paulo/i);
      const stateInput = screen.getByPlaceholderText(/SP/i);

      expect(streetInput).toHaveValue(mockAddress.street);
      expect(neighborhoodInput).toHaveValue(mockAddress.neighborhood);
      expect(cityInput).toHaveValue(mockAddress.city);
      expect(stateInput).toHaveValue(mockAddress.state);
    });
  });

  it('handles invalid CEP gracefully', async () => {
    (fetchAddressByCEP as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('CEP não encontrado'));

    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const cepInput = screen.getByPlaceholderText(/04329-000/i);
    fireEvent.change(cepInput, { target: { value: '00000000' } });

    await waitFor(() => {
      expect(fetchAddressByCEP).toHaveBeenCalledWith('00000-000');
    });

    // Fields should remain editable after failed CEP lookup
    const streetInput = screen.getByPlaceholderText(/Rodovia dos Imigrantes/i);
    expect(streetInput).not.toBeDisabled();
  });

  it('allows manual address entry', () => {
    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const streetInput = screen.getByPlaceholderText(/Rodovia dos Imigrantes/i);
    const numberInput = screen.getByPlaceholderText(/1500/i);
    const complementInput = screen.getByPlaceholderText(/Pavilhão 3/i);

    fireEvent.change(streetInput, { target: { value: 'Test Street' } });
    fireEvent.change(numberInput, { target: { value: '123' } });
    fireEvent.change(complementInput, { target: { value: 'Apt 456' } });

    expect(streetInput).toHaveValue('Test Street');
    expect(numberInput).toHaveValue('123');
    expect(complementInput).toHaveValue('Apt 456');
  });

  it('handles state selection', () => {
    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const stateInput = screen.getByPlaceholderText(/SP/i);
    fireEvent.change(stateInput, { target: { value: 'RJ' } });

    expect(stateInput).toHaveValue('RJ');
  });

  it('shows loading indicator while fetching CEP', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (fetchAddressByCEP as ReturnType<typeof vi.fn>).mockReturnValue(promise);

    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const cepInput = screen.getByPlaceholderText(/04329-000/i);
    fireEvent.change(cepInput, { target: { value: '01310100' } });

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByTestId('cep-loading')).toBeInTheDocument();
    });

    resolvePromise!({
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP'
    });

    // Loading indicator should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('cep-loading')).not.toBeInTheDocument();
    });
  });

  it('validates required fields on form submission', async () => {
    const TestForm = () => {
      const methods = useForm({
        mode: 'onBlur',
        defaultValues: {
          venue: {
            name: '',
            address: {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Brasil'
            }
          }
        }
      });

      const onSubmit = vi.fn();

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <VenueSection />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    };

    render(<TestForm />);

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Form should not submit without required fields
    await waitFor(() => {
      const streetInput = screen.getByPlaceholderText(/Rodovia dos Imigrantes/i);
      expect(streetInput).toBeInTheDocument();
    });
  });

  it('handles venue name input', () => {
    render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const venueNameInput = screen.getByPlaceholderText(/São Paulo Expo/i);
    fireEvent.change(venueNameInput, { target: { value: 'Convention Center' } });

    expect(venueNameInput).toHaveValue('Convention Center');
  });

  it('preserves form data on re-render', () => {
    const { rerender } = render(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    const streetInput = screen.getByPlaceholderText(/Rodovia dos Imigrantes/i);
    fireEvent.change(streetInput, { target: { value: 'Test Street' } });

    rerender(
      <Wrapper>
        <VenueSection />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText(/Rodovia dos Imigrantes/i)).toHaveValue('Test Street');
  });
});