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
    // console.log(profile);
    User.findOrCreate({ 
        where: { googleId: profile.id },
        defaults: { name: profile.displayName }
    })
    .then(([user, created]) => {
        done(null, user);
    })
    .catch(done);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
    .then(user => {
        done(null, user);
    })
    .catch(err => done(err));
});

module.exports = passport;