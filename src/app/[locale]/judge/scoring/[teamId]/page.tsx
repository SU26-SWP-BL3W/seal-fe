import type { Metadata } from 'next';
import { ScoringDashboardView } from '@/views/ScoringDashboardView';

export const metadata: Metadata = {
  title: 'Chấm điểm - SEAL',
  description: 'Bảng điều khiển chấm điểm đội',
};

interface ScoringPageProps {
  params: {
    teamId: string;
  };
}

export default function ScoringPage({ params }: ScoringPageProps) {
  return <ScoringDashboardView teamId={params.teamId} teamName="Tech Innovators" />;
}
