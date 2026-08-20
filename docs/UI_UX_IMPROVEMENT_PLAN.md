# Kế hoạch chi tiết cải thiện UI/UX — SEAL Frontend

> **Phiên bản:** 2.0 (chi tiết theo từng màn hình)  
> **Ngày:** 2026-08-20  
> **Phạm vi:** 47 routes · 46 views · 40 domain components  
> **Hướng thiết kế:** **Command Deck** (proposal FE) — góc vát / vuông, gaming-technical; tinh chỉnh hierarchy & logic, **không** đổi sang SaaS `rounded-*`

---

## Mục lục

1. [Tổng quan & nguyên tắc](#1-tổng-quan--nguyên-tắc)
2. [Bảng inventory toàn bộ màn hình](#2-bảng-inventory-toàn-bộ-màn-hình)
3. [Component dùng chung cần tạo trước](#3-component-dùng-chung-cần-tạo-trước)
4. [Chi tiết theo nhóm màn hình](#4-chi-tiết-theo-nhóm-màn-hình)
   - [4.1 Public & Landing](#41-public--landing)
   - [4.2 Auth](#42-auth)
   - [4.3 Sinh viên / Team](#43-sinh-viên--team)
   - [4.4 Coordinator (BTC)](#44-coordinator-btc)
   - [4.5 Giám khảo (Judge)](#45-giám-khảo-judge)
   - [4.6 Cố vấn (Mentor)](#46-cố-vấn-mentor)
   - [4.7 Admin](#47-admin)
   - [4.8 Màn hình orphaned](#48-màn-hình-orphaned)
5. [Navigation & layout shell](#5-navigation--layout-shell)
6. [Lộ trình triển khai theo wave](#6-lộ-trình-triển-khai-theo-wave)
7. [Checklist PR & nghiệm thu](#7-checklist-pr--nghiệm-thu)

---

## 1. Tổng quan & nguyên tắc

### 1.1 Thống kê technical debt (đo từ codebase)

| Metric | Tổng / Max | Ghi chú |
|--------|------------|---------|
| View files | 46 | ~20,557 LOC |
| Routes (`page.tsx`) | 47 | 2 view dùng chung route |
| `font-mono` (views) | ~700+ lần | Quá nhiều cho label/button |
| `hud-clipped` (views) | ~250+ lần | Signature "AI template" |
| Hardcode hex `#...` | ~1,500+ lần | Peak: CoordinatorDashboard (118), MySubmissions (115) |
| View > 800 LOC | 4 | UserProfile (1449), EventDetail (907), JudgeScoring (836), AdminDashboard (822) |
| View không dùng domain component | 27/46 | Cơ hội extract shared shell |

### 1.2 Quy tắc áp dụng cho MỌI màn hình

| # | Quy tắc | Trước | Sau |
|---|---------|-------|-----|
| R1 | Page title | `font-mono uppercase` | `font-display/IBM Plex semibold`, sentence case |
| R2 | Section label | `SYSTEM METRICS // ...` | "Thống kê tổng quan" |
| R3 | Card/panel | `hud-clipped` + glow mọi nơi | `hud-clipped` + border phẳng; glow chỉ 1 vùng primary |
| R4 | Màu | hex inline | `var(--*)` từ `tokens.css` |
| R5 | Role badge | `[EC]`, `[05]` | Icon + "Ban tổ chức" |
| R6 | ID hiển thị | UUID đầy đủ | `formatShortId()` + copy |
| R7 | Empty state | Text mono | Icon + copy + CTA |
| R8 | Auth gate heading | "YÊU CẦU QUYỀN..." làm H1 | `EmptyState` component, title riêng |

### 1.3 Effort sizing

| Size | Ý nghĩa |
|------|---------|
| **S** | Chỉ đổi title, token, spacing — không đổi layout |
| **M** | Refactor 1 layout section + dùng shared component |
| **L** | Tách sub-component, đổi layout chính |
| **XL** | God view split, nhiều sub-component mới |

---

## 2. Bảng inventory toàn bộ màn hình

| # | Route | View file | Role | P | LOC | mono | hud | hex | Effort |
|---|-------|-----------|------|---|-----|------|-----|-----|--------|
| 1 | `/` | LandingPortalView | public | P0 | 557 | 37 | 17 | 0 | L |
| 2 | `/login` | LoginView | public | P0 | 250 | 13 | 6 | 16 | M |
| 3 | `/register` | RegisterView | public | P0 | 288 | 14 | 3 | 0 | M |
| 4 | `/verify-email` | VerifyEmailView | public | P1 | 239 | 4 | 2 | 0 | S |
| 5 | `/forgot-password` | ForgotPasswordView | public | P1 | 94 | 6 | 2 | 0 | S |
| 6 | `/reset-password` | ResetPasswordView | public | P1 | 140 | 8 | 4 | 0 | S |
| 7 | `/change-password` | ForceChangePasswordView | all | P1 | 144 | 8 | 4 | 0 | S |
| 8 | `/events` | EventsDiscoveryView | public/student | P0 | 505 | 22 | 18 | 12 | L |
| 9 | `/events/[id]` | EventDetailView | public/staff | P0 | 907 | 32 | 58 | 44 | XL |
| 10 | `/events/[id]/leaderboard` | LeaderboardView | public | P0 | 357 | 10 | 0 | 13 | M |
| 11 | `/onboarding/profile` | OnboardingProfileView | student | P0 | 579 | 24 | 8 | 0 | L |
| 12 | `/my-team` | MyTeamView | student | P0 | 712 | 13 | 11 | 3 | L |
| 13 | `/my-submissions` | MySubmissionsView | student | P0 | 513 | 12 | 0 | 115 | L |
| 14 | `/submissions/new` | NewSubmissionView | student | P0 | 629 | 29 | 8 | 12 | L |
| 15 | `/my-invitations` | TeamInvitationsView | student | P1 | 261 | 12 | 1 | 0 | M |
| 16 | `/profile` | UserProfileView | all | P0 | 1449 | 35 | 56 | 32 | XL |
| 17 | `/appeals` | AppealsView | student/EC | P1 | 395 | 22 | 4 | 4 | M |
| 18 | `/coordinator` | CoordinatorDashboardView | coordinator | P0 | 478 | 26 | 0 | 118 | L |
| 19 | `/coordinator/dashboard` | CoordinatorDashboardView | coordinator | P0 | (dup #18) | — | — | — | — |
| 20 | `/coordinator/staff` | CoordinatorStaffView | coordinator | P1 | 666 | 34 | 11 | 13 | L |
| 21 | `/coordinator/teams` | CoordinatorTeamsView | coordinator | P0 | 696 | 46 | 11 | 10 | L |
| 22 | `/coordinator/profiles` | CoordinatorProfilesView | coordinator | P1 | 357 | 19 | 0 | 25 | M |
| 23 | `/coordinator/templates` | CoordinatorTemplatesView | coordinator | P1 | 616 | 24 | 0 | 115 | L |
| 24 | `/coordinator/submissions` | CoordinatorSubmissionsView | coordinator | P1 | 430 | 12 | 12 | 11 | M |
| 25 | `/coordinator/publish-results` | CoordinatorPublishResultsView | coordinator | P0 | 642 | 15 | 0 | 110 | L |
| 26 | `/coordinator/prizes` | CoordinatorPrizesView | coordinator | P1 | 542 | 15 | 0 | 85 | L |
| 27 | `/coordinator/calibration` | CoordinatorCalibrationView | coordinator | P2 | 221 | 14 | 0 | 82 | M |
| 28 | `/coordinator/appeals` | CoordinatorAppealsView | coordinator | P1 | 341 | 16 | 0 | 61 | M |
| 29 | `/coordinator/events/new` | CreateEventWizardView | coordinator | P1 | 265 | 12 | 0 | 42 | M |
| 30 | `/coordinator/events/[id]` | CoordinatorEventDetailView | coordinator | P1 | 173 | 12 | 0 | 50 | S |
| 31 | `/coordinator/tracks/[trackId]/assign-template` | CoordinatorAssignTemplateView | coordinator | P1 | 274 | 17 | 0 | 65 | M |
| 32 | `/judge/scoring` | JudgeScoringView | judge | P0 | 836 | 38 | 44 | 31 | XL |
| 33 | `/judge/tracks` | JudgeTracksView | judge | P1 | 289 | 6 | 0 | 21 | M |
| 34 | `/judge/tracks/[trackId]/teams` | JudgeTrackTeamsView | judge | P1 | 225 | 11 | 0 | 10 | M |
| 35 | `/judge/events` | JudgeEventsView | judge | P1 | 368 | 14 | 0 | 15 | M |
| 36 | `/judge/leaderboard` | LeaderboardView | judge | P0 | (dup #10) | — | — | — | — |
| 37 | `/mentor` | MentorTracksView | mentor | P1 | 153 | 9 | 11 | 10 | M |
| 38 | `/mentor/tracks` | MentorTracksView | mentor | P1 | (dup #37) | — | — | — | — |
| 39 | `/mentor/teams` | MentorTeamsView | mentor | P1 | 180 | 9 | 8 | 7 | M |
| 40 | `/mentor/submissions` | MentorSubmissionsView | mentor | P1 | 449 | 9 | 29 | 24 | L |
| 41 | `/admin/dashboard` | AdminDashboardView | admin | P1 | 822 | 70 | 12 | 17 | XL |
| 42 | `/admin/users` | AdminUsersView | admin | P2 | 652 | 31 | 0 | 38 | L |
| 43 | `/admin/schools` | AdminSchoolsView | admin | P2 | 469 | 21 | 3 | 85 | L |
| 44 | `/admin/events` | AdminEventsView | admin | P2 | 345 | 16 | 0 | 14 | M |
| 45 | `/admin/events/new` | AdminCreateEventView | admin | P2 | 405 | 23 | 5 | 1 | M |
| 46 | `/admin/events/[eventId]` | AdminEventDetailView | admin | P2 | 855 | 29 | 1 | 27 | L |
| 47 | `/admin/events/coordinators` | AdminCoordinatorsView | admin | P2 | 631 | 15 | 0 | 17 | L |
| — | *(no route)* | HomeView | dev | P3 | 26 | 1 | 0 | 0 | S |
| — | *(no route)* | MentorProgressView | mentor | P3 | 132 | 10 | 3 | 0 | S |

**Tổng effort ước lượng:** 4 XL + 14 L + 16 M + 8 S + 2 P3 cleanup

---

## 3. Component dùng chung cần tạo trước

Tạo **trước Wave 1** — mọi màn hình sẽ dùng lại.

| Component | Path đề xuất | Dùng bởi (số màn) | Mô tả |
|-----------|---------------|-------------------|-------|
| `AuthLayout` | `components/layout/AuthLayout.tsx` | 6 auth views | Card centered, logo, title slot, footer link |
| `PageHeader` | `components/layout/PageHeader.tsx` | ~40 views | Title + description + breadcrumb + actions slot |
| `PageShell` | `components/layout/PageShell.tsx` | ~35 views | Max-width container, spacing, optional sidebar offset |
| `StatCard` | `components/ui/StatCard.tsx` | 15+ dashboards | Label + value + subtext, border-left accent |
| `EmptyState` | `components/ui/EmptyState.tsx` | ~30 views | Icon + title + description + CTA |
| `AuthGate` | `components/auth/AuthGate.tsx` | 8 views | Thay pattern "YÊU CẦU QUYỀN" làm H1 |
| `DataTable` | `components/ui/DataTable.tsx` | 20+ views | Responsive table + mobile card fallback |
| `FilterBar` | `components/ui/FilterBar.tsx` | 12 views | Search + select filters + reset |
| `ConfirmActionDialog` | *(extend ConfirmDialog)* | 10 views | Destructive action 2-step confirm |
| `formatShortId()` | `lib/formatId.ts` | 15 views | UUID → 8 ký tự + copy tooltip |

---

## 4. Chi tiết theo nhóm màn hình

---

### 4.1 Public & Landing

#### Màn #1 — Landing (`/` → `LandingPortalView.tsx`)

| | |
|---|---|
| **Priority** | P0 · **Effort** L · **LOC** 557 |
| **Domain components** | `SealShield`, `LandingMetricsStrip`, `LandingWorkflowSteps`, `LandingLeaderboardPodium` |

**Layout hiện tại:**
```
[Hero: shield + tag + H1 uppercase + 2 CTA + quick access tags]
[MetricsStrip: 4 stat cards]
[LatestEventSpotlight: command deck panel + countdown + corner +]
[FeaturedEvents: asymmetric grid]
[WorkflowSteps: 4 bước numbered]
[LeaderboardPodium]
[FAQ accordion với [Q.01]]
```

**Vấn đề cụ thể:**
1. Hero H1 toàn uppercase + gradient — khó đọc trên mobile
2. Quick access tags 3 màu khác nhau — rainbow
3. `LatestEventSpotlight`: corner `+`, watermark shield pulse, hiện UUID
4. Metrics "100% Minh bạch", "SEAL System" — marketing giả
5. Inline sub-components (FAQ, PreviewCard) trong cùng file 557 dòng

**Layout mục tiêu:**
```
[Hero: logo nhỏ · H1 sentence case · 1 dòng mô tả · 1 primary CTA · 1 secondary link]
[Metrics: chỉ hiện khi API có data · skeleton khi loading]
[Spotlight event: card sạch · countdown compact · không UUID]
[Events grid: dùng EventCard component thống nhất]
[Workflow: 4 bước icon + title ngắn · bỏ "TACTICAL"]
[Podium: giữ · empty state đẹp hơn]
[FAQ: accordion chuẩn · không [Q.01]]
```

**Tasks cụ thể:**

- [ ] **L1-01** Đổi H1: "Nơi ý tưởng công nghệ bứt phá giới hạn" (sentence case, `font-display`)
- [ ] **L1-02** Quick access → text links inline: "Đội thi · Giám khảo · Ban tổ chức"
- [ ] **L1-03** `LandingMetricsStrip`: ẩn card nếu value = 0 / "Chưa công bố"; bỏ `#EVENTS` tag
- [ ] **L1-04** `LatestEventSpotlight`: xóa corner `+`, `hud-scanline-once`, watermark shield
- [ ] **L1-05** ID event → `formatShortId(event.id)`, không hiện full UUID
- [ ] **L1-06** Tách `LandingFaqSection`, `PreviewSection` ra file riêng trong `components/domain/landing/`
- [ ] **L1-07** CTA button dùng `<Button>` component, không raw `<button className="hud-clipped...">`

**Files sửa:** `LandingPortalView.tsx`, `LandingMetricsStrip.tsx`, `LandingWorkflowSteps.tsx`, `LandingLeaderboardPodium.tsx`

**Acceptance:** Không uppercase title; không UUID; metrics chỉ từ API; Lighthouse a11y ≥ 90

---

#### Màn #8 — Khám phá sự kiện (`/events` → `EventsDiscoveryView.tsx`)

| | |
|---|---|
| **Priority** | P0 · **Effort** L · **LOC** 505 |
| **Domain components** | Inline EventCard (trùng `components/domain/EventCard.tsx`) |

**Layout hiện tại:** Header + search + admin banner + sidebar filter (desktop) + sort tabs + card list

**Vấn đề cụ thể:**
1. Inline `EventCard` duplicate domain component
2. Sidebar filter ẩn mobile không có toggle rõ
3. Background hardcode `#090e11`
4. 18 `hud-clipped` trên list cards

**Tasks cụ thể:**

- [ ] **E8-01** Thay inline card → import `EventCard` từ domain
- [ ] **E8-02** Mobile: thêm `FilterDrawer` button "Bộ lọc" sticky
- [ ] **E8-03** PageHeader: "Khám phá sự kiện" + search trong header
- [ ] **E8-04** Sort tabs → `<select>` hoặc segmented control đơn giản
- [ ] **E8-05** Empty state: "Chưa có sự kiện nào" + CTA admin (nếu role)

**Files sửa:** `EventsDiscoveryView.tsx`, `EventCard.tsx`

---

#### Màn #9 — Chi tiết sự kiện (`/events/[id]` → `EventDetailView.tsx`)

| | |
|---|---|
| **Priority** | P0 · **Effort** XL · **LOC** 907 (58 hud — cao nhất app) |

**Layout hiện tại:** Hero + countdown + role workspace dock + 5 tabs (timeline/tracks/prizes/rules/teams)

**Vấn đề cụ thể:**
1. God view 907 dòng — hero + tabs + role dock + modals
2. 58 `hud-clipped` — visual noise cực cao
3. Role dock (judge/coordinator/mentor shortcuts) gây rối cho guest
4. Tab content depth không đều

**Layout mục tiêu — tách thành:**
```
components/domain/event-detail/
  EventDetailHero.tsx       — tên, status, countdown, CTA đăng ký
  EventDetailTabs.tsx       — tab shell
  EventTimelineTab.tsx
  EventTracksTab.tsx
  EventPrizesTab.tsx
  EventRulesTab.tsx
  EventTeamsTab.tsx         — AvailableTeamsList
  EventStaffDock.tsx        — chỉ render khi logged-in staff
```

**Tasks cụ thể:**

- [ ] **E9-01** Tách 7 sub-components (giữ logic trong viewModel)
- [ ] **E9-02** Hero: bỏ hud-clipped trên badges; 1 gradient max
- [ ] **E9-03** Staff dock: collapse thành dropdown "Không gian làm việc" thay block riêng
- [ ] **E9-04** Tab bar: underline style, không clip-path
- [ ] **E9-05** Guest CTA sticky bottom mobile: "Đăng ký tham gia"
- [ ] **E9-06** Thay hex colors → tokens

**Acceptance:** File view ≤ 200 LOC; mỗi tab ≤ 150 LOC; 0 hud-clipped trong tabs

---

#### Màn #10 — Bảng xếp hạng (`/events/[id]/leaderboard`, `/judge/leaderboard` → `LeaderboardView.tsx`)

| | |
|---|---|
| **Priority** | P0 · **Effort** M · **LOC** 357 |

**Tasks cụ thể:**

- [ ] **L10-01** PageHeader + breadcrumb về event
- [ ] **L10-02** Podium (`LandingLeaderboardPodium`) + table: podium collapse trên mobile
- [ ] **L10-03** Phân biệt judge route vs public: judge thấy thêm cột chi tiết điểm
- [ ] **L10-04** Empty state: "Kết quả chưa công bố" + thời gian dự kiến
- [ ] **L10-05** Nút "Chia sẻ" (copy link) — optional P2

---

### 4.2 Auth

> **Mục tiêu nhóm:** 6 màn dùng chung `AuthLayout` — cùng palette teal, không amber.

#### Màn #2 — Login (`/login` → `LoginView.tsx`) · P0 · M

| Vấn đề | Task |
|--------|------|
| Hardcode `#0f1826`, `#1e2e4a`, amber | **A2-01** Wrap `AuthLayout`; dùng `var(--bg-panel)`, `var(--accent-primary)` |
| H1 mono uppercase | **A2-02** "Chào mừng trở lại" — IBM Plex semibold |
| Submit button amber gradient | **A2-03** Dùng `<Button variant="primary">` |
| Google button styling | **A2-04** Container `rounded-lg overflow-hidden` |
| Input hud-clipped | **A2-05** Dùng `<Input>` component |

#### Màn #3 — Register (`/register` → `RegisterView.tsx`) · P0 · M

- [ ] **A3-01** `AuthLayout` — đồng bộ Login
- [ ] **A3-02** Hiện password rules trước khi submit (bullet list)
- [ ] **A3-03** Success step "Xác thực email" — icon email lớn, countdown redirect

#### Màn #4 — Verify email (`/verify-email`) · P1 · S

- [ ] **A4-01** `AuthLayout` + loading/success/error states dùng `EmptyState`
- [ ] **A4-02** Hiện countdown "Chuyển hướng sau X giây"

#### Màn #5 — Forgot password · P1 · S

- [ ] **A5-01** `AuthLayout`
- [ ] **A5-02** Success state nổi bật (banner xanh trong card)

#### Màn #6 — Reset password · P1 · S

- [ ] **A6-01** `AuthLayout`
- [ ] **A6-02** Invalid token → link "Gửi lại email khôi phục"

#### Màn #7 — Force change password (`/change-password`) · P1 · S

- [ ] **A7-01** `AuthLayout` + warning banner vàng
- [ ] **A7-02** Hiện password policy + nút "Đăng xuất" secondary

**AuthLayout spec:**
```tsx
// components/layout/AuthLayout.tsx
<main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md">
    <div className="rounded-xl border border-muted bg-panel p-8 shadow-lg">
      {logo}{title}{children}{footer}
    </div>
  </div>
</main>
```

---

### 4.3 Sinh viên / Team

#### Màn #11 — Onboarding profile (`/onboarding/profile`) · P0 · L

**States:** choose path → FPT form / non-FPT upload → pending → locked → rejected

| Task | Chi tiết |
|------|----------|
| **S11-01** | Step indicator 3 bước top |
| **S11-02** | Locked/rejected: `EmptyState` + CTA "Liên hệ BTC" / "Gửi lại hồ sơ" |
| **S11-03** | Upload: preview ảnh + progress bar |
| **S11-04** | Tách `FptVerificationForm`, `ExternalStudentUploadForm` |

---

#### Màn #12 — My Team (`/my-team`) · P0 · L

**Layout:** No-team (tabs: tạo / tìm / lời mời) · Has-team (header, roster, invite, checklist, countdown)

| Task | Chi tiết |
|------|----------|
| **S12-01** | PageHeader dynamic: "Không gian đội" / `{teamName}` |
| **S12-02** | Tab switcher dùng Button group, không custom clip |
| **S12-03** | Registration checklist: progress ring thay bullet list |
| **S12-04** | Modal states giữ nguyên logic, đổi styling tokens |
| **S12-05** | Mobile: roster card layout thay table |

**Domain components giữ:** `TeamHeader`, `MemberRoster`, `CreateTeamForm`, `InvitePanel`, `RegistrationChecklist`, `TeamCountdownTimer`

---

#### Màn #13 — My Submissions (`/my-submissions`) · P0 · L

**Debt cao:** 115 hex — dùng legacy `glow-box`, `hex-bg`

| Task | Chi tiết |
|------|----------|
| **S13-01** | **Priority:** thay toàn bộ hex → tokens (115 chỗ) |
| **S13-02** | Table → `DataTable` responsive |
| **S13-03** | Edit modal → tách `SubmissionEditModal` |
| **S13-04** | Feedback panel: card bên phải desktop, accordion mobile |
| **S13-05** | Link "Nộp phúc khảo" rõ ràng khi eligible |

---

#### Màn #14 — New Submission (`/submissions/new`) · P0 · L

| Task | Chi tiết |
|------|----------|
| **S14-01** | Progress summary top: "2/3 hạng mục đã nộp" |
| **S14-02** | Tách `SubmissionTrackCard` → domain component |
| **S14-03** | URL validation inline icon ✓/✗ |
| **S14-04** | Submit sticky footer mobile |

---

#### Màn #15 — My Invitations (`/my-invitations`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **S15-01** | Title thống nhất: "Lời mời của tôi" (giữ sentence case) |
| **S15-02** | 2 section rõ: "Lời mời vào đội" vs "Phân công vai trò" — icon + màu border khác |
| **S15-03** | Cân nhắc merge vào MyTeam tab — nếu giữ route riêng thì link cross-nav |

---

#### Màn #16 — User Profile (`/profile`) · P0 · XL

**Largest view:** 1449 LOC · 56 hud-clipped

**Tách thành tabs theo role:**
```
ProfileIdentityTab     — avatar, tên, email, role badges
ProfileStudentTab      — student form, FPT verify, upload (ẩn nếu staff)
ProfileStaffTab        — event assignments table (ẩn nếu student thuần)
ProfileSecurityTab     — đổi mật khẩu
ProfileHistoryTab      — team history, rejections (optional P2)
```

| Task | Chi tiết |
|------|----------|
| **S16-01** | Tab shell — chỉ render tab relevant cho role |
| **S16-02** | `getRoleDetails()` → dùng `Badge` tone thay inline tailwind hex |
| **S16-03** | Staff assignment: `DataTable` thay custom table |
| **S16-04** | Mục tiêu: view file ≤ 150 LOC, mỗi tab ≤ 200 LOC |

---

#### Màn #17 — Appeals (`/appeals`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **S17-01** | Tách student view vs EC view — hoặc redirect EC → `/coordinator/appeals` |
| **S17-02** | Form: dùng `Field` + `Input` + `select` styled |
| **S17-03** | Status timeline cho mỗi appeal |

---

### 4.4 Coordinator (BTC)

> **Pattern chung coordinator:** Mọi màn có `PageHeader` + event selector (nếu multi-event) + `FilterBar` + `DataTable`. Thu hex trước, layout sau.

#### Màn #18 — Coordinator Dashboard (`/coordinator`, `/coordinator/dashboard`) · P0 · L

**Debt:** 118 hex — cao nhất app

| Task | Chi tiết |
|------|----------|
| **C18-01** | **Critical:** replace 118 hex → CSS variables |
| **C18-02** | Title: "Tổng quan sự kiện" (bỏ "TRUNG TÂM CHỈ HUY") |
| **C18-03** | Event selector: dropdown compact top-right |
| **C18-04** | Alert cards: pending teams (N), pending profiles (N) — clickable → route |
| **C18-05** | Round timeline: horizontal stepper thay list badge |
| **C18-06** | Redirect `/coordinator` → `/coordinator/dashboard` (hoặc ngược lại, chọn 1) |

---

#### Màn #19 — Coordinator Teams (`/coordinator/teams`) · P0 · L

| Task | Chi tiết |
|------|----------|
| **C19-01** | 2 zone: "Chờ duyệt (N)" highlight amber border + "Tất cả đội" |
| **C19-02** | Approve/reject: modal confirm với lý do bắt buộc khi reject |
| **C19-03** | `DataTable` + mobile card |
| **C19-04** | 46 mono usages → giảm còn ≤ 5 (chỉ ID/time) |

---

#### Màn #20 — Publish Results (`/coordinator/publish-results`) · P0 · L

**Debt:** 110 hex — màn high-stakes

| Task | Chi tiết |
|------|----------|
| **C20-01** | Replace hex → tokens |
| **C20-02** | 2-step publish: preview table → confirm dialog tóm tắt |
| **C20-03** | Unpublished rows: checkbox select + bulk publish |
| **C20-04** | Visual diff: published = green dot, draft = gray |

---

#### Màn #21 — Coordinator Staff (`/coordinator/staff`) · P1 · L

| Task | Chi tiết |
|------|----------|
| **C21-01** | 3 invite forms: stack vertical mobile, 3-col desktop |
| **C21-02** | Tách `StaffInviteCard` component |
| **C21-03** | Assigned staff: tabs Judge / Mentor / Coordinator |

---

#### Màn #22 — Coordinator Profiles (`/coordinator/profiles`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **C22-01** | `AuthGate` thay "YÊU CẦU QUYỀN" làm H1 |
| **C22-02** | Queue card: ảnh thumbnail + approve/reject swipe-friendly mobile |
| **C22-03** | Batch approve checkbox |

---

#### Màn #23 — Templates (`/coordinator/templates`) · P1 · L

**Debt:** 115 hex

| Task | Chi tiết |
|------|----------|
| **C23-01** | Replace hex |
| **C23-02** | Template list left + editor right (master-detail) desktop |
| **C23-03** | Criteria weight: slider + sum validation = 100% |
| **C23-04** | Undo last change trong editor modal |

---

#### Màn #24 — Submissions (`/coordinator/submissions`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **C24-01** | Title sentence case thống nhất |
| **C24-02** | URL column: icon link + truncate + copy |
| **C24-03** | Inline preview modal (iframe/link open) |

---

#### Màn #25 — Prizes (`/coordinator/prizes`) · P1 · L

**Debt:** 85 hex

| Task | Chi tiết |
|------|----------|
| **C25-01** | Replace hex |
| **C25-02** | Prize tier: draggable reorder |
| **C25-03** | Live preview panel "Hiển thị công khai" bên phải |

---

#### Màn #26 — Calibration (`/coordinator/calibration`) · P2 · M

| Task | Chi tiết |
|------|----------|
| **C26-01** | Title: "Phân tích điểm số" (bỏ "PHÒNG PHÂN TÍCH") |
| **C26-02** | Charts: label + legend accessible |
| **C26-03** | 82 hex → tokens |

---

#### Màn #27 — Appeals (`/coordinator/appeals`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **C27-01** | Queue sorted by urgency (pending longest first) |
| **C27-02** | SLA badge: "> 48h" red |
| **C27-03** | Detail drawer thay inline expand |

---

#### Màn #28 — Create Event Wizard (`/coordinator/events/new`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **C28-01** | Step indicator 1-4-6 (note: Step5 StaffAssignment missing — wire hoặc document skip) |
| **C28-02** | Wizard header dùng `PageHeader` |
| **C28-03** | Steps giữ logic, restyle inputs qua `Field`/`Input` |

**Wizard steps (files):**
- `Step1EventBasicInfo.tsx` — S
- `Step2RoundConfig.tsx` — M
- `Step3TrackConfig.tsx` — M
- `Step4TemplateCriteriaEditor.tsx` — L
- `Step5StaffAssignment.tsx` — M (hiện chưa wired)
- `Step6EventConfirmation.tsx` — S

---

#### Màn #29 — Coordinator Event Detail (`/coordinator/events/[id]`) · P1 · S

| Task | Chi tiết |
|------|----------|
| **C29-01** | Checklist config: sort by blocking (red = chưa xong, chặn publish) |
| **C29-02** | Link nhanh → staff/templates/teams dạng button grid |
| **C29-03** | 50 hex → tokens |

---

#### Màn #30 — Assign Template (`/coordinator/tracks/[trackId]/assign-template`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **C30-01** | Diff view: criteria side-by-side current vs selected |
| **C30-02** | Cân nhắc merge vào wizard Step 4 — giảm standalone page |
| **C30-03** | 65 hex → tokens |

---

### 4.5 Giám khảo (Judge)

> **Mục tiêu nhóm:** Consolidate nav — `/judge/scoring` là hub chính; events/tracks/teams là secondary hoặc merge.

#### Màn #32 — Judge Scoring (`/judge/scoring`) · P0 · XL

**Debt:** 836 LOC · 44 hud-clipped

**Tách thành:**
```
JudgeScoringShell.tsx       — layout + track selector
JudgeScoringWaiting.tsx     — time-gate screen
JudgeSubmissionPicker.tsx   — danh sách bài cần chấm
JudgeScoringForm.tsx        — rubric + save/submit
JudgeAnonymousPanel.tsx     — thông tin ẩn danh
```

| Task | Chi tiết |
|------|----------|
| **J32-01** | Tách 5 sub-components |
| **J32-02** | Bỏ hud-clipped trên form fields (44 → 0) |
| **J32-03** | Waiting vs scoring: shared header, không full-page swap |
| **J32-04** | Rubric: sticky score summary sidebar desktop |
| **J32-05** | Autosave indicator "Đã lưu nháp" |
| **J32-06** | Keyboard nav giữa tiêu chí (accessibility) |

---

#### Màn #33 — Judge Tracks (`/judge/tracks`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **J33-01** | Bỏ heading `[ YÊU CẦU QUYỀN GIÁM KHẢO ]` bracket style |
| **J33-02** | Track cards → link thẳng `/judge/scoring?trackId=` |
| **J33-03** | Fake progress bar (`idx * 35`) → real submission count |

---

#### Màn #34 — Judge Track Teams (`/judge/tracks/[trackId]/teams`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **J34-01** | Cân nhắc deprecate — merge vào scoring picker |
| **J34-02** | Nếu giữ: scoring status column + progress bar |

---

#### Màn #35 — Judge Events (`/judge/events`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **J35-01** | Redirect hoặc merge vào `/judge/tracks` |
| **J35-02** | `AuthGate` pattern |

---

### 4.6 Cố vấn (Mentor)

#### Màn #37 — Mentor Tracks (`/mentor`, `/mentor/tracks`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **M37-01** | Redirect `/mentor` → `/mentor/tracks` |
| **M37-02** | Track cards: real stats, bỏ fake progress |
| **M37-03** | Empty state gọn |

---

#### Màn #39 — Mentor Teams (`/mentor/teams`) · P1 · M

| Task | Chi tiết |
|------|----------|
| **M39-01** | `DataTable` + search |
| **M39-02** | Progress column: submitted/total tracks |
| **M39-03** | Row click → `/mentor/submissions?teamId=` |

---

#### Màn #40 — Mentor Submissions (`/mentor/submissions`) · P1 · L

**Debt:** 29 hud-clipped

| Task | Chi tiết |
|------|----------|
| **M40-01** | Bỏ hud-clipped trên feedback form |
| **M40-02** | Autosave draft feedback |
| **M40-03** | Submission switcher: dropdown thay `[ TEAM ]` bracket |
| **M40-04** | Split: `MentorSubmissionDetail.tsx` |

---

### 4.7 Admin

> **Pattern chung admin:** Functional table-first; ưu tiên thấp hơn student/coordinator. Focus: token cleanup + `DataTable`.

#### Màn #41 — Admin Dashboard (`/admin/dashboard`) · P1 · XL

**Debt:** 70 mono · 822 LOC

| Task | Chi tiết |
|------|----------|
| **AD41-01** | Tách: `AdminStatsStrip`, `AdminEventGrid`, `AdminQuickActions` |
| **AD41-02** | Giảm mono 70 → ≤ 10 |
| **AD41-03** | Event grid/list: default grid cards |
| **AD41-04** | Modals giữ: `ComprehensiveEventEditModal`, `AdminCoordinatorModal` |

---

#### Màn #42 — Admin Users (`/admin/users`) · P2 · L

| Task | Chi tiết |
|------|----------|
| **AD42-01** | `AuthGate` |
| **AD42-02** | Tab: "Tất cả" / "Chờ duyệt" |
| **AD42-03** | `StudentProfileModal` giữ, styling tokens |

---

#### Màn #43 — Admin Schools (`/admin/schools`) · P2 · L

**Debt:** 85 hex

| Task | Chi tiết |
|------|----------|
| **AD43-01** | Replace 85 hex |
| **AD43-02** | Add/edit form → modal thay inline row |
| **AD43-03** | `AuthGate` |

---

#### Màn #44 — Admin Events (`/admin/events`) · P2 · M

| Task | Chi tiết |
|------|----------|
| **AD44-01** | `DataTable` + filter |
| **AD44-02** | Align card style với EventsDiscovery |

---

#### Màn #45 — Admin Create Event (`/admin/events/new`) · P2 · M

| Task | Chi tiết |
|------|----------|
| **AD45-01** | Reuse coordinator wizard hoặc shared form components |
| **AD45-02** | Step progress indicator |

---

#### Màn #46 — Admin Event Detail (`/admin/events/[eventId]`) · P2 · L

| Task | Chi tiết |
|------|----------|
| **AD46-01** | Shared `EventDetailHero` với public view |
| **AD46-02** | Admin actions: sticky action bar (Publish, Revoke, Edit) |
| **AD46-03** | 27 hex → tokens |

---

#### Màn #47 — Admin Coordinators (`/admin/events/coordinators`) · P2 · L

| Task | Chi tiết |
|------|----------|
| **AD47-01** | `DataTable` + event filter |
| **AD47-02** | Assign EC: modal confirm |
| **AD47-03** | 17 hex → tokens |

---

### 4.8 Màn hình orphaned

| View | Đề xuất | Task |
|------|---------|------|
| `HomeView.tsx` | Xóa hoặc route `/dev/health` (admin only) | **O-01** |
| `MentorProgressView.tsx` | Wire `/mentor/progress` hoặc merge vào MentorTeams | **O-02** |

---

## 5. Navigation & layout shell

### 5.1 `NavigationBar.tsx` (~1000 LOC)

| Task | Chi tiết |
|------|----------|
| **NAV-01** | Tách theo role: `AdminSidebar`, `CoordinatorSidebar`, `PublicNavbar` — đã partial, tiếp tục split file |
| **NAV-02** | Label nav: sentence case — "Bài nộp" thay "QUẢN LÝ BÀI NỘP [05]" |
| **NAV-03** | Bỏ badge `HUD v2.0`, `COMMAND DECK` |
| **NAV-04** | Role badge sidebar: `[ADM]` → icon + tooltip |
| **NAV-05** | Public navbar: sticky, blur backdrop, không lattice background |

### 5.2 `DashboardHeader.tsx`

| Task | Chi tiết |
|------|----------|
| **HDR-01** | Countdown fake → wire API hoặc **remove** |
| **HDR-02** | Search → implement basic hoặc **remove** |
| **HDR-03** | Placeholder sentence case |

### 5.3 `AppLayoutWrapper.tsx`

| Task | Chi tiết |
|------|----------|
| **LAY-01** | Mentor/Judge sidebar flags hiện `false` — quyết định: enable vertical sidebar hoặc giữ horizontal nav |
| **LAY-02** | Footer: chỉ landing + `/events`; cập nhật copyright year dynamic |

### 5.4 `Footer.tsx`

| Task | Chi tiết |
|------|----------|
| **FTR-01** | Giảm uppercase links |
| **FTR-02** | `© {year} SEAL` dynamic |

---

## 6. Lộ trình triển khai theo wave

### Wave 0 — Foundation (blocker cho mọi wave sau)

| ID | Task | Files |
|----|------|-------|
| W0-1 | Cập nhật `tokens.css` (spacing 48px, clip 8px) | `styles/tokens.css` |
| W0-2 | Refactor Button, Card, Input, Badge, Field | `components/ui/*` |
| W0-3 | Tạo AuthLayout, PageHeader, PageShell, EmptyState, StatCard, DataTable | `components/layout/*`, `components/ui/*` |
| W0-4 | Tạo `formatShortId()` | `lib/formatId.ts` |
| W0-5 | Làm mỏng `globals.css` HUD utilities | `app/globals.css` |

**PR:** `refactor/design-system-v2`

---

### Wave 1 — Public funnel (P0, 8 màn)

| Màn | Task IDs |
|-----|----------|
| Landing #1 | L1-01 → L1-07 |
| Login #2 | A2-01 → A2-05 |
| Register #3 | A3-01 → A3-03 |
| Events #8 | E8-01 → E8-05 |
| Event Detail #9 | E9-01 → E9-06 |
| Leaderboard #10 | L10-01 → L10-04 |
| Onboarding #11 | S11-01 → S11-04 |
| NAV public | NAV-05, FTR-01 |

**PR:** `refactor/ui-wave-1-public`

---

### Wave 2 — Student workspace (P0, 5 màn)

| Màn | Task IDs |
|-----|----------|
| My Team #12 | S12-01 → S12-05 |
| My Submissions #13 | S13-01 → S13-05 |
| New Submission #14 | S14-01 → S14-04 |
| User Profile #16 | S16-01 → S16-04 |
| Invitations #15 | S15-01 → S15-03 |

**PR:** `refactor/ui-wave-2-student`

---

### Wave 3 — Coordinator critical (P0, 3 màn)

| Màn | Task IDs |
|-----|----------|
| Dashboard #18 | C18-01 → C18-06 |
| Teams #19 | C19-01 → C19-04 |
| Publish Results #20 | C20-01 → C20-04 |
| NAV coordinator | NAV-01 → NAV-04 |

**PR:** `refactor/ui-wave-3-coordinator-p0`

---

### Wave 4 — Judge + auth secondary (P0-P1)

| Màn | Task IDs |
|-----|----------|
| Judge Scoring #32 | J32-01 → J32-06 |
| Judge Tracks/Events #33-35 | J33-01 → J35-02 |
| Auth #4-7 | A4 → A7 |
| Appeals #17 | S17-01 → S17-03 |

**PR:** `refactor/ui-wave-4-judge-auth`

---

### Wave 5 — Coordinator secondary (P1, 9 màn)

| Màn | Task IDs |
|-----|----------|
| Staff #21 | C21-01 → C21-03 |
| Profiles #22 | C22-01 → C22-03 |
| Templates #23 | C23-01 → C23-04 |
| Submissions #24 | C24-01 → C24-03 |
| Prizes #25 | C25-01 → C25-03 |
| Appeals #27 | C27-01 → C27-03 |
| Wizard #28 | C28-01 → C28-03 |
| Event Detail #29 | C29-01 → C29-03 |
| Assign Template #30 | C30-01 → C30-03 |

**PR:** `refactor/ui-wave-5-coordinator-p1`

---

### Wave 6 — Mentor + Admin (P1-P2)

| Màn | Task IDs |
|-----|----------|
| Mentor #37-40 | M37 → M40 |
| Admin #41-47 | AD41 → AD47 |
| Calibration #26 | C26-01 → C26-03 |
| Orphaned | O-01, O-02 |

**PR:** `refactor/ui-wave-6-mentor-admin`

---

### Wave 7 — QA & polish

- [ ] Screenshot regression 47 routes
- [ ] Responsive 375 / 768 / 1280
- [ ] `prefers-reduced-motion` audit
- [ ] i18n: strings mới → `messages/vi.json`, `messages/en.json`
- [ ] Grep audit: `#hex` count → target < 50 toàn app
- [ ] Grep audit: `hud-clipped` → target < 20 (logo + 1 CTA)
- [ ] User test 3 sinh viên + 1 BTC + 1 judge

---

## 7. Checklist PR & nghiệm thu

### 7.1 Checklist mỗi PR

```markdown
- [ ] Chỉ sửa scope wave đã định — không scope creep
- [ ] 0 hex mới (grep `#` trong diff)
- [ ] font-mono không tăng net count
- [ ] hud-clipped không tăng net count
- [ ] Page title sentence case
- [ ] EmptyState cho mọi list có thể rỗng
- [ ] Mobile 375px không horizontal scroll
- [ ] Build + lint pass
- [ ] Screenshot before/after mỗi màn trong PR
```

### 7.2 Nghiệm thu theo màn (copy cho từng PR)

| Màn | Route | Visual ✓ | Mobile ✓ | Tokens ✓ | Empty ✓ |
|-----|-------|----------|----------|----------|---------|
| | | | | | |

### 7.3 KPI đo lường cuối Wave 7

| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Hardcode hex (views) | ~1,500 | < 50 |
| hud-clipped (views) | ~250 | < 20 |
| font-mono trên labels | ~700 | < 100 |
| View > 500 LOC | 18 | ≤ 5 |
| Views không dùng shared shell | 27 | 0 |

---

## Phụ lục A — Map route → task ID nhanh

```
/ ............................ L1-*
/login ....................... A2-*
/register ..................... A3-*
/events ...................... E8-*
/events/[id] ................. E9-*
/events/[id]/leaderboard ..... L10-*
/onboarding/profile ........... S11-*
/my-team ..................... S12-*
/my-submissions .............. S13-*
/submissions/new ............. S14-*
/profile ..................... S16-*
/coordinator/dashboard ....... C18-*
/coordinator/teams ........... C19-*
/coordinator/publish-results . C20-*
/judge/scoring ............... J32-*
```

## Phụ lục B — Component domain cần tạo mới

```
components/domain/landing/
  LandingFaqSection.tsx
  LandingEventSpotlight.tsx
  LandingPreviewSection.tsx

components/domain/event-detail/
  EventDetailHero.tsx
  EventDetailTabs.tsx
  EventTimelineTab.tsx
  ... (7 files)

components/domain/judge/
  JudgeScoringShell.tsx
  JudgeScoringForm.tsx
  ... (5 files)

components/domain/profile/
  ProfileIdentityTab.tsx
  ProfileStudentTab.tsx
  ProfileStaffTab.tsx
  ProfileSecurityTab.tsx

components/domain/submission/
  SubmissionTrackCard.tsx
  SubmissionEditModal.tsx
```

---

*Tài liệu living document — cập nhật task status khi hoàn thành từng wave.*
