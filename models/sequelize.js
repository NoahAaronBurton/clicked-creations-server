const Sequelize = require('sequelize');
require('dotenv').config();
const bcrypt = require('bcrypt');


const sqlPort = process.env.DATABASE_PORT;
const dbName = process.env.DATABASE_NAME;

const sequelize = new Sequelize(dbName, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    port: sqlPort
});
//todo: add password to user model
const User = sequelize.define('user', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    googleId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: true
    }
});


User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = { sequelize, User };