require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const { User } = require('./models/sequelize');

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['profile', 'email']
},
function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ 
        where: { googleId: profile.id },
        defaults: { name: profile.displayName }
    })
    .then(([user, created]) => {
        if (!user) {
            return done(new Error('No user found or created'), null);
        }
        done(null, user);
    })
    .catch(err => {
        done(err, null);
    });
}));

passport.serializeUser((user, done) => {
    if (!user) {
        return done(new Error('No user to serialize'), null);
    }
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
    .then(user => {
        if (!user) {
            return done(new Error('No user found with this id'), null);
        }
        done(null, user);
    })
    .catch(err => {
        done(err, null);
    });
});

module.exports = passport;