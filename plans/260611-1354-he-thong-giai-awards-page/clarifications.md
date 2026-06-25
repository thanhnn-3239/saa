# Clarifications — Hệ thống giải (zFYDgyj_pD)

## Session 2026-06-11

- Q: Trang mới /he-thong-giai quan hệ thế nào với stub /awards-information hiện có? → A: Thay thế — đổi ROUTES.awardsInfo → /he-thong-giai để mọi link hiện có tự cập nhật, redirect 301 từ /awards-information sang
- Q: Trang có yêu cầu đăng nhập không (TC ID-0/ID-1)? → A: Có — bảo vệ như /sun-kudos (proxy session check + getSessionUser trong page)
- Q: Active state menu trái có cập nhật khi tự cuộn không, menu có sticky không? → A: Scroll-spy (IntersectionObserver) + sticky menu
- Q: Bố cục menu trái trên mobile? → A: Ẩn menu trên mobile — chỉ hiển thị danh sách cards cuộn dọc
- Q: Nút "Chi tiết" banner Sun* Kudos điều hướng đi đâu? → A: Cùng tab tới /sun-kudos hiện có (ROUTES.kudos)
- Q: Dữ liệu 6 giải thưởng lấy từ đâu? → A: Tĩnh trong messages/i18n (vi.json + en.json) + config array trong lib/awards, mở rộng lib/awards/categories.ts, không dùng DB
- Q: Bản tiếng Anh xử lý thế nào (spec chỉ có tiếng Việt)? → A: Tự dịch sang EN khi implement, tên giải giữ nguyên tiếng Anh sẵn có
