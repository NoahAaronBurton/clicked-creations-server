const Sequelize = require('sequelize');
require('dotenv').config();

const sqlPort = process.env.DATABASE_PORT || 3306;
const dbName = process.env.DATABASE_NAME || 'clicked_creations';

const sequelize = new Sequelize(dbName, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    port: sqlPort
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