const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');

module.exports = (app) => {
    app.command('/removebalance', async ({ command, ack, respond }) => {
        await ack();
        
        const args = command.text.trim().split(/\s+/);
        if (args.length < 2) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /removebalance <@user> <amount>"
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

        // removing money part
        const userdb = new sqlite3.Database('./users.db');
        userdb.get('SELECT balance FROM users WHERE id = ?', [targetUserId], function(err, row) {
            if (err) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "An error with updateing the db"
                })
            }
            if (row.balance < amount) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "The user dont have enough balance"
                })
            }
            
            userdb.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, targetUserId], function(err) {
                if (err) {
                    console.error(err);
                    userdb.close();
                    return respond({
                        response_type: "ephemeral",
                        text: "An error with updating the db"
                    });
                }

        respond({
          response_type: "in_channel",
          text: `Removed ${amount} from <@${targetUserId}>'s balance!`
        });
      });
    });
  });
};