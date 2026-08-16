/**
 * DEV PREVIEW MOCK DATA FILE FOR COORDINATOR UI TESTING
 * (Tệp dữ liệu Mock thử nghiệm giao diện dành cho Điều phối viên)
 * Lưu ý: Có thể gỡ bỏ tệp này sau khi hoàn tất Session test UI.
 */

export const mockCoordinatorEvents = [
  {
    id: "EV-01",
    Id: "EV-01",
    eventId: "EV-01",
    EventId: "EV-01",
    eventName: "SEAL Hackathon 2026: AI & Cloud Nexus",
    EventName: "SEAL Hackathon 2026: AI & Cloud Nexus",
    season: "Summer",
    Season: "Summer",
    year: 2026,
    Year: 2026,
    startDate: "2026-06-01T08:00:00Z",
    endDate: "2026-06-30T18:00:00Z",
    registrationStartDate: "2026-05-01T08:00:00Z",
    registrationEndDate: "2026-05-25T23:59:00Z",
    maxTeams: 50,
    teamCount: 12,
    description: "Sự kiện thi đấu phát triển ứng dụng trí tuệ nhân tạo và hạ tầng đám mây quy mô lớn dành cho sinh viên.",
    status: true,
    Status: true,
  },
  {
    id: "EV-02",
    Id: "EV-02",
    eventId: "EV-02",
    EventId: "EV-02",
    eventName: "FPT Tech Innovation Challenge 2026",
    EventName: "FPT Tech Innovation Challenge 2026",
    season: "Autumn",
    Season: "Autumn",
    year: 2026,
    Year: 2026,
    startDate: "2026-09-01T08:00:00Z",
    endDate: "2026-09-28T18:00:00Z",
    registrationStartDate: "2026-08-01T08:00:00Z",
    registrationEndDate: "2026-08-25T23:59:00Z",
    maxTeams: 40,
    teamCount: 8,
    description: "Thử thách sáng tạo công nghệ và giải pháp phần mềm doanh nghiệp.",
    status: false,
    Status: false,
  },
  {
    id: "EV-03",
    Id: "EV-03",
    eventId: "EV-03",
    EventId: "EV-03",
    eventName: "Cyber Security Student Cup 2026",
    EventName: "Cyber Security Student Cup 2026",
    season: "Spring",
    Season: "Spring",
    year: 2026,
    Year: 2026,
    startDate: "2026-03-01T08:00:00Z",
    endDate: "2026-03-25T18:00:00Z",
    registrationStartDate: "2026-02-01T08:00:00Z",
    registrationEndDate: "2026-02-20T23:59:00Z",
    maxTeams: 30,
    teamCount: 15,
    description: "Giải đấu an toàn thông tin và bảo mật ứng dụng cho sinh viên.",
    status: true,
    Status: true,
  },
];

export const mockCoordinatorRounds = [
  {
    id: "RND-01",
    roundName: "Vòng 1: Sơ Loại & Đánh Giá Ý Tưởng",
    roundNumber: 1,
    startDate: "2026-06-01T08:00:00Z",
    endDate: "2026-06-15T18:00:00Z",
    scoringStartDate: "2026-06-16T08:00:00Z",
    scoringEndDate: "2026-06-20T18:00:00Z",
    advancementRule: "top:10",
  },
  {
    id: "RND-02",
    roundName: "Vòng 2: Hackathon 48H & Demo Day",
    roundNumber: 2,
    startDate: "2026-06-21T08:00:00Z",
    endDate: "2026-06-30T18:00:00Z",
    scoringStartDate: "2026-07-01T08:00:00Z",
    scoringEndDate: "2026-07-03T18:00:00Z",
    advancementRule: "top:3",
  },
];

export const mockCoordinatorTracks = [
  {
    id: "TRK-01",
    trackName: "Advanced Cloud & Infrastructure",
    templateId: "TPL-CLOUD-02",
    description: "Hạng mục phát triển kiến trúc hệ thống đám mây và tối ưu hiệu năng.",
  },
  {
    id: "TRK-02",
    trackName: "AI & Machine Learning Innovation",
    templateId: "TPL-AI-01",
    description: "Hạng mục ứng dụng trí tuệ nhân tạo và học máy vào thực tiễn.",
  },
  {
    id: "TRK-03",
    trackName: "DevOps & Security Compliance",
    templateId: "TPL-DEVOPS-01",
    description: "Hạng mục tự động hóa tích hợp CI/CD và an toàn thông tin.",
  },
];

export const mockCoordinatorTemplates = [
  {
    id: "TPL-CLOUD-02",
    templateId: "TPL-CLOUD-02",
    TemplateId: "TPL-CLOUD-02",
    templateName: "Mẫu Tiêu Chí Cloud Architecture & Scale (100%)",
    TemplateName: "Mẫu Tiêu Chí Cloud Architecture & Scale (100%)",
    description: "Mẫu tiêu chí chuẩn đánh giá kiến trúc vi dịch vụ (Microservices), Kubernetes & Serverless.",
    criterias: [
      { criteriaId: "crit-c1", criterionName: "Kiến trúc Đám mây & Khả năng mở rộng (Scale)", description: "Đánh giá thiết kế Serverless, Kubernetes & Load Balancing", weight: 35, maxScore: 10 },
      { criteriaId: "crit-c2", criterionName: "Tối ưu hóa Chi phí & Hiệu năng (Cost & Perf)", description: "Đánh giá tốc độ truy vấn và độ trễ latency", weight: 35, maxScore: 10 },
      { criteriaId: "crit-c3", criterionName: "Bảo mật Hạ tầng & IAM Policy", description: "Cấu hình tường lửa, mã hóa dữ liệu & IAM role", weight: 30, maxScore: 10 },
    ],
  },
  {
    id: "TPL-AI-01",
    templateId: "TPL-AI-01",
    TemplateId: "TPL-AI-01",
    templateName: "Mẫu Tiêu Chí Trí Tuệ Nhân Tạo & LLM (100%)",
    TemplateName: "Mẫu Tiêu Chí Trí Tuệ Nhân Tạo & LLM (100%)",
    description: "Mẫu tiêu chí đánh giá mô hình học máy, RAG & LLM Fine-tuning.",
    criterias: [
      { criteriaId: "crit-a1", criterionName: "Độ chính xác Mô hình & RAG Benchmark", description: "Đánh giá chỉ số Accuracy, Precision & Recall", weight: 40, maxScore: 10 },
      { criteriaId: "crit-a2", criterionName: "Đột phá Sáng tạo thuật toán AI", description: "Tính mới trong giải pháp giải quyết bài toán thực tế", weight: 30, maxScore: 10 },
      { criteriaId: "crit-a3", criterionName: "Tải thực tế & Tốc độ suy luận (Inference Speed)", description: "Thời gian xử lý token/giây của API", weight: 30, maxScore: 10 },
    ],
  },
  {
    id: "TPL-DEVOPS-01",
    templateId: "TPL-DEVOPS-01",
    TemplateId: "TPL-DEVOPS-01",
    templateName: "Mẫu Tiêu Chí DevOps & CI/CD Security (100%)",
    TemplateName: "Mẫu Tiêu Chí DevOps & CI/CD Security (100%)",
    description: "Mẫu tiêu chí tự động hóa quy trình triển khai và quét lỗ hổng bảo mật.",
    criterias: [
      { criteriaId: "crit-d1", criterionName: "Tự động hóa Pipeline CI/CD", description: "Đánh giá kịch bản GitHub Actions / GitLab CI", weight: 40, maxScore: 10 },
      { criteriaId: "crit-d2", criterionName: "Quét lỗ hổng SAST/DAST & SonarQube", description: "Phân tích mã nguồn và bảo mật container", weight: 30, maxScore: 10 },
      { criteriaId: "crit-d3", criterionName: "Giám sát Hệ thống (Monitoring & Logging)", description: "Cấu hình Prometheus, Grafana & ELK Stack", weight: 30, maxScore: 10 },
    ],
  },
];

export const mockCoordinatorPendingUsers = [
  {
    id: "EXT-001",
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@external.edu.vn",
    schoolName: "Đại học Bách Khoa",
    photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%CCA+BK",
    isApproved: false,
  },
  {
    id: "EXT-002",
    fullName: "Trần Thị B",
    email: "tranthib@external.edu.vn",
    schoolName: "Đại học Khoa học Tự nhiên",
    photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%CCA+KHTN",
    isApproved: false,
  },
  {
    id: "EXT-003",
    fullName: "Lê Văn C",
    email: "levanc@external.edu.vn",
    schoolName: "Đại học Công nghệ Thông tin",
    photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%CCA+UIT",
    isApproved: false,
  },
];

export const mockCoordinatorAppeals = [
  {
    id: "APL-9204",
    teamName: "Alpha Strike",
    submissionRef: "SUB-8812-B",
    primaryReason: "Khiếu nại điểm chí số 2 về môi trường chạy thực tế bị lệch so với benchmark.",
    timestamp: "2026-06-21 14:02Z",
    status: "Pending",
  },
  {
    id: "APL-9205",
    teamName: "Byte Brawlers",
    submissionRef: "SUB-7644-A",
    primaryReason: "Thuật toán xử lý mảng lớn bị bộ chấm tự động tính sai thời gian thực thi.",
    timestamp: "2026-06-21 14:15Z",
    status: "Pending",
  },
  {
    id: "APL-9208",
    teamName: "Cyber Navigators",
    submissionRef: "SUB-1109-C",
    primaryReason: "Kết quả trả về định dạng JSON hợp lệ nhưng bị báo lỗi parse sai schema.",
    timestamp: "2026-06-21 15:40Z",
    status: "Pending",
  },
];

export const mockCoordinatorFinalResults = [
  { id: "res-01", rank: 1, teamName: "ALPHA STRIKE", uid: "SUB-8812-B", finalScore: 88.50, isAdvanced: true },
  { id: "res-02", rank: 2, teamName: "OMEGA SQUAD", uid: "SUB-7644-A", finalScore: 82.10, isAdvanced: true },
  { id: "res-03", rank: 3, teamName: "CYBER NAVIGATORS", uid: "SUB-1109-C", finalScore: 78.40, isAdvanced: true },
  { id: "res-04", rank: 4, teamName: "NULL VOID", uid: "SUB-0091-D", finalScore: 71.20, isAdvanced: false },
  { id: "res-05", rank: 5, teamName: "BYTE BRAWLERS", uid: "SUB-5541-E", finalScore: 68.00, isAdvanced: false },
];
