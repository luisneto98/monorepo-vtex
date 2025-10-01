import { MaterialCard } from './MaterialCard';
import type { PressMaterial } from '@shared/types/press-materials';

interface MaterialsGridProps {
  materials: PressMaterial[];
  onEdit: (material: PressMaterial) => void;
  onDelete: (id: string) => void;
  onPreview: (material: PressMaterial) => void;
  onDownload: (material: PressMaterial) => void;
  loading?: boolean;
}

export function MaterialsGrid({
  materials,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  loading = false,
}: MaterialsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {materials.map((material) => (
        <MaterialCard
          key={material._id}
          material={material}
          onEdit={onEdit}
          onDelete={onDelete}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}