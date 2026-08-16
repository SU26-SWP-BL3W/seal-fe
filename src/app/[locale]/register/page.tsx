import type { Metadata } from 'next';
import { RegisterView } from '@/views/RegisterView';

export const metadata: Metadata = {
  title: 'Đăng ký - SEAL',
  description: 'Đăng ký tài khoản SEAL Hackathon Platform',
};

export default function RegisterPage() {
  return <RegisterView />;
}
