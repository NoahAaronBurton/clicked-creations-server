const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { sequelize, User } = require('./models/sequelize');


const app = express();

app.use(
  cors({
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,POST,DELETE',
      credentials: true
  })
)

app.use(cookieSession({
  name: 'google-auth-session',
  keys:['clicked'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Sync models with database
sequelize.sync()
  .then(() => {
    // Start server
    const app = express();
    const port = process.env.PORT || 3000;

    // ... set up routes

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(console.error);