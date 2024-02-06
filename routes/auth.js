const router = require('express').Router();
const passport = require('passport');

// /auth/google/callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        successRedirect: `${process.env.CLIENT_URL}`, 
        failureRedirect: "/login/failed"
    } 
    ),    
)

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

//* endpoints that client can hit to check the authentication status of the user
router.get("/login/success", (req, res) => {
    if (req.user) {
        res.status(200).json({
            error: false,
            message: 'auth.js: user has successfully authenticated',
            user: req.user,
        });
        console.log('auth.js: user has successfully authenticated');
        // console.log(req.user)
    } else {
        res.status(403).json({
            error: true,
            message: 'auth.js: user not loggin in'
        });
    
    }
})

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
    res.json({
        error: false,
        message: 'auth.js: user has successfully logged out'});
    console.log('auth.js: user has successfully logged out');    
});

module.exports = router;