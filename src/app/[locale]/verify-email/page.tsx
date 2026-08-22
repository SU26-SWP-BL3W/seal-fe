import type { Metadata } from 'next';
import { VerifyEmailView } from '@/views/auth/VerifyEmailView';

export const metadata: Metadata = {
  title: 'Xác thực email - SEAL',
  description: 'Xác thực email tài khoản SEAL Hackathon Platform',
};

export default function VerifyEmailPage() {
  return <VerifyEmailView />;
}
