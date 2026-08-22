import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useChangePassword } from "@/repositories/authRepository";
import { useToast } from "@/providers/ToastProvider";
import { resolveStaffLandingPath } from "@/lib/eventRoles";

export function useForceChangePasswordViewModel() {
  const toast = useToast();
  const router = useRouter();
  const { user, activeRole, allEventRoles, updateUser } = useAuth();
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.mustChangePassword === false) {
      const landing = user?.isAdmin
        ? "/admin/dashboard"
        : resolveStaffLandingPath(allEventRoles) ||
          (activeRole?.roleName === "Judge"
            ? "/judge/events"
            : activeRole?.roleName === "Mentor"
            ? "/mentor"
            : activeRole?.roleName === "EventCoordinator" || activeRole?.roleName === "Coordinator"
            ? "/coordinator/dashboard"
            : activeRole?.roleName === "TeamLeader" || activeRole?.roleName === "TeamMember"
            ? "/my-team"
            : "/events");
      router.replace(landing);
    }
  }, [user, allEventRoles, activeRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) {
      const msg = "Vui lòng nhập mật khẩu tạm đã nhận qua email.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      const msg = "Mật khẩu mới phải có ít nhất 6 ký tự.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      const msg = "Mật khẩu xác nhận không khớp.";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword, confirmNewPassword });
      toast.success("Đổi mật khẩu mới thành công.");
      updateUser({ mustChangePassword: false });

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored, mustChangePassword: false }));
        } catch {
          // ignore
        }
        const landing = user?.isAdmin
          ? "/admin/dashboard"
          : resolveStaffLandingPath(allEventRoles) ||
            (activeRole?.roleName === "Judge"
              ? "/judge/events"
              : activeRole?.roleName === "Mentor"
              ? "/mentor"
              : activeRole?.roleName === "EventCoordinator" || activeRole?.roleName === "Coordinator"
              ? "/coordinator/dashboard"
              : activeRole?.roleName === "TeamLeader" || activeRole?.roleName === "TeamMember"
              ? "/my-team"
              : "/events");
        window.location.replace(landing);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu tạm đã nhận qua email.";
      setError(msg);
      toast.error(msg);
    }
  };

  return {
    state: {
      oldPassword,
      newPassword,
      confirmNewPassword,
      error,
      isPending,
    },
    actions: {
      setOldPassword,
      setNewPassword,
      setConfirmNewPassword,
      handleSubmit,
    },
  };
}
