const router = require('express').Router();
require('dotenv').config();
const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);
const { sequelize, User, UserImages } = require('../models/sequelize');
const { Readable } = require('stream');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // this option should be fine
const { Storage } = require('@google-cloud/storage');
const bucketName = process.env.GOOGLE_IMG_UPLOAD_BUCKET_NAME;
const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_IMG_UPLOAD_BASE64, 'base64').toString());

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials,
});

function generateUniqueFilename() {
    // Combine current date-time and a random number to form a unique filename
    let uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    return uniqueFilename;
}



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
        style: style,
        response_format: "b64_json"
    });

    return res.json(image);
});

// route for capturing upload for image alteration
router.post('/upload',upload.single('file'), async (req, res) => {
    try {
        
        const originalFileType = path.extname(req.file.originalname);
        const filename = `${generateUniqueFilename()}_file${originalFileType}`;

        // Create a write stream for the file in Google Cloud Storage
        const file = storage.bucket(bucketName).file(filename);
        const fileWriteStream = file.createWriteStream();

        // Create a read stream from the uploaded file and pipe it to the write stream
        const fileReadStream = new Readable();
        fileReadStream.push(req.file.buffer);
        fileReadStream.push(null);
        fileReadStream.pipe(fileWriteStream);

        fileWriteStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: err.message });
        });

        fileWriteStream.on('finish', async () => {
            try {
                // The file has been uploaded to Google Cloud Storage.
                // Generate a signed URL for the file.
                const options = {
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                };
                const [url] = await file.getSignedUrl(options);
                console.log(`The signed url for ${filename} is ${url}.`);

                // Create a form data object
                const formData = new FormData();
                formData.append('file', req.file.buffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype,
                });
                formData.append('api_token', process.env.VANCE_API_KEY);
                formData.append('job', 'ai');

                // Send a POST request to the other API with the file
                const response = await axios.post('https://api-service.vanceai.com/web_api/v1/upload', formData, {
                    headers: formData.getHeaders(),
                });

                // Handle the response from the other API
                if (response.status === 200) {
                    const uid = response.data.data.uid;
                    

                    res.status(200).json({ message: 'File sent to other API successfully.', file: url, response: response.data, uid: uid});
                } else {
                    throw new Error('Failed to send file to other API.');
                }
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: err.message });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// transform image
router.post('/transform', async (req, res) => {
    try {
        const uid = req.body.uid;
        const job = req.body.job;
        const api_token = process.env.VANCE_API_KEY;

        const jconfig = function(job) {
            if (job === 'Remove Background') {
                return `{
                    "name": "matting",
                    "config": {
                        "module": "matting",
                        "module_params": {
                            "model_name": "MattingStable"
                        }
                    }
                }`;
            }
        }

        const formData = new FormData();
        formData.append('uid', uid);
        formData.append('api_token', api_token);
        formData.append('jconfig', jconfig(job));

        const response = await axios.post('https://api-service.vanceai.com/web_api/v1/transform', formData, {
            headers: formData.getHeaders(),
        });

        if (response.status === 200) {
            const trans_id = response.data.data.trans_id;

            

            const downloadData = new FormData();
            downloadData.append('trans_id', trans_id);
            downloadData.append('api_token', api_token);

            const downloadResponse = await axios.post('https://api-service.vanceai.com/web_api/v1/download', downloadData, {
            headers: downloadData.getHeaders(),
            responseType: 'arraybuffer', // Set responseType to 'arraybuffer' to receive binary data
        });

        // Generate a unique filename for the transformed image
        const transformedImageFilename = `${generateUniqueFilename()}_transformed.jpg`; // Replace '.jpg' with the actual file extension of your image

        // Create a write stream for the transformed image in Google Cloud Storage
        const transformedImageFile = storage.bucket(bucketName).file(transformedImageFilename);
        const transformedImageFileWriteStream = transformedImageFile.createWriteStream();

        // Create a read stream from the transformed image data and pipe it to the write stream
        const transformedImageReadStream = new Readable();
        transformedImageReadStream.push(downloadResponse.data);
        transformedImageReadStream.push(null);
        transformedImageReadStream.pipe(transformedImageFileWriteStream);

        transformedImageFileWriteStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: err.message });
        });


        transformedImageFileWriteStream.on('finish', async () => {
            try {
                // The transformed image has been uploaded to Google Cloud Storage.
                // Read the file from Google Cloud Storage
                const [fileContents] = await transformedImageFile.download();
    
                // Convert the file contents to a Base64 string
                const base64Image = fileContents.toString('base64');
    
                res.status(200).json({ message: 'Image transformed successfully.', base64Image: base64Image });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: err.message });
            }
        });
        
        } else {
            throw new Error('Failed to transform image. Please Try again. Its also possible this job is not compatible with the image.');
        }


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 