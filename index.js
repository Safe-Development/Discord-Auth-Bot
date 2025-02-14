/*
     Safe Development - Discord Bot with Express API
     Author: godmodule
     Version: 0.8.2
     Notes:
        - Added an Express API for authentication
        - Added a ban/unban button interaction
        - Added a HWID reset command
        - Added a user information command
        - Added a command to generate invites for all users with access role
        - Added a command to get all invites
        - Added a command to get all users
        - Added a command to send an announcement
        - Added a command to create an invite code
        - Added a command to register a new user
        - Added a command to unban a user
*/

const { Client, GatewayIntentBits, Partials, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, REST, Routes, SlashCommandBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');

dotenv.config();

const { TOKEN, CLIENT_ID, GUILD_ID, OWNER_ID, SUPPORT_ROLE_ID, ACCESS_ROLE_ID } = process.env;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const app = express();
app.use(bodyParser.json());

let db = new sqlite3.Database('./users.sqlite', (err) => {
    if (err) console.error(err.message);
    else {
        console.log('Connected to the users database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            uid INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            hwid TEXT,
            discord_id TEXT NOT NULL,
            invite_code TEXT NOT NULL,
            register_date TEXT NOT NULL,
            last_login TEXT,
            status TEXT DEFAULT 'active'
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS invites (
            code TEXT PRIMARY KEY,
            expiration_date TEXT,
            used INTEGER DEFAULT 0
        )`);
    }
});

const commands = [
    new SlashCommandBuilder().setName('register').setDescription('Register a new user'),
    new SlashCommandBuilder().setName('createinvite').setDescription('Create a new invite code').addIntegerOption(option => option.setName('days').setDescription('Validity in days')),
    new SlashCommandBuilder().setName('ban').setDescription('Ban a user').addIntegerOption(option => option.setName('uid').setDescription('User ID').setRequired(true)),
    new SlashCommandBuilder().setName('unban').setDescription('Unban a user').addIntegerOption(option => option.setName('uid').setDescription('User ID').setRequired(true)),
    new SlashCommandBuilder().setName('resethwid').setDescription('Reset a user\'s HWID').addIntegerOption(option => option.setName('uid').setDescription('User ID').setRequired(true)),
    new SlashCommandBuilder().setName('user').setDescription('Get user information').addIntegerOption(option => option.setName('uid').setDescription('User ID').setRequired(true)),
    new SlashCommandBuilder().setName('users').setDescription('Get all users'),
    new SlashCommandBuilder().setName('invites').setDescription('Get all invites'),
    new SlashCommandBuilder().setName('announcement').setDescription('Send an announcement')
        .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true))
        .addBooleanOption(option => option.setName('ping').setDescription('Ping @everyone and @here?').setRequired(true)),
    new SlashCommandBuilder().setName('invitewave').setDescription('Generate invites for all users with access role and send via DM')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName, options } = interaction;
    const member = interaction.member;
    const hasAccessRole = member.roles.cache.has(ACCESS_ROLE_ID);
    const hasSupportRole = member.roles.cache.has(SUPPORT_ROLE_ID);

    let allowed = false;

    if (commandName === 'register') {
        allowed = true;
    } else if (interaction.user.id === OWNER_ID) {
        allowed = true;
    } else if (hasSupportRole) {
        if (commandName === 'resethwid' || commandName === 'ban' || commandName === 'unban' || commandName === 'user') {
            allowed = true;
        }
    }

    if (!allowed) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    if (commandName === 'register') {
        const modal = new ModalBuilder().setCustomId('registerModal').setTitle('Register New User');
        const usernameInput = new TextInputBuilder().setCustomId('username').setLabel('Username').setStyle(TextInputStyle.Short).setRequired(true);
        const passwordInput = new TextInputBuilder().setCustomId('password').setLabel('Password').setStyle(TextInputStyle.Short).setRequired(true);
        const inviteCodeInput = new TextInputBuilder().setCustomId('invite_code').setLabel('Invite Code').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(usernameInput), new ActionRowBuilder().addComponents(passwordInput), new ActionRowBuilder().addComponents(inviteCodeInput));
        await interaction.showModal(modal);
    } else if (commandName === 'createinvite') {
        let days = options.getInteger('days') || 7;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);
        const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        db.run(`INSERT INTO invites (code, expiration_date) VALUES (?, ?)`, [inviteCode, expirationDate.toISOString()], (err) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
            const embed = new EmbedBuilder().setTitle("Invite Code Created").setDescription(`Your invite code: \`${inviteCode}\``).setColor(0x00FF00).setFooter({ text: "Safe Development © 2025 godmodule" });
            interaction.reply({ embeds: [embed], ephemeral: true });
        });
    } else if (commandName === 'user') {
        const uid = options.getInteger('uid');

        db.get(`SELECT * FROM users WHERE uid = ?`, [uid], (err, row) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
            if (!row) return interaction.reply({ content: 'User not found.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(`User Information - ${row.username} (UID: ${row.uid})`)
                .addFields(
                    { name: 'Discord ID', value: `<@${row.discord_id}>`, inline: true },
                    { name: 'Status', value: row.status, inline: true },
                    { name: 'Registration Date', value: new Date(row.register_date).toLocaleDateString(), inline: true },
                    { name: 'Last Login', value: row.last_login ? new Date(row.last_login).toLocaleDateString() : "Never", inline: true },
                    { name: 'HWID', value: row.hwid || "Not Set", inline: true }
                )
                .setColor(0x0000FF)
                .setFooter({ text: "Safe Development © 2025 godmodule" });

            const banButton = new ButtonBuilder()
                .setCustomId(`ban_${uid}`)
                .setLabel('Ban')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(row.status === 'banned');

            const unbanButton = new ButtonBuilder()
                .setCustomId(`unban_${uid}`)
                .setLabel('Unban')
                .setStyle(ButtonStyle.Success)
                .setDisabled(row.status === 'active');

            const rowAction = new ActionRowBuilder().addComponents(banButton, unbanButton);

            interaction.reply({ embeds: [embed] }).then(msg => { // Send embed publicly
                if (interaction.user.id === OWNER_ID || hasSupportRole) {
                    interaction.channel.send({ content: `Use these buttons to manage the user (only for support staff):`, components: [rowAction] }) // Buttons in a separate message
                        .catch(console.error);
                }
            });
        });
    } else if (commandName === 'users') {
        db.all(`SELECT * FROM users`, [], (err, rows) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });

            if (!rows || rows.length === 0) return interaction.reply({ content: 'No users found.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle("All Users")
                .setDescription(rows.map(user => `**UID:** ${user.uid} - **Username:** ${user.username} - **Discord ID:** <@${user.discord_id}> - **Status:** ${user.status} - **HWID:** ${user.hwid || "Not Set"}`).join('\n'))
                .setColor(0x00FF00)
                .setFooter({ text: "Safe Development © 2025 godmodule" });

            interaction.reply({ embeds: [embed], ephemeral: true });
        });
    } else if (commandName === 'invites') {
        db.all(`SELECT * FROM invites`, [], (err, rows) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });

            if (!rows || rows.length === 0) return interaction.reply({ content: 'No invites found.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle("All Invites")
                .setDescription(rows.map(invite => `**Code:** ${invite.code} - **Expires:** ${new Date(invite.expiration_date).toLocaleDateString()} - **Used:** ${invite.used ? 'Yes' : 'No'}`).join('\n'))
                .setColor(0x00FF00)
                .setFooter({ text: "Safe Development © 2025 godmodule" });

            interaction.reply({ embeds: [embed], ephemeral: true });
        });
    } else if (commandName === 'ban' || commandName === 'unban' || commandName === 'resethwid') {
        const uid = options.getInteger('uid');
        const action = commandName === 'ban' ? 'banned' : commandName === 'unban' ? 'active' : 'HWID reset';
        const fieldToUpdate = commandName === 'resethwid' ? 'hwid' : 'status';
        const newValue = commandName === 'resethwid' ? null : action;


        db.get(`SELECT * FROM users WHERE uid = ?`, [uid], (err, row) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
            if (!row) return interaction.reply({ content: 'User not found.', ephemeral: true });

            db.run(`UPDATE users SET ${fieldToUpdate} = ? WHERE uid = ?`, [newValue, uid], function (err) {
                if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });

                const embed = new EmbedBuilder()
                    .setTitle(`User ${action}: ${row.username} (UID: ${row.uid})`)
                    .setDescription(`${row.username}'s ${fieldToUpdate === 'status' ? 'status' : 'HWID'} has been updated to ${action}.`)
                    .setColor(commandName === 'ban' ? 0xFF0000 : 0x00FF00)
                    .setFooter({ text: "Safe Development © 2025 godmodule" });

                interaction.reply({ embeds: [embed] });
            });
        });
    } else if (commandName === 'invitewave') {
        const role = interaction.guild.roles.cache.get(ACCESS_ROLE_ID);
        if (!role) {
            return interaction.reply({ content: `Role with ID ${ACCESS_ROLE_ID} not found.`, ephemeral: true });
        }

        const membersWithRole = interaction.guild.members.cache.filter(member => member.roles.cache.has(ACCESS_ROLE_ID));
        if (membersWithRole.size === 0) {
            return interaction.reply({ content: `No members found with role ${role.name}.`, ephemeral: true });
        }

        db.all(`SELECT discord_id FROM users`, async (err, rows) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
            if (!rows || rows.length === 0) return interaction.reply({ content: 'No users found in the database.', ephemeral: true });

            let successCount = 0;
            let errorCount = 0;

            for (const member of membersWithRole.values()) {
                const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);

                db.run(`INSERT INTO invites (code, expiration_date) VALUES (?, ?)`, [inviteCode, expirationDate.toISOString()], async (err) => {
                    if (err) {
                        errorCount++;
                        return;
                    }

                    try {
                        await member.user.send({ content: `You have received an invite code: \`${inviteCode}\` (Expires: ${expirationDate.toLocaleDateString()}).` });
                        successCount++;
                    } catch (dmError) {
                        console.error(`Failed to send DM to ${member.id}:`, dmError);
                        errorCount++;
                    }
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("Invite Wave Completed")
                .setDescription(`Invite codes have been sent to ${successCount} users with the access role. ${errorCount} users encountered errors.`)
                .setColor(0x00FF00)
                .setFooter({ text: "Safe Development © 2025 godmodule" });

            interaction.reply({ embeds: [embed] });
        });
    } else if (commandName === 'announcement') {
        const message = options.getString('message');
        const ping = options.getBoolean('ping');

        const announcementMessage = ping ? `||@everyone @here|| ${message}` : message;

        await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
        await interaction.channel.send(announcementMessage);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'registerModal') {
        const username = interaction.fields.getTextInputValue('username');
        const password = interaction.fields.getTextInputValue('password');
        const inviteCode = interaction.fields.getTextInputValue('invite_code');

        db.get(`SELECT * FROM invites WHERE code = ?`, [inviteCode], (err, row) => {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
            if (!row) return interaction.reply({ content: 'Invalid invite code.', ephemeral: true });
            if (row.used) return interaction.reply({ content: 'This invite code has already been used.', ephemeral: true });

            db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, userRow) => {
                if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });
                if (userRow) return interaction.reply({ content: 'Username already exists.', ephemeral: true });

                const registerDate = new Date().toISOString();
                db.run(`INSERT INTO users (username, password, discord_id, invite_code, register_date) VALUES (?,?,?,?,?)`,
                    [username, password, interaction.user.id, inviteCode, registerDate], function (err) {
                        if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });

                        db.run(`UPDATE invites SET used = 1 WHERE code = ?`, [inviteCode]);

                        const embed = new EmbedBuilder()
                            .setTitle(`Welcome to SafeClient, ${username}!`)
                            .setDescription("You have successfully registered.")
                            .setColor(0x00FF00)
                            .setFooter({ text: "Safe Development © 2025 godmodule" });
                        interaction.reply({ embeds: [embed], ephemeral: true });
                    });
            });
        });
    }
});

// Button interaction handler (ban)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, uid] = interaction.customId.split('_');

    if (action === 'ban' || action === 'unban') {
        if (interaction.user.id !== OWNER_ID && !interaction.member.roles.cache.has(SUPPORT_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
        }

        const newStatus = action === 'ban' ? 'banned' : 'active';

        db.run(`UPDATE users SET status = ? WHERE uid = ?`, [newStatus, uid], function (err) {
            if (err) return interaction.reply({ content: 'An error occurred.', ephemeral: true });

            interaction.update({ content: `User ${newStatus}.`, components: [] }); // Update the button message
        });
    }
});

app.post('/auth', (req, res) => {
    const { username, password, hwid } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).send('Database error.');
        if (!row) return res.status(401).send('Invalid credentials.');

        if (!row.hwid) {
            db.run(`UPDATE users SET last_login = ?, hwid = ? WHERE username = ?`, [new Date().toISOString(), hwid, username], function (err) {
                if (err) return res.status(500).send('Database error.');
                return res.json({ success: true });
            });
        } else if (row.hwid === hwid) {
            db.run(`UPDATE users SET last_login = ? WHERE username = ?`, [new Date().toISOString(), username], function (err) {
                if (err) return res.status(500).send('Database error.');
                return res.json({ success: true });
            });
        } else {
            return res.status(403).send('Incorrect HWID.');
        }
    });
});

app.listen(8000, () => console.log('API is running on port 8000'));

client.login(TOKEN);

/*
     Safe Development - Discord Bot with Express API
     Author: godmodule
     Version: 0.8.2
     Notes:
        - Added an Express API for authentication
        - Added a ban/unban button interaction
        - Added a HWID reset command
        - Added a user information command
        - Added a command to generate invites for all users with access role
        - Added a command to get all invites
        - Added a command to get all users
        - Added a command to send an announcement
        - Added a command to create an invite code
        - Added a command to register a new user
        - Added a command to unban a user
*/
