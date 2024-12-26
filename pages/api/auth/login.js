import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/user';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        try {
            // Kullanıcıyı bul
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }

            // Şifreyi kontrol et
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Geçersiz şifre' });
            }

            // Token oluştur
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({ message: 'Giriş başarılı', token });
        } catch (error) {
            res.status(400).json({ error: 'Giriş başarısız', details: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
