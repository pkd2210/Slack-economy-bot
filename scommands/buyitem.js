const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');

module.exports = (app) => {
    app.command('/buyitem', async ({ command, ack, respond, client }) => {
        await ack();

        const args = command.text.trim().split(/\s+/)
        if (args.length < 1) {
            return await respond({
                response_type: "ephemeral",
                text: "Usage: /buyitem <item id>"
            })
        }
        const itemId = args[0];
        const userId = command.user_id;

        const userdb = new sqlite3.Database('./users.db');
        const itemsdb = new sqlite3.Database('./items.db');

        itemsdb.get('SELECT * FROM items WHERE id = ?' , [itemId], function(err, row) {
            if (err) {
                itemsdb.close();
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "Error checking the db"
                })
            }

            if (!row) {
                itemsdb.close();
                userdb.close();
                return respond({
                    response_type: "ephemeral",
                    text: "This is not an item"
                })
            }

            const price = row.price;
            const name = row.name;
            const stock = row.stock;
            const stock_code = row.stock_code;

            userdb.get('SELECT balance FROM users WHERE id = ?', [userId], function(err, balancerow) {
                if (err) {
                    userdb.close();
                    itemsdb.close();
                    return respond({
                        response_type: "ephemeral",
                        text: "Error checking the db"
                    })
                }

                if (!balancerow || balancerow.balance < price) {
                    userdb.close();
                    itemsdb.close();
                    return respond({
                        response_type: "ephemeral",
                        text: "You do not have enough balance"
                    })
                }

                if (stock_code == 0 && stock <= 0) {
                    userdb.close();
                    itemsdb.close();

                    return respond({
                        response_type: "ephemeral",
                        text: "Item is not available"
                    })
                }

                if (stock_code === 1) {
                    const tableName = `${itemId}_codes`
                    itemsdb.get(`SELECT * FROM "${tableName}" LIMIT 1`, [], function(err, codeRow) {
                        if (err) {
                            itemsdb.close();
                            userdb.close();
                            return respond({
                                response_type: "ephemeral",
                                text: "error checking the stock"
                            })
                        }

                        if (!codeRow) {
                            itemsdb.close();
                            userdb.close();
                            return respond({
                                response_type: "ephemeral",
                                text: "No codes in the stock"
                            })
                        }

                        const code = codeRow.code;

                        userdb.run('UPDATE users SET balance = balance - ? WHERE id = ?', [price, userId], function(err) {
                            if (err) { 
                                itemsdb.close();
                                userdb.close();
                                return respond({
                                    response_type: "ephemeral",
                                    text: "Error updating your balance"
                                })
                            }
                        })

                        itemsdb.run(`DELETE FROM "${tableName}" WHERE id = ?`, [codeRow.id], function(err) {
                            if (err) {
                                itemsdb.close();
                                userdb.close();
                                return respond({
                                    response_type: "ephemeral",
                                    text: "Error removing the code from the stock"
                                })
                            }
                        })

                        itemsdb.close();
                        userdb.close();
                        client.chat.postMessage({
                            channel: userId,
                            text: `Your code is:\n${code}`
                        })
                        client.chat.postMessage({
                            channel: config.slack_reward_room,
                            text: `<@${userId}> bought ${name} for ${price}`
                        })
                        return respond({
                            response_type: "ephemeral",
                            text: `You bought ${name}, you will get the code in your dm`
                        })
                    });
                }

                if (stock_code === 0 && stock > 0) {
                    userdb.run('UPDATE users SET balance = balance - ? WHERE id = ?', [price, userId], function(err) {
                        if (err) {
                            itemsdb.close();
                            userdb.close();
                            return respond({
                                response_type: "ephemeral",
                                text: "Error updating your balance"
                            })
                        }
                    })

                    itemsdb.run('UPDATE items SET stock = stock - 1 WHERE id = ?', [itemId], function(err) {
                        if (err) {
                            itemsdb.close();
                            userdb.close();
                            return respond({
                                response_type: "ephemeral",
                                text: "Error updating the item stock"
                            })
                        }
                    })
                    itemsdb.close();
                    userdb.close();
                    client.chat.postMessage({
                        channel: config.slack_reward_room,
                        text: `<@${userId}> bought ${name} for ${price}`
                    })
                    return respond({
                        response_type: "in_channel",
                        text: `You bought ${name} for ${price}!`
                    });
                }
            })
        })
    })
}