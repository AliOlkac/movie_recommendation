import bcrypt from "bcryptjs"; // Şifrelerin güvenli bir şekilde hashlenmesini ve karşılaştırılmasını sağlar
import User from "../../../models/user"; // Veritabanında kullanıcıları temsil eden model

// -----------------------------------------------------------------------------
// Login API Handler
// Bu API, kullanıcının giriş yapmasını sağlar. Şifre doğrulama ve kullanıcı
// bilgisi döndürme işlemlerini yapar.
// -----------------------------------------------------------------------------
export default async function login(req, res) {
    // -------------------------------------------------------------------------
    // 1) HTTP Metodunu Kontrol Et
    // -------------------------------------------------------------------------
    if (req.method !== "POST") {
        // Eğer istek "POST" değilse, uygun olmayan metod hatası döndür
        return res.status(405).json({ message: "Only POST requests allowed" });
    }

    // -------------------------------------------------------------------------
    // 2) Kullanıcıdan Gelen Verileri Al
    // -------------------------------------------------------------------------
    const { email, password } = req.body; // İstek gövdesinden email ve şifre alınır

    try {
        // ---------------------------------------------------------------------
        // 3) Veritabanında Kullanıcıyı Bul
        // ---------------------------------------------------------------------
        const user = await User.findOne({ where: { email } }); // Email'e göre kullanıcı ara

        if (!user) {
            // Eğer kullanıcı bulunamazsa 404 "Not Found" hatası döndür
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Password from input:", password); // Kullanıcının girdiği şifre (debug için)
        console.log("Hashed password from DB:", user.password); // Veritabanındaki hashlenmiş şifre (debug için)

        // ---------------------------------------------------------------------
        // 4) Şifre Doğrulama
        // ---------------------------------------------------------------------
        const isPasswordValid = await bcrypt.compare(password, user.password); // Kullanıcının şifresi ile veritabanındaki hash karşılaştırılır

        if (!isPasswordValid) {
            // Eğer şifre yanlışsa 401 "Unauthorized" hatası döndür
            return res.status(401).json({ message: "Invalid password" });
        }

        // ---------------------------------------------------------------------
        // 5) Başarılı Giriş
        // ---------------------------------------------------------------------
        // Eğer şifre doğruysa başarı mesajı ve kullanıcı bilgisi döndür
        return res.status(200).json({
            message: "Login successful", // Başarı mesajı
            user, // Kullanıcı bilgileri (ör: id, email)
        });
    } catch (error) {
        // ---------------------------------------------------------------------
        // 6) Hata Durumu
        // ---------------------------------------------------------------------
        console.error("Error during login:", error); // Hata mesajını konsola yaz
        // 500 "Internal Server Error" döndür ve hata mesajını ekle
        return res.status(500).json({
            message: "An error occurred", // Genel hata mesajı
            error: error.message, // Hatanın ayrıntılı açıklaması
        });
    }
}
