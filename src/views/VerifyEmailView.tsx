"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail, useResendVerification } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useToast } from "@/providers/ToastProvider";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { CheckCircle2, XCircle, ArrowRight, RefreshCw } from "lucide-react";

export function VerifyEmailView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [resendEmail, setResendEmail] = useState("");
  const { mutateAsync: resendApi, isPending: isResending } = useResendVerification();

  const { data, isLoading, isError, error } = useVerifyEmail(token);
  const isSuccessState = !isError && data !== undefined && data !== false;

  useEffect(() => {
    if (isSuccessState) {
      const timer = setTimeout(() => {
        router.push("/login?verified=true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessState, router]);

  if (!token) {
    return (
      <AuthLayout
        title="Liên kết không hợp lệ"
        description="Không tìm thấy mã xác thực trong URL. Vui lòng kiểm tra lại đường dẫn từ email."
        footer={
          <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
            Về trang đăng nhập
          </Link>
        }
      >
        <div className="flex justify-center">
          <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
        </div>
      </AuthLayout>
    );
  }

  if (isLoading) {
    return (
      <AuthLayout title="Đang xác thực" description="Đang kiểm tra mã xác nhận email của bạn...">
        <div className="flex justify-center py-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      </AuthLayout>
    );
  }

  if (isSuccessState) {
    return (
      <AuthLayout
        title="Xác thực email thành công"
        description="Email của bạn đã được xác thực. Đăng nhập để tiếp tục hoàn thiện hồ sơ."
        footer={
          <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <RefreshCw className="h-3 w-3 animate-spin text-[var(--color-success)]" />
            Tự động chuyển đến trang đăng nhập sau 3 giây...
          </p>
        }
      >
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />
          <Link href="/login?verified=true" className="w-full">
            <Button className="w-full justify-center">
              Đăng nhập để hoàn thiện hồ sơ <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Token xác thực không hợp lệ hoặc đã hết hạn (24 giờ).";

  return (
    <AuthLayout
      title="Xác thực thất bại"
      description={errorMessage}
      footer={
        <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
          Về trang đăng nhập
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
        </div>

        <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3 text-left text-xs text-[var(--text-muted)]">
          <p className="mb-1 font-medium text-[var(--color-danger)]">Nguyên nhân có thể:</p>
          <ul className="space-y-1">
            <li>Link đã được sử dụng trước đó</li>
            <li>Link hết hạn sau 24 giờ kể từ khi đăng ký</li>
            <li>Đường dẫn bị sao chép không đầy đủ</li>
          </ul>
        </div>

        <Field label="Email đăng ký">
          {({ id }) => (
            <Input
              id={id}
              type="email"
              placeholder="ban@fpt.edu.vn"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
          )}
        </Field>

        <Button
          disabled={!resendEmail.trim() || isResending}
          className="w-full justify-center"
          onClick={async () => {
            try {
              await resendApi(resendEmail.trim());
              toast.success("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
            } catch (err: any) {
              toast.error(err?.response?.data?.message || err?.message || "Không thể gửi lại email xác thực.");
            }
          }}
        >
          {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
        </Button>

        <Link href="/register" className="block">
          <Button variant="ghost" className="w-full justify-center">
            Đăng ký lại
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
