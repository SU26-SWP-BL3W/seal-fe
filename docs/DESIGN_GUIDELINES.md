# SEAL Design Guidelines — Command Deck

> Nguồn gốc: **SEAL UI/UX Design Proposal** (Command Deck / Obsidian Dark).  
> Cải thiện UX = hierarchy + copy + logic — **không** đổi sang SaaS bo tròn / “nhẵn mịn”.

## Hình học (bắt buộc — Geometric Discipline)

| Surface | Shape | Class / token |
|---------|-------|----------------|
| Button, Card, panel CTA | Góc **vát** (clip) | `.hud-clipped` + `--clip-size` |
| Input, table cell | Góc **vuông** | `border-radius: 0` — không clip |
| Badge / chip | Góc vuông | Không `rounded-full` / pill |
| Status dot | Tròn nhỏ OK | Chỉ indicator 6–10px |

**Cấm:** `rounded-lg` / `rounded-xl` / pill thay cho clip trên panel & CTA.  
Đó là lệch proposal → nhìn “app mềm”, mất chất gaming / technical.

## Nguyên tắc cốt lõi

1. **Command Deck** — Obsidian surfaces, mint accent, Chakra Petch + IBM Plex + JetBrains Mono.
2. **Content first** — hành động và data thật nổi hơn decoration.
3. **Restraint** — glow / scanline / corner `+` chỉ khi cần nhấn 1 vùng primary; không phủ mọi card.
4. **Logic trên marketing** — CTA theo auth, cửa sổ đăng ký, capacity, countdown từ API.

## Giữ vs bỏ (anti-slop, vẫn đúng proposal)

| Giữ (proposal) | Bỏ / hạn chế |
|----------------|--------------|
| `.hud-clipped`, lattice nền nhẹ | Glow trên mọi card |
| Mono + uppercase trên **label/CTA** kỹ thuật | FULL CAPS cả đoạn body dài |
| `SealShield` làm logo / watermark | Watermark + 4 góc `+` + scanline cùng lúc |
| Flat border + panel `bg-panel` | Gradient text cầu vồng |
| Role accent trên badge nhỏ | Rainbow border mỗi card |

## Tokens shape

```css
--clip-size: 12px;   /* góc vát chuẩn */
/* không dùng --radius-lg cho panel — radius = 0 */
```

## Bố cục chuẩn

### Public / landing
```
hud-lattice main
  Hero asymmetric: brand+CTA | live event panel (hud-clipped)
  Metrics strip (API only)
  Spotlight / featured (luôn lấp cột phải — countdown hoặc mark)
  Workflow · podium · FAQ
```

### Auth
```
AuthLayout — logo SealShield + form Input vuông + Button clipped
```

### Dashboard
```
PageShell → PageHeader → StatCard (clipped) → FilterBar → table/list
```

## Component mapping

| Need | Component |
|------|-----------|
| CTA | `Button` (`.hud-clipped`) |
| Panel | `Card` (`.hud-clipped`, no default glow) |
| Field | `Input` (vuông) + `Field` |
| Status | `Badge` (vuông, mono) |
| Empty | `EmptyState` (border dashed, **không** icon tròn mềm) |

## Pre-delivery checklist

- [ ] Panel/CTA dùng clip hoặc vuông — không `rounded-lg` mới
- [ ] 1 điểm nhấn primary mỗi viewport
- [ ] Không hex hardcode mới; dùng `var(--*)`
- [ ] Metrics / countdown / capacity từ API
- [ ] ID → `formatShortId()`
- [ ] Mobile 375px không scroll ngang
