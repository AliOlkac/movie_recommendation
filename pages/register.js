import { useState } from 'react'; // React'in State Hook'unu içe aktarıyoruz
import { useRouter } from 'next/router'; // Next.js Router modülünü içe aktarıyoruz
import Link from 'next/link'; // Sayfalar arasında bağlantı oluşturmak için Link bileşeni
import Image from 'next/image'; // Görseller için optimize edilmiş Image bileşeni

// -----------------------------------------------------------------------------
// RegisterPage Bileşeni
// -----------------------------------------------------------------------------
export default function RegisterPage() {
    // -------------------------------------------------------------------------
    // State Tanımlamaları
    // -------------------------------------------------------------------------
    const [email, setEmail] = useState(''); // Kullanıcıdan alınacak email adresini tutan state
    const [password, setPassword] = useState(''); // Kullanıcıdan alınacak şifreyi tutan state
    const [confirmPassword, setConfirmPassword] = useState(''); // Şifre onayı için state
    const [message, setMessage] = useState(''); // Hata veya bilgi mesajını tutan state
    const router = useRouter(); // Sayfalar arası yönlendirme yapmak için Next.js Router

    // -------------------------------------------------------------------------
    // 1) Kayıt Formunun Gönderilmesi
    // -------------------------------------------------------------------------
    async function handleSubmit(e) {
        e.preventDefault(); // Formun varsayılan davranışını engeller

        // Şifre ve şifre onayı eşleşmezse hata mesajı göster
        if (password !== confirmPassword) {
            setMessage("Passwords don't match!");
            return;
        }

        try {
            // API'ye kayıt isteği gönderiyoruz
            const res = await fetch('/api/auth/register', {
                method: 'POST', // HTTP POST isteği
                headers: { 'Content-Type': 'application/json' }, // JSON içeriği belirtiyoruz
                body: JSON.stringify({ email, password }), // Kullanıcı bilgilerini JSON formatında gönderiyoruz
            });

            const data = await res.json(); // Yanıttan JSON verisini alıyoruz

            if (res.ok) {
                // Başarılı kayıt durumunda kullanıcıyı yönlendiriyoruz
                router.push('/login'); // Kullanıcıyı login sayfasına yönlendir
            } else {
                // API'den gelen hata mesajını state'e atıyoruz
                setMessage(data.error || 'Registration failed!');
            }
        } catch (error) {
            // Beklenmedik bir hata durumunda mesajı ayarlıyoruz
            console.error('Registration error:', error);
            setMessage('An unexpected error occurred.');
        }
    }

    // -------------------------------------------------------------------------
    // 2) Sayfa Render Edilen Kısım
    // -------------------------------------------------------------------------
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary-light via-primary to-primary-dark relative overflow-hidden"
            style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Hareketli Arkaplan */}
            <div className="absolute inset-0 bg-opacity-50" style={{
                backgroundImage: 'url(/register-background.jpg)', // Arkaplan görseli
                backgroundSize: 'cover', // Görselin kapsama ayarı
                backgroundRepeat: 'no-repeat', // Tekrarlanmayı engeller
                filter: 'blur(10px)', // Blur efekti
                zIndex: -1, // Arkaplanın içerikten daha geride olmasını sağlar
            }}></div>

            {/* Kart İçeriği */}
            <div className="card bg-primary-lighter shadow-xl p-8 max-w-md w-full text-accent rounded-lg">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 100"
                        style={{ height: '100px', width: '100px', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))' }}
                    >
                        {/* Palet Renkleriyle "N" harfi */}
                        <defs>
                            <linearGradient id="palette-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#F2BB77', stopOpacity: 1 }} />
                                <stop offset="50%" style={{ stopColor: '#A66E4E', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#F2E2CE', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                        {/* "N" harfi şekli */}
                        <path
                            d="M20 90 L20 10 L40 10 L60 60 L60 10 L80 10 L80 90 L60 90 L40 40 L40 90 Z"
                            fill="url(#palette-gradient)"
                        />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold text-center mb-6 animate-pulse">
                    Create an Account
                </h2>

                {/* Kayıt Formu */}
                <form onSubmit={handleSubmit}>
                    {/* Email Girişi */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text text-accent-dark">Email</span>
                        </label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={email} // State ile bağlama
                            onChange={(e) => setEmail(e.target.value)} // State'i güncelleme
                        />
                    </div>

                    {/* Şifre Girişi */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text text-accent-dark">Password</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={password} // State ile bağlama
                            onChange={(e) => setPassword(e.target.value)} // State'i güncelleme
                        />
                    </div>

                    {/* Şifre Onayı Girişi */}
                    <div className="form-control mb-6">
                        <label className="label">
                            <span className="label-text text-accent-dark">Confirm Password</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={confirmPassword} // State ile bağlama
                            onChange={(e) => setConfirmPassword(e.target.value)} // State'i güncelleme
                        />
                    </div>

                    {/* Kayıt Butonu */}
                    <div className="form-control">
                        <button type="submit" className="btn bg-accent text-white w-full transition-transform transform hover:scale-105">
                            Register
                        </button>
                    </div>
                </form>

                {/* Bölüm Ayırıcı */}
                <div className="divider text-accent-dark my-6">OR</div>

                {/* Giriş Yapma Linki */}
                <div className="text-center">
                    <p>Already have an account?</p>
                    <Link href="/login" className="link link-primary text-accent hover:underline">
                        Login here
                    </Link>
                </div>

                {/* Hata Mesajı */}
                {message && <p className="text-red-500 mt-4">{message}</p>}
            </div>
        </div>
    );
}
