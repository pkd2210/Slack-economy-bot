const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/createitem', async ({ command, ack, respond }) => {
        await ack();
        
        const text = command.text.trim();
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    args.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            args.push(current.trim());
        }
        
        if (args.length < 4) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /createitem <\"name\"> <\"description\"> <price> <Integer Stock | Boolean Stockcode>"
            });
        }

        const itemName = args[0];
        const itemDescription = args[1];
        const priceStr = args[2];
        const stockStr = args[3];

        if (!itemName || itemName.trim() === '') {
            return await respond({
                response_type: "ephemeral",
                text: "Item name cannot be empty"
            });
        }

        if (!itemDescription || itemDescription.trim() === '') {
            return await respond({
                response_type: "ephemeral",
                text: "Item description cannot be empty"
            });
        }

        const price = parseFloat(priceStr);
        if (isNaN(price) || price < 0) {
            return await respond({
                response_type: "ephemeral",
                text: "Price must be a valid positive number"
            });
        }

        let stock, stockCode;
        if (stockStr.toLowerCase() === 'true' || stockStr.toLowerCase() === 'false') {
            stockCode = stockStr.toLowerCase() === 'true' ? 1 : 0;
            stock = 0;
        } else {
            const stockInt = parseInt(stockStr);
            if (isNaN(stockInt) || stockInt < 0) {
                return await respond({
                    response_type: "ephemeral",
                    text: "Stock must be a positive integer or boolean (true/false)"
                });
            }
            stock = stockInt;
            stockCode = 0;
        }

        const validatedItem = {
            name: itemName.trim(),
            description: itemDescription.trim(),
            price: price,
            stock: stock,
            stockCode: stockCode
        };
        const itemsdb = new sqlite3.Database('./items.db');
        itemsdb.run('INSERT INTO items (name, description, price, stock, stock_code) VALUES (?, ?, ?, ?, ?)',
            [validatedItem.name, validatedItem.description, validatedItem.price, validatedItem.stock, validatedItem.stockCode], function(err) {
            if (err) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "Error while trting to create the item"
                });
            }
            else {
                if (validatedItem.stockCode === 1) {
                    const itemId = this.lastID;
                    const tableName = `${itemId}_codes`;
                    itemsdb.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT NOT NULL
                    )`, 
                        function() {
                            itemsdb.close();
                            return respond({
                                response_type: "in_channel",
                                text: `Item "${validatedItem.name}" Was Created Successfully`
                            });
                        }
                    );
                } else {
                    itemsdb.close();
                    return respond({
                        response_type: "in_channel",
                        text: `Item "${validatedItem.name}" Was Created Successfully`
                    });
                }
            }
        });
    });
};