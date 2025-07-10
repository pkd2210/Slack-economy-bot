const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');

module.exports = (app) => {
    app.command('/addbalance', async ({ command, ack, respond }) => {
        await ack();
        
        const args = command.text.trim().split(/\s+/);
        if (args.length < 2) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /addbalance <@user> <amount>"
            });
        }

        const userMention = args[0];
        const amount = parseInt(args[1], 10);

        const userMatch = userMention.match(/^<@([A-Za-z0-9]+)(\|.*)?>/);
        if (!userMatch) {
            return await respond({
                response_type: "ephemeral",
                text: `First parameter must be a Slack user mention!"`
            });
        }
        const targetUserId = userMatch[1];

        if (isNaN(amount) || amount <= 0) {
            return await respond({
                response_type: "ephemeral",
                text: "Amount must be a positive integer"
            });
        }

        // adding money part
        const userdb = new sqlite3.Database('./users.db');
        userdb.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, targetUserId], function(err) {
            if (err) {
                console.error(err);
                return respond({
                    response_type: "ephemeral",
                    text: "An error with updating the db"
                });
            }

        respond({
          response_type: "in_channel",
          text: `Adding ${amount} to <@${targetUserId}>'s balance!`
        });
      });
    });
};
