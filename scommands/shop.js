const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/shop', async ({ command, ack, respond }) => {
        await ack();

        const itemsdb = new sqlite3.Database('./items.db');
        itemsdb.all('SELECT id, name, description, price FROM items ORDER BY price ASC', [], (err, rows) => {
            if (err) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "An error with featching the db"
                });
            }
            if (rows.length === 0) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "No items in the shop"
                })
            }
                
            let text = "Items Shop\nID | Name | Description | Price\n";
            rows.forEach((row) => {
                text += `${row.id} | ${row.name} | ${row.description} | ${row.price}\n`;
            });
            itemsdb.close();
            return respond({
                response_type: "in_channel",
                text: text
            })
        })
    })
}