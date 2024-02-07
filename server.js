const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { sequelize, User } = require('./models/sequelize');
const passport = require('./passport');
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');

const app = express();
app.use(express.json());

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'; 
app.use(
  cors({
      origin: clientUrl, //todo: UPDATE ENV VARIABLE
      methods: 'GET,HEAD,PUT,POST,DELETE',
      credentials: true
  })
)

app.use(cookieSession({
  name: 'google-auth-session',
  keys:[ process.env.COOKIE_KEY ||'clicked'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

//auth routes
app.use('/auth', authRouter);

//chat routes
app.use('/chat', chatRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).send('An error occurred');
  } else {
    res.status(500).send(err.stack);
  }
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