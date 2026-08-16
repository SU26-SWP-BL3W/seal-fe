# repositories/

1 thư mục con / **luồng nghiệp vụ** (theo tên miền, không theo số — số Flow1-5 trong tài liệu BE
hiện KHÔNG khớp nhau giữa các nguồn, xem cảnh báo cuối file). Trong mỗi thư mục: 1 file /
nhóm entity (`authRepository.ts`, `scoresRepository.ts`...), export hook React Query
(`useGetX`, `useCreateX`...) bọc quanh `models/apiClient`. Đây là lớp DUY NHẤT được gọi thẳng
`apiClient`/`axios`.

```
repositories/
├── auth/       AuthController + phần Users liên quan danh tính (profile, reject-lock, schools, fpt-verify)
├── events/      EventsController, RoundsController, TracksController, TemplatesController,
│                 CriteriasController, EventRolesController + mời nhân sự (EventCoordinators/Judges/Mentors)
├── teams/        TeamsController — tạo đội, mời thành viên, đăng ký/duyệt tham gia sự kiện
├── scoring/        SubmitResultsController, ScoresController, ScoreDetailsController, StorageController
├── results/          FinalResultsController, PrizesController, AppealsController
└── shared/             NotificationsController, AuditLogsController — dùng chung nhiều luồng, không thuộc riêng luồng nào
```

**Cấm** (rút từ audit repo cũ):
- Không fallback id giả khi thiếu (`resultId || "res-1"`) — thiếu thì để lỗi nổi lên thật.
- Không `catch` rồi trả mock data — lỗi phải throw để React Query báo `isError` thật.
- Không hardcode dữ liệu mẫu (`MOCK_*`) import thẳng vào production code.
- Field/route đối chiếu trực tiếp Request/Response Model thật trong source C# của BE
  (`SU26_SWP_BL3W_BE/backend/SEAL.Application/Features/**/Models`) — **không** suy đoán hay copy
  từ FE cũ. FE cũ từng có bug lệch contract thật (`useFptStudentVerification` gọi
  `/FptStudents/{code}` — route không tồn tại; đúng route là `/fpt-mock/students/{code}`).

**⚠️ Cảnh báo đánh số luồng:** file swimlane BE (`docs/swimlane/SEAL_flow4_submission_scoring.drawio`)
đặt Submission/Scoring là **Flow4**, nhưng comment ngay trong chính `SubmitResultsController.cs`/
`StorageController.cs` lại tự gắn tag `[FLOW3-NOPBAI]`. Hai nguồn trong repo BE lệch nhau. Vì vậy
thư mục ở đây đặt tên theo **domain** (auth/events/teams/scoring/results), không theo số, để khỏi
phụ thuộc vào số nào đúng — nếu nhóm chốt lại số chính thức, đổi tên thư mục sau cũng không ảnh
hưởng logic bên trong.
