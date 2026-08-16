# repositories/

1 file / nhóm entity (`eventsRepository.ts`, `teamsRepository.ts`...) — export hook React Query
(`useGetX`, `useCreateX`...) bọc quanh `models/apiClient`. Đây là lớp DUY NHẤT được gọi thẳng
`apiClient`/`axios`.

**Cấm** (rút từ audit repo cũ):
- Không fallback id giả khi thiếu (`resultId || "res-1"`) — thiếu thì để lỗi nổi lên thật.
- Không `catch` rồi trả mock data — lỗi phải throw để React Query báo `isError` thật.
- Không hardcode dữ liệu mẫu (`MOCK_*`) import thẳng vào production code.
