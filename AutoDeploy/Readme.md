<div align="center">

  <div align="center">
    <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" alt="SubManager Logo" width="100" height="100" />
  </div>

  # 🚀 SubManager Auto Deploy Wizard

  **سریع‌ترین و ساده‌ترین روش برای دپلوی خودکار پنل مدیریت SubManager روی Cloudflare Workers**


</div>


[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy%20via-SubManager%20Wizard-0284c7?style=for-the-badge&logo=cloudflare&logoColor=white)](https://nottdevv.github.io/SUB-Manager/AutoDeploy/)



## 📖 معرفی پروژه :

این ویزارد (**SubManager Auto Deploy Wizard**) یک ابزار فرانت‌اند بر پایه HTML و TailwindCSS است که به کاربران اجازه می‌دهد بدون نیاز به نصب هیچ‌گونه پیش‌نیاز، ابزارهای ترمینالی یا دانش فنی پیچیده، پنل مدیریت **[SUB-Manager](https://github.com/NottDevv/SUB-Manager)** را تنها با چند کلیک روی سرویس Cloudflare Workers و دیتابیس D1 راه‌اندازی کنند.

---


## 🌟 ویژگی‌ها (Features)

- ⚡ **دپلوی کاملاً خودکار:** اتصال مستقیم به API کلادفلر و ایجاد اتوماتیک پایگاه‌داده D1 و Worker.
- 🎨 **رابط کاربری مدرن و واکنش‌گرا:** طراحی زیبا با Tailwind CSS، پشتیبانی از حالت شب و بهینه‌سازی کامل برای موبایل و دسکتاپ.
- 🌐 **پشتیبانی دو زبانه:** دارای سوئیچ لحظه‌ای بین زبان‌های **فارسی** و **English**.
- 🔐 **ایمنی و شفافیت بالا:** انجام تمام پردازش‌ها و درخواست‌های API در سمت مرورگر شما (Client-Side).
- 🛠️ **پیکربندی آسان مسیر:** قابلیت تنظیم نام دلخواه برای Worker و تغییر مسیر (Path) پنل مدیریت قبل از دپلوی.

---




## 🛠️ نحوه کارکرد (How it Works)

این ویزارد تمامی مراحل REST API کلادفلر را به صورت خودکار زیر مدیریت می‌کند:

* **مرحله ۱:** دریافت Account ID و API Token از کاربر
* **مرحله ۲:** دریافت آخرین نسخه کدهای ورکر از گیت‌هاب
* **مرحله ۳:** بررسی و ساخت خودکار دیتابیس D1 با نام submanager-db
* **مرحله ۴:** آپلود سورس ورکر با Binding متغیر DB
* **مرحله ۵:** فعال‌سازی ساب‌دومین workers.dev و تحویل لینک نهایی

---




##  🧰 جزئیات فنی مراحل:
1. **دانلود سورس ورکر:** ابزار به صورت مستقیم فایل `worker.js` را از [ریپازیتوری اصلی SUB-Manager](https://github.com/NottDevv/SUB-Manager/refs/heads/main/Worker/worker.js) دریافت می‌کند.
2. **مدیریت D1 Database:** ساخت دیتابیس `submanager-db` (در صورت عدم وجود) و دریافت `UUID` آن.
3. **تنظیم Bindings:** اتصال متغیر محیطی **`DB`** به دیتابیس ساخته‌شده جهت ذخیره اطلاعات کاربران و کانفیگ‌ها.
4. **انتشار روی Edge:** فعال‌سازی ساب‌دومین `workers.dev` و تحویل آدرس نهایی.

---


## 📋 پیش‌نیازها (Prerequisites)

برای شروع استفاده تنها به موارد زیر نیاز دارید:
1. یک حساب رایگان در **[Cloudflare](https://dash.cloudflare.com/sign-up)**.
2. دریافت **Account ID** و ایجاد یک **API Token** (کلادفلر).

---

## 🚀 راهنمای سریع استفاده (Quick Start)

### ۱. ساخت توکن کلادفلر (API Token)
برای عملکرد صحیح ویزارد دپلوی، توکن شما باید دسترسی‌های زیر را داشته باشد:
- `Workers Scripts` ➔ **Edit**
- `D1` ➔ **Edit**
- `User Details` ➔ **Read**

> 💡 **راهنمای سریع:** می‌توانید روی **[لینک مستقیم ساخت توکن با دسترسی‌های پیش‌فرض](https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_scripts%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22d1%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22user_details%22%2C%22type%22%3A%22read%22%7D%5D&accountId=*&zoneId=all&name=SubManager-Wizard)** کلیک کنید تا دسترسی‌ها به‌صورت خودکار تنظیم شوند.

### ۲. اجرای دپلوی
1. صفحه اتودپلوی را باز کنید.
2. **Account ID** و **API Token** خود را در ورودی‌های مربوطه وارد کنید.
3. در صورت نیاز، نام پنل (`Panel Name`) و آدرس مسیر ادمین (`Path`) را تغییر دهید.
4. روی دکمه **Deploy Panel / شروع دپلوی پنل** کلیک کنید و چند ثانیه منتظر بمانید.
5. پس از اتمام، لینک اختصاصی پنل مدیریت همراه با اطلاعات ورود پیش‌فرض نمایش داده می‌شود.

---

## 🔑 اطلاعات ورود پیش‌فرض (Default Credentials)

پس از نصب موفقیت‌آمیز، می‌توانید با اطلاعات زیر وارد پنل شوید:

- **نام کاربری پیش‌فرض:** `admin`
- **رمز عبور پیش‌فرض:** `123456`

> ⚠️ **هشدار امنیتی مهم:** بلافاصله پس از اولین ورود، حتماً نام کاربری و رمز عبور پیش‌فرض را از بخش **تنظیمات ادمین (Admin Settings)** تغییر دهید.

---

## 💻 راه‌اندازی روی GitHub Pages (Local / Self-Host)

اگر می‌خواهید این صفحه اتودپلوی را روی GitHub Pages پروژه خود میزبانی کنید:

1. فایل `index.html` را در ریشه (Root) پروژه یا پوشه `wizard/` قرار دهید.
2. از بخش تنظیمات ریپازیتوری (**Settings ➔ Pages**)، منبع انتشار را روی شاخه `main` تنظیم کنید.
3. وب‌سایت اتودپلوی شما روی آدرس زیر فعال خواهد شد:
   `https://<your-username>.github.io/SUB-Manager/`

---

## 🤝 مشارکت (Contributing)

مشارکت‌ها، پیشنهادات و گزارش مشکلات (Issues) همیشه استقبال می‌شوند!  
اگر این ابزار برای شما مفید بود، لطفاً با دادن یک ⭐ به پروژه اصلی **[SUB-Manager](https://github.com/NottDevv/SUB-Manager)** از ما حمایت کنید.
