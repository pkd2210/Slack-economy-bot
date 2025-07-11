const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/balance', async ({ command, ack, respond }) => {
        await ack();
        
        const args = command.text.trim().split(/\s+/);
        let targetUserId;
        
        if (args.length === 0 || args[0] === '') {
            targetUserId = command.user_id;
        } else {
            const userMention = args[0];
            const userMatch = userMention.match(/^<@([A-Za-z0-9]+)(\|.*)?>/);
            if (!userMatch) {
                return await respond({
                    response_type: "ephemeral",
                    text: "Usage: /balance [@user]"
                });
            }
            targetUserId = userMatch[1];
        }
        
        const userdb = new sqlite3.Database('./users.db');
        userdb.get('SELECT balance FROM users WHERE id = ?', [targetUserId], function(err, row) {
            if (err) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "An error with updating the db"
                });
            }
            
            const balance = row ? row.balance : 0;
            const isOwnBalance = targetUserId === command.user_id;
            
            userdb.close();
            return respond({
                response_type: "in_channel",
                text: isOwnBalance ? 
                    `You have ${balance} balance` : 
                    `<@${targetUserId}> has ${balance} balance`
            });
        });
    });
}