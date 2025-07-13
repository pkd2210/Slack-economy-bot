const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/removeitem', async ({ command, ack, respond }) => {
        await ack();
        
        const args = command.text.trim().split(/\s+/);
        if (args.length < 1) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /removeitem <item id>"
            });
        }

        const itemId = args[0];

        const userdb = new sqlite3.Database('./items.db');
        userdb.run('DELETE FROM items WHERE id = ?', [itemId], function(err) {
            if (err) {
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "Error removing the item"
                });
            }

            userdb.run(`DROP TABLE IF EXISTS "${itemId}_codes"`, function() {
                userdb.close();

                return respond({
                    response_type: "in_channel",
                    text: `Removed the item ${itemId}!`
                });
            });
        });
    });
};