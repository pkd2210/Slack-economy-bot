const sqlite3 = require('sqlite3').verbose();

module.exports = (app) => {
    app.command('/edititem', async ({ command, ack, respond }) => {
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
        
        if (args.length < 5) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /edititem <id> <\"name\"> <\"description\"> <price> <Integer Stock> - Use '000' to keep current value"
            });
        }

        const itemId = args[0];
        const itemName = args[1];
        const itemDescription = args[2];
        const priceStr = args[3];
        const stockStr = args[4];

        const id = parseInt(itemId);
        if (isNaN(id) || id <= 0) {
            return await respond({
                response_type: "ephemeral",
                text: "Item not exists"
            });
        }

        if (itemName !== "000" && (!itemName || itemName.trim() === '')) {
            return await respond({
                response_type: "ephemeral",
                text: "Item name cannot be empty (use '000' to keep current)"
            });
        }

        if (itemDescription !== "000" && (!itemDescription || itemDescription.trim() === '')) {
            return await respond({
                response_type: "ephemeral",
                text: "Item description cannot be empty (use '000' to keep current)"
            });
        }

        let price = null;
        if (priceStr !== "000") {
            price = parseFloat(priceStr);
            if (isNaN(price) || price < 0) {
                return await respond({
                    response_type: "ephemeral",
                    text: "Price must be a valid positive number (use '000' to keep current)"
                });
            }
        }

        let stock = null, stockCode = null;
        if (stockStr !== "000") {
            if (stockStr.toLowerCase() === 'true' || stockStr.toLowerCase() === 'false') {
                stockCode = stockStr.toLowerCase() === 'true' ? 1 : 0;
                stock = 0;
            } else {
                const stockInt = parseInt(stockStr);
                if (isNaN(stockInt) || stockInt < 0) {
                    return await respond({
                        response_type: "ephemeral",
                        text: "Stock must be a positive integer or boolean (use '000' to keep current)"
                    });
                }
                stock = stockInt;
                stockCode = 0;
            }
        }

        const itemsdb = new sqlite3.Database('./items.db');
        

        itemsdb.get('SELECT * FROM items WHERE id = ?', [id], (err, currentItem) => {
            if (err) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "Error while fetching item data"
                });
            }
            
            if (!currentItem) {
                itemsdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: `Item with ID ${id} not found`
                });
            }

            const updateData = {
                name: itemName === "000" ? currentItem.name : itemName.trim(),
                description: itemDescription === "000" ? currentItem.description : itemDescription.trim(),
                price: price === null ? currentItem.price : price,
                stock: stock === null ? currentItem.stock : stock,
                stockCode: stockCode === null ? currentItem.stock_code : stockCode
            };

            itemsdb.run('UPDATE items SET name = ?, description = ?, price = ?, stock = ?, stock_code = ? WHERE id = ?',
                [updateData.name, updateData.description, updateData.price, updateData.stock, updateData.stockCode, id], function(err) {
                if (err) {
                    itemsdb.close();
                    return respond({
                        response_type: "ephemeral",
                        text: "Error while updating the item"
                    });
                }
                
                if (this.changes === 0) {
                    itemsdb.close();
                    return respond({
                        response_type: "ephemeral",
                        text: `Item was not found found`
                    });
                }

                itemsdb.close();
                return respond({
                    response_type: "in_channel",
                    text: `Item "${updateData.name}" updated successfully`
                });
            });
        });
    });
};