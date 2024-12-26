import bcrypt from "bcryptjs";
import User from "../../../models/user";

export default async function login(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Only POST requests allowed" });
    }

    const { email, password } = req.body;

    try {
        // Kullanıcıyı veritabanından email ile bul
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Password from input:", password); // Kullanıcının girdiği şifre
        console.log("Hashed password from DB:", user.password); // Veritabanındaki hashlenmiş şifre

        // Şifre doğrulama
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Başarılı giriş
        return res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "An error occurred", error: error.message });
    }
}
