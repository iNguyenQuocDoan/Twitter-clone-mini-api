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
4. `/debug` → bấm "Chạy tất cả test" → tất cả 11 row chuyển sang ✅
