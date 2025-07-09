const { App } = require("@slack/bolt");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const config = require('./config.json');
// Initializes your app with credentials
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode:true,
    appToken: process.env.APP_TOKEN
  });

// Dynamically load all command handlers from scommands
const commandsPath = path.join(__dirname, "scommands");
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith(".js")) {
    const command = require(path.join(commandsPath, file));
    if (typeof command === "function") {
      command(app);
    }
  }
});

// setup database (based on the discord one)
// Setup User DataBase Using SQLite
const userdb = new sqlite3.Database('./users.db', (err) => {
	if (err) {
		console.error('Could not connect to users database:', err);
		process.exit(1); // Exit the process if the database cannot be initialized
	} else {
		console.log('Connected to SQLite users database');
		// Create users table if it doesn't exist
		userdb.run(`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			balance INTEGER DEFAULT 0,
			last_daily INTEGER
		)`, (err) => {
			if (err) {
				console.error('Could not create users table:', err);
				process.exit(1); // Exit the process if the table cannot be created
			} else {
				console.log('Users table ready');
			}
		});
	}
});

// Setup Items DataBase Using SQLite
const itemsdb = new sqlite3.Database('./items.db', (err) => {
	if (err) {
		console.error('Could not connect to items database:', err);
		process.exit(1); // Exit the process if the database cannot be initialized
	} else {
		console.log('Connected to SQLite items database');
		// Create items table if it doesn't exist
		itemsdb.run(`CREATE TABLE IF NOT EXISTS items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			price INTEGER DEFAULT 0,
			stock INTEGER DEFAULT 0,
			stock_code INTEFER DEFAULT 0
		)`, (err) => {
			if (err) {
				console.error('Could not create items table:', err);
				process.exit(1); // Exit the process if the table cannot be created
			} else {
				console.log('Items table ready');
			}
		});
	}
});

// Listen for new users joining the workspace
app.event('team_join', async ({ event }) => {
  const user = event.user;
  if (user && user.id) {
    // Use default balance from config.json, fallback to 0 if not set
    const defaultBalance = (config.defaults && typeof config.defaults.balance === "number")
      ? config.defaults.balance
      : 0;
    userdb.run(
      `INSERT OR IGNORE INTO users (id, balance, last_daily) VALUES (?, ?, NULL)`,
      [user.id, defaultBalance]
    );
    console.log(`New user added to database: ${user.id}`);
  }
});

// Add this function to sync all current users to the database on startup
async function syncAllCurrentUsers() {
  try {
    const result = await app.client.users.list({ token: process.env.SLACK_BOT_TOKEN });
    if (result.members && Array.isArray(result.members)) {
      const defaultBalance = (config.defaults && typeof config.defaults.balance === "number")
        ? config.defaults.balance
        : 0;
      result.members.forEach(user => {
        if (!user.is_bot && user.id !== 'USLACKBOT') {
          userdb.run(
            `INSERT OR IGNORE INTO users (id, balance, last_daily) VALUES (?, ?, NULL)`,
            [user.id, defaultBalance]
          );
        }
      });
      console.log('All current users synced to database');
    }
  } catch (err) {
    console.error('Failed to sync users:', err);
  }
}

// Give user money for each message they send
const messageCooldown = new Map();
app.message(async ({ message, say }) => {
  if (message.subtype || message.bot_id) return;
  const userId = message.user;
  const cooldown = (config.messages_cooldown_secends || 0) * 1000;
  const balancePerMessage = config.balance_per_message || 0;
  if (!userId) return;

  if (messageCooldown.has(userId)) {
      const last = messageCooldown.get(userId);
      if (Date.now() - last < cooldown) return;
  }
  messageCooldown.set(userId, Date.now());
  const earnedBalance = config.balance_per_message || 0;
  userdb.run('UPDATE users SET balance = balance + ? WHERE id = ?', [earnedBalance, userId], (err) => {
      if (err) {
          console.error('Error updating user balance:', err);
      }
  });
});

// startup the bot
(async () => {
  await syncAllCurrentUsers();
  const port = 3000
  await app.start(process.env.PORT || port);
  console.log('Bolt app started!!');
})();
