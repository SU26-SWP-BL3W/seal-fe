'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export function LoginView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Integrate with actual authentication API
      // This is a placeholder that simulates the auth flow
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate with Google OAuth flow
      // This is a placeholder for OAuth implementation
      window.location.href = '/api/auth/google';
    } catch (err) {
      setError('Lỗi khi đăng nhập với Google');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-[#f1f5f9] antialiased flex items-center justify-center relative overflow-hidden">
      {/* Hexagon Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3V51.9L30 69.2L0 51.9V17.3Z' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3Cpath d='M30 69.2L60 86.5V104M30 69.2L0 86.5V104M30 -17.3V0' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-80 pointer-events-none" />

      {/* Radial Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2dd4bf]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-md mx-4 p-1">
        {/* Decorative Top Header */}
        <div className="mb-8 text-center">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#2dd4bf] mb-2">
            // SEAL COMMAND DECK
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#94a3b8]">
            Authentication Protocol v1.0
          </div>
        </div>

        {/* Login Form */}
        <LoginForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onGoogleLogin={handleGoogleLogin}
        />

        {/* Footer Info */}
        <div className="mt-8 text-center text-[10px] font-mono text-[#475569] uppercase tracking-wider">
          <p>PROTECTED BY ENCRYPTION • AUDIT LOGGED</p>
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />

      {/* Global Scan Line Animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .hud-clipped {
          clip-path: polygon(
            15px 0,
            100% 0,
            100% calc(100% - 15px),
            calc(100% - 15px) 100%,
            0 100%,
            0 15px
          );
        }

        .hud-clipped-reverse {
          clip-path: polygon(
            0 0,
            calc(100% - 15px) 0,
            100% 15px,
            100% 100%,
            15px 100%,
            0 calc(100% - 15px)
          );
        }

        .sci-input {
          background-color: rgba(15, 24, 38, 0.7);
          border: 1px solid #1e293b;
          transition: all 0.3s ease;
        }

        .sci-input:focus {
          border-color: #2dd4bf;
          box-shadow: 0 0 10px rgba(45, 212, 191, 0.2);
          outline: none;
        }
      `}</style>
    </main>
  );
}

export default LoginView;
