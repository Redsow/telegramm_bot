import express, { Request, Response } from 'express';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';

const router = express.Router();
const OPENAI_API_KEY = 'your_openai_api_key';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/ask', async (req: Request, res: Response) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Отсутствует параметр "text" в теле запроса' });
    }

    try {
        const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: text }],
        });

        const reply = completion.data.choices[0]?.message?.content || 'Извините, я этого не понял.';

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Ошибка при общении с OpenAI:', error);
        res.status(500).json({ error: 'Ошибка при общении с OpenAI' });
    }
});

export default router;
