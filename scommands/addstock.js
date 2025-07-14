const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/addstock', async ({ command, ack, respond }) => {
        await ack();

        const args = command.text.trim().split(/\s+/);
        if (args.length < 2) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /addstock <item id> \"<Code>\""
            });
        }
        const itemId = args[0];
        const code = args.slice(1).join(" ").replace(/^"|"$/g, '');

        const tableName = `${itemId}_codes`;

        const itemsdb = new sqlite3.Database('./items.db');
        itemsdb.run(`INSERT INTO "${tableName}" (code) VALUES (?)`, [code], function(err) {
            if (err) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "Error adding the code to the stock"
                });
            }

            itemsdb.close();
            return respond({
                response_type: "ephemeral",
                text: `You added to the code to the stock successfully`
            });
        })
    });
}