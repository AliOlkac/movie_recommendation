import { NextResponse } from 'next/server';

export function middleware(req) {
    const token = req.cookies.get('token');
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    }
}

// Middleware'in yalnızca belirli rotalarda çalışmasını sağlayın
export const config = {
    matcher: ['/page'], // Sadece /dashboard rotası için çalışır
};
