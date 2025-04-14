# 📬 SubTracker – Smart Email-Based Subscription Tracker

SubTracker helps users stay on top of recurring subscriptions by scanning their Gmail inbox for billing emails and generating clean, monthly summaries. It's privacy-respecting, user-friendly, and fully automated.

## 🚀 Features

- 🔐 **Google Login** (OAuth 2.0) with read-only Gmail access
- 📥 **Automated Email Scanning** using Gmail API + OpenAI
- 🧠 **AI-Powered Extraction** of vendor, amount, and currency from emails
- 💾 **Supabase Backend** to store users, subscriptions, and email metadata
- 📊 **Beautiful Monthly Summaries** with detailed breakdowns
- 📩 **Email Reports** sent automatically every 30 days
- ✅ **Privacy-First**: We never store email content, only structured metadata

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, Shadcn/UI
- **Auth**: NextAuth.js + Google OAuth
- **Backend**: Supabase (PostgreSQL, Row Level Security)
- **AI**: OpenAI API (GPT-4) for parsing billing info
- **Email**: Gmail API (read-only access)

---

## 📦 Database Schema (Supabase)

### `users`
| Column       | Type     | Description                    |
|--------------|----------|--------------------------------|
| id           | UUID     | Primary key (Google `sub`)     |
| email        | Text     | User email                     |
| created_at   | Timestamp| When user was created          |

### `profiles`
| Column       | Type     | Description               |
|--------------|----------|---------------------------|
| id           | UUID     | FK to `users.id`          |
| full_name    | Text     | User name                 |
| phone        | Text     | Optional phone number     |
| address      | Text     | Optional mailing address  |

### `subscriptions`
| Column      | Type     | Description                         |
|-------------|----------|-------------------------------------|
| id          | UUID     | Primary key                         |
| user_id     | UUID     | FK to `users.id`                    |
| vendor      | Text     | Extracted vendor name               |
| amount      | Numeric  | Subscription amount                 |
| currency    | Text     | USD, CAD, etc.                      |
| interval    | Text     | Monthly / Yearly / Unknown          |
| last_seen   | Date     | Date of last billing email          |

### `emails`
| Column      | Type     | Description                      |
|-------------|----------|----------------------------------|
| id          | UUID     | Primary key                      |
| user_id     | UUID     | FK to `users.id`                 |
| subscription_id | UUID | FK to `subscriptions.id`         |
| subject     | Text     | Email subject                    |
| date        | Date     | Date of the email                |
| extracted_text | Text | Summary extracted via OpenAI     |

---

## ✨ How It Works

1. **User Logs In** → Google login prompts Gmail read-only permission
2. **Gmail Sync** → `/api/gmail/scan` fetches recent emails via Gmail API
3. **OpenAI Parsing** → Body of each email is sent to OpenAI for vendor, amount, currency
4. **Supabase Sync** → Parsed data is saved into `subscriptions` and `emails` tables
5. **Frontend Summary** → User sees all their recurring charges in a clean UI
6. **Auto Reports** → Monthly summary email sent to the user

---

