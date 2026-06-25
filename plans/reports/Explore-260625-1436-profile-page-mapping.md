# Next.js 16 + Supabase + next-intl Codebase Mapping
## Sun* Annual Awards 2025 — Profile Page Planning

**Report Date:** 2026-06-25  
**Codebase Root:** `/home/nguyen.ngoc.thanh@sun-asterisk.com/Documents/learn/ssa`  
**Work Context:** Mapping existing patterns to inform "My Profile" page implementation

---

## 1. ROUTING STRUCTURE & PAGES

### Route Tree (No [locale] segment)
- **i18n Model:** Cookie-based (NO URL routing)
  - Locale stored in `NEXT_LOCALE` cookie (values: `vi` or `en`)
  - Config: `/lib/i18n/config.ts` lines 5–7
  - Request handler: `/i18n/request.ts` lines 1–17
  - Default locale: `vi`

### App Directory Layout
```
app/
├── layout.tsx                    (root, i18n setup)
├── providers.tsx                 (Providers wrapper)
├── globals.css
├── /api/*                        (route handlers)
├── /auth                         (auth callbacks)
├── /auto-login
├── /login
│   └── page.tsx                  Login page (route: /login)
│
└── (public)                       Route group (auth OPTIONAL)
    ├── layout.tsx                Shared header, footer, send-kudo dialog
    │
    ├── page.tsx                  Homepage (route: /)
    ├── /awards-information       (route: /awards-information)
    │   └── page.tsx
    ├── /sun-kudos                (route: /sun-kudos)
    │   └── page.tsx
    ├── /notifications            (route: /notifications)
    │   └── page.tsx
    ├── /profile                  (route: /profile) ← STUB ONLY
    │   └── page.tsx              ComingSoon component
    └── /tieu-chuan-chung         (route: /tieu-chuan-chung)
        └── page.tsx
```

### Existing Routes & Files

| Route | File Path | Description |
|-------|-----------|-------------|
| `/` | `/app/(public)/page.tsx` | Homepage; renders HomepageContent |
| `/login` | `/app/login/page.tsx` | OAuth login; reads error param |
| `/awards-information` | `/app/(public)/awards-information/page.tsx` | Awards system (Hệ thống giải) |
| `/sun-kudos` | `/app/(public)/sun-kudos/page.tsx` | Kudos board; prefetches feed + filters |
| `/notifications` | `/app/(public)/notifications/page.tsx` | Notifications list; prefetches first page |
| `/profile` | `/app/(public)/profile/page.tsx` | **STUB ONLY** — returns `<ComingSoon />` |
| `/tieu-chuan-chung` | `/app/(public)/tieu-chuan-chung/page.tsx` | Standards page |

### Route Constants
- **Source:** `/lib/navigation/routes.ts`
- Profile route: `ROUTES.profile = "/profile"` (line 12)
- All routes exported from `ROUTES` constant (lines 7–14)

### Layout Nesting
- **Root Layout** (`/app/layout.tsx` lines 35–55):
  - Sets up Google fonts (Geist, Montserrat)
  - Initializes next-intl: `getLocale()`, `getMessages()`
  - Wraps `Providers` (QueryClientProvider, etc.)
  
- **Public Layout** (`/app/(public)/layout.tsx` lines 17–71):
  - Server Component; resolves `getSessionUser()` (line 22)
  - Renders fixed AppHeader (line 44–53)
  - Renders SendKudoProvider context
  - Renders page content (line 59; padded for fixed header)
  - Renders AppFooter (line 64)
  - Renders FloatingWidgetButton (line 67)

---

## 2. SHARED LAYOUT COMPONENTS

### AppHeader
- **File:** `/app/(public)/_components/app-header.tsx`
- **Type:** Server Component (no "use client")
- **Signature:** `AppHeader(props: AppHeaderProps)` (lines 24–65)
- **Props:**
  - `languageSwitcher: React.ReactNode` — LanguageSwitcher component
  - `authControls?: React.ReactNode` — NotificationBell + AccountMenu (authenticated only)
  - `navLabels: { aboutSaa, awardInformation, kudos }`
  - `menuToggleLabel: string`
- **Elements:**
  - Logo (left) → `/` home link
  - HeaderNav component (left) — shows active tab based on pathname
  - LanguageSwitcher (right) — always visible
  - Auth controls (right) — hidden for guests
  - MobileMenu (right) — hamburger + drawer
- **Design Reference:** `mm:2167:9091` (Figma frame)

### AppFooter
- **File:** `/app/(public)/_components/app-footer.tsx`
- **Type:** Server Component
- **Signature:** `AppFooter()` (lines 7–73)
- **i18n:** Reads namespace `"Home.footer"` (line 8)
- **Elements:**
  - Logo (left) → `/` home link
  - Nav links: About SAA 2025, Award Information (gold-glass style), Sun* Kudos, Tiêu chuẩn chung
  - Copyright text (right)
- **Design Reference:** `mm:5001:14800` (Figma frame)

### NotificationBell
- **File:** `/components/header/notification-bell.tsx`
- **Type:** Client Component ("use client")
- **Signature:** `NotificationBell()` (lines 22–123)
- **Behavior:**
  - Shows unread count badge (red) — `useUnreadCount()` (line 29)
  - Opens dropdown on click; closes on Escape or outside-click
  - Displays 5 recent notifications — `useNotifications(5)` (line 30)
  - "Mark all read" button — `useMarkRead()` (line 31)
  - "View all" link → `/notifications`
  - Realtime updates — `useNotificationsRealtime()` (line 28)
- **i18n:** Namespace `"Notifications"` (line 23)
- **Dependencies:**
  - `useUnreadCount()` → `/lib/notifications/use-unread-count.ts`
  - `useNotifications()` → `/lib/notifications/use-notifications.ts`
  - `useMarkRead()` → `/lib/notifications/use-mark-read.ts`
  - `useNotificationsRealtime()` → `/lib/notifications/use-notifications-realtime.ts`

### AccountMenu
- **File:** `/components/header/account-menu.tsx`
- **Type:** Client Component ("use client")
- **Signature:** `AccountMenu({ role?: string })` (lines 37–202)
- **Props:**
  - `role?: string` — User role from JWT custom claim; shows "Admin Dashboard" when `role === "admin"`
- **Menu Items:**
  1. **Profile** — Link to `/profile` (line 142)
  2. **Admin Dashboard** — Link to `/admin` (only when `role === "admin"`; line 162)
  3. **Logout** — Form with `signOut` server action (line 180)
- **Accessibility:**
  - Keyboard support: Escape closes, returns focus to trigger
  - Highlight effect: cream glow with text-shadow (line 77)
  - Focus management: active state follows mouse/keyboard
- **Design Reference:** `Dropdown-profile` frame design

### LanguageSwitcher
- **File:** `/components/language-switcher.tsx` (inferred; not fully read but used)
- **Props:** `ariaLabel: string`
- **Behavior:** Toggles locale between `vi` / `en` via `NEXT_LOCALE` cookie

---

## 3. AUTHENTICATION & CURRENT USER

### Current User Utility
- **Function:** `getSessionUser()`
- **File:** `/lib/auth/get-session-user.ts`
- **Signature:** `async getSessionUser(): Promise<SessionUser | null>` (lines 25–44)
- **Returns:**
  ```typescript
  interface SessionUser {
    id: string;           // UUID from JWT sub claim
    email: string;        // From JWT email claim
    role?: string;        // From JWT user_role custom claim (undefined until role system exists)
  }
  ```
- **Implementation:**
  - Uses `supabase.auth.getClaims()` (JWT-verified, not `getSession()`)
  - Validates domain via `isAllowedEmail()` (defense-in-depth)
  - Returns `null` for unauthenticated requests
  - Safe to call from Server Components, Route Handlers, Server Actions
- **Used By:**
  - `/app/(public)/layout.tsx` (line 22) — passes auth controls
  - `/app/(public)/sun-kudos/page.tsx` (line 36) — passes currentUserId for feed
  - `/app/(public)/awards-information/page.tsx` — defense-in-depth guard

### Profile Data Model (Database)
- **Table:** `public.profiles` (`/supabase/migrations/20260604070000_schema.sql` lines 12–20)
- **Columns:**
  - `id UUID` — PK, references `auth.users.id` (cascade delete)
  - `full_name TEXT` — populated from OAuth metadata or email
  - `email TEXT` — from OAuth
  - `avatar_url TEXT` — from OAuth (Google avatar or Pravatar seed)
  - `role TEXT` — default `'member'`; values: `'member'` | `'admin'`
  - `department_id BIGINT` — FK to `departments.id`
  - `active_badge_id BIGINT` — showcased badge on profile (line 125)
  - `created_at TIMESTAMPTZ` — default now()
- **RLS:** Enabled; policies in `20260604070100_rls_policies.sql`
- **Auto-creation:** Trigger `handle_new_user()` on OAuth signup (lines 152–167)

### ProfileBrief Type (Kudos context)
- **File:** `/lib/kudos/types.ts` (lines 10–26)
- **Used In:** Kudo cards, leaderboards, spotlight
- **Shape:**
  ```typescript
  interface ProfileBrief {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    stars: 0 | 1 | 2 | 3;              // Computed tier (0–3)
    kudosReceived: number;              // Raw count; drives stars
    departmentId: number | null;
    departmentName?: string | null;     // Optional; joined from departments
  }
  ```
- **Star Tier Thresholds:** Tier 1 ≥ 10, Tier 2 ≥ 20, Tier 3 ≥ 50 kudos_received

### Session User Resolution Pattern
**Public Layout Flow:**
```
PublicLayout (Server Component)
  ├─ await getSessionUser()           → SessionUser | null
  ├─ await getTranslations("Home")    → i18n object
  ├─ user ? NotificationBell : null
  ├─ user ? AccountMenu : null
  └─ children
```

---

## 4. DATA FETCHING PATTERN

### Server-Side Prefetch (Sun Kudos Example)
- **File:** `/app/(public)/sun-kudos/page.tsx` (lines 34–123)
- **Pattern:** HydrationBoundary + TanStack Query dehydration
- **Flow:**

```typescript
// Step 1: Resolve session
const user = await getSessionUser();

// Step 2: Create QueryClient (server instance)
const queryClient = makeQueryClient();

// Step 3: Parallel prefetches (Promise.allSettled)
await Promise.allSettled([
  queryClient.prefetchQuery({
    queryKey: highlightKudosKey(filter),
    queryFn: () => getHighlightKudos(filter, user?.id ?? null),
  }),
  queryClient.prefetchInfiniteQuery({
    queryKey: kudosFeedKey(filter),
    queryFn: () => getKudosPage({ filter, currentUserId: user?.id ?? null }),
    initialPageParam: null,
  }),
  // ... spotlight, sidebar (if authenticated)
]);

// Step 4: Dehydrate and render
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <KudosBoard {...props} />
  </HydrationBoundary>
);
```

### QueryClient Config
- **File:** `/lib/query/query-client.ts`
- **Settings:**
  - `staleTime: 30s` — board data via Realtime; short window prevents stale renders
  - `gcTime: 5min` (default) — keep unused queries while navigating
  - `retry: 1` — one retry on transient network errors

### Client-Side Data Fetching (useKudosFeed Example)
- **File:** `/lib/kudos/use-kudos-feed.ts` (lines 46–55)
- **Hook:** `useInfiniteQuery` from TanStack React Query
- **Fetch:** Via `/api/kudos/feed` route handler (not direct Supabase)

```typescript
export function useKudosFeed(filter: KudosFilter, limit = 20) {
  return useInfiniteQuery({
    queryKey: kudosFeedKey(filter),
    queryFn: ({ pageParam }) =>
      fetchKudosPage(filter, pageParam as PageCursor | null, limit),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });
}
```

### Route Handlers (API Layer)
- **Pattern:** Server-side Supabase client in route handlers
- **Example:** `/api/kudos/feed` — wraps `getKudosPage()` query
- **Auth:** Proxy middleware (`proxy.ts`) gates routes; Route Handler can assume auth
- **Data Shape Returned:** `KudosPage` (line 65–69 in `queries.ts`):
  ```typescript
  interface KudosPage {
    items: KudoCard[];
    nextCursor: PageCursor | null;
  }
  ```

### Query Key Pattern (TanStack Query)
- **File:** `/lib/kudos/query-keys.ts`
- **Keys are exported as factories** (not "use client") — usable from server + client
- **Examples:**
  - `highlightKudosKey(filter)` → `["kudos", "highlight", filter]`
  - `kudosFeedKey(filter)` → `["kudos", "feed", filter]`
  - `spotlightKey` → `["kudos", "spotlight"]`
  - `sidebarKey` → `["kudos", "sidebar"]`

### Supabase Server Client
- **File:** `/lib/supabase/server.ts` (lines 9–33)
- **Usage:** Async function `createClient()` — returns authenticated Supabase client
- **Auth:** Cookie-based (`next-intl/ssr` pattern)
- **Safe For:** Server Components, Route Handlers, Server Actions
- **Env:** Uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 5. i18n (INTERNATIONALIZATION)

### Configuration
- **Locales:** `["vi", "en"]` (lines 5 in `/lib/i18n/config.ts`)
- **Default:** `vi` (Vietnamese)
- **Cookie:** `NEXT_LOCALE` (stores lowercase locale code)
- **Cookie UI Display:** Uppercase `VN` / `EN` labels

### Message Files
- **Directory:** `/messages/`
- **Files:**
  - `/messages/vi.json` — Vietnamese translations
  - `/messages/en.json` — English translations
- **Top-level Namespaces:**
  - `"Login"` — login page messages
  - `"Notifications"` — bell + notifications list
  - `"Home"` — shared header, footer, homepage
    - Sub-namespace: `"Home.nav"` — nav labels
    - Sub-namespace: `"Home.account"` — menu items
    - Sub-namespace: `"Home.footer"` — footer links
    - Sub-namespace: `"Home.awards"` — award card titles

### i18n Patterns in Code
- **Server Component:** `getTranslations("Home")` → returns translation object
  - Example: `/app/(public)/layout.tsx` line 24
  - Returns i18n object; call `t("nav.aboutSaa")` to get string

- **Client Component:** `useTranslations("Namespace")` hook
  - Example: `/components/header/notification-bell.tsx` line 23
  - Returns `t` function: `t("bellAria")`

### Message Lookup (Header Example)
```typescript
// vi.json "Home" namespace:
{
  "Home": {
    "nav": {
      "aboutSaa": "About SAA 2025",
      "awardInformation": "Award Information",
      "kudos": "Sun* Kudos",
      "standards": "Tiêu chuẩn chung",
      "langSelectAria": "Chọn ngôn ngữ",
      "menuToggle": "Mở/đóng menu điều hướng"
    },
    "account": {
      "menuAria": "Menu tài khoản",
      "profile": "Profile",
      "adminDashboard": "Admin Dashboard",
      "logout": "Logout"
    },
    "footer": {
      "copyright": "Bản quyền thuộc về Sun* © 2025",
      "aboutSaa": "About SAA 2025",
      ...
    }
  }
}
```

---

## 6. PROFILE PAGE CONTEXT

### Current State
- **Route:** `/profile` (already in `ROUTES.profile`)
- **File:** `/app/(public)/profile/page.tsx`
- **Current Implementation:**
  ```typescript
  import { ComingSoon } from "@/components/coming-soon";
  
  export default function ProfilePage() {
    return <ComingSoon />;
  }
  ```

### Profile Page Requirements (from wireframe)
1. **Top section:** Shared header (logo, nav, notifications, user avatar)
2. **Hero section:** User avatar + name + department + profile card
3. **Tabs/sections:**
   - **My Kudos Sent** — infinite scroll feed
   - **Kudos Received** — infinite scroll feed
   - **Badges** — user's earned badges
4. **Footer:** Shared footer (logo, nav links, copyright)

### Reusable Components for Profile
- ✅ **Header:** `AppHeader` (already reused across all pages)
- ✅ **Footer:** `AppFooter` (already reused across all pages)
- ✅ **Kudo Card:** Can reuse `KudoCard` from Kudos board
- ✅ **Profile Avatar:** Reuse patterns from `ProfileBrief` cards
- ✅ **Query Pattern:** Adopt sun-kudos prefetch pattern (HydrationBoundary + TanStack Query)

### Data Queries Needed for Profile
1. **Current User Profile:** Extend `getSessionUser()` to fetch full profile row
   - Query: `SELECT id, full_name, email, avatar_url, department_id, active_badge_id FROM profiles WHERE id = $1`
   - Include department name via join

2. **Kudos Sent (Infinite):** 
   - Query: `SELECT * FROM kudos WHERE sender_id = $userId AND status = 'published' ORDER BY created_at DESC`
   - Reuse cursor-based pagination from `getKudosPage()`

3. **Kudos Received (Infinite):**
   - Query: `SELECT * FROM kudos WHERE recipient_id = $userId AND status = 'published' ORDER BY created_at DESC`
   - Reuse cursor-based pagination

4. **User Badges:**
   - Query: `SELECT badges.* FROM user_badges JOIN badges ON user_badges.badge_id = badges.id WHERE user_id = $1 ORDER BY created_at DESC`

5. **Sidebar Stats (if showing):**
   - Already exists: `getSidebarStats(userId)` in `/lib/kudos/sidebar-queries.ts`
   - Returns: `{ kudosSent, kudosReceived, heartsReceived, badgesCount, secretBoxes }`

---

## 7. KEY FILE PATHS & IMPORTS

### Navigation & Routes
- `ROUTES` constant: `/lib/navigation/routes.ts` (line 7–14)
- Route alias: `ROUTES.profile = "/profile"` (line 12)

### Auth
- Session util: `/lib/auth/get-session-user.ts`
- Domain whitelist: `/lib/auth/allowed-domain.ts`
- Sign-out action: `/lib/auth/sign-out-action.ts` (used by AccountMenu)

### Supabase
- Server client: `/lib/supabase/server.ts`
- Admin client: `/lib/supabase/admin.ts` (for seed/admin tasks)
- Client-side: `/lib/supabase/client.ts`

### Data Queries
- Kudos queries: `/lib/kudos/queries.ts`
- Sidebar queries: `/lib/kudos/sidebar-queries.ts`
- Spotlight queries: `/lib/kudos/spotlight-queries.ts`
- Notifications queries: `/lib/notifications/queries.ts`

### TanStack Query
- Query client factory: `/lib/query/query-client.ts`
- Query keys (kudos): `/lib/kudos/query-keys.ts`
- Query keys (notifications): `/lib/notifications/query-keys.ts`

### Components
- Header: `/app/(public)/_components/app-header.tsx`
- Footer: `/app/(public)/_components/app-footer.tsx`
- NotificationBell: `/components/header/notification-bell.tsx`
- AccountMenu: `/components/header/account-menu.tsx`
- LanguageSwitcher: `/components/language-switcher.tsx`
- Kudo card: `/app/(public)/sun-kudos/_components/feed/kudo-card.tsx` (inferred)

### i18n
- Config: `/lib/i18n/config.ts`
- Request handler: `/i18n/request.ts`
- Messages: `/messages/vi.json`, `/messages/en.json`

### Types
- Session user: `/lib/auth/get-session-user.ts` (interface lines 9–14)
- Profile brief: `/lib/kudos/types.ts` (interface lines 11–26)
- Kudo card: `/lib/kudos/types.ts` (interface lines 33–69)
- Sidebar stats: `/lib/kudos/types.ts` (interface lines 102–113)

---

## 8. IMPLEMENTATION CHECKLIST FOR PROFILE PAGE

### Phase 1: Data Layer
- [ ] Create profile query function: `getFullProfile(userId: string)` in new `/lib/profile/queries.ts`
- [ ] Create kudos-sent query: `getProfileKudosSent(userId, filter, currentUserId)` (reuse `getKudosPage` logic)
- [ ] Create kudos-received query: `getProfileKudosReceived(userId, filter, currentUserId)`
- [ ] Create user-badges query: `getUserBadges(userId)`
- [ ] Export query keys: `/lib/profile/query-keys.ts`

### Phase 2: Server Component
- [ ] Create `/app/(public)/profile/page.tsx`
- [ ] Implement prefetch logic (HydrationBoundary pattern)
- [ ] Resolve session user
- [ ] Prefetch: profile, kudos-sent (first page), kudos-received (first page), badges
- [ ] Dehydrate and render ProfileScreen

### Phase 3: UI Components
- [ ] Create ProfileHeader (avatar, name, department, stats)
- [ ] Create ProfileTabs (My Kudos Sent / Received / Badges)
- [ ] Reuse KudoCard for feed sections
- [ ] Reuse badge display from existing patterns
- [ ] Add i18n namespace: `"Profile"` with keys for tab labels, empty states

### Phase 4: Client Hooks
- [ ] Create `useProfileKudosSent(userId)` hook
- [ ] Create `useProfileKudosReceived(userId)` hook
- [ ] Create `useUserBadges(userId)` hook
- [ ] Use `useInfiniteQuery` for kudos feeds (cursor-based pagination)

### Phase 5: i18n
- [ ] Add `"Profile"` namespace to `/messages/vi.json` and `/messages/en.json`
- [ ] Keys: tab labels, empty states, header labels
- [ ] Example: `"Profile.tabs.sent"`, `"Profile.emptyKudos"`, etc.

---

## NOTES & FLAGGED PATTERNS

### Already Partial (Profile-Related)
- ✅ Profile route already exists at `/profile` (stub only)
- ✅ AccountMenu links to profile: `ROUTES.profile` (line 142 in `/components/header/account-menu.tsx`)
- ✅ Profile data model fully normalized in Supabase (`profiles` table)
- ✅ Profile-brief shape used throughout Kudos board context

### Auth & Security
- ✅ Auth gate: Proxy middleware (`proxy.ts`); `PUBLIC_PATHS` allowlist excludes `/profile`, so unauthenticated users redirected to `/login`
- ✅ Defense-in-depth: `getSessionUser()` validates email domain server-side
- ✅ JWT roles: Support exists (role claim in `SessionUser.role`); Admin Dashboard hidden until role system live

### Performance Considerations
- ✅ Server prefetch + HydrationBoundary pattern already established (sun-kudos, notifications)
- ✅ Cursor-based pagination with `nextCursor` already in place
- ✅ Realtime updates via Supabase available (see `useNotificationsRealtime`)
- ⚠️ Star-tier computation: Threshold values hardcoded in `/lib/kudos/stars.ts` and sidebar-queries; extract to constant

### i18n Notes
- Cookie-based locale (no URL segments) — simpler routing, but requires explicit locale context in components
- Message files are flat JSON (no nesting beyond namespace level)
- Server components use `getTranslations()` (async); client components use `useTranslations()` hook

### Database Notes
- `profiles.role` has check constraint: `('member' | 'admin')` only
- RLS policies must allow authenticated user to read their own profile row
- Indices exist on `kudos (recipient_id, created_at)` and `(sender_id, created_at)` — optimal for profile queries

---

## UNRESOLVED QUESTIONS

1. **Profile Edit Mode:** Should the profile page show edit buttons? If so, where does edited data go? (Form action, mutation hook, etc.)
2. **Active Badge Display:** The `profiles.active_badge_id` column suggests a showcase badge — where should this appear on the profile?
3. **Secret Boxes & Unopened Count:** Should profile show secret boxes UI? (Already in sidebar stats; questionable for profile detail.)
4. **Admin Dashboard Route:** `/admin` route referenced in AccountMenu (line 162) but not yet implemented. Should it be a protected route under a separate layout?
5. **Profile Picture Upload:** Google OAuth provides avatar; should profile support custom avatar upload?
6. **Kudos Received by Anonymous Senders:** If sender is anonymous, profile should mask sender name. Already handled in `KudoCard` (see `ownedByViewer` logic)?

---

**End of Report**
