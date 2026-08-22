import { useState } from "react";
import { CredentialResponse } from "@react-oauth/google";
import { useRegister, useResendVerification } from "@/repositories/authRepository";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";

import { authService } from "@/services/auth/authService";

export type RegisterStep = "form" | "success";

export function useRegisterViewModel() {
  const { user: currentUser, loginWithGoogleCredential } = useAuth();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "";

  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<RegisterStep>("form");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  const [isNavigating, setIsNavigating] = useState(false);
  const { mutateAsync: registerApi, isPending } = useRegister();
  const { mutateAsync: resendApi, isPending: isResending } = useResendVerification();
  const [resendMsg, setResendMsg] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Họ và tên không được để trống";
    if (!email.trim()) errs.email = "Email không được để trống";
    else if (!authService.validateEmail(email)) errs.email = "Email không hợp lệ";

    const pwdCheck = authService.validatePasswordStrength(password);
    if (!password) errs.password = "Mật khẩu không được để trống";
    else if (!pwdCheck.isValid) errs.password = "Mật khẩu phải ít nhất 6 ký tự";

    if (password !== confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra và hoàn thiện các trường thông tin bắt buộc.");
      return;
    }
    setErrors({});
    try {
      await registerApi({ email: email.trim(), password, fullName: fullName.trim() });
      toast.success("Đăng ký tài khoản thành công!");
      setStep("success");
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "";

      if (
        apiMessage.toLowerCase().includes("không gửi được email xác thực") ||
        apiMessage.toLowerCase().includes("email xác thực")
      ) {
        toast.success("Tài khoản đã được tạo thành công trong hệ thống!");
        setIsAccountCreated(true);
        setStep("success");
        return;
      }

      if (apiMessage.toLowerCase().includes("đã tồn tại")) {
        setErrors({
          submit: `Email "${email.trim()}" đã được đăng ký trước đó. Bạn có thể đăng nhập ngay hoặc sử dụng tính năng quên mật khẩu.`,
        });
        setIsAccountCreated(true);
        toast.error(`Email "${email.trim()}" đã tồn tại trong hệ thống.`);
        return;
      }

      const finalMsg = apiMessage || "Đăng ký thất bại. Vui lòng kiểm tra kết nối và thử lại.";
      setErrors({ submit: finalMsg });
      toast.error(finalMsg);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error("Không nhận được token xác thực từ Google.");
      return;
    }
    try {
      const targetPath = await loginWithGoogleCredential(response.credential);
      setIsNavigating(true);
      toast.success("Đăng ký / Đăng nhập Google thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : targetPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Đăng nhập Google thất bại.";
      toast.error(msg);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập với Google bị hủy hoặc gặp sự cố.");
  };

  const handleResend = async () => {
    try {
      await resendApi(email);
      setResendMsg("Đã gửi lại yêu cầu xác thực tới hệ thống.");
      toast.success("Đã gửi lại email xác thực thành công!");
    } catch {
      setResendMsg("Không gửi lại được qua email. Bạn có thể thử đăng nhập trực tiếp.");
    }
  };

  return {
    state: {
      step,
      fullName,
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirm,
      errors,
      isAccountCreated,
      isNavigating,
      isPending,
      isResending,
      resendMsg,
      returnUrl,
      currentUser,
    },
    actions: {
      setStep,
      setFullName,
      setEmail,
      setPassword,
      setConfirmPassword,
      setShowPassword,
      setShowConfirm,
      setErrors,
      handleRegister,
      handleGoogleSuccess,
      handleGoogleError,
      handleResend,
    },
  };
}
