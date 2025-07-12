const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');

module.exports = (app) => {
    app.command('/daily', async ({ command, ack, respond }) => {
        await ack();

        const userId = command.user_id;
        const userdb = new sqlite3.Database('./users.db');
        const payout = config.daily_payout || 0;
        const now = new Date();

        if (payout <= 0) {
            return await respond({
                response_type: "ephemeral",
                text: "Daily payouts are disabled"
            });
        }

        userdb.get('SELECT last_daily, balance FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "An error with updating the db"
                });
            }
            if (row && row.last_daily && now - row.last_daily < 1000 * 60 * 60 * 24) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "You have already claimed your daily reward today"
                });
            }
            else {
                userdb.run('UPDATE users SET balance = balance + ?, last_daily = ? WHERE id = ?', [payout, now, userId], (err) => {
                    if (err) {
                        userdb.close();
                        return respond({
                            response_type: "ephemeral",
                            text: "An error with updating the db"
                        });
                    }
                    else {
                        return respond({
                            response_type: "in_channel",
                            text: `You have received a payout of ${payout}`
                        });
                    }
                    userdb.close();
                }); 
            }
        })
    });
}