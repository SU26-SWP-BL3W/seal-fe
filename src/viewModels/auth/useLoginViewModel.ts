import { useState } from "react";
import { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";

export function useLoginViewModel() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const isVerifiedNotice = searchParams.get("verified") === "true";
  const initialEmail = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const { user: currentUser, loginWithCredentials, loginWithGoogleCredential } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      const msg = "Vui lòng nhập email và mật khẩu.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
    try {
      const defaultPath = await loginWithCredentials(email, password);
      setIsNavigating(true);
      toast.success("Đăng nhập thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : defaultPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Email hoặc mật khẩu không đúng.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      const msg = "Không nhận được token xác thực từ Google.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
    try {
      const defaultPath = await loginWithGoogleCredential(response.credential);
      setIsNavigating(true);
      toast.success("Đăng nhập Google thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : defaultPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Đăng nhập Google thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    const msg = "Đăng nhập với Google bị hủy hoặc gặp sự cố.";
    setErrorMessage(msg);
    toast.error(msg);
  };

  return {
    state: {
      email,
      password,
      showPassword,
      rememberMe,
      errorMessage,
      isSubmitting,
      isNavigating,
      isVerifiedNotice,
      currentUser,
    },
    actions: {
      setEmail,
      setPassword,
      setShowPassword,
      setRememberMe,
      handleLoginSubmit,
      handleGoogleSuccess,
      handleGoogleError,
    },
  };
}
