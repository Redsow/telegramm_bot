import express, { Request, Response } from 'express';
import axios from 'axios';
import OpenAIApi  from 'openai';
import router from "./routes";

const OPENAI_API_KEY = 'your_openai_api_key';

interface ImageParams {
    prompt: string;
    n: number;
    size: string;
}

const createImage = async (params: ImageParams) => {
    const { prompt, n, size } = params;

    const requestBody = {
        prompt: prompt,
        n: n,
        size: size,
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Ошибка при создании изображения с помощью Openal API: ' + error.message);
    }
};

router.post('/generate', async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Отсутствует параметр "prompt" в теле запроса' });
    }

    try {
        const response = await createImage({
            prompt: prompt,
            n: 1,
            size: '1024x1024',
        });

        const imageUrl = response.data[0]?.url || 'Изображение не генерируется';

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Ошибка при создании изображения с помощью OpenAI:', error);
        res.status(500).json({ error: 'Ошибка при создании изображения с помощью OpenAI' });
    }
});