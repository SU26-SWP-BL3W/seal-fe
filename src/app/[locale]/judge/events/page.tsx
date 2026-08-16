import type { Metadata } from 'next';
import { AssignedEventsView } from '@/views/AssignedEventsView';

export const metadata: Metadata = {
  title: 'Sự kiện được phân công - SEAL',
  description: 'Danh sách các sự kiện được phân công để chấm điểm',
};

export default function AssignedEventsPage() {
  return <AssignedEventsView />;
}
