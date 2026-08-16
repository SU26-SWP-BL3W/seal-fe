import type { Metadata } from 'next';
import { AssignedCategoriesView } from '@/views/AssignedCategoriesView';

export const metadata: Metadata = {
  title: 'Hạng mục được gán - SEAL',
  description: 'Danh sách các hạng mục được gán để chấm điểm',
};

export default function AssignedCategoriesPage() {
  return <AssignedCategoriesView />;
}
