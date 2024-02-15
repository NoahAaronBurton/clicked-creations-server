const router = require('express').Router();
//? multer for user image upload
require('dotenv').config();
const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

//route for image generation
router.post('/generate', async (req, res) => {
    const prompt = req.body.prompt;
    const quality = req.body.quality;
    const size = req.body.size; //*  Must be one of 1024x1024, 1792x1024, or 1024x1792 for dall-e-3 models.
    const style = req.body.style; //*  Must be one of vivid or natural. 


    const image = await openai.images.generate({ 
        model: "dall-e-3",
        prompt: prompt,
        quality: quality,
        size: size,
        style: style
    });

    return res.json(image);
});

module.exports = router; 