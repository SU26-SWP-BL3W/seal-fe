# Kế hoạch cải thiện UI/UX — SEAL Frontend

> **Mục tiêu:** Giảm cảm giác "AI template / cyberpunk HUD", tăng độ tin cậy và chuyên nghiệp, giữ dark theme phù hợp hackathon nhưng hướng tới aesthetic **clean, content-first** (tham chiếu: Linear, Vercel, Devpost).
>
> **Ngày lập:** 2026-08-20  
> **Phạm vi:** Toàn bộ `seal-fe` (`src/views`, `src/components`, `src/styles`)

---

## 1. Chẩn đoán hiện trạng

### 1.1 Triệu chứng người dùng cảm nhận

| Triệu chứng | Nguyên nhân kỹ thuật |
|-------------|----------------------|
| "Rất AI", không đẹp | Quá nhiều decoration (glow, scanline, corner `+`, pulse) trên mọi component |
| Thiếu tin cậy | Placeholder hiển thị công khai (`XXX`, UUID dài, metrics marketing giả) |
| Rối mắt | 5+ accent colors cùng lúc, mỗi role/section một màu |
| Không đồng nhất | Login dùng amber hardcode; landing/dashboard dùng teal tokens |
| Khó đọc | `font-mono` + `UPPERCASE` + `tracking-wider` trên hầu hết label |

### 1.2 Điểm mạnh cần giữ

- Design token system (`src/styles/tokens.css`) — single source of truth
- Component library (`Button`, `Card`, `Badge`, `Input`, `Field`)
- Role-based navigation logic
- Dark theme phù hợp đối tượng sinh viên / tech
- i18n (`next-intl`) và `prefers-reduced-motion` đã có

### 1.3 Điểm hiện tại (baseline)

| Tiêu chí | Điểm | Ghi chú |
|----------|------|---------|
| Visual identity | 4/10 | Concept có nhưng over-designed |
| Typography | 5/10 | Font tốt, dùng sai context |
| Color system | 5/10 | Tokens tốt, implementation quá nhiều màu |
| Layout & hierarchy | 5/10 | Grid ổn, mọi section cùng visual weight |
| UX / usability | 6/10 | Flow nghiệp vụ tốt, presentation gây noise |
| Trust / polish | 3/10 | Data giả, page không đồng bộ |

**Mục tiêu sau refactor:** ≥ 7.5/10 trung bình, trust ≥ 8/10.

---

## 2. Design direction mới

### 2.1 Tên phong cách: **"Refined Dark"** (thay "Command Deck HUD")

| Trước (bỏ/giảm) | Sau (ưu tiên) |
|-----------------|---------------|
| HUD, Tactical, Command Deck | SEAL Platform, Workspace |
| Corner brackets `+`, scanline | Whitespace, subtle border |
| Glow mọi nơi | Glow chỉ CTA chính & trạng thái live |
| Mono uppercase labels | Sans-serif sentence case |
| Role badge `[ADM] [05]` | Badge nhỏ, icon + tên role |
| 5 accent colors cùng lúc | 1 primary + semantic + role (muted) |

### 2.2 Nguyên tắc thiết kế

1. **Restraint** — Mỗi màn hình tối đa 1 điểm nhấn visual (hero CTA hoặc spotlight event).
2. **Content first** — Tên sự kiện, deadline, hành động quan trọng nổi hơn decoration.
3. **Consistency** — Mọi page đọc từ `tokens.css`; cấm hardcode màu trong view.
4. **Trust** — Không hiển thị UUID, placeholder, số liệu marketing nếu chưa có data thật.
5. **Progressive disclosure** — Sidebar gọn; chi tiết nghiệp vụ ở trang con.

### 2.3 Tham chiếu (không copy 1:1)

- **Linear** — dark mode, typography, spacing
- **Vercel Dashboard** — restrained panels, ít border
- **Devpost** — hackathon content-first, ảnh sự kiện
- **GitHub** — navigation functional, không game UI

---

## 3. Hệ thống thiết kế (Design System v2)

### 3.1 Color — thu gọn palette

```css
/* Giữ trong tokens.css — chỉnh giá trị, không thêm file mới */

/* Primary — dùng cho CTA, link, focus ring */
--accent-primary: #2dd4bf;

/* Secondary — dùng cho highlight phụ, gradient nhẹ */
--accent-secondary: #38bdf8;

/* Role accents — CHỈ dùng ở badge 12px, sidebar dot, KHÔNG dùng full panel */
--role-team:        #38bdf8;
--role-mentor:      #34d399;
--role-judge:       #fbbf24;
--role-coordinator: #a78bfa;
--role-admin:       #f87171;

/* Semantic — giữ nguyên */
--color-success, --color-danger, --color-warning
```

**Quy tắc:**
- Panel/card: `--bg-panel` + `--border-muted` — không glow mặc định
- Hover: đổi border opacity, không thêm shadow mới
- Gradient: chỉ hero headline hoặc 1 CTA/section

### 3.2 Typography

| Vai trò | Font | Style | Ví dụ |
|---------|------|-------|-------|
| Display / H1 | Chakra Petch | Semibold, **sentence case** | "Nơi ý tưởng công nghệ bứt phá giới hạn" |
| Heading H2–H3 | IBM Plex Sans | Semibold | "Sự kiện nổi bật" |
| Body | IBM Plex Sans | Regular 16px | Mô tả, paragraph |
| Label / caption | IBM Plex Sans | Medium 13px | "Email", "Hạn đăng ký" |
| Mono | JetBrains Mono | Chỉ code, ID rút gọn, timestamp | `#F348…5919` → `#F348C08F` |

**Cấm:** `font-mono` trên button label, sidebar nav, form label (trừ auth code / debug).

### 3.3 Shape & spacing

| Token | Hiện tại | Đề xuất | Lý do |
|-------|----------|---------|-------|
| `--clip-size` | 12px | **8px** hoặc bỏ `hud-clipped` trên input | Góc vát everywhere = AI aesthetic |
| `--space-xl` | 36px | **48px** giữa section landing | Thoáng hơn, ít chật |
| Border radius | clip-path | **`rounded-lg` (8px)** cho card/input | Dễ maintain, quen thuộc hơn |
| Card padding | 24px | Giữ 24px; hero padding 64–80px | |

**Giữ `hud-clipped` cho:** logo container, 1 primary CTA/section (tùy chọn brand).

### 3.4 Motion

| Hiệu ứng | Hành động |
|----------|-----------|
| `hud-pulse`, `hud-scanline-once` | **Xóa** khỏi card thường; giữ tối đa 1 lần ở hero load |
| `hud-live-dot` | Giữ cho trạng thái "Live" / "Đang diễn ra" |
| Hover `-translate-y` | Giảm từ card xuống chỉ link/card clickable chính |
| `prefers-reduced-motion` | Giữ và audit lại toàn bộ animation |

### 3.5 Component guidelines

#### Button
- Primary: teal solid, **sentence case** — "Khám phá sự kiện"
- Secondary: outline `--border-muted`
- Ghost: icon button header
- Bỏ: `hover:bg-white` + white glow (quá gắt)

#### Card
- Default: `border border-[var(--border-muted)] bg-[var(--bg-panel)] rounded-lg p-6`
- Không thêm glow mặc định
- Spotlight card: border-left 3px accent — không cần corner `+`

#### Badge
- Sentence case: "Đang diễn ra", "Đã kết thúc"
- Role badge: icon + "Ban tổ chức" — bỏ `[EC]`, `[05]`

#### Input
- `rounded-lg`, focus ring `--accent-primary`
- Label: IBM Plex Sans, không mono

---

## 4. Kế hoạch theo phase

### Phase 0 — Chuẩn bị (0.5 ngày dev)

**Mục tiêu:** Có spec và checklist trước khi sửa code.

- [ ] Review & approve document này với team
- [ ] Chụp screenshot baseline các màn: landing, login, coordinator dashboard, my-team, judge scoring
- [ ] Tạo branch `cursor/ui-refine-*-7fec`
- [ ] Thêm ESLint rule (optional): cảnh báo hex color hardcode trong `src/views`

**Deliverable:** Baseline screenshots trong `docs/ui-baseline/`

---

### Phase 1 — Foundation (1–2 ngày dev)

**Mục tiêu:** Sửa design system; mọi page sau này inherit tự động.

| Task | File | Chi tiết |
|------|------|----------|
| Cập nhật tokens | `src/styles/tokens.css` | Spacing, thu gọn accent docs |
| Làm mỏng HUD utilities | `src/app/globals.css` | Deprecate `.hud-glow-*` default; document khi nào dùng |
| Refactor Button | `src/components/ui/Button.tsx` | Sentence case default, bỏ white hover glow |
| Refactor Card | `src/components/ui/Card.tsx` | `rounded-lg`, bỏ clip mặc định |
| Refactor Input/Field | `src/components/ui/Input.tsx`, `Field.tsx` | Sans label, rounded-lg |
| Refactor Badge | `src/components/ui/Badge.tsx` | Sentence case |

**Acceptance criteria:**
- Storybook hoặc trang `/design-system` demo (optional) — hoặc verify qua 1 page test
- Không regression build/lint

---

### Phase 2 — Auth & Landing (2–3 ngày dev)

**Mục tiêu:** 2 trang public đầu tiên người dùng thấy — impact cao nhất.

#### 2.1 Login / Register / Forgot password

| Vấn đề | Sửa |
|--------|-----|
| Hardcode `#0f1826`, amber | Dùng `var(--bg-panel)`, `var(--accent-primary)` |
| Mono uppercase heading | Chakra/IBM Plex, sentence case |
| Nút amber gradient | Primary button component |
| `SEAL-HMS` vs `SEAL` | Thống nhất branding "SEAL" |

**Files:** `LoginView.tsx`, `RegisterView.tsx`, `ForgotPasswordView.tsx`, `ResetPasswordView.tsx`, `VerifyEmailView.tsx`

#### 2.2 Landing page

| Section | Hành động |
|---------|-----------|
| Hero | Giảm glow; 1 CTA chính; headline sentence case |
| Quick access tags | Đổi thành text links đơn giản, bỏ border màu 3 loại |
| Metrics strip | Ẩn metric không có data; bỏ "100% Minh bạch" nếu không đo được |
| Event spotlight | Ẩn UUID; truncate ID; fallback tên event |
| Workflow steps | Gộp visual — bỏ "TACTICAL" trong title |
| FAQ | Bỏ prefix `[Q.01]`; accordion chuẩn |
| Footer | Giữ, giảm uppercase |

**Files:** `LandingPortalView.tsx`, `LandingMetricsStrip.tsx`, `LandingWorkflowSteps.tsx`, `LandingLeaderboardPodium.tsx`, `NavigationBar.tsx`, `Footer.tsx`

**Acceptance criteria:**
- Login + landing cùng palette
- Không placeholder `XXX` / UUID full trên production build
- Lighthouse Accessibility ≥ 90 (landing)

---

### Phase 3 — Navigation & Shell (1–2 ngày dev)

**Mục tiêu:** Sidebar/header gọn, dễ scan.

#### DashboardSidebar / NavigationBar

| Trước | Sau |
|-------|-----|
| `QUẢN LÝ BÀI NỘP [05]` | `Bài nộp` |
| `CONTROL CENTER BTC` | `Tổng quan` |
| `HUD v2.0` badge | Bỏ hoặc `Beta` nhỏ |
| `COMMAND DECK` subtitle | Bỏ |
| Section header UPPERCASE dài | Label 11px muted, sentence case |

#### DashboardHeader

| Vấn đề | Sửa |
|--------|-----|
| Countdown fake `18H 45M` | Nối API round thật hoặc ẩn |
| Search không hoạt động | Ẩn đến khi implement hoặc wire search |
| Placeholder UPPERCASE | Sentence case |

**Files:** `DashboardSidebar.tsx`, `DashboardHeader.tsx`, `DashboardShell.tsx`, `NavigationBar.tsx`, `AppLayoutWrapper.tsx`

**Acceptance criteria:**
- Nav item ≤ 20 ký tự (tiếng Việt)
- Active state rõ: bg subtle + border-left, không clip-path mọi item

---

### Phase 4 — Workspace views (3–5 ngày dev)

**Mục tiêu:** Các màn làm việc chính — ưu tiên theo tần suất dùng.

#### Thứ tự ưu tiên

1. **Sinh viên:** `MyTeamView`, `NewSubmissionView`, `EventsDiscoveryView`, `EventDetailView`
2. **Coordinator:** `CoordinatorDashboardView`, `CoordinatorTeamsView`, `CoordinatorSubmissionsView`
3. **Judge:** `JudgeScoringView`, `JudgeTracksView`
4. **Admin:** `AdminDashboardView`, `AdminEventsView`
5. **Còn lại:** Mentor views, wizard tạo event, appeals, profile

#### Pattern áp dụng mỗi view

```
1. Page title: H1 sentence case, không UPPERCASE
2. Stats row: tối đa 4 card, không glow
3. Table: dùng Table component, zebra subtle
4. Empty state: illustration/icon + CTA — không chỉ text mono
5. Action bar: primary 1 nút, secondary text link
```

**Acceptance criteria mỗi view:**
- [ ] Không hex hardcode mới
- [ ] Không `font-mono` trên label form
- [ ] Empty/error state có copy tiếng Việt rõ ràng

---

### Phase 5 — Trust & data polish (1 ngày dev)

**Mục tiêu:** Loại bỏ cảm giác demo.

| Hạng mục | Hành động |
|----------|-----------|
| Event name `XXX` | Fallback: "Sự kiện chưa đặt tên" + ẩn khỏi featured nếu invalid |
| UUID hiển thị | `formatShortId(id)` — 8 ký tự đầu, copy full on click |
| Metrics giả | Chỉ render khi API trả data; skeleton khi loading |
| Countdown header | Wire `useCountdown` từ round active |
| Search | Implement hoặc remove UI |
| `© 2024` footer | Cập nhật năm động |

**Files:** `eventsMetadata.ts`, helpers mới `src/lib/formatId.ts`, các view có hardcoded strings

---

### Phase 6 — QA & rollout (1 ngày dev)

- [ ] Visual regression: so screenshot trước/sau từng phase
- [ ] Responsive: 375px, 768px, 1280px
- [ ] `prefers-reduced-motion`: tắt animation
- [ ] i18n: chuỗi mới đưa vào `messages/vi.json`, `messages/en.json`
- [ ] Lint + build pass
- [ ] Demo nội bộ với 2–3 sinh viên / BTC lấy feedback

---

## 5. Ma trận ưu tiên (Impact × Effort)

```
Impact cao ↑
    │
    │  [P2 Login/Landing]     [P4 Judge Scoring]
    │  [P3 Navigation]        [P4 Event Detail]
    │
    │  [P1 Tokens/Button]     [P4 Admin views]
    │  [P5 Trust/data]
    │
    └──────────────────────────────────→ Effort cao
         Thấp              Trung bình           Cao
```

**Làm trước:** Phase 1 → 2 → 3 → 5 (song song một phần với 2)

**Có thể defer:** Mentor views, wizard step decoration, scanline hero

---

## 6. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| Team quen aesthetic cũ | Phase 2 làm mẫu landing+login trước, review trước khi scale |
| Regression CSS Tailwind v4 | Sửa component trước, view sau; không đổi `@layer` structure |
| Mất brand "SEAL shield" | Giữ logo hex/shield; chỉ bỏ decoration thừa |
| Scope creep | Mỗi PR ≤ 1 phase; không redesign logic nghiệp vụ |
| i18n broken | Mọi string mới qua `next-intl` ngay từ Phase 2 |

---

## 7. Checklist PR (dùng cho mỗi phase)

```markdown
## UI PR Checklist
- [ ] Dùng CSS variables từ tokens.css (không hex mới)
- [ ] Label/button sentence case
- [ ] font-mono chỉ cho code/id/time
- [ ] Không thêm glow/scanline vào card thường
- [ ] Empty/loading/error state
- [ ] Mobile checked
- [ ] prefers-reduced-motion respected
- [ ] Screenshot before/after attached
```

---

## 8. Kết quả mong đợi

Sau khi hoàn thành Phase 1–5:

| Tiêu chí | Trước | Sau (mục tiêu) |
|----------|-------|----------------|
| Visual identity | 4 | 8 |
| Typography | 5 | 8 |
| Color system | 5 | 8 |
| Layout & hierarchy | 5 | 7 |
| UX / usability | 6 | 8 |
| Trust / polish | 3 | 8 |
| **Trung bình** | **4.7** | **7.8** |

Người dùng mới vào landing sẽ cảm nhận **nền tảng hackathon chuyên nghiệp**, không còn cảm giác dashboard game hay template AI.

---

## 9. Bước tiếp theo đề xuất

1. **Review document này** — xác nhận direction "Refined Dark" hoặc điều chỉnh
2. **Bắt đầu Phase 1 + 2** — tokens + login/landing làm proof of concept
3. **Sau khi approve POC** — rollout Phase 3–4 theo thứ tự ưu tiên user

---

*Tài liệu này là living document — cập nhật khi hoàn thành từng phase.*
