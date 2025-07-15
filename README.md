# Slack Economy bot

## Widgets

[![GitHub Repo stars](https://img.shields.io/github/stars/pkd2210/Slack-economy-Bot?style=social)](https://github.com/pkd2210/Slack-economy-Bot/stargazers) [![GitHub forks](https://img.shields.io/github/forks/pkd2210/Slack-economy-Bot?style=social)](https://github.com/pkd2210/Slack-economy-Bot/network/members) [![GitHub issues](https://img.shields.io/github/issues/pkd2210/Slack-economy-Bot)](https://github.com/pkd2210/Slack-economy-Bot/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/pkd2210/Slack-economy-Bot)](https://github.com/pkd2210/Slack-economy-Bot/pulls) [![GitHub last commit](https://img.shields.io/github/last-commit/pkd2210/Slack-economy-Bot)](https://github.com/pkd2210/Slack-economy-Bot/commits/main)

## Deployment

1. Install Node.js 22.x
2. Import the bot `git clone https://github.com/pkd2210/Slack-economy-Bot.git`
3. Run `npm ci`
4. Create a `.env` file with:

   ```env
   SLACK_SIGING_SECRET=<PUT HERE>
   SLACK_BOT_TOKEN=<PUT HERE>
   APP_TOKEN=<PUT HERE>
   ```

5. Configure `config.json` for bot settings (embed color, log channel, daily payout, etc) or use the /config command.
6. Start the bot with `node index.js`

## Config Options

| Name                        | Description                                                         | Default Setting |
|-----------------------------|---------------------------------------------------------------------|-----------------|
| `default_balance`           | The default amount of money a person gets when they enter the server| 0               |
| `log_channel_id`            | Channel ID for logging important actions                            | (none)          | // discord only
| `command_room`              | Channel ID where commands can be used                               | (none)          | // dissabled
| `balance_per_message`       | Amount of money earned per message                                  | 0               | 
| `messages_cooldown_secends` | Cooldown (in seconds) between earning money from messages           | 0               |
| `leaderboard_limit`         | Number of users shown in the leaderboard (Max 25!)                  | 10              | // discord only, at slack its infinite
| `daily_payout`              | Amount given for daily claim                                        | 0               |
| `embed_color`               | Hex color for all embed messages (e.g., `#FFFFFF`)                  | #FFFFFF         | // discord only
| `reward_room`               | Channel ID where item purchase notifications are sent               | (none)          | // discord only
| `reward_giver_id`           | Role ID to mention when an item is purchased                        | (none)          | // discord only

## Features

### Balance Management

- `/addbalance` — Add balance to a user
- `/removebalance` — Remove balance from a user
- `/balance` — Check your or another user's balance
- `/daily` — Claim a daily payout (configurable)
- `/leaderboard` — View the top users by balance
- `/buyitem` - Purchase an item from the shop
- Earn money by sending messages (with cooldown)

### Item & Shop Management

- `/createitem` — Create a new shop item (supports code-based or stock-based items)
- `/edititem` — Edit item details (name, description, price, stock)
- `/removeitem` — Remove an item and its codes from the shop
- `/addstock` — Add a code to an item's stock (for code-based items)
- `/shop` — View all items in the shop

### Data Storage

- Uses SQLite for persistent storage of users and items
- Each item can have its own codes table for unique code stock

### Logging

- All important actions (balance changes, item changes, config updates) are logged to a configurable channel // discord only

## File Structure

- `index.js` — Main bot logic and event handling
- `scommands/` — All slash command implementations
- `config.json` — Bot configuration
- `users.db` — User balances and daily tracking
- `items.db` — Shop items and item codes

## AI Usage

I used GitHub Copilot for code completions, wording, some SQLite queries, and bug understanding (not direct bug fixing, but understand the bugs).
