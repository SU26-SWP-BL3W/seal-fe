'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface DeclineInvitationModalProps {
  isOpen: boolean;
  eventTitle?: string;
  onConfirm?: (reason: string) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DeclineInvitationModal({
  isOpen,
  eventTitle = 'Sự kiện',
  onConfirm,
  onCancel,
  isLoading = false,
}: DeclineInvitationModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!reason.trim()) {
        setError('Vui lòng nhập lý do từ chối');
        setLocalIsLoading(false);
        return;
      }

      if (reason.length < 10) {
        setError('Lý do phải có ít nhất 10 ký tự');
        setLocalIsLoading(false);
        return;
      }

      if (onConfirm) {
        await onConfirm(reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const isLoading_ = isLoading || localIsLoading;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="hud-clipped p-[2px] bg-gradient-to-br from-[#2dd4bf] to-[#a78bfa] max-w-md w-full">
          <div className="hud-clipped bg-[#111a2e] shadow-[0_0_30px_rgba(45,212,191,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#24344d]">
              <h2 className="text-xl font-bold text-[#f1f5f9] uppercase tracking-wide">
                XÁC NHẬN TỪ CHỐI
              </h2>
              <button
                onClick={onCancel}
                disabled={isLoading_}
                className="text-[#94a3b8] hover:text-[#2dd4bf] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Title */}
              <div className="bg-[#0f172a]/50 border border-[#2dd4bf]/30 rounded-sm p-4">
                <p className="text-xs text-[#94a3b8] uppercase tracking-widest font-mono mb-1">
                  SỰ KIỆN
                </p>
                <p className="text-lg font-bold text-[#f1f5f9] line-clamp-2">
                  {eventTitle}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono">
                  {error}
                </div>
              )}

              {/* Reason Input */}
              <div className="space-y-2">
                <label
                  htmlFor="reason"
                  className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
                >
                  &gt; LÝ DO TỪ CHỐI
                </label>
                <div className="relative">
                  <textarea
                    id="reason"
                    placeholder="Vui lòng cho chúng tôi biết lý do từ chối tham gia..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isLoading_}
                    rows={4}
                    className="sci-input hud-clipped-reverse w-full px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all resize-none"
                    required
                  />
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                </div>
                <p className="text-xs text-[#94a3b8] text-right">
                  {reason.length} / 500 ký tự
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading_}
                  className="hud-clipped flex-1 bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#2dd4bf]/50 py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading_}
                  className="hud-clipped flex-1 bg-[#f87171] hover:bg-[#ef4444] disabled:bg-[#7f1d1d] text-[#fff] py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all group relative overflow-hidden disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading_ ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
                </button>
              </div>

              {/* Note */}
              <p className="text-xs text-[#475569] font-mono text-center border-t border-[#24344d] pt-4">
                Hành động này không thể hoàn tác. Vui lòng cân nhắc kỹ.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Global Styles */}
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
    </>
  );
}

export default DeclineInvitationModal;
