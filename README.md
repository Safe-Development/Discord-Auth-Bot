# 🚀 Safe Development - Discord Auth Bot

**Author: godmodule**
**Version:** 0.8.2
**Safe Development**

## Overview

Welcome to the **Safe Development Discord Auth Bot**! This bot is designed to streamline user management and authentication within your Discord server. With an integrated Express API, it provides a seamless experience for handling user registrations, invite codes, and more.

## ✨ Features

- **Express API for Authentication**
- **User Registration and Management**
- **Invite Code Generation**
- **Ban/Unban Users**
- **HWID Reset Command**
- **User Information Retrieval**
- **Announcement Command**
- **Generate Invites for Users with Access Role**

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Safe-Development/Discord-Auth-Bot.git
cd Discord-Auth-Bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add the following:
```
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
OWNER_ID=your_discord_owner_id
SUPPORT_ROLE_ID=your_support_role_id
ACCESS_ROLE_ID=your_access_role_id
```

### 4. Run the Bot
```bash
node index.js
```

## 💡 Usage

The bot provides several slash commands for managing users and invites:

- **Register a New User:** `/register`
- **Create a New Invite Code:** `/createinvite days:<number_of_days>`
- **Ban a User:** `/ban uid:<user_id>`
- **Unban a User:** `/unban uid:<user_id>`
- **Reset a User's HWID:** `/resethwid uid:<user_id>`
- **Get User Information:** `/user uid:<user_id>`
- **Get All Users:** `/users`
- **Get All Invites:** `/invites`
- **Send an Announcement:** `/announcement message:<message> ping:<true/false>`
- **Generate Invites for All Users with Access Role:** `/invitewave`

## 🌐 Express API

The bot also includes an Express API for user authentication:

- **Endpoint:** `/auth`
- **Method:** `POST`
- **Parameters:**
    - `username`: User's username
    - `password`: User's password
    - `hwid`: User's hardware ID

Example request:
```json
{
    "username": "godmodule-example",
    "password": "safe123-example",
    "hwid": "hwid"
}
```

## 📸 Screenshots

Here are some screenshots to give you a visual overview of how the bot operates:

![Screenshot 1](https://cdn.discordapp.com/attachments/1338893924143468598/1340094681668780176/image.png?ex=67b11bed&is=67afca6d&hm=50297a00fe0e567884a445c35c91f770824fe128358ddff31f85f29e223b3c0c&)
![Screenshot 2](https://cdn.discordapp.com/attachments/1338893924143468598/1340094682041946266/image.png?ex=67b11bed&is=67afca6d&hm=766bed38693de8f5dff5baaeb256947a9e6dfb5f69aa94becead5a1e0671cfd6&)

## 👥 Contribution

To contribute to the project, follow these steps:

1. **Fork the Repository**
2. **Create a New Branch:**
    ```bash
    git checkout -b feature-branch
    ```
3. **Make Your Changes**
4. **Commit Your Changes:**
    ```bash
    git commit -m "Description of changes"
    ```
5. **Push to the Branch:**
    ```bash
    git push origin feature-branch
    ```
6. **Create a Pull Request**

## 📜 Notes

- The bot requires the following Discord permissions:
    - `Manage Roles`
    - `Manage Channels`
    - `Send Messages`
    - `Read Message History`

## 📌 Important Notes

- **Database Security:** The current implementation does not encrypt the database. It is recommended to use SQLite encryption extensions or migrate to a more secure database system for storing sensitive information.
- **Password Storage:** Passwords are stored in plaintext. It's crucial to hash passwords using a secure hashing algorithm like bcrypt before storing them in the database.
- **Environment Variables:** Ensure that your `.env` file is not exposed publicly. Use `.gitignore` to prevent it from being committed to your repository.
- **Error Handling:** Improve error handling throughout the application to provide more detailed error messages and logging.
- **Scalability:** As the user base grows, consider optimizing database queries and possibly switching to a more robust database system.

## 🚀 Future Enhancements

- **Encryption for Database:** Implement encryption for the SQLite database to enhance security.
- **Password Hashing:** Integrate a password hashing mechanism such as bcrypt.
- **Enhanced Logging:** Add robust logging mechanisms to track and debug issues effectively.
- **Role-Based Access Control:** Implement more granular role-based access control for various commands.
- **Unit Tests:** Add unit tests to ensure the reliability and stability of the bot's functionality.

---
```
Safe Development © 2025
```` 
