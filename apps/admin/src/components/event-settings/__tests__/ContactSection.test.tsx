import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import { ContactSection } from '../ContactSection';

const Wrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      contactInfo: {
        email: '',
        phone: '',
        whatsapp: '',
      },
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ContactSection', () => {
  it('renders contact fields', () => {
    render(
      <Wrapper>
        <ContactSection />
      </Wrapper>
    );

    expect(screen.getByText('Informações de Contato')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/)).toBeInTheDocument();
  });

  it('formats phone number correctly', () => {
    render(
      <Wrapper>
        <ContactSection />
      </Wrapper>
    );

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    fireEvent.change(phoneInput, { target: { value: '11999999999' } });
    expect(phoneInput).toHaveValue('(11) 99999-9999');
  });

  it('shows optional label for WhatsApp', () => {
    render(
      <Wrapper>
        <ContactSection />
      </Wrapper>
    );

    expect(screen.getByText(/WhatsApp \(Opcional\)/)).toBeInTheDocument();
  });
});