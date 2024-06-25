import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Configuration, OpenAIApi } from 'openai';
import router from './routes';
import { users } from './users';

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key';
const OPENAI_API_KEY = 'your_openai_api_key';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

const authorizeRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (user.role !== role) {
            return res.sendStatus(403);
        }
        next();
    };
};

app.post('/register', (req: Request, res: Response) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    users[username] = { password: hashedPassword, role: role };

    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = users[username];
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ token: token });
});

app.use('/api', authenticateToken, router);

app.post('/api/ask', authenticateToken, async (req: Request, res: Response) => {
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

app.post('/api/generate', authenticateToken, authorizeRole('admin'), async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Отсутствует параметр "prompt" в теле запроса' });
    }

    try {
        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: '1024x1024',
        });

        const imageUrl = response.data.data[0]?.url || 'Изображение не генерируется';

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Ошибка при создании изображения с помощью OpenAI:', error);
        res.status(500).json({ error: 'Ошибка при создании изображения с помощью OpenAI' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
