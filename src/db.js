const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT, role TEXT)");
  db.run("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount REAL, card_last4 TEXT)");
  db.run("INSERT INTO users VALUES (1,'admin','admin123','admin@acme.test','admin')");
  db.run("INSERT INTO users VALUES (2,'alice','password1','alice@acme.test','user')");
  db.run("INSERT INTO users VALUES (3,'bob','qwerty','bob@acme.test','user')");
  db.run("INSERT INTO orders VALUES (1,2,'Widget',19.99,'4242')");
  db.run("INSERT INTO orders VALUES (2,3,'Gadget',99.50,'1881')");
});

module.exports = db;
