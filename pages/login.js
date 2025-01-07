import { useState } from 'react'; // React'in State Hook'unu içe aktarıyoruz
import { useRouter } from 'next/router'; // Next.js Router modülünü içe aktarıyoruz
import Link from 'next/link'; // Sayfalar arasında bağlantı oluşturmak için Link bileşeni
import Image from 'next/image'; // Görseller için optimize edilmiş Image bileşeni

// -----------------------------------------------------------------------------
// LoginPage Bileşeni
// -----------------------------------------------------------------------------
export default function LoginPage() {
    // -------------------------------------------------------------------------
    // State Tanımlamaları
    // -------------------------------------------------------------------------
    const [email, setEmail] = useState(''); // Kullanıcıdan alınacak email adresini tutan state
    const [password, setPassword] = useState(''); // Kullanıcıdan alınacak şifreyi tutan state
    const [message, setMessage] = useState(''); // Hata veya bilgi mesajını tutan state
    const router = useRouter(); // Sayfalar arası yönlendirme yapmak için Next.js Router

    // -------------------------------------------------------------------------
    // 1) Giriş Formunun Gönderilmesi
    // -------------------------------------------------------------------------
    async function handleSubmit(e) {
        e.preventDefault(); // Formun varsayılan davranışını engeller

        try {
            // API'ye giriş isteği gönderiyoruz
            const res = await fetch('/api/auth/login', {
                method: 'POST', // HTTP POST isteği
                headers: { 'Content-Type': 'application/json' }, // JSON içeriği belirtiyoruz
                body: JSON.stringify({ email, password }), // Kullanıcı bilgilerini JSON formatında gönderiyoruz
            });

            const data = await res.json(); // Yanıttan JSON verisini alıyoruz

            if (res.ok) {
                // Başarılı giriş durumunda kullanıcıyı yönlendiriyoruz
                router.push('/dashboard'); // Kullanıcıyı dashboard sayfasına yönlendir
            } else {
                // API'den gelen hata mesajını state'e atıyoruz
                setMessage(data.message || 'Login failed!');
            }
        } catch (error) {
            // Beklenmedik bir hata durumunda mesajı ayarlıyoruz
            console.error('Login error:', error);
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
                backgroundImage: 'url(/movie-background.jpg)', // Arkaplan görseli
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
                    Welcome Back!
                </h2>

                {/* Giriş Formu */}
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
                    <div className="form-control mb-6">
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

                    {/* Giriş Butonu */}
                    <div className="form-control">
                        <button type="submit" className="btn bg-accent text-white w-full transition-transform transform hover:scale-105">
                            Login
                        </button>
                    </div>
                </form>

                {/* Bölüm Ayırıcı */}
                <div className="divider text-accent-dark my-6">OR</div>

                {/* Kayıt Olma Linki */}
                <div className="text-center">
                    <p>Don&apos;t have an account?</p>
                    <Link href="/register" className="link link-primary text-accent hover:underline">
                        Sign up now
                    </Link>
                </div>

                {/* Hata Mesajı */}
                {message && <p className="text-red-500 mt-4">{message}</p>}
            </div>
        </div>
    );
}
