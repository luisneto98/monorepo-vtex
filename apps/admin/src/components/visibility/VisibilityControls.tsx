import SectionVisibilityCard from './SectionVisibilityCard';
import type { SystemConfig, SectionName } from '@vtexday26/shared';

interface VisibilityControlsProps {
  config: SystemConfig;
  pendingChanges: any;
  onSectionUpdate: (section: string, updates: any) => void;
}

const sectionInfo: Record<SectionName, { title: string; description: string }> = {
  speakers: {
    title: 'Speakers',
    description: 'Control visibility of speaker profiles and related content',
  },
  sponsors: {
    title: 'Sponsors',
    description: 'Control visibility of sponsor information and logos',
  },
  sessions: {
    title: 'Sessions',
    description: 'Control visibility of session schedules and details',
  },
  faq: {
    title: 'FAQ',
    description: 'Control visibility of frequently asked questions',
  },
  registration: {
    title: 'Registration',
    description: 'Control visibility of registration forms and information',
  },
  schedule: {
    title: 'Schedule',
    description: 'Control visibility of event schedule and timeline',
  },
};

export default function VisibilityControls({
  config,
  pendingChanges,
  onSectionUpdate,
}: VisibilityControlsProps) {
  return (
    <div className="space-y-4">
      {Object.entries(config.sections).map(([section, visibility]) => {
        const info = sectionInfo[section as SectionName];
        const pending = pendingChanges[section];
        const currentVisibility = {
          ...visibility,
          ...pending,
        };

        return (
          <SectionVisibilityCard
            key={section}
            section={section as SectionName}
            title={info.title}
            description={info.description}
            visibility={currentVisibility}
            hasChanges={!!pending}
            onUpdate={(updates) => onSectionUpdate(section, updates)}
          />
        );
      })}
    </div>
  );
}