require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const { User } = require('./models/sequelize');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
    // proxy: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
    // passReqToCallback: true
},
function(accessToken, refreshToken, profile, done) {
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Profile:', profile);

    if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email found in user profile'), null);
    }
    

    const email = profile.emails[0].value; // Corrected line
    User.findOrCreate({ 
        where: { email },
        defaults: { googleId: profile.id, name: profile.displayName }
    })
    .then(([user, created]) => {
        if (!user) {
            return done(new Error('No user found or created'), null);
        }
        done(null, user);
    })
    .catch(err => {
        console.error('Error occurred while finding or creating user:', err);
        done(err, null);
    });
}));


passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.findOne({ where: { email: email } }).then(user => {
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            console.log('local strategy user:', user.dataValues)
            return done(null, user);
        }).catch(err => {
            console.error('Error occurred while finding or creating user:', err);
            done(err, null);
        });
    }
));

passport.serializeUser((user, done) => {
    if (!user) {
        console.error('No user to serialize');
        return done(new Error('No user to serialize'), null);
    }

    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
        .then(user => {
            if (!user) {
                console.log('No user found with ID:', id);
                return done(new Error('No user found'), null);
            }

            done(null, user);
        })
        .catch(err => done(err));
});

module.exports = passport;