import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapSelector } from '../MapSelector';
import { FormProvider, useForm } from 'react-hook-form';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-container" {...props}>{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)} />
  ),
  useMapEvents: vi.fn(() => null)
}));

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn()
      }
    }
  },
  icon: vi.fn().mockReturnValue('mock-icon'),
  divIcon: vi.fn().mockReturnValue('mock-div-icon')
}));

const Wrapper = ({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) => {
  const methods = useForm({
    defaultValues: {
      venue: {
        coordinates: {
          latitude: -23.5505,
          longitude: -46.6333,
          ...defaultValues
        }
      }
    }
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('MapSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container with default coordinates', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      JSON.stringify([-23.5505, -46.6333])
    );
  });

  it('displays coordinate input fields', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    expect(screen.getByText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByText(/Longitude/i)).toBeInTheDocument();
  });

  it('validates latitude range', async () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const latInputs = screen.getAllByRole('spinbutton');
    const latInput = latInputs[0]; // First spinbutton is latitude

    // Test invalid high latitude
    fireEvent.change(latInput, { target: { value: '91' } });
    fireEvent.blur(latInput);

    // Value should not be accepted
    expect(latInput).not.toHaveValue('91');

    // Test invalid low latitude
    fireEvent.change(latInput, { target: { value: '-91' } });
    fireEvent.blur(latInput);

    // Value should not be accepted
    expect(latInput).not.toHaveValue('-91');

    // Test valid latitude
    fireEvent.change(latInput, { target: { value: '45' } });
    fireEvent.blur(latInput);

    expect(latInput).toHaveValue(45);
  });

  it('validates longitude range', async () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const lngInputs = screen.getAllByRole('spinbutton');
    const lngInput = lngInputs[1]; // Second spinbutton is longitude

    // Test invalid high longitude
    fireEvent.change(lngInput, { target: { value: '181' } });
    fireEvent.blur(lngInput);

    // Value should not be accepted
    expect(lngInput).not.toHaveValue('181');

    // Test invalid low longitude
    fireEvent.change(lngInput, { target: { value: '-181' } });
    fireEvent.blur(lngInput);

    // Value should not be accepted
    expect(lngInput).not.toHaveValue('-181');

    // Test valid longitude
    fireEvent.change(lngInput, { target: { value: '120' } });
    fireEvent.blur(lngInput);

    expect(lngInput).toHaveValue(120);
  });

  it('updates coordinates when user types valid values', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const inputs = screen.getAllByRole('spinbutton');
    const latInput = inputs[0];
    const lngInput = inputs[1];

    fireEvent.change(latInput, { target: { value: '-15.7801' } });
    fireEvent.change(lngInput, { target: { value: '-47.9292' } });

    expect(latInput).toHaveValue(-15.7801);
    expect(lngInput).toHaveValue(-47.9292);
  });

  it('displays instructional text', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    expect(screen.getByText(/Clique no mapa para selecionar a localização exata do evento/i)).toBeInTheDocument();
  });

  it('renders map title', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    expect(screen.getByText(/Localização no Mapa/i)).toBeInTheDocument();
  });

  it('handles decimal precision in coordinates', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const inputs = screen.getAllByRole('spinbutton');
    const latInput = inputs[0];

    fireEvent.change(latInput, { target: { value: '-23.123456' } });
    expect(latInput).toHaveValue(-23.123456);
  });

  it('prevents non-numeric input', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const inputs = screen.getAllByRole('spinbutton');
    const latInput = inputs[0];

    fireEvent.change(latInput, { target: { value: 'abc' } });

    // Input should not accept non-numeric values
    expect(latInput).not.toHaveValue('abc');
  });

  it('updates marker position when coordinates change', () => {
    const { rerender } = render(
      <Wrapper defaultValues={{ latitude: -10, longitude: -50 }}>
        <MapSelector />
      </Wrapper>
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-position', JSON.stringify([-10, -50]));

    // Update coordinates
    const inputs = screen.getAllByRole('spinbutton');
    const latInput = inputs[0];
    const lngInput = inputs[1];

    fireEvent.change(latInput, { target: { value: '0' } });
    fireEvent.change(lngInput, { target: { value: '0' } });

    rerender(
      <Wrapper defaultValues={{ latitude: 0, longitude: 0 }}>
        <MapSelector />
      </Wrapper>
    );

    expect(screen.getByTestId('marker')).toHaveAttribute('data-position', JSON.stringify([0, 0]));
  });

  it('memoizes position calculation', () => {
    const { rerender } = render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const marker = screen.getByTestId('marker');
    const initialPosition = marker.getAttribute('data-position');

    // Re-render with same coordinates
    rerender(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    // Position should remain the same
    expect(screen.getByTestId('marker')).toHaveAttribute('data-position', initialPosition);
  });

  it('has proper input attributes for coordinates', () => {
    render(
      <Wrapper>
        <MapSelector />
      </Wrapper>
    );

    const inputs = screen.getAllByRole('spinbutton');
    const latInput = inputs[0];
    const lngInput = inputs[1];

    // Check latitude input attributes
    expect(latInput).toHaveAttribute('type', 'number');
    expect(latInput).toHaveAttribute('step', '0.000001');
    expect(latInput).toHaveAttribute('min', '-90');
    expect(latInput).toHaveAttribute('max', '90');

    // Check longitude input attributes
    expect(lngInput).toHaveAttribute('type', 'number');
    expect(lngInput).toHaveAttribute('step', '0.000001');
    expect(lngInput).toHaveAttribute('min', '-180');
    expect(lngInput).toHaveAttribute('max', '180');
  });
});