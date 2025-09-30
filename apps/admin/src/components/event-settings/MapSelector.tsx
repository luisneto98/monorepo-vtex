import { useMemo, memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet with secure CDN URLs
// SRI attributes are handled in index.html for preloaded images
(L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Validates coordinate ranges
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns True if valid, false otherwise
 */
function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (position: [number, number]) => void;
}

const LocationMarker = memo(function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (validateCoordinates(lat, lng)) {
        setPosition([lat, lng]);
      }
    },
  });

  return <Marker position={position} />;
});

export const MapSelector = memo(function MapSelector() {
  const { control, watch, setValue } = useFormContext();
  const latitude = watch('mapCoordinates.latitude');
  const longitude = watch('mapCoordinates.longitude');
  const position: [number, number] = useMemo(
    () => [latitude || -23.5505, longitude || -46.6333],
    [latitude, longitude]
  );

  const setPosition = useMemo(
    () => (newPosition: [number, number]) => {
      if (validateCoordinates(newPosition[0], newPosition[1])) {
        setValue('mapCoordinates.latitude', newPosition[0]);
        setValue('mapCoordinates.longitude', newPosition[1]);
      }
    },
    [setValue]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Localização no Mapa</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Clique no mapa para selecionar a localização exata do evento
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField
            control={control}
            name="mapCoordinates.latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= -90 && value <= 90) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="mapCoordinates.longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= -180 && value <= 180) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
          <ErrorBoundary
            isolate
            componentName="Mapa"
            resetKeys={[`${position[0]},${position[1]}`]}
            resetOnPropsChange
          >
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                crossOrigin=""
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
});