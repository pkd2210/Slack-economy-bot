const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');

module.exports = (app) => {
    app.command('/leaderboard', async ({ ack, respond }) => {
        await ack();
        
        const userdb = new sqlite3.Database('./users.db');
        userdb.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT ?', [config.leaderboard_limit], function(err, rows) {
            if (err) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "An error with updating the db"
                });
            }
            if (rows.length === 0) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "No users found in the leaderboard"
                });
            }
            let leaderboardText = "Leaderboard:\n";
            rows.forEach((row,index) => {
                leaderboardText += `${index + 1}. <@${row.id}>: ${row.balance} balance\n`;
            });
            userdb.close();
            return respond({
                response_type: "in_channel",
                text: leaderboardText
            });
        });
    });
}