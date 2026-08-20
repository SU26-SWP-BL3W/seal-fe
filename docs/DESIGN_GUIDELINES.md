# SEAL Design Guidelines — Refined Dark

> Gộp từ: Canvas skill (anti-slop), UI/UX Improvement Plan, layout patterns (Linear / Vercel / Devpost).

## Nguyên tắc cốt lõi

1. **Content first** — nội dung và hành động nổi hơn decoration.
2. **Visual hierarchy** — một vùng primary mỗi màn; phần còn lại compact, neutral.
3. **Restraint** — màu accent dùng có chủ đích, không phủ khắp UI.

## Cấm (AI slop patterns)

| Pattern | Ví dụ cũ | Thay bằng |
|---------|----------|-----------|
| Gradient text/bg | `bg-gradient-to-r from-teal...` | Màu solid `--accent-primary` |
| Glow / box-shadow | `shadow-[0_0_20px...]`, `hud-glow-*` | Flat border hoặc không shadow |
| Rainbow accents | Mỗi card một màu border | Neutral card; accent 1 CTA |
| Mono + UPPERCASE labels | `font-mono uppercase tracking-wider` | IBM Plex, sentence case |
| Decorative borders | corner `+`, scanline, pulse | Whitespace |
| Wall of identical cards | 4 stat cards cùng style nặng | StatCard gọn, label nhỏ |
| HUD clip everywhere | `hud-clipped` trên mọi thứ | `rounded-lg` (8px) |
| Fake metrics | "100% Minh bạch" | Chỉ data từ API |
| UUID full | `#F348C08F...` | `formatShortId()` |

## Bố cục chuẩn (layout format)

### Public page
```
PageShell (max-width 1280, px py)
  PageHeader (title + description + actions)
  [Primary section — hero hoặc spotlight]
  [Secondary grid — 2–3 cột desktop, 1 cột mobile]
  [Tertiary — FAQ, footer links]
```

### Auth page
```
AuthLayout (centered, max-w-md)
  logo + title (sentence case)
  form fields (Field + Input)
  primary Button
  footer link
```

### Dashboard / workspace
```
PageShell
  PageHeader + optional event selector (actions slot)
  StatCard row (max 4, chỉ số thật)
  FilterBar (search + filters)
  DataTable / card list
  EmptyState khi rỗng
```

### Spacing scale (tokens)
- Section gap: `--space-xl` (48px)
- Card padding: 24px (`p-6`)
- Field gap: 6px label → input

## Typography

| Vai trò | Font | Size |
|---------|------|------|
| H1 page | Chakra Petch / display | 24–32px, semibold |
| H2 section | IBM Plex Sans | 18–20px, semibold |
| Body | IBM Plex Sans | 14–16px |
| Label | IBM Plex Sans | 14px medium |
| Mono | JetBrains Mono | Chỉ ID, timestamp, code |

## Color usage

- **Primary CTA:** `--accent-primary` (teal)
- **Semantic:** success / danger / warning — badge và alert only
- **Role colors:** badge nhỏ sidebar, không full panel
- **Surface:** `--bg-base` → `--bg-panel` → `--bg-input`

## Component mapping

| Need | Component |
|------|-----------|
| Auth screens | `AuthLayout` |
| Page title | `PageHeader` |
| Container | `PageShell` |
| Empty list | `EmptyState` |
| KPI | `StatCard` |
| Form | `Field` + `Input` + `Button` |
| Status | `Badge` (sentence case) |
| Panel | `Card` (rounded-lg, no glow) |

## Pre-delivery checklist (mỗi PR)

- [ ] Squint test: có 1 điểm nhấn rõ?
- [ ] Không gradient / glow / shadow decorative?
- [ ] Title sentence case?
- [ ] Không hex hardcode mới?
- [ ] Empty state khi list rỗng?
- [ ] Mobile 375px không scroll ngang?
