import type { Metadata } from 'next';
import { EventDetailsView } from '@/views/EventDetailsView';

export const metadata: Metadata = {
  title: 'Chi tiết sự kiện - SEAL',
  description: 'Chi tiết sự kiện hackathon SEAL',
};

interface EventPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  return <EventDetailsView eventId={params.id} />;
}
