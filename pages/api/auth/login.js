import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../../models';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Kullanıcıyı bul
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Şifreyi kontrol et
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // JWT oluştur
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Cookie'ye token'ı ayarla
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 hafta
            sameSite: 'strict',
            path: '/',
        }));

        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
