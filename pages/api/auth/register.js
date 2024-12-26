import bcrypt from 'bcryptjs';
import User from '../../../models/user';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { username, email, password } = req.body;
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);


        try {


            // Kullanıcıyı oluştur
            const newUser = await User.create({
                username,
                email,
                password: hashedPassword,
            });

            res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu', user: newUser });
        } catch (error) {
            res.status(400).json({ error: 'Kullanıcı oluşturulamadı', details: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
