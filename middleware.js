import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // Eğer kullanıcı kayıt veya giriş sayfasındaysa geç
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return NextResponse.next();
    }

    // Token'ı kontrol et
    const token = req.cookies.token || req.headers.get('Authorization')?.split(' ')[1];

    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect('/login');
        }
    } else {
        return NextResponse.redirect('/login');
    }
}

export const config = {
    matcher: ['/dashboard', '/favorites', '/recommendations'], // Korunmasını istediğiniz yollar
};
