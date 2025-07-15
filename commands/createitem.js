const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('createitem')
	.setDescription('Create a new item for the shop.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
	.addStringOption(option =>
		option.setName('name')
		.setDescription('The name of the item')
		.setRequired(true)
	)
	.addStringOption(option => 
		option.setName('description')
		.setDescription('The description of the item')
		.setRequired(true)
	)
	.addIntegerOption(option =>
		option.setName('price')
		.setDescription('The price of the item')
		.setRequired(true)
	)
	.addIntegerOption(option =>
		option.setName('stock')
		.setDescription('The stock of the item (will be set to 0 if code stock is used')
		.setRequired(false)
	)
	.addBooleanOption(option =>
		option.setName('stockcode')
		.setDescription('Check if the item uses stock code instead of stock')
		.setRequired(false)
	),
	// command execution
	async execute(interaction) {
		const itemsdb = new sqlite3.Database('./items.db');
		const name = interaction.options.getString('name');
		const description = interaction.options.getString('description');
		const price = interaction.options.getInteger('price');
		const stock = interaction.options.getInteger('stock') ?? 0;
		const stockcode = interaction.options.getBoolean('stockcode') ?? false;

		let finalStock = stock;
		if (stockcode === true) {
			finalStock = 0;
		}

		itemsdb.run(
			'INSERT INTO items (name, description, price, stock, stock_code) VALUES (?, ?, ?, ?, ?)',
			[name, description, price, finalStock, stockcode ? 1 : 0],
			async function (err) {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error adding the item to the database.', flags: MessageFlags.Ephemeral });
				}

				if (stockcode) {
					const itemId = this.lastID;
					const tableName = `${itemId}_codes`;
					itemsdb.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						code TEXT NOT NULL
					)`);
				}

				const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
				if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Item Created')
						.setDescription(`Created item **${name}** for the shop.`)
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
				}
				return interaction.reply({ content: `Item **${name}** created successfully!`, flags: MessageFlags.Ephemeral });
			}
		);
	}
}