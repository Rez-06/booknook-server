# BookNook Server

Express + MongoDB API for BookNook, a small online library.

Live API: https://booknook-server-rez24.vercel.app/

## Endpoints

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/books` | public | all books (`?limit=6` for newest) |
| GET | `/books/:id` | public | one book |
| POST | `/books` | JWT | add a book |
| PATCH | `/books/:id` | JWT, owner | update a book |
| DELETE | `/books/:id` | JWT, owner | delete a book |
| POST | `/borrows` | JWT | borrow a book (copies -1, no double borrow) |
| GET | `/borrows` | JWT | borrows of the logged-in user |
| DELETE | `/borrows/:id` | JWT, owner | return a book (copies +1) |

## Run locally

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

## Auth

Requests send `Authorization: Bearer <token>`. Tokens are issued by Better Auth on the client
and verified here against its JWKS endpoint (`JWKS_URL`).
