# Clarifications — i18n system (next-intl)

## Related
- Builds on / translates: [260604-1415-login-google-oauth](../260604-1415-login-google-oauth/plan.md)
- MoMorph: Login `GzbNeVGJHz`, Dropdown-ngôn ngữ `hUyaaugye2` (fileKey `9ypp4enmFmdK3YAFJLIu6C`)

## Session 2026-06-04
- Q: Thư viện i18n? → A: next-intl (4.13) — App Router/RSC-native, Next 16 + React 19.
- Q: Cơ chế locale, có prefix URL? → A: Cookie-based (`NEXT_LOCALE`), KHÔNG prefix URL; không cần middleware (proxy.ts giữ nguyên).
- Q: Phạm vi & nơi đặt? → A: Plan mới riêng; dựng hạ tầng + dịch màn Login (+ dropdown ngôn ngữ); màn khác dịch dần sau.
- Q: Locale mặc định? → A: vi (default), en (thứ hai).
- Q: Cơ chế đổi ngôn ngữ? → A: Server Action set cookie `NEXT_LOCALE` + `router.refresh()` (chuẩn no-routing của next-intl).

## Unresolved
- Official EN copy cho welcome text màn Login (đang dùng bản dịch hợp lý, chờ product xác nhận nếu có wording chính thức).
