import { useState } from "react";
import { useForgotPassword } from "@/repositories/authRepository";

export function useForgotPasswordViewModel() {
  const { mutateAsync: forgotPassword, isPending } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
          (err as Error)?.message ||
          "Không gửi được yêu cầu. Vui lòng thử lại.",
      );
    }
  };

  return {
    state: {
      email,
      error,
      sent,
      isPending,
    },
    actions: {
      setEmail,
      handleSubmit,
    },
  };
}
