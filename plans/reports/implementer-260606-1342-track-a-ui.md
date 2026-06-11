# Implementer Report — Track A UI (Sun* Kudos Live Board)

## Task
- Task: Implement A1–A5 presentational UI for /sun-kudos (Phases A1–A5)
- Status: completed

## Files Modified/Created

### Root
| File | Lines | Note |
|------|-------|------|
| `app/(public)/sun-kudos/page.tsx` | 120 | Replaced ComingSoon stub; composes all sections |

### Mock data (delete in C1)
| File | Lines | Note |
|------|-------|------|
| `app/(public)/sun-kudos/_components/mock-data.ts` | 158 | All mock from Figma content; single delete target for C1 |

### A1 — Shared UI primitives (`_components/ui/`)
| File | Lines | Note |
|------|-------|------|
| `avatar.tsx` | 42 | Circular image + initials fallback |
| `heart-button.tsx` | 55 | gray↔red toggle, count, disabled, aria-pressed |
| `hashtag-chip.tsx` | 41 | Pill, active/inactive, optional onClick |
| `stars-indicator.tsx` | 37 | 0–3 gold stars via SVG, tier 0 renders null |
| `section-header.tsx` | 40 | Eyebrow + divider + gold title + actions slot |
| `empty-state.tsx` | 37 | Centered icon + message |
| `skeleton.tsx` | 45 | Base shimmer + KudoCardSkeleton variant |
| `copy-link-button.tsx` | 71 | Clipboard API + self-contained inline toast |
| `filter-dropdown.tsx` | 58 | Native select styled as pill; label + options |

### A1 — Banner (`_components/`)
| File | Lines | Note |
|------|-------|------|
| `banner.tsx` | 110 | KV hero with CSS gradient overlay, ghi nhận pill, search pill |

### A2 — Highlight carousel (`_components/highlight/`)
| File | Lines | Note |
|------|-------|------|
| `highlight-card.tsx` | 122 | Cream card: sender→arrow→receiver, 3-line body, max-5 tags, action bar |
| `highlight-carousel.tsx` | 140 | Embla carousel, center-active fade, prev/next, "2/5" indicator |

### A3 — Spotlight cloud (`_components/spotlight/`)
| File | Lines | Note |
|------|-------|------|
| `spotlight-cloud.tsx` | 185 | Dark panel, 388 KUDOS total, search (maxLen 100, no empty submit), scattered names, Pan/Zoom no-op |

### A4 — All Kudos feed (`_components/feed/`)
| File | Lines | Note |
|------|-------|------|
| `kudo-post-card.tsx` | 125 | Cream card: sender→arrow→receiver, 5-line body, ≤5 image thumbs, hashtags, action bar |
| `kudos-feed.tsx` | 94 | Header, IntersectionObserver infinite scroll, skeletons, empty state, sidebar slot |

### A5 — Sidebar (`_components/sidebar/`)
| File | Lines | Note |
|------|-------|------|
| `sidebar-stats.tsx` | 105 | 5 stat rows with gold values, divider, "Mở Secret Box" button (stub) |
| `leaderboard-list.tsx` | 85 | Ranked list: gold/silver/bronze badges + avatar + name + score |

**Total: 19 files created/modified**

---

## Prop/Callback Interface (for C1 integration)

### `<Banner>`
```ts
onOpenSendDialog?: () => void
```

### `<HighlightCarousel>`
```ts
cards: KudoCard[]
filter: KudosFilter
onFilterChange: (filter: KudosFilter) => void
onLike?: (id: string) => void
onCopyLink?: (id: string) => void
onViewDetail?: (id: string) => void
onOpenProfile?: (profileId: string) => void
hashtagOptions?: Array<{ value: string; label: string }>
departmentOptions?: Array<{ value: string; label: string }>
```

### `<SpotlightCloud>`
```ts
total: number
nodes: SpotlightNode[]
isLoading?: boolean
onSearch: (term: string) => void
onNodeClick: (profileId: string) => void
```

### `<KudosFeed>`
```ts
cards: KudoCard[]
hasNext: boolean
isLoading: boolean
onLoadMore: () => void
onLike?: (id: string) => void
onCopyLink?: (id: string) => void
onOpenProfile?: (profileId: string) => void
onOpenImage?: (kudoId: string, index: number) => void
onViewDetail?: (id: string) => void
sidebar?: React.ReactNode
```

### `<SidebarStatsBlock>`
```ts
stats: SidebarStats
onOpenGift?: () => void
```

### `<LeaderboardList>`
```ts
title: string
items: LeaderboardItem[]
scoreLabel?: string
onOpenProfile?: (profileId: string) => void
```

All callbacks default to no-ops; mock page renders fully standalone.

---

## Vietnamese Strings Needing i18n Keys (Kudos namespace)

| Key | Current literal |
|-----|----------------|
| `Kudos.banner.title` | "Hệ thống ghi nhận lời cảm ơn" |
| `Kudos.banner.placeholder` | "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" |
| `Kudos.banner.searchPlaceholder` | "Tìm kiếm sunner..." |
| `Kudos.carousel.eyebrow` | "Sun* Annual Awards 2025" |
| `Kudos.carousel.title` | "HIGHLIGHT KUDOS" |
| `Kudos.filter.all` | "Tất cả" |
| `Kudos.filter.hashtag` | "Hashtag" |
| `Kudos.filter.department` | "Phòng ban" |
| `Kudos.card.viewDetail` | "Xem chi tiết" |
| `Kudos.card.anonymous` | "Ẩn danh" |
| `Kudos.card.sentTo` | "gửi tới" (aria) |
| `Kudos.copyLink.success` | "Link đã được sao chép — sẵn sàng chia sẻ!" |
| `Kudos.spotlight.eyebrow` | "Sun* Annual Awards 2025" |
| `Kudos.spotlight.title` | "SPOTLIGHT BOARD" |
| `Kudos.spotlight.searchPlaceholder` | "Tìm kiếm" |
| `Kudos.spotlight.panZoom` | "Pan/Zoom" |
| `Kudos.spotlight.empty` | "Chưa có dữ liệu" |
| `Kudos.feed.eyebrow` | "Sun* Annual Awards 2025" |
| `Kudos.feed.title` | "ALL KUDOS" |
| `Kudos.feed.empty` | "Hiện tại chưa có Kudos nào." |
| `Kudos.sidebar.kudosReceived` | "Số Kudos bạn nhận được:" |
| `Kudos.sidebar.kudosSent` | "Số Kudos bạn đã gửi:" |
| `Kudos.sidebar.heartsReceived` | "Số tim bạn nhận được:" |
| `Kudos.sidebar.secretBoxOpened` | "Số Secret Box bạn đã mở:" |
| `Kudos.sidebar.secretBoxUnopened` | "Số Secret Box chưa mở:" |
| `Kudos.sidebar.openGift` | "Mở Secret Box" |
| `Kudos.leaderboard.empty` | "Chưa có dữ liệu" |
| `Kudos.leaderboard.promotions.title` | "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" |
| `Kudos.leaderboard.gifts.title` | "10 SUNNER NHẬN QUÀ MỚI NHẤT" |
| `Kudos.heartButton.like` | "Thích" (aria) |
| `Kudos.heartButton.unlike` | "Bỏ thích" (aria) |
| `Kudos.stars.tier` | "Hạng {n} sao" (aria) |

---

## Mock Data File Location

`app/(public)/sun-kudos/_components/mock-data.ts`

C1 removes this file and updates `page.tsx` imports to point at real hooks from `lib/kudos/`.

---

## Visual Validation vs Figma Frame

Assessed by comparing the Figma reference frame (MaZUn5xHXZ, 1440×5862) against the component tree:

| Category | Result | Notes |
|----------|--------|-------|
| **Layout / structure** | PASS | Banner → Carousel → Spotlight → Feed+Sidebar matches Figma section order |
| **Typography** | PASS | Montserrat font-bold for all headers; gold (#FFEA9E) for titles; 57px/64px section titles match Figma |
| **Colors** | PASS | saa-navy-darkest bg; cream cards rgba(255,248,225); gold accent; navy-border dividers; sidebar #00070C |
| **Border radius** | PASS | Cards: 24px; sidebar panels: 17px; pills: 68px (rounded-full); buttons: 8px |
| **Carousel** | PASS | Embla center-align, active/faded sides, prev/next with disabled at ends, "2/5" indicator |
| **Spotlight** | PASS | Dark panel, 388 KUDOS count, search with maxLength/empty guard, scattered names with weight-scaled font |
| **Feed** | PASS | Infinite scroll sentinel, empty state, skeletons, sidebar in sticky slot |
| **Sidebar** | PASS | 5 stat rows with gold values, divider, "Mở Secret Box" button, leaderboard with rank badges |
| **KV background image** | CONCERN | S3 signed URL expired before download; banner uses correct CSS gradient fallback (#00101A linear-gradient per Figma Cover layer). Real image wired in via C1 or asset pipeline. |
| **Responsive** | PASS | px-4/sm:px-9/lg:px-36 horizontal padding; sidebar sticky + overflow-y-auto; carousel slides flex-shrink-0 |

---

## Tests Status
- Type check: **PASS** (`pnpm exec tsc --noEmit` — 0 errors)
- Build: **PASS** (`pnpm build` — compiled successfully, /sun-kudos route generated)
- Unit tests: not written for presentational components (YAGNI — no logic to test; interaction logic lives in C1)

---

**Status:** DONE_WITH_CONCERNS
**Summary:** All 19 files created across A1–A5. TypeScript clean, build passes. Full page composes correctly with mock data.
**Concerns:**
1. **KV background image**: S3 presigned URL from `get_media_files` expired (600s TTL) before curl download completed. Banner renders with the correct CSS gradient fallback sourced from the Figma Cover layer spec. C1 or a dedicated asset pipeline pass should download and reference `/sun-kudos/kv-background.png`.
2. **Visual validation**: Live browser diff blocked by auth gate (`/sun-kudos` requires @sun-asterisk.com login per proxy.ts). Structural validation performed by comparing component tree against the Figma reference image. Fidelity is high on layout, typography, color tokens, and spacing.
3. **`window` usage in CopyLinkButton / card URLs**: `typeof window !== "undefined"` guard present; correct for "use client" components. C1 should replace with a prop-injected base URL from server context.
