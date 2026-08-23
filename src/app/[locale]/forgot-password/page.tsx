import type { Metadata } from 'next';
import { ForgotPasswordView } from '@/views/auth/ForgotPasswordView';

export const metadata: Metadata = {
  title: 'Khôi phục mật khẩu - SEAL',
  description: 'Khôi phục mật khẩu tài khoản SEAL Hackathon Platform',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
