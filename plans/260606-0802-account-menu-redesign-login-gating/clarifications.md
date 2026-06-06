# Clarifications

## Session 2026-06-06
- Q: Header "không khớp trạng thái login" — bug hay lệch thiết kế? → A: Lệch THIẾT KẾ — redesign UI account area (code đã đổi header theo session, logout action đã có)
- Q: Khách (chưa login) thấy gì ở header account area? → A: KHÔNG có guest view — require login mới vào hệ thống (nội bộ @sun-asterisk only); guest bị redirect /login
- Q: Dropdown gồm mục nào? → A: Profile + Admin Dashboard (role-gated, ẩn cho non-admin) + Logout
- Q: Sau Logout điều hướng tới đâu? → A: /login (giữ hành vi hiện tại)
- Q: Trigger account button kiểu gì? → A: Icon user phẳng ~40x40 theo Homepage A1.8 (bỏ avatar vàng + tên + chevron hiện tại)
- Q: Label "Sign out" giữ hay đổi? → A: Đổi thành "Logout" theo frame Dropdown-profile
- Q: i18n cho Profile/Logout/Admin Dashboard? → A: Có — thêm key next-intl (vi+en), giữ literal "Profile"/"Logout" theo design
