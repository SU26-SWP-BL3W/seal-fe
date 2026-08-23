import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail, useResendVerification } from "@/repositories/authRepository";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/providers/ToastProvider";

export function useVerifyEmailViewModel() {
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

  const handleResend = async () => {
    try {
      await resendApi(resendEmail.trim());
      toast.success("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể gửi lại email xác thực.");
    }
  };

  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Token xác thực không hợp lệ hoặc đã hết hạn (24 giờ).";

  return {
    state: {
      token,
      resendEmail,
      isResending,
      isLoading,
      isSuccessState,
      errorMessage,
    },
    actions: {
      setResendEmail,
      handleResend,
    },
  };
}
