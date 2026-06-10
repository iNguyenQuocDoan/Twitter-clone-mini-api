# Seed Accounts

Tài khoản test được tạo sẵn bởi `npm run seed`. Dùng để đăng nhập vào FE (`http://localhost:3000`) hoặc chạy smoke test.

## Credentials

> **Password (chung cho tất cả tài khoản):** `Password@123`

| Email                 | Username          | Role  | Vai trò                        |
| --------------------- | ----------------- | ----- | ------------------------------ |
| `admin@example.com`   | `admin`           | Admin | Administrator account          |
| `an@example.com`      | `an_dev`          | User  | Frontend engineer              |
| `binh@example.com`    | `binh_designer`   | User  | Product designer               |
| `chi@example.com`     | `chi_backend`     | User  | Backend engineer               |

Tất cả đều có `verify = Verified` để bỏ qua bước xác thực email.

`Role` enum (xem `src/constants/enums.ts`): `User = 0`, `Admin = 1`. Hiện chưa có
endpoint admin-only — field này dùng cho UI badge và làm groundwork cho permission
trong các iteration sau.

## Relationships có sẵn

```
an  → follows binh, chi
binh → follows an
chi  → no follows
```

→ Khi đăng nhập với `an@example.com`, timeline sẽ thấy tweet của `binh` và `chi`.

## Tweets

9 tweet được tạo sẵn (mỗi user 3 tweet), với timestamps giả lập 2 phút đến 4 giờ trước. Có hashtags: `nextjs`, `css`, `design`, `react`, `typography`, `ux`, `express`, `jwt`, `mongodb`.

## Likes / Bookmarks có sẵn

- `an` đã like tweet đầu của `binh` và `chi`
- `an` đã bookmark tweet đầu của `chi`

## Conversations + Messages có sẵn

**5 cuộc trò chuyện DM, 30 tin nhắn**, mix timestamps từ vài phút tới 5 ngày trước. **Read receipts đa dạng**: hầu hết đã read, một số tin gần đây để `unread` để badge hiển thị.

| Conversation               | # tin | Last message                                              |
| -------------------------- | ----- | --------------------------------------------------------- |
| `an_dev ↔ binh_designer`   | 11    | "Send code cho t với, t copy cho project lab" *(2 unread cho an)* |
| `an_dev ↔ chi_backend`     | 8     | "Test xong nhớ note lại trong README" *(1 unread cho an)* |
| `admin ↔ an_dev`           | 4     | "Đã note. Em đang gặp bug 'Xem như user'…" *(1 unread cho admin)* |
| `admin ↔ binh_designer`    | 3     | "Got it, thanks 👍" *(read sạch)*                          |
| `binh_designer ↔ chi_backend` | 4  | "Ok 👌" *(read sạch)*                                      |

→ Login `admin` → vào `/admin/messages`: thấy đủ **5 conv** với member-pair label, **bấm vào đọc được nội dung** từng conv.
→ Admin có riêng `/messages` cũng thấy 2 conv của mình (với an + binh).
→ Login `an_dev` → `/messages`: 3 conv, badge **2** + **1** + **0** ở các row tương ứng.

## Realtime test

Hai cách verify socket.io realtime hoạt động:

```bash
# CLI test (Node) — chạy 3 socket client mô phỏng an, binh, admin
npm run socket-test
# Kỳ vọng: 5 PASS · 0 FAIL
```

Hoặc test trên browser:
1. Tab 1 (admin) → `/admin/messages` — mở conv `an ↔ binh`
2. Tab 2 (incognito, an) → `/messages` — chọn conv với binh
3. Tab 3 (incognito khác, binh) → `/messages` — chọn conv với an
4. Gõ tin ở tab 2 → Enter — tab 3 thấy ngay, tab 1 cũng cập nhật ngay

## Commands

```bash
# Insert / reset seed data
npm run seed

# Smoke test toàn bộ endpoint (yêu cầu BE đang chạy ở port 9990)
npm run smoke

# Tuỳ chỉnh user / URL cho smoke test
BE_URL=http://localhost:9990 TEST_EMAIL=binh@example.com npm run smoke
```

## Reset toàn bộ DB local

Nếu cần xoá sạch và làm lại:

```bash
# Trong mongosh
mongosh mongodb://127.0.0.1:27017/twitter-dev --eval "db.dropDatabase()"

# Sau đó seed lại
npm run seed
```

## Quick FE check

1. Mở `http://localhost:3000`
2. Bấm **Đăng nhập** → dùng `an@example.com` / `Password@123`
3. `/home` phải thấy 6 tweet (của binh + chi)
4. `/messages` → thấy 2 conversation với badge unread
5. `/debug` → bấm "Chạy tất cả test" → tất cả 11 row chuyển sang ✅

### Test realtime messaging

1. Tab 1: login `an_dev` → `/messages` → chọn conv với binh
2. Tab 2 (incognito): login `binh_designer` → `/messages` → chọn conv với an
3. Gõ tin ở tab 1 và bấm Enter → tab 2 thấy tin ngay (qua Socket.IO)
4. Tab 3: login `admin` → `/admin/messages` → tin đó xuất hiện ngay trong `count`, click vào conv để đọc nội dung
