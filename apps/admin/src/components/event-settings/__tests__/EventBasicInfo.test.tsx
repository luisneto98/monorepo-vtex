import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import { EventBasicInfo } from '../EventBasicInfo';

const Wrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      eventName: { pt: '', en: '', es: '' },
      startDate: '',
      endDate: '',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('EventBasicInfo', () => {
  it('renders event name tabs', () => {
    render(
      <Wrapper>
        <EventBasicInfo />
      </Wrapper>
    );

    expect(screen.getByText('Nome do Evento')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('renders date fields', () => {
    render(
      <Wrapper>
        <EventBasicInfo />
      </Wrapper>
    );

    expect(screen.getByLabelText('Data de Início')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Término')).toBeInTheDocument();
  });

  it('renders multi-language input fields', () => {
    render(
      <Wrapper>
        <EventBasicInfo />
      </Wrapper>
    );

    const ptTab = screen.getByRole('tab', { name: 'Português' });
    expect(ptTab).toBeInTheDocument();
    expect(ptTab).toHaveAttribute('aria-selected', 'true');
  });
});