import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users } from 'lucide-react';

describe('StatsCard', () => {
  it('should display metric value and label', () => {
    render(
      <StatsCard
        title="Total de Palestrantes"
        value={42}
        icon={Users}
        color="blue"
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total de Palestrantes')).toBeInTheDocument();
  });

  it('should display description when provided', () => {
    render(
      <StatsCard
        title="Speakers"
        value={10}
        icon={Users}
        description="Active speakers"
        color="green"
      />
    );

    expect(screen.getByText('Active speakers')).toBeInTheDocument();
  });

  it('should display trend information when provided', () => {
    render(
      <StatsCard
        title="Sessions"
        value={25}
        icon={Users}
        trend={{ value: 15, isPositive: true }}
        color="purple"
      />
    );

    expect(screen.getByText('↑ 15%')).toBeInTheDocument();
    expect(screen.getByText('vs último mês')).toBeInTheDocument();
  });

  it('should display negative trend correctly', () => {
    render(
      <StatsCard
        title="Sponsors"
        value={8}
        icon={Users}
        trend={{ value: 5, isPositive: false }}
        color="orange"
      />
    );

    expect(screen.getByText('↓ 5%')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <StatsCard
        title="Loading Card"
        value={0}
        icon={Users}
        loading={true}
      />
    );

    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});