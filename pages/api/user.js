import jwt from 'jsonwebtoken'; // JWT işlemleri için jsonwebtoken kütüphanesini içe aktarıyoruz
import { User } from '../../models'; // Veritabanı işlemleri için User modelini içe aktarıyoruz

// JWT gizli anahtarını tanımlıyoruz (çevresel değişken veya sabit bir değer kullanılıyor)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// -----------------------------------------------------------------------------
// API Handler: Kullanıcı Doğrulama ve Bilgi Getirme
// -----------------------------------------------------------------------------
export default async function handler(req, res) {
    // -------------------------------------------------------------------------
    // 1) Authorization Header Kontrolü
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization; // Authorization başlığını al

    if (!authHeader) {
        // Eğer Authorization başlığı yoksa hata döndür
        return res.status(401).json({
            error: 'No token provided', // Hata mesajı: Token sağlanmadı
        });
    }

    // Authorization başlığından JWT token'ını ayıkla
    const token = authHeader.split(' ')[1]; // Bearer token formatında: "Bearer <token>"

    try {
        // ---------------------------------------------------------------------
        // 2) Token Doğrulama
        // ---------------------------------------------------------------------
        const decoded = jwt.verify(token, JWT_SECRET); // Token doğrulama işlemi

        // Doğrulanan token'dan kullanıcı ID'sini al ve veritabanında ara
        const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'email'], // Kullanıcıdan yalnızca gerekli alanları al
        });

        if (!user) {
            // Eğer kullanıcı bulunamazsa hata döndür
            return res.status(404).json({
                error: 'User not found', // Hata mesajı: Kullanıcı bulunamadı
            });
        }

        // ---------------------------------------------------------------------
        // 3) Kullanıcı Bilgilerini Döndürme
        // ---------------------------------------------------------------------
        return res.status(200).json({
            user, // Başarıyla bulunan kullanıcı bilgileri
        });
    } catch (error) {
        // Eğer token doğrulama sırasında hata oluşursa
        return res.status(401).json({
            error: 'Invalid token', // Hata mesajı: Geçersiz token
        });
    }
}
