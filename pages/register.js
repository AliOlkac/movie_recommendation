import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords don't match!");
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/login');
            } else {
                setMessage(data.error || 'Registration failed!');
            }
        } catch (error) {
            console.error('Registration error:', error);
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
                backgroundImage: 'url(/register-background.jpg)',
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
                        <path
                            d="M20 90 L20 10 L40 10 L60 60 L60 10 L80 10 L80 90 L60 90 L40 40 L40 90 Z"
                            fill="url(#palette-gradient)"
                        />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold text-center mb-6 animate-pulse">Create an Account</h2>
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
                    <div className="form-control mb-4">
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

                    {/* Confirm Password Input */}
                    <div className="form-control mb-6">
                        <label className="label">
                            <span className="label-text text-accent-dark">Confirm Password</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            className="input input-bordered w-full text-white bg-gray-800"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {/* Register Button */}
                    <div className="form-control">
                        <button type="submit" className="btn bg-accent text-white w-full transition-transform transform hover:scale-105">
                            Register
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div className="divider text-accent-dark my-6">OR</div>

                {/* Login Link */}
                <div className="text-center">
                    <p>Already have an account?</p>
                    <Link href="/login" className="link link-primary text-accent hover:underline">
                        Login here
                    </Link>
                </div>

                {/* Error Message */}
                {message && <p className="text-red-500 mt-4">{message}</p>}
            </div>
        </div>
    );
}
