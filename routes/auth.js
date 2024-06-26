const router = require('express').Router();
const passport = require('passport');
const { User } = require('../models/sequelize');
const bcrypt = require('bcrypt');

function ensureAuthenticated(req, res, next) {
    console.log('ensureAuth User:\n', req.user.dataValues);
    console.log('ensure Auth Session ID:', req.sessionID);

    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: true, message: 'User is not authenticated' });
}
// auth/google
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

// /auth/google/callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        successRedirect: `${process.env.CLIENT_URL}/home`
    } 
    ),
    function(req, res) {
        console.log('\n Session ID:'+ req.sessionID);
        console.log('\n Session:'+ JSON.stringify(req.session)); // log the session data
        console.log('\n user:'+ JSON.stringify(req.user)); // log the user data
        res.status(200).send({ message: 'User logged in', user: req.user, sessionID: req.sessionID });
    }    
)





router.post('/login/password', 
  passport.authenticate('local'),
  function(req, res) {
    console.log('\n Session ID:'+ req.sessionID);
    console.log('\n Session:'+ JSON.stringify(req.session)); // log the session data
    console.log('\n user:'+ JSON.stringify(req.user)); // log the user data
    res.status(200).send({ message: 'User logged in', user: req.user, sessionID: req.sessionID });
  });


// router.post("/signup", async (req, res) => {
//     // console.log('auth.js: signup route hit');
//     // console.log(req.body);
//     if (!req.body.email || !req.body.password) {
//         return res.status(400).json({
//             error: true,
//             message: 'Email and password are required.'
//         });
//     }

//     try {
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         const user = await User.create({ ...req.body, password: hashedPassword });

//         res.json({
//             error: false,
//             message: 'auth.js: signup route hit',
//             user: user
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             error: true,
//             message: 'Error creating user. Please try again or use different credentials.'
//         });
//     }
// });
router.post("/signup", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            error: true,
            message: 'Email and password are required.'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({ ...req.body, password: hashedPassword });

        req.logIn(user, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: true,
                    message: 'An error occurred during login.'
                });
            }
            console.log('\n Session ID:'+ req.sessionID);
            res.json({
                error: false,
                message: 'User has been created and logged in.',
                user: user,
                sessionID: req.sessionID
            });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: 'Error creating user. Please try again or use different credentials.'
        });
    }
});

//* dev route to test user authentication
router.get('/test', ensureAuthenticated, (req, res) => {
    console.log('/test User:', req.user.dataValues);
    console.log('/testSession ID:', req.sessionID);

    res.json({ user: req.user, sessionID: req.sessionID });
});

//* endpoints that client can hit to check the authentication status of the user
// router.get("/login/success", (req, res) => {
//     // console.log(req.user)
//     if (req.user) {
//         const { dataValues: { email, ...user } } = req.user; //? email
//         res.status(200).json({
//             error: false,
//             message: 'auth.js: user has successfully authenticated',
//             user: user,
//         });
//         console.log('auth.js: user has successfully authenticated');
//     } else {
//         res.status(403).json({
//             error: true,
//             message: 'auth.js: user not loggin in'
//         });
//     }
// })

// auth/google/profile
router.get('/google/profile', (req, res) => {
    // Get the profile from the authenticated user
    const user = req.user;
    const sessionID = req.sessionID;
    const session = req.session;
    res.json({ user, sessionID, session });
});

router.get(
    "/login/failed", (req, res) => {
        res.status(401).json({
            error: true,
            message: 'auth.js: user failed to authenticate'
        });
    }
)

// /auth/logout
router.get("/logout", (req, res) => {
    req.logout();
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: true, message: 'Could not destroy session' });
        } else {
            res.clearCookie('connect.sid'); // replace 'connect.sid' with  cookie name if it's different
            res.json({ error: false, message: 'User has successfully logged out' });
            console.log('User has successfully logged out');
        }
    });
});

router.get('/auth/failure', (req, res) => {
    res.redirect('/failure');
  });

module.exports = router;