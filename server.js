const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { sequelize, User } = require('./models/sequelize');
const passport = require('./passport');
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');
const imageRouter = require('./routes/image');
const multer = require('multer');

const app = express();
app.use(express.json());

require('dotenv').config({ path: process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env' });

// console.log('server CLIENT_URL: '+ process.env.CLIENT_URL);
app.use(
  cors({
      origin: process.env.CLIENT_URL,
      methods: 'GET,HEAD,PUT,POST,DELETE',
      credentials: true
  })
);
// app.use(cors());

// app.use(cookieSession({
//   name: 'google-auth-session',
//   keys: [process.env.COOKIE_KEY],
//   maxAge: 24 * 60 * 60 * 1000,
//   secure: process.env.NODE_ENV === 'production',
//   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
// }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: false, 
    sameSite: 'Lax' 
  }
}));
//! Typically, you would use passport.authenticate('strategy') in specific routes where you want to apply authentication, not as a global middleware. If you're trying to ensure that every route requires authentication, it might be better to create a custom middleware function for that.
// app.use(passport.authenticate('session'));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  // console.log(res.get('Access-Control-Allow-Origin'));
  next();
});

//auth routes
app.use('/auth', authRouter);

//chat routes
app.use('/chat', chatRouter);

//image routes
app.use('/image', imageRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).send('An error occurred');
  } else {
    res.status(500).send(err.stack);
  }
});


//* alter: true will update the table if it exists, 
//* force: true will drop the table if it exists
let syncOptions = { alter: false , force: false }; 
sequelize.sync(syncOptions)
  .then(() => {
    // console.log('Database & tables created!')
    // Start server
    // console.log(process.env.PORT);
    const port = process.env.PORT;

    const server = app.listen(port, () => {
      const address = server.address();
      // console.log(`Server is running at http://${address.address}:${address.port}`);
    });
  })
  .catch(console.error);