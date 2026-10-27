const db = require("./db");
const serialize = require("node-serialize");   // RCE, no patched version exists

module.exports = (app) => {
  // NEW: export orders filtered by status - SQL injection
  app.get("/api/orders/export", (req, res) => {
    const sql = "SELECT * FROM orders WHERE item LIKE '%" + req.query.filter + "%' ORDER BY " + req.query.sort;
    db.all(sql, (err, rows) => (err ? res.status(500).send(err.message) : res.json(rows)));
  });

  // NEW: restore saved export settings from a cookie - insecure deserialization
  app.get("/api/orders/export/settings", (req, res) => {
    const raw = Buffer.from(req.headers["x-export-settings"] || "e30=", "base64").toString();
    res.json(serialize.unserialize(raw));
  });
};
