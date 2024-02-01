const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('clicked_creations', process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql'
});

const User = sequelize.define('user', {
    googleId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = { sequelize, User };