const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { sequelize, User } = require('./models/sequelize');
const passport = require('./passport');
const authRouter = require('./routes/auth');
const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI(OPENAI_API_KEY);


//* stream example
async function main() {
  const stream = await openai.chat.completions.create({
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say this is a test!"}],
    "temperature": 0.7,
    "stream": true,
  });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta.content || '';
    // process.stdout.write(content);
    console.log(content);
  }

}


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
      main();
    });
  })
  .catch(console.error);