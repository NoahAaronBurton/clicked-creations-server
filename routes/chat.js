const router = require('express').Router();
require('dotenv').config();

const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

const { socialDirective } = require('.././prompts.js');

//todo: add message history to the chat
router.post('/social', async (req, res) => {
        const userMessage = req.body.userMessage;
        let messages = req.body.messages; // get the messages array from the client

        messages.push(
                { role: "user", content: userMessage },
                { role: "assistant", content: "" } // add a placeholder for the AI's response
        );

        async function main() {
                const response = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: messages, // pass the entire messages array to the API
                        temperature: 0.7,
                });

                const content = response.choices[0]?.message.content || 'no message found';
                messages[messages.length - 1].content = content; // update the last message with the AI's response
                return messages; // return the updated messages array
        }

        try {
                const updatedMessages = await main();
                res.json({ messages: updatedMessages }); // send the updated messages array to the client
        } catch (error) {
                console.error(error);
                res.status(500).send('Something broke in /chat/social');
        }
})

module.exports = router;