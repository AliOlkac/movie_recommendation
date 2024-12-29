import bcrypt from 'bcryptjs'; // Şifreleri güvenli bir şekilde hashlemek için bcryptjs kütüphanesini içe aktarıyoruz.
import User from '../../../models/user'; // Kullanıcı modelini içe aktarıyoruz (veritabanı işlemleri için).

/**
 * Kullanıcı Kayıt API Handler
 * Bu API, yeni bir kullanıcı oluşturmayı sağlar. Şifre hashleme ve
 * veritabanına kayıt işlemlerini içerir.
 */
export default async function handler(req, res) {
    // -------------------------------------------------------------------------
    // 1) HTTP Metodunu Kontrol Et
    // -------------------------------------------------------------------------
    if (req.method === 'POST') {
        // Eğer istek POST değilse, 405 "Method Not Allowed" hatası döndür
        const { username, email, password } = req.body; // İstek gövdesinden kullanıcı bilgilerini al

        try {
            // -----------------------------------------------------------------
            // 2) Şifreyi Hashleme
            // -----------------------------------------------------------------
            const hashedPassword = await bcrypt.hash(password, 10); // Şifreyi bcrypt ile hashle (10 salt rounds)

            // -----------------------------------------------------------------
            // 3) Yeni Kullanıcı Oluşturma
            // -----------------------------------------------------------------
            const newUser = await User.create({
                username,            // Kullanıcının adı
                email,               // Kullanıcının email adresi
                password: hashedPassword, // Hashlenmiş şifre
            });

            // Başarılı işlemde 201 "Created" koduyla kullanıcı bilgilerini döndür
            res.status(201).json({
                message: 'Kullanıcı başarıyla oluşturuldu', // Başarı mesajı
                user: newUser, // Yeni oluşturulan kullanıcı bilgileri
            });
        } catch (error) {
            // -----------------------------------------------------------------
            // 4) Hata Durumu
            // -----------------------------------------------------------------
            console.error('Kullanıcı oluşturulamadı:', error.message); // Hata loglama
            // 400 "Bad Request" koduyla hata mesajı döndür
            res.status(400).json({
                error: 'Kullanıcı oluşturulamadı', // Genel hata mesajı
                details: error.message, // Hatanın detaylı açıklaması
            });
        }
    } else {
        // Eğer istek POST değilse, 405 "Method Not Allowed" hatası döndür
        res.status(405).json({
            error: 'Method not allowed', // Hata mesajı
        });
    }
}
