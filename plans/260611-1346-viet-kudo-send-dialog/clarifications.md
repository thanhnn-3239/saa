# Clarifications — Viết Kudo (send-kudos modal)

## Session 2026-06-11

- Q: Design có trường 'Danh hiệu' (required) nhưng không có trong specs/test cases/DB — xử lý? → A: Làm theo design — thêm migration cột `kudos.title`, field bắt buộc trong form, render làm tiêu đề card trên board (giải quyết câu hỏi treo "IDOL GIỎI TRẺ" từ plan UI-fidelity)
- Q: Rich text editor (B/I/S/numbered/link/quote + @mention) lưu trữ và render thế nào khi body là plain text? → A: Tiptap + lưu HTML đã sanitize vào `kudos.body`, board render HTML sanitized
- Q: Spec G yêu cầu text field điền tên ẩn danh khi bật checkbox, DB chỉ có boolean — xử lý? → A: Thêm cột `kudos.anonymous_name` (nullable), bật checkbox → hiện input bí danh optional, board hiển thị bí danh hoặc 'Ẩn danh' nếu trống
- Q: Hashtag chỉ chọn có sẵn hay được tạo mới? → A: Chỉ chọn có sẵn từ bảng `hashtags` (taxonomy do admin kiểm soát)
- Q: @mention có tạo notification không? → A: (default) v1 visual-only mention, không notification — notifications backend vẫn out-of-scope
- Q: Giới hạn ảnh upload? → A: (default) jpg/png/webp, ≤5MB/ảnh, tối đa 5 ảnh, bucket `kudo-images` có sẵn, path `{uid}/{uuid}.{ext}`
- Q: Max length nội dung + title? → A: (default) body ≤2000 ký tự (counter hiển thị), title ≤100 ký tự
- Q: Link 'Tiêu chuẩn cộng đồng' trên toolbar mở gì? → A: (default) modal đơn giản với nội dung i18n tĩnh (v1)
- Q: Entry point mở modal? → A: (default) nút banner đã wired qua `onOpenSendDialog` (kudos-board.tsx:256 đang noop)
- Q: Sau submit thành công? → A: (default) toast thành công + đóng modal + reset form; board tự cập nhật qua Supabase Realtime có sẵn
- Q: Tự gửi kudo cho chính mình? → A: (default) chặn — DB đã có `check (sender_id <> recipient_id)`, loại current user khỏi kết quả search người nhận
