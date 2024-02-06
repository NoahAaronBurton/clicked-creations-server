const router = require('express').Router();
require('dotenv').config();

const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

const { socialDirective, userDirective } = require('.././prompts.js');


//* stream example


router.get('/social', async (req, res) => {
        async function main() {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: socialDirective },
                        { role: "user", content: userDirective },
                    ],
                    temperature: 0.7,
                });

                const content = response.choices[0]?.message.content || 'no message found';
                console.log(content);
                return content;
            }

        try {
                const content = await main();
                res.json({ message: content });
        } catch (error) {
                console.error(error);
                res.status(500).send('Something broke in /chat/social');
        }
})

module.exports = router;