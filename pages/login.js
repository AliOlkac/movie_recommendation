import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Link bileşenini ekleyin
import Image from 'next/image'; // Görsel için import

export default function LoginPage() {
    const [email, setEmail] = useState(''); // Kullanıcıdan alınacak email
    const [password, setPassword] = useState(''); // Kullanıcıdan alınacak şifre
    const [message, setMessage] = useState(''); // Hata veya başarı mesajı
    const router = useRouter(); // Yönlendirme için Next.js Router kullanımı

    // Form gönderildiğinde çağrılan işlev
    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Başarılı girişte yönlendirme yap
                router.push('/dashboard');
            } else {
                // Hata mesajını ayarla
                setMessage(data.message || 'Login failed!');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('An unexpected error occurred.');
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary-light via-primary to-primary-dark relative overflow-hidden"
            style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Hareketli Arkaplan */}
            <div className="absolute inset-0 bg-opacity-50" style={{
                backgroundImage: 'url(/movie-background.jpg)',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(10px)',
                zIndex: -1,
            }}></div>

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
                        {/* "N" harfi */}
                        <path
                            d="M20 90 L20 10 L40 10 L60 60 L60 10 L80 10 L80 90 L60 90 L40 40 L40 90 Z"
                            fill="url(#palette-gradient)"
                        />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold text-center mb-6 animate-pulse">Welcome Back!</h2>
                <form onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text text-accent-dark">Email</span>
                        </label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="form-control mb-6">
                        <label className="label">
                            <span className="label-text text-accent-dark">Password</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Login Button */}
                    <div className="form-control">
                        <button type="submit" className="btn bg-accent text-white w-full transition-transform transform hover:scale-105">
                            Login
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div className="divider text-accent-dark my-6">OR</div>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p>Don&apos;t have an account?</p>
                    <Link href="/register" className="link link-primary text-accent hover:underline">
                        Sign up now
                    </Link>
                </div>

                {/* Error Message */}
                {message && <p className="text-red-500 mt-4">{message}</p>}
            </div>
        </div>
    );
}
