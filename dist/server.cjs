var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DATA_FILE = import_path.default.join(DATA_DIR, "database.json");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var initialDb = {
  admin: {
    username: "admin",
    password_hash: "123456"
  },
  users: []
};
function readDb() {
  try {
    if (!import_fs.default.existsSync(DATA_FILE)) {
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const content = import_fs.default.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return initialDb;
  }
}
function writeDb(db) {
  try {
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}
var FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
app.get(["/favicon.ico", "/favicon.svg"], (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(FAVICON_SVG);
});
function isVpnClient(userAgent = "") {
  const ua = userAgent.toLowerCase();
  const clientKeywords = [
    "v2ray",
    "v2rayng",
    "nekobox",
    "shadowrocket",
    "hiddify",
    "streisand",
    "sing-box",
    "clash",
    "stash",
    "quantumult",
    "curl",
    "wget",
    "python",
    "go-http-client"
  ];
  return clientKeywords.some((keyword) => ua.includes(keyword));
}
app.get(["/USR/:username", "/u/:username", "/sub/:username"], (req, res, next) => {
  const { username } = req.params;
  const userAgent = req.headers["user-agent"] || "";
  const isRaw = req.query.raw === "1" || req.query.config === "1";
  if (isVpnClient(userAgent) || isRaw) {
    const db = readDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(404).send(Buffer.from("User Account Not Found").toString("base64"));
    }
    if (user.status === "disabled") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(403).send(Buffer.from("Account Disabled").toString("base64"));
    }
    const isExpired = user.expire_date && new Date(user.expire_date) < /* @__PURE__ */ new Date();
    if (isExpired) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(403).send(Buffer.from("Account Expired").toString("base64"));
    }
    const expireTimestamp = user.expire_date ? Math.floor(new Date(user.expire_date).getTime() / 1e3) : 0;
    const defaultTotal = 107374182400;
    const defaultDownload = 225485783;
    res.setHeader("subscription-userinfo", `upload=0; download=${defaultDownload}; total=${defaultTotal}; expire=${expireTimestamp}`);
    res.setHeader("profile-title", `base64:${Buffer.from(user.username).toString("base64")}`);
    res.setHeader("profile-update-interval", "24");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const configList = user.links.map((l) => l.url).join("\n");
    const base64Output = Buffer.from(configList).toString("base64");
    return res.send(base64Output);
  }
  next();
});
app.get("/api/sub-info", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Valid URL is required" });
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6e3);
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "v2rayNG/1.8.12 (Android)"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const subInfo = response.headers.get("subscription-userinfo");
    const profileTitle = response.headers.get("profile-title");
    res.json({
      subscriptionUserinfo: subInfo || null,
      profileTitle: profileTitle || null,
      status: response.status
    });
  } catch (err) {
    res.json({ subscriptionUserinfo: null, error: err.message || "Fetch failed" });
  }
});
app.get("/api/data", (req, res) => {
  const db = readDb();
  res.json({
    adminUsername: db.admin.username,
    users: db.users
  });
});
app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (username === db.admin.username && password === db.admin.password_hash) {
    return res.json({ success: true, role: "admin", username: db.admin.username });
  }
  return res.status(401).json({ success: false, message: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A" });
});
app.post("/api/auth/user-login", (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (user && (user.password === password || !user.password)) {
    return res.json({ success: true, role: "user", user });
  }
  return res.status(401).json({ success: false, message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A" });
});
app.post("/api/admin/update-credentials", (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (username) db.admin.username = username;
  if (password) db.admin.password_hash = password;
  writeDb(db);
  res.json({ success: true });
});
app.post("/api/admin/users", (req, res) => {
  const { username, password, expire_date, order_index } = req.body;
  const db = readDb();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ success: false, message: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u0627\u0633\u062A" });
  }
  const nextOrder = typeof order_index === "number" ? order_index : db.users.length + 1;
  const newUser = {
    id: Date.now(),
    username,
    password: password || void 0,
    role: "user",
    status: "active",
    expire_date: expire_date || null,
    order_index: nextOrder,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    links: []
  };
  db.users.push(newUser);
  db.users.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  writeDb(db);
  res.json({ success: true, user: newUser });
});
app.put("/api/admin/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const { username, password, status, expire_date, order_index } = req.body;
  const db = readDb();
  const userIdx = db.users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return res.status(404).json({ success: false });
  if (username) db.users[userIdx].username = username;
  if (password) db.users[userIdx].password = password;
  if (status) db.users[userIdx].status = status;
  if (typeof order_index === "number") db.users[userIdx].order_index = order_index;
  db.users[userIdx].expire_date = expire_date || null;
  db.users.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  writeDb(db);
  res.json({ success: true, user: db.users[userIdx] });
});
app.post("/api/admin/reorder-users", (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) return res.status(400).json({ success: false, message: "Invalid payload" });
  const db = readDb();
  userIds.forEach((id, idx) => {
    const user = db.users.find((u) => u.id === id);
    if (user) {
      user.order_index = idx + 1;
    }
  });
  db.users.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  writeDb(db);
  res.json({ success: true, users: db.users });
});
app.delete("/api/admin/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const db = readDb();
  db.users = db.users.filter((u) => u.id !== userId);
  writeDb(db);
  res.json({ success: true });
});
app.post("/api/admin/users/:id/links", (req, res) => {
  const userId = Number(req.params.id);
  const { title, url, order_index } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false });
  const nextOrder = typeof order_index === "number" ? order_index : user.links.length + 1;
  const newLink = {
    id: Date.now(),
    user_id: userId,
    title,
    url,
    order_index: nextOrder
  };
  user.links.push(newLink);
  user.links.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  writeDb(db);
  res.json({ success: true, link: newLink });
});
app.post("/api/admin/users/:id/reorder-links", (req, res) => {
  const userId = Number(req.params.id);
  const { linkIds } = req.body;
  if (!Array.isArray(linkIds)) return res.status(400).json({ success: false, message: "Invalid payload" });
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false });
  linkIds.forEach((id, idx) => {
    const link = user.links.find((l) => l.id === id);
    if (link) {
      link.order_index = idx + 1;
    }
  });
  user.links.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  writeDb(db);
  res.json({ success: true, links: user.links });
});
app.put("/api/admin/links/:linkId", (req, res) => {
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
app.delete("/api/admin/links/:linkId", (req, res) => {
  const linkId = Number(req.params.linkId);
  const db = readDb();
  for (const user of db.users) {
    user.links = user.links.filter((l) => l.id !== linkId);
  }
  writeDb(db);
  res.json({ success: true });
});
app.get("/api/admin/backup", (req, res) => {
  const db = readDb();
  const fileName = `submanager_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(JSON.stringify(db, null, 2));
});
app.post("/api/admin/restore", import_express.default.json({ limit: "50mb" }), (req, res) => {
  try {
    const newDb = req.body;
    if (newDb && newDb.admin && Array.isArray(newDb.users)) {
      writeDb(newDb);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid database format" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SubManager Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
