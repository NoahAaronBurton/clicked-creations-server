const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { sequelize, User } = require('./models/sequelize');
const passport = require('./passport');
const authRouter = require('./routes/auth');

const app = express();

app.use(
  cors({
      origin: 'http://localhost:5173',
      methods: 'GET,HEAD,PUT,POST,DELETE',
      credentials: true
  })
)

app.use(cookieSession({
  name: 'google-auth-session',
  keys:['clicked'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

//auth routes
app.use('/auth', authRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Sync models with database
sequelize.sync()
  .then(() => {
    // Start server
    const port = process.env.PORT || 3000;

    // ... set up routes

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(console.error);