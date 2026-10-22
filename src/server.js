// =====================================================================
//  Acme Payments API  -  INTENTIONALLY VULNERABLE. DO NOT USE IN PROD.
//  Built to demo SAST / SCA / Reachability / DAST / Secrets findings.
// =====================================================================
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { exec } = require("child_process");
const _ = require("lodash");          // SCA: lodash 4.17.15 (prototype pollution, template injection) - REACHABLE
const axios = require("axios");       // SCA: axios 0.21.1 - REACHABLE
const jwt = require("jsonwebtoken");  // SCA: jsonwebtoken 8.5.1 - REACHABLE
const db = require("./db");
const config = require("./config");
// NOTE: handlebars, marked and moment are installed but NEVER imported -> reachability should de-prioritise them.

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// DAST: no helmet / security headers, x-powered-by left on, permissive CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));

app.get("/health", (req, res) => res.json({ status: "ok", version: "1.3.0", env: process.env }));  // info leak

// --- SAST + DAST: SQL injection --------------------------------------
app.get("/api/users", (req, res) => {
  const query = "SELECT id, username, email, role FROM users WHERE id = " + req.query.id;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).send("DB error: " + err.message + " in query " + query); // verbose errors
    res.json(rows);
  });
});

// --- SAST: SQL injection in login + plaintext password compare -------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, (err, user) => {
    if (err || !user) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret); // no expiry
    res.json({ token });
  });
});

// --- SAST: JWT verification accepts any algorithm ---------------------
app.get("/api/orders", (req, res) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256", "none"] });
    db.all("SELECT * FROM orders WHERE user_id = " + decoded.id, (err, rows) => res.json(rows));
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// --- SAST + DAST: reflected XSS --------------------------------------
app.get("/search", (req, res) => {
  res.send("<h2>Results for: " + req.query.q + "</h2><p>No products found.</p>");
});

// --- SAST + DAST: path traversal -------------------------------------
app.get("/api/files", (req, res) => {
  const filePath = path.join(__dirname, "..", "public", req.query.name);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(404).send("not found: " + filePath);
    res.type("text/plain").send(data);
  });
});

// --- SAST: SSRF via user-controlled URL (axios = reachable) ----------
app.post("/api/webhooks/test", async (req, res) => {
  try {
    const r = await axios.get(req.body.url, { timeout: 3000 });
    res.json({ status: r.status, body: String(r.data).slice(0, 500) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// --- SCA REACHABLE: lodash _.merge prototype pollution (CVE-2019-10744 family / CVE-2020-8203)
app.post("/api/preferences", (req, res) => {
  const defaults = { theme: "light", currency: "USD" };
  const prefs = _.merge({}, defaults, req.body);
  res.json(prefs);
});

// --- SCA REACHABLE: lodash _.template with user input (CVE-2021-23337) -----------------------
app.post("/api/receipts/preview", (req, res) => {
  if (!config.enableRceEndpoints) return res.status(403).json({ error: "disabled in this environment" });
  const compiled = _.template(req.body.template);
  res.send(compiled({ customer: "alice", amount: 19.99 }));
});

// --- SAST: OS command injection --------------------------------------
app.get("/api/admin/ping", (req, res) => {
  if (!config.enableRceEndpoints) return res.status(403).json({ error: "disabled in this environment" });
  exec("ping -c 1 " + req.query.host, (err, stdout, stderr) => res.type("text/plain").send(stdout + stderr));
});

// --- SAST: code injection via eval ------------------------------------
app.post("/api/calc", (req, res) => {
  if (!config.enableRceEndpoints) return res.status(403).json({ error: "disabled in this environment" });
  res.json({ result: eval(req.body.expression) });
});

// --- SAST: weak crypto + insecure randomness --------------------------
app.post("/api/tokens/reset", (req, res) => {
  const token = crypto.createHash("md5").update(req.body.email + Math.random()).digest("hex");
  res.json({ resetToken: token });
});

// --- SAST: open redirect ---------------------------------------------
app.get("/redirect", (req, res) => res.redirect(req.query.next));

require("./export")(app);

app.get("/openapi.json", (req, res) => res.sendFile(path.join(__dirname, "..", "openapi.json")));

app.listen(config.port, () => console.log(`Acme Payments API listening on :${config.port}`));
