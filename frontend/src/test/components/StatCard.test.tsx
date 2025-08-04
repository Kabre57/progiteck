import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

describe('StatCard', () => {
  it('renders with basic props', () => {
    render(
      <StatCard
        title="Test Title"
        value={42}
        icon={Users}
        color="blue"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with trend data', () => {
    render(
      <StatCard
        title="Test Title"
        value={100}
        icon={Users}
        color="green"
        trend={{ value: "15%", isPositive: true }}
      />
    );

    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('renders negative trend correctly', () => {
    render(
      <StatCard
        title="Test Title"
        value={50}
        icon={Users}
        color="red"
        trend={{ value: "5%", isPositive: false }}
      />
    );

    expect(screen.getByText('5%')).toBeInTheDocument();
  });
});