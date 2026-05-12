# Twitter Clone Mini API

Express + MongoDB backend cho Twitter clone. Port mặc định **9990**.

## Setup

```bash
npm install
cp .env-example .env  # nếu chưa có
npm run seed          # tạo 3 user + 9 tweet + follows
npm run dev           # dev server với nodemon + tsx
```

Yêu cầu: MongoDB local đang chạy ở `127.0.0.1:27017` (xem `MONGO_URI` trong `.env`).

## Scripts

| Command         | Mục đích                                            |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Dev server (nodemon + tsx)                          |
| `npm run build` | TypeScript build sang `dist/`                       |
| `npm start`     | Chạy production build từ `dist/`                    |
| `npm run seed`  | Insert seed data — xem [docs/seed-accounts.md](docs/seed-accounts.md) |
| `npm run smoke` | CLI smoke test toàn bộ endpoint (yêu cầu BE chạy)   |

## Docs

- [Seed accounts + credentials](docs/seed-accounts.md)
- Swagger UI: `http://localhost:9990/api-docs` (khi BE đang chạy)

## API endpoints

| Path                            | Method   | Auth | Mô tả                       |
| ------------------------------- | -------- | ---- | --------------------------- |
| `/users/register`               | POST     |  —   | Đăng ký                     |
| `/users/login`                  | POST     |  —   | Đăng nhập                   |
| `/users/logout`                 | POST     |  ✓   | Đăng xuất                   |
| `/users/refresh-token`          | POST     |  —   | Refresh access token        |
| `/users/me`                     | GET      |  ✓   | Lấy user hiện tại           |
| `/users/me`                     | PATCH    |  ✓   | Update profile              |
| `/users/change-password`        | PUT      |  ✓   | Đổi mật khẩu                |
| `/users/:username`              | GET      |  —   | Public profile              |
| `/users/follow`                 | POST     |  ✓   | Follow                      |
| `/users/follow/:user_id`        | DELETE   |  ✓   | Unfollow                    |
| `/users/forgot-password`        | POST     |  —   | Gửi forgot password token   |
| `/users/reset-password`         | POST     |  —   | Reset password              |
| `/users/verify-email`           | POST     |  —   | Verify email                |
| `/tweets/timeline`              | GET      |  ✓   | Feed (paginated)            |
| `/tweets`                       | POST     |  ✓   | Đăng tweet                  |
| `/tweets/:tweet_id`             | GET      |  ✓   | Tweet detail                |
| `/likes`                        | POST     |  ✓   | Like tweet                  |
| `/likes/tweets/:tweet_id`       | DELETE   |  ✓   | Unlike                      |
| `/bookmarks`                    | POST     |  ✓   | Bookmark                    |
| `/bookmarks/tweets/:tweet_id`   | DELETE   |  ✓   | Unbookmark                  |

Response shape: `{ success, data, message }` cho single, `{ success, data, meta, message }` cho paginated.
