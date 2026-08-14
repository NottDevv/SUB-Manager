# 🚀 راهنمای کامل راه‌اندازی پنل SubManager روی Cloudflare Worker + SQLite D1

این راهنما آموزش گام‌به‌گام برای استقرار (Deploy) کامل پروژه مدیریت سابسکریپشن **SubManager** روی زیرساخت رایگان و لبه کلادفلر (**Cloudflare Worker**) و دیتابیس **SQLite D1** می‌باشد.

---

## 📋 فهرست مطالب
1. [پیش‌نیازها](#-پیش‌نیازها)
2. [نصب و ورود به Wrangler CLI](#-نصب-و-ورود-به-wrangler-cli)
3. [ساخت دیتابیس SQLite D1 در کلادفلر](#-ساخت-دیتابیس-sqlite-d1-در-کلادفلر)
4. [تنظیم فایل wrangler.toml](#-تنظیم-فایل-wranglertoml)
5. [ایجاد و مقداردهی اولیه جدول‌های دیتابیس (Migration)](#-ایجاد-و-مقداردهی-اولیه-جدول‌های-دیتابیس-migration)
6. [استقرار و آپلود Worker](#-استقرار-و-آپلود-worker)
7. [اتصال دامنه اختصاصی (Custom Domain)](#-اتصال-دامنه-اختصاصی-custom-domain)
8. [تست و عیب‌یابی](#-تست-و-عیب‌یابی)

---

## 🛠️ ۱. پیش‌نیازها

- یک حساب کاربری فعال در [Cloudflare](https://dash.cloudflare.com/)
- ابزار [Node.js](https://nodejs.org/) (نسخه ۱۸ به بالا)

---

## 💻 ۲. نصب و ورود به Wrangler CLI

ابزار **Wrangler** دستور خطی رسمی کلادفلر برای مدیریت ورکرها و دیتابیس D1 است.

برای نصب سراسری Wrangler دستور زیر را در ترمینال اجرا کنید:

```bash
npm install -g wrangler
```

سپس برای متصل کردن حساب کلادفلر خود وارد شوید:

```bash
wrangler login
```
*با اجرای این دستور یک مرورگر باز می‌شود که باید روی دکمه Allow کلیک کنید تا دسترسی داده شود.*

---

## 🗄️ ۳. ساخت دیتابیس SQLite D1 در کلادفلر

برای ساخت یک دیتابیس SQLite جدید در کلادفلر به نام `submanager-db` دستور زیر را اجرا کنید:

```bash
wrangler d1 create submanager-db
```

پس از ساخت، خروجی مشابه زیر به شما داده می‌شود که حاوی **`database_id`** شماست:

```text
✅ Successfully created DB 'submanager-db' in region WNAM
Created your database using D1's new storage engine.

[[d1_databases]]
binding = "DB"
database_name = "submanager-db"
database_id = "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

*کد `database_id` فوق را کپی کنید زیرا در مرحله بعدی به آن نیاز داریم.*

---

## ⚙️ ۴. تنظیم فایل `wrangler.toml`

در همان فولدر `Worker` یک فایل به نام `wrangler.toml` بسازید و محتویات زیر را در آن قرار دهید:

```toml
name = "submanager-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

# اتصال دیتابیس D1
[[d1_databases]]
binding = "DB"
database_name = "submanager-db"
database_id = "کد_دیتا_بیس_شما_در_مرحله_قبل"
```

---

## 📝 ۵. ایجاد و مقداردهی اولیه جدول‌های دیتابیس (Migration)

برای ساخت جدول‌ها به صورت دستی (یا بررسی ساختار SQL)، یک فایل به نام `schema.sql` درون فولدر `Worker` بسازید:

```sql
-- فایل schema.sql

-- 1. جدول تنظیمات ادمین
CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. جدول کاربران
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  expire_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول لینک‌ها و کانفیگ‌ها
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ۴. اطلاعات اولیه ادمین
INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_username', 'admin');
INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_password_hash', '123456');
```

حالا برای اجرای این دستورات روی دیتابیس ابری D1 دستور زیر را بزنید:

```bash
wrangler d1 execute submanager-db --file=./schema.sql
```

*(برای اجرای آزمایشی و تست لوکال می‌توانید از پرچم `--local` استفاده کنید).*

---

## 🚀 ۶. استقرار و آپلود Worker

برای آپلود و انتشار ورکر روی شبکه جهانی کلادفلر دستور زیر را در ترمینال اجرا کنید:

```bash
wrangler deploy
```

پس از اجرای موفق، آدرس ورکر شما به صورت زیر نمایش داده می‌شود:
`https://submanager-worker.your-subdomain.workers.dev`

---

## 🌐 ۷. اتصال دامنه اختصاصی (Custom Domain)

برای اینکه لینک‌های سابسکریپشن بدون فیلترینگ یا اختلال روی دامنه اختصاصی شما (مثلاً `sub.yourdomain.com`) کار کنند:

1. وارد پنل Cloudflare خود شوید و دامنه خود را انتخاب کنید.
2. از منوی سمت چپ به **Workers & Pages** بروید.
3. ورکر `submanager-worker` را انتخاب کنید.
4. وارد زبانه **Settings** > **Triggers** شوید.
5. روی **Add Custom Domain** کلیک کنید.
6. دامنه فرعی خود مانند `sub.mydomain.com` را وارد کنید.
7. کلادفلر به صورت خودکار ریکورد DNS مرتبط را ایجاد و گواهی SSL رایگان صادر می‌کند.

---

## 🔍 ۸. تست و عیب‌یابی

### تست لینک سابسکریپشن کاربر:
آدرس زیر را در مرورگر یا اپلیکیشن‌هایی مثل v2rayNG / Hiddify تست کنید:
- `https://sub.mydomain.com/USR/tehran_vip`
- `https://sub.mydomain.com/sub/shiraz_user`

### ویژگی هدرهای استاندارد (Subscription-Userinfo):
هنگامی که این لینک توسط نرم‌افزار v2rayNG فراخوانی می‌شود، هدرهای زیر صادر می‌گردند:
```http
subscription-userinfo: upload=0; download=0; total=0; expire=1798675200
profile-title: base64:dGVocmFuX3ZpcA==
profile-update-interval: 24
```

### تست دیتابیس لوکال:
برای اجرای ورکر به صورت آزمایشی روی سیستم خودتان:
```bash
wrangler dev
```

---

🎉 **تبریک! پنل سابسکریپشن شما با ساختار فوق‌العاده سریع و رایگان Cloudflare Worker و دیتابیس D1 آماده استفاده است.**
