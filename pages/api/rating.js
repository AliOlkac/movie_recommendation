import Rating from '../../models/rating'; // Rating modelini içe aktarıyoruz
import Movie from '../../models/movie';   // Movie modelini içe aktarıyoruz

// -----------------------------------------------------------------------------
// API Handler: Rating İşlemleri
// -----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Yalnızca POST isteklerini işleyelim
    if (req.method === 'POST') {
        const { userId, movieId, rating } = req.body; // İstekten gelen verileri alıyoruz

        try {
            // -----------------------------------------------------------------
            // 1) Rating'i Kaydet veya Güncelle
            // -----------------------------------------------------------------
            const [newRating, created] = await Rating.upsert({
                userId,   // Hangi kullanıcı
                movieId,  // Hangi film
                rating,   // Kullanıcının verdiği puan
            });

            // Eğer yeni bir puan oluşturulduysa (ilk kez kaydediliyorsa)
            if (created) {
                res.status(201).json({
                    message: 'Puan başarıyla oluşturuldu', // Başarı mesajı
                    rating: newRating,                   // Oluşturulan puan bilgisi
                });
            } else {
                // Eğer mevcut bir kayıt güncellendiyse
                res.status(200).json({
                    message: 'Puan başarıyla güncellendi', // Güncelleme mesajı
                    rating: newRating,                   // Güncellenen puan bilgisi
                });
            }
        } catch (error) {
            // Hata durumunda hata mesajı döndür
            res.status(400).json({
                error: 'Puan kaydedilemedi',          // Genel hata mesajı
                details: error.message,              // Hata detayları
            });
        }
    } else {
        // POST harici HTTP yöntemlerini reddet
        res.status(405).json({
            error: 'Method not allowed', // Yanlış HTTP yöntemi mesajı
        });
    }
}
// -----------------------------------------------------------------------------