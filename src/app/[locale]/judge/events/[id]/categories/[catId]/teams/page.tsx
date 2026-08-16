import type { Metadata } from 'next';
import { TeamListView } from '@/views/TeamListView';

export const metadata: Metadata = {
  title: 'Danh sách Đội - SEAL',
  description: 'Danh sách các đội để chấm điểm',
};

export default function TeamListPage() {
  return <TeamListView />;
}
