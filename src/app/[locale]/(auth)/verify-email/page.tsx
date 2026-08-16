import { VerifyEmailView } from "@/views/VerifyEmailView";
import { Suspense } from "react";

export const metadata = {
  title: "Xác Thực Email — SEAL Hackathon",
  description: "Xác thực địa chỉ email để kích hoạt tài khoản SEAL Hackathon",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[70vh]">
          <svg className="w-12 h-12 animate-spin" viewBox="0 0 100 100">
            <polygon
              points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="2"
              strokeDasharray="240"
              strokeDashoffset="60"
            />
          </svg>
        </div>
      }
    >
      <VerifyEmailView />
    </Suspense>
  );
}
