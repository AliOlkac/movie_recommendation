import Rating from '../../models/rating';
import Movie from '../../models/movie';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId, movieId, rating } = req.body;

        try {
            // Rating'i kaydet veya güncelle
            const [newRating, created] = await Rating.upsert({
                userId,
                movieId,
                rating,
            });

            if (created) {
                res.status(201).json({ message: 'Puan başarıyla oluşturuldu', rating: newRating });
            } else {
                res.status(200).json({ message: 'Puan başarıyla güncellendi', rating: newRating });
            }
        } catch (error) {
            res.status(400).json({ error: 'Puan kaydedilemedi', details: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
