import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Data Storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface LinkRecord {
  id: number;
  user_id: number;
  title: string;
  url: string;
}

interface UserRecord {
  id: number;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  expire_date: string | null;
  created_at: string;
  links: LinkRecord[];
}

interface DatabaseSchema {
  admin: {
    username: string;
    password_hash: string;
  };
  users: UserRecord[];
}

const initialDb: DatabaseSchema = {
  admin: {
    username: 'admin',
    password_hash: '123456',
  },
  users: [
    {
      id: 1,
      username: 'tehran_vip',
      password: 'user123',
      role: 'user',
      status: 'active',
      expire_date: '2026-12-31',
      created_at: new Date().toISOString(),
      links: [
        {
          id: 101,
          user_id: 1,
          title: '🇩🇪 آلمان - High Speed',
          url: 'vless://a1b2c3d4-e5f6-7890-abcd-1234567890ab@de.server.com:443?type=ws&security=tls&path=%2Fws#Germany-VIP',
        },
        {
          id: 102,
          user_id: 1,
          title: '🇫🇷 فرانسه - Low Latency',
          url: 'vmess://ew0KICAidnMiOiAiMi4wIiwNCiAgInBzIjogIkZyYW5jZS1WSVAiLA0KICAiYWRkIjogImZyLnNlcnZlci5jb20iLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYTFiMmMzZDQtZTVmNi03ODkwLWFiY2QtMTIzNDU2Nzg5MGFiIiwNCiAgImFpZCI6ICIwIiwNCiAgInNjcCI6ICJub25lIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvd3MiLA0KICAidGxzIjogInRscyINCn0=',
        },
        {
          id: 103,
          user_id: 1,
          title: '🇳🇱 هلند - Game Ping',
          url: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQxMjM=@nl.server.com:8388#Netherlands-Game',
        },
      ],
    },
    {
      id: 2,
      username: 'shiraz_user',
      password: 'shirazpass',
      role: 'user',
      status: 'active',
      expire_date: '2026-09-15',
      created_at: new Date().toISOString(),
      links: [
        {
          id: 104,
          user_id: 2,
          title: '🇬🇧 انگلیس - Turbo',
          url: 'vless://b2c3d4e5-f6a7-8901-bcde-2345678901bc@uk.server.com:443?type=grpc&security=tls&serviceName=grpc#UK-Turbo',
        },
      ],
    },
  ],
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return initialDb;
  }
}

function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Check User-Agent for VPN client applications
function isVpnClient(userAgent: string = ''): boolean {
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
  return clientKeywords.some((keyword) => ua.includes(keyword));
}

// --- Subscription Sub Link Endpoint (Base64 User-Agent routing for /USR/:username) ---
app.get(['/USR/:username', '/u/:username', '/sub/:username'], (req, res, next) => {
  const { username } = req.params;
  const userAgent = req.headers['user-agent'] || '';
  const isRaw = req.query.raw === '1' || req.query.config === '1';

  if (isVpnClient(userAgent) || isRaw) {
    const db = readDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(404).send(Buffer.from('User Account Not Found').toString('base64'));
    }

    if (user.status === 'disabled') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(403).send(Buffer.from('Account Disabled').toString('base64'));
    }

    const isExpired = user.expire_date && new Date(user.expire_date) < new Date();
    if (isExpired) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(403).send(Buffer.from('Account Expired').toString('base64'));
    }

    // Prepare Subscription Headers
    const expireTimestamp = user.expire_date
      ? Math.floor(new Date(user.expire_date).getTime() / 1000)
      : 0;

    const defaultTotal = 107374182400;
    const defaultDownload = 225485783;
    res.setHeader('subscription-userinfo', `upload=0; download=${defaultDownload}; total=${defaultTotal}; expire=${expireTimestamp}`);
    res.setHeader('profile-title', `base64:${Buffer.from(user.username).toString('base64')}`);
    res.setHeader('profile-update-interval', '24');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const configList = user.links.map((l) => l.url).join('\n');
    const base64Output = Buffer.from(configList).toString('base64');
    return res.send(base64Output);
  }

  // If standard browser request, pass down to Vite / SPA handler
  next();
});

// Proxy for fetching Subscription Header (subscription-userinfo) from external sub links
app.get('/api/sub-info', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'v2rayNG/1.8.12 (Android)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const subInfo = response.headers.get('subscription-userinfo');
    const profileTitle = response.headers.get('profile-title');

    res.json({
      subscriptionUserinfo: subInfo || null,
      profileTitle: profileTitle || null,
      status: response.status,
    });
  } catch (err: any) {
    res.json({ subscriptionUserinfo: null, error: err.message || 'Fetch failed' });
  }
});

// --- API Routes ---
app.get('/api/data', (req, res) => {
  const db = readDb();
  res.json({
    adminUsername: db.admin.username,
    users: db.users,
  });
});

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (username === db.admin.username && password === db.admin.password_hash) {
    return res.json({ success: true, role: 'admin', username: db.admin.username });
  }
  return res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
});

// User Login
app.post('/api/auth/user-login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (user && (user.password === password || !user.password)) {
    return res.json({ success: true, role: 'user', user });
  }
  return res.status(401).json({ success: false, message: 'رمز عبور اشتباه است' });
});

// Update Admin Credentials
app.post('/api/admin/update-credentials', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (username) db.admin.username = username;
  if (password) db.admin.password_hash = password;
  writeDb(db);
  res.json({ success: true });
});

// Create User
app.post('/api/admin/users', (req, res) => {
  const { username, password, expire_date } = req.body;
  const db = readDb();

  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'نام کاربری تکراری است' });
  }

  const newUser: UserRecord = {
    id: Date.now(),
    username,
    password: password || undefined,
    role: 'user',
    status: 'active',
    expire_date: expire_date || null,
    created_at: new Date().toISOString(),
    links: [],
  };

  db.users.push(newUser);
  writeDb(db);
  res.json({ success: true, user: newUser });
});

// Update User
app.put('/api/admin/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const { username, password, status, expire_date } = req.body;
  const db = readDb();

  const userIdx = db.users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return res.status(404).json({ success: false });

  if (username) db.users[userIdx].username = username;
  if (password) db.users[userIdx].password = password;
  if (status) db.users[userIdx].status = status;
  db.users[userIdx].expire_date = expire_date || null;

  writeDb(db);
  res.json({ success: true, user: db.users[userIdx] });
});

// Delete User
app.delete('/api/admin/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  db.users = db.users.filter((u) => u.id !== userId);
  writeDb(db);
  res.json({ success: true });
});

// Add Link to User
app.post('/api/admin/users/:id/links', (req, res) => {
  const userId = Number(req.params.id);
  const { title, url } = req.body;
  const db = readDb();

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false });

  const newLink: LinkRecord = {
    id: Date.now(),
    user_id: userId,
    title,
    url,
  };

  user.links.push(newLink);
  writeDb(db);
  res.json({ success: true, link: newLink });
});

// Update Link
app.put('/api/admin/links/:linkId', (req, res) => {
  const linkId = Number(req.params.linkId);
  const { title, url } = req.body;
  const db = readDb();

  for (const user of db.users) {
    const linkIdx = user.links.findIndex((l) => l.id === linkId);
    if (linkIdx !== -1) {
      if (title) user.links[linkIdx].title = title;
      if (url) user.links[linkIdx].url = url;
      writeDb(db);
      return res.json({ success: true, link: user.links[linkIdx] });
    }
  }

  res.status(404).json({ success: false });
});

// Delete Link
app.delete('/api/admin/links/:linkId', (req, res) => {
  const linkId = Number(req.params.linkId);
  const db = readDb();

  for (const user of db.users) {
    user.links = user.links.filter((l) => l.id !== linkId);
  }

  writeDb(db);
  res.json({ success: true });
});

// One-Click Database Backup download
app.get('/api/admin/backup', (req, res) => {
  const db = readDb();
  const fileName = `submanager_backup_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(JSON.stringify(db, null, 2));
});

// Restore Database Backup
app.post('/api/admin/restore', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const newDb = req.body;
    if (newDb && newDb.admin && Array.isArray(newDb.users)) {
      writeDb(newDb);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid database format' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Boot Server with Vite Middleware or Production Static Fallback
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubManager Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
