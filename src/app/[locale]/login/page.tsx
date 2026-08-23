import type { Metadata } from 'next';
import { LoginView } from '@/views/auth/LoginView';

export const metadata: Metadata = {
  title: 'Đăng nhập - SEAL',
  description: 'Đăng nhập vào SEAL Hackathon Platform',
};

export default function LoginPage() {
  return <LoginView />;
}
