import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useResetPassword } from "@/repositories/authRepository";
import { authService } from "@/services/auth/authService";

export function useResetPasswordViewModel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { mutateAsync: resetPassword, isPending } = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) return;

    const pwdCheck = authService.validatePasswordStrength(newPassword);
    if (!newPassword || !pwdCheck.isValid) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Liên kết không hợp lệ hoặc đã hết hạn (24 giờ). Vui lòng yêu cầu lại.",
      );
    }
  };

  return {
    state: {
      token,
      newPassword,
      confirmNewPassword,
      error,
      done,
      isPending,
    },
    actions: {
      setNewPassword,
      setConfirmNewPassword,
      handleSubmit,
    },
  };
}
