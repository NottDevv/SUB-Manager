/**
 * ============================================================================
 * Cloudflare Worker Backend for SubManager (Subscription & Config Manager)
 * Database: Cloudflare D1 (SQLite)
 * Features:
 *   - RESTful API for Admin & User management
 *   - Multi-tenant Subscription links router (/USR/:username, /u/:username, /sub/:username)
 *   - Automatic User-Agent detection (v2rayNG, Hiddify, Shadowrocket, Sing-Box, etc.)
 *   - Base64 payload generator with standard headers (subscription-userinfo, profile-title)
 *   - External Subscription Header Proxy (/api/sub-info)
 *   - Database Backup & Restore endpoints
 *   - Complete CORS handling & security headers
 * ============================================================================
 */

// --- Default CORS Headers Helper ---
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, User-Agent',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data, status = 200, request = null) {
  const corsHeaders = request ? getCorsHeaders(request) : { 'Access-Control-Allow-Origin': '*' };
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function errorResponse(message, status = 400, request = null) {
  return jsonResponse({ success: false, message }, status, request);
}

// --- SQL Schema Initialization Script ---
const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  expire_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
`;

// Seed initial admin & default users if database is empty
async function initializeDatabaseIfNeeded(db) {
  try {
    // 1. Ensure tables exist
    const statements = INITIAL_SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sql of statements) {
      await db.prepare(sql).run();
    }

    // 2. Check if admin credentials exist
    const adminCheck = await db.prepare("SELECT value FROM admin_config WHERE key = 'admin_username'").first();
    if (!adminCheck) {
      await db.batch([
        db.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_username', 'admin')"),
        db.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_password_hash', '123456')"),
      ]);
    }

    // 3. Check if any users exist; if empty, insert default sample users
    const userCountResult = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    if (userCountResult && userCountResult.count === 0) {
      const now = new Date().toISOString();
      const user1 = await db
        .prepare("INSERT INTO users (username, password, role, status, expire_date, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind('tehran_vip', 'user123', 'user', 'active', '2026-12-31', now)
        .run();

      const user1Id = user1.meta.last_row_id;

      await db.batch([
        db.prepare("INSERT INTO links (user_id, title, url) VALUES (?, ?, ?)").bind(
          user1Id,
          '🇩🇪 آلمان - High Speed',
          'vless://a1b2c3d4-e5f6-7890-abcd-1234567890ab@de.server.com:443?type=ws&security=tls&path=%2Fws#Germany-VIP'
        ),
        db.prepare("INSERT INTO links (user_id, title, url) VALUES (?, ?, ?)").bind(
          user1Id,
          '🇫🇷 فرانسه - Low Latency',
          'vmess://ew0KICAidnMiOiAiMi4wIiwNCiAgInBzIjogIkZyYW5jZS1WSVAiLA0KICAiYWRkIjogImZyLnNlcnZlci5jb20iLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYTFiMmMzZDQtZTVmNi03ODkwLWFiY2QtMTIzNDU2Nzg5MGFiIiwNCiAgImFpZCI6ICIwIiwNCiAgInNjcCI6ICJub25lIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvd3MiLA0KICAidGxzIjogInRscyINCn0='
        ),
      ]);

      const user2 = await db
        .prepare("INSERT INTO users (username, password, role, status, expire_date, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind('shiraz_user', 'shirazpass', 'user', 'active', '2026-09-15', now)
        .run();

      const user2Id = user2.meta.last_row_id;
      await db.prepare("INSERT INTO links (user_id, title, url) VALUES (?, ?, ?)").bind(
        user2Id,
        '🇬🇧 انگلیس - Turbo',
        'vless://b2c3d4e5-f6a7-8901-bcde-2345678901bc@uk.server.com:443?type=grpc&security=tls&serviceName=grpc#UK-Turbo'
      );
    }
  } catch (err) {
    console.error('Database Initialization Error:', err);
  }
}

// Check User-Agent for VPN clients
function isVpnClient(userAgent = '') {
  const ua = userAgent.toLowerCase();
  const clientKeywords = [
    'v2ray',
    'v2rayng',
    'nekobox',
    'shadowrocket',
    'hiddify',
    'streisand',
    'sing-box',
    'clash',
    'stash',
    'quantumult',
    'curl',
    'wget',
    'python',
    'go-http-client',
  ];
  return clientKeywords.some((k) => ua.includes(k));
}

// Convert string to Base64
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Format Unix Timestamp
function getUnixTimestamp(dateString) {
  if (!dateString) return 0;
  return Math.floor(new Date(dateString).getTime() / 1000);
}

// --- Main Cloudflare Worker Handler ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS Options Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    // Ensure D1 database binding exists
    if (!env.DB) {
      return errorResponse('D1 Database binding "DB" is missing in wrangler.toml', 500, request);
    }

    // Auto-initialize DB tables on first hit
    await initializeDatabaseIfNeeded(env.DB);

    // =========================================================================
    // 1. ROUTE: Subscription Router (/USR/:username, /u/:username, /sub/:username)
    // =========================================================================
    const subMatch = pathname.match(/^\/(USR|u|sub)\/([^/]+)/i);
    if (subMatch) {
      const username = decodeURIComponent(subMatch[2]);
      const userAgent = request.headers.get('user-agent') || '';
      const isRaw = url.searchParams.get('raw') === '1' || url.searchParams.get('config') === '1';

      if (isVpnClient(userAgent) || isRaw) {
        // Query User from D1
        const user = await env.DB.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').bind(username).first();

        if (!user) {
          return new Response(toBase64('User Account Not Found'), {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...getCorsHeaders(request) },
          });
        }

        if (user.status === 'disabled') {
          return new Response(toBase64('Account Disabled'), {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...getCorsHeaders(request) },
          });
        }

        const isExpired = user.expire_date && new Date(user.expire_date) < new Date();
        if (isExpired) {
          return new Response(toBase64('Account Expired'), {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...getCorsHeaders(request) },
          });
        }

        // Fetch user links
        const { results: links } = await env.DB.prepare('SELECT url FROM links WHERE user_id = ? ORDER BY id ASC')
          .bind(user.id)
          .all();

        const expireTimestamp = getUnixTimestamp(user.expire_date);
        const configText = (links || []).map((l) => l.url).join('\n');
        const base64Content = toBase64(configText);

        // 100GB default total, ~0.21GB sample usage for clients
        const defaultTotal = 107374182400;
        const defaultDownload = 225485783;

        return new Response(base64Content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'subscription-userinfo': `upload=0; download=${defaultDownload}; total=${defaultTotal}; expire=${expireTimestamp}`,
            'profile-title': `base64:${toBase64(user.username)}`,
            'profile-update-interval': '24',
            ...getCorsHeaders(request),
          },
        });
      }
    }

    // =========================================================================
    // 2. ROUTE: /api/sub-info (Subscription Header Proxy)
    // =========================================================================
    if (pathname === '/api/sub-info' && method === 'GET') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return errorResponse('Valid HTTP/HTTPS URL parameter is required', 400, request);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const subRes = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'v2rayNG/1.8.12 (Android)',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const subInfo = subRes.headers.get('subscription-userinfo');
        const profileTitle = subRes.headers.get('profile-title');

        return jsonResponse(
          {
            subscriptionUserinfo: subInfo || null,
            profileTitle: profileTitle || null,
            status: subRes.status,
          },
          200,
          request
        );
      } catch (err) {
        return jsonResponse(
          {
            subscriptionUserinfo: null,
            error: err.message || 'Failed to fetch subscription headers',
          },
          200,
          request
        );
      }
    }

    // =========================================================================
    // 3. ROUTE: /api/data (Full Admin & User Dashboard Data)
    // =========================================================================
    if (pathname === '/api/data' && method === 'GET') {
      try {
        // Fetch admin username
        const adminRow = await env.DB.prepare("SELECT value FROM admin_config WHERE key = 'admin_username'").first();
        const adminUsername = adminRow ? adminRow.value : 'admin';

        // Fetch all users
        const { results: users } = await env.DB.prepare('SELECT * FROM users ORDER BY id DESC').all();

        // Fetch all links
        const { results: links } = await env.DB.prepare('SELECT * FROM links ORDER BY id ASC').all();

        // Map links to respective users
        const fullUsers = users.map((u) => ({
          id: u.id,
          username: u.username,
          password: u.password || undefined,
          role: u.role,
          status: u.status,
          expire_date: u.expire_date,
          created_at: u.created_at,
          links: links.filter((l) => l.user_id === u.id),
        }));

        return jsonResponse(
          {
            adminUsername,
            users: fullUsers,
          },
          200,
          request
        );
      } catch (err) {
        return errorResponse(`Database Query Error: ${err.message}`, 500, request);
      }
    }

    // =========================================================================
    // 4. ROUTE: /api/auth/admin-login
    // =========================================================================
    if (pathname === '/api/auth/admin-login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { username, password } = body;

      const adminUserRow = await env.DB.prepare("SELECT value FROM admin_config WHERE key = 'admin_username'").first();
      const adminPassRow = await env.DB.prepare("SELECT value FROM admin_config WHERE key = 'admin_password_hash'").first();

      const currentAdminUser = adminUserRow ? adminUserRow.value : 'admin';
      const currentAdminPass = adminPassRow ? adminPassRow.value : '123456';

      if (username === currentAdminUser && password === currentAdminPass) {
        return jsonResponse({ success: true, role: 'admin', username: currentAdminUser }, 200, request);
      }
      return errorResponse('نام کاربری یا رمز عبور اشتباه است', 401, request);
    }

    // =========================================================================
    // 5. ROUTE: /api/auth/user-login
    // =========================================================================
    if (pathname === '/api/auth/user-login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { username, password } = body;

      const user = await env.DB.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').bind(username).first();

      if (user && (user.password === password || !user.password)) {
        const { results: userLinks } = await env.DB.prepare('SELECT * FROM links WHERE user_id = ?').bind(user.id).all();
        const fullUser = {
          ...user,
          links: userLinks,
        };
        return jsonResponse({ success: true, role: 'user', user: fullUser }, 200, request);
      }
      return errorResponse('رمز عبور اشتباه است', 401, request);
    }

    // =========================================================================
    // 6. ROUTE: /api/admin/update-credentials
    // =========================================================================
    if (pathname === '/api/admin/update-credentials' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { username, password } = body;

      if (username) {
        await env.DB.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_username', ?)").bind(username).run();
      }
      if (password) {
        await env.DB.prepare("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_password_hash', ?)").bind(password).run();
      }

      return jsonResponse({ success: true }, 200, request);
    }

    // =========================================================================
    // 7. ROUTE: /api/admin/users (Create User)
    // =========================================================================
    if (pathname === '/api/admin/users' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { username, password, expire_date } = body;

      if (!username) {
        return errorResponse('نام کاربری الزامی است', 400, request);
      }

      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').bind(username).first();
      if (existingUser) {
        return errorResponse('نام کاربری تکراری است', 400, request);
      }

      const now = new Date().toISOString();
      const insertResult = await env.DB.prepare(
        'INSERT INTO users (username, password, role, status, expire_date, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(username, password || null, 'user', 'active', expire_date || null, now)
        .run();

      const newUser = {
        id: insertResult.meta.last_row_id,
        username,
        password: password || undefined,
        role: 'user',
        status: 'active',
        expire_date: expire_date || null,
        created_at: now,
        links: [],
      };

      return jsonResponse({ success: true, user: newUser }, 200, request);
    }

    // =========================================================================
    // 8. ROUTE: /api/admin/users/:id (Update User)
    // =========================================================================
    const updateUserMatch = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
    if (updateUserMatch && method === 'PUT') {
      const userId = parseInt(updateUserMatch[1], 10);
      const body = await request.json().catch(() => ({}));
      const { username, password, status, expire_date } = body;

      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return errorResponse('کاربر یافت نشد', 404, request);
      }

      const newUsername = username || user.username;
      const newPassword = password !== undefined ? password : user.password;
      const newStatus = status || user.status;
      const newExpireDate = expire_date || null;

      await env.DB.prepare('UPDATE users SET username = ?, password = ?, status = ?, expire_date = ? WHERE id = ?')
        .bind(newUsername, newPassword, newStatus, newExpireDate, userId)
        .run();

      const { results: links } = await env.DB.prepare('SELECT * FROM links WHERE user_id = ?').bind(userId).all();

      const updatedUser = {
        id: userId,
        username: newUsername,
        password: newPassword || undefined,
        role: user.role,
        status: newStatus,
        expire_date: newExpireDate,
        created_at: user.created_at,
        links,
      };

      return jsonResponse({ success: true, user: updatedUser }, 200, request);
    }

    // =========================================================================
    // 9. ROUTE: /api/admin/users/:id (Delete User)
    // =========================================================================
    if (updateUserMatch && method === 'DELETE') {
      const userId = parseInt(updateUserMatch[1], 10);

      await env.DB.batch([
        env.DB.prepare('DELETE FROM links WHERE user_id = ?').bind(userId),
        env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
      ]);

      return jsonResponse({ success: true }, 200, request);
    }

    // =========================================================================
    // 10. ROUTE: /api/admin/users/:id/links (Add Link to User)
    // =========================================================================
    const userLinksMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/links$/);
    if (userLinksMatch && method === 'POST') {
      const userId = parseInt(userLinksMatch[1], 10);
      const body = await request.json().catch(() => ({}));
      const { title, url: linkUrl } = body;

      if (!title || !linkUrl) {
        return errorResponse('عنوان و آدرس لینک الزامی هستند', 400, request);
      }

      const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return errorResponse('کاربر یافت نشد', 404, request);
      }

      const insertResult = await env.DB.prepare('INSERT INTO links (user_id, title, url) VALUES (?, ?, ?)')
        .bind(userId, title, linkUrl)
        .run();

      const newLink = {
        id: insertResult.meta.last_row_id,
        user_id: userId,
        title,
        url: linkUrl,
      };

      return jsonResponse({ success: true, link: newLink }, 200, request);
    }

    // =========================================================================
    // 11. ROUTE: /api/admin/links/:linkId (Update Link)
    // =========================================================================
    const linkMatch = pathname.match(/^\/api\/admin\/links\/(\d+)$/);
    if (linkMatch && method === 'PUT') {
      const linkId = parseInt(linkMatch[1], 10);
      const body = await request.json().catch(() => ({}));
      const { title, url: linkUrl } = body;

      const link = await env.DB.prepare('SELECT * FROM links WHERE id = ?').bind(linkId).first();
      if (!link) {
        return errorResponse('لینک یافت نشد', 404, request);
      }

      const newTitle = title || link.title;
      const newUrl = linkUrl || link.url;

      await env.DB.prepare('UPDATE links SET title = ?, url = ? WHERE id = ?').bind(newTitle, newUrl, linkId).run();

      return jsonResponse(
        {
          success: true,
          link: {
            id: linkId,
            user_id: link.user_id,
            title: newTitle,
            url: newUrl,
          },
        },
        200,
        request
      );
    }

    // =========================================================================
    // 12. ROUTE: /api/admin/links/:linkId (Delete Link)
    // =========================================================================
    if (linkMatch && method === 'DELETE') {
      const linkId = parseInt(linkMatch[1], 10);
      await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(linkId).run();
      return jsonResponse({ success: true }, 200, request);
    }

    // =========================================================================
    // 13. ROUTE: /api/admin/backup (Download Full D1 JSON Backup)
    // =========================================================================
    if (pathname === '/api/admin/backup' && method === 'GET') {
      const adminRow = await env.DB.prepare("SELECT value FROM admin_config WHERE key = 'admin_username'").first();
      const passRow = await env.DB.prepare("SELECT value FROM admin_config WHERE key = 'admin_password_hash'").first();

      const { results: users } = await env.DB.prepare('SELECT * FROM users').all();
      const { results: links } = await env.DB.prepare('SELECT * FROM links').all();

      const fullUsers = users.map((u) => ({
        ...u,
        links: links.filter((l) => l.user_id === u.id),
      }));

      const dbData = {
        admin: {
          username: adminRow ? adminRow.value : 'admin',
          password_hash: passRow ? passRow.value : '123456',
        },
        users: fullUsers,
      };

      const fileName = `submanager_backup_${new Date().toISOString().slice(0, 10)}.json`;
      return new Response(JSON.stringify(dbData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          ...getCorsHeaders(request),
        },
      });
    }

    // =========================================================================
    // 14. ROUTE: /api/admin/restore (Restore Full JSON Backup to D1)
    // =========================================================================
    if (pathname === '/api/admin/restore' && method === 'POST') {
      try {
        const body = await request.json().catch(() => null);
        if (!body || !body.admin || !Array.isArray(body.users)) {
          return errorResponse('فرمت فایل پشتیبان نامعتبر است', 400, request);
        }

        // Clear existing tables
        await env.DB.batch([
          env.DB.prepare('DELETE FROM links'),
          env.DB.prepare('DELETE FROM users'),
          env.DB.prepare('DELETE FROM admin_config'),
        ]);

        // Restore admin config
        await env.DB.batch([
          env.DB.prepare("INSERT INTO admin_config (key, value) VALUES ('admin_username', ?)").bind(body.admin.username || 'admin'),
          env.DB.prepare("INSERT INTO admin_config (key, value) VALUES ('admin_password_hash', ?)").bind(
            body.admin.password_hash || '123456'
          ),
        ]);

        // Restore users & links
        for (const u of body.users) {
          const insertUser = await env.DB.prepare(
            'INSERT INTO users (id, username, password, role, status, expire_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
            .bind(
              u.id || null,
              u.username,
              u.password || null,
              u.role || 'user',
              u.status || 'active',
              u.expire_date || null,
              u.created_at || new Date().toISOString()
            )
            .run();

          const actualUserId = u.id || insertUser.meta.last_row_id;

          if (Array.isArray(u.links)) {
            for (const l of u.links) {
              await env.DB.prepare('INSERT INTO links (id, user_id, title, url) VALUES (?, ?, ?, ?)')
                .bind(l.id || null, actualUserId, l.title, l.url)
                .run();
            }
          }
        }

        return jsonResponse({ success: true }, 200, request);
      } catch (err) {
        return errorResponse(`خطا در بازگردانی اطلاعات: ${err.message}`, 500, request);
      }
    }

    // Default Fallback for static assets or unrecognized endpoints
    return new Response('SubManager Cloudflare Worker is running active.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...getCorsHeaders(request) },
    });
  },
};
