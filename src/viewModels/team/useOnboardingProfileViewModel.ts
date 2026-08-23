import { useState, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import {
  useSubmitStudentProfile,
  useFptStudentVerification,
  useRequestUnblock,
} from "@/repositories/authRepository";
import { useGetUserRejections } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { uploadRepository } from "@/repositories/uploadRepository";
import type { FptStudentResponse } from "@/models/entities";

export type OnboardingStep = "choose" | "fpt" | "nonFpt" | "pending";

export function useOnboardingProfileViewModel() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>("choose");
  const [fptCode, setFptCode] = useState("");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestUnblockSuccess, setRequestUnblockSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: submitProfile, isPending: isSubmittingProfile } = useSubmitStudentProfile();
  const isSubmitting = isSubmittingProfile || isUploadingPhoto;
  const { mutateAsync: verifyFpt, isPending: isVerifyingFpt } = useFptStudentVerification();
  const { mutateAsync: requestUnblock, isPending: isUnblocking } = useRequestUnblock();
  const { data: schools = [], isLoading: loadingSchools } = useGetSchools();

  const { data: rejections = [] } = useGetUserRejections(user?.id);
  const rejectionCount = rejections.filter((r) => r.isActive !== false).length;
  const isBlocked = rejectionCount >= 2;

  const handleVerifyFpt = async () => {
    setFptError("");
    setFptResult(null);
    try {
      const result = await verifyFpt(fptCode);
      if (result?.isValid) {
        setFptResult(result);
      } else {
        setFptError("Mã sinh viên không tồn tại trong hệ thống FPT.");
      }
    } catch {
      setFptError("Không thể kết nối hệ thống. Vui lòng thử lại sau.");
    }
  };

  const handleFileDrop = (file: File) => {
    if (!file.type.startsWith("image/")) { setSubmitError("Chỉ chấp nhận file ảnh (PNG, JPG)."); return; }
    if (file.size > 5 * 1024 * 1024) { setSubmitError("File không được vượt quá 5MB."); return; }
    setSubmitError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitFptProfile = async () => {
    if (!fptResult) return;
    setSubmitError("");
    try {
      await submitProfile({
        isFpt: true,
        studentCode: fptResult.studentCode ?? fptCode,
        fullName: fptResult.fullName ?? undefined,
      } as any);
      router.push("/profile");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Không thể gửi hồ sơ. Vui lòng thử lại.");
    }
  };

  const handleSubmitNonFptProfile = async () => {
    setSubmitError("");
    try {
      let photoCardUrl: string | undefined;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const uploaded = await uploadRepository.uploadFile(photoFile);
        photoCardUrl = uploaded?.fileUrl || (uploaded as any)?.FileUrl;
        if (!photoCardUrl) {
          throw new Error("Không thể lấy đường dẫn ảnh sau khi tải lên. Vui lòng thử lại.");
        }
      }
      await submitProfile({ isFpt: false, schoolId, studentCode, photoStudentCardUrl: photoCardUrl });
      router.push("/profile");
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi hồ sơ. Vui lòng thử lại.";
      setSubmitError(errorMsg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRequestUnblock = async () => {
    if (!user?.email) return;
    setSubmitError("");
    try {
      await requestUnblock(user.email);
      setRequestUnblockSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Không thể gửi yêu cầu mở khóa. Vui lòng thử lại.");
    }
  };

  return {
    state: {
      user,
      step,
      fptCode,
      fptResult,
      fptError,
      schoolId,
      studentCode,
      photoFile,
      photoPreview,
      isDragging,
      submitError,
      requestUnblockSuccess,
      isUploadingPhoto,
      isSubmitting,
      isVerifyingFpt,
      isUnblocking,
      loadingSchools,
      rejectionCount,
      isBlocked,
    },
    data: {
      schools,
      rejections,
    },
    refs: {
      fileInputRef,
    },
    actions: {
      setStep,
      setFptCode,
      setFptResult,
      setFptError,
      setSchoolId,
      setStudentCode,
      setPhotoFile,
      setPhotoPreview,
      setIsDragging,
      handleVerifyFpt,
      handleFileDrop,
      handleSubmitFptProfile,
      handleSubmitNonFptProfile,
      handleRequestUnblock,
      logout,
      navigateEvents: () => router.push("/events"),
    },
  };
}
