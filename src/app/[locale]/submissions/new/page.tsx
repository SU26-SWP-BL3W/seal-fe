import { NewSubmissionView } from "@/views/team/NewSubmissionView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
// NewSubmissionView tự xử lý cả nộp mới (T7) lẫn chỉnh sửa bài đã nộp theo
// từng track (T6) qua prop existingSubmission nội bộ.
export default function NewSubmissionPage() {
  return <NewSubmissionView />;
}
