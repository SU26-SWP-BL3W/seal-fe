// Route group cho khu vực CHƯA đăng nhập (login/register/forgot-password/verify-email...).
// Flow 1 (Auth) thêm các route thật vào đây, vd (auth)/login/page.tsx.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--bg-base)]">
      {children}
    </div>
  );
}
