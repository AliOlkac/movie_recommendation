export function middleware(req) {
    const { pathname } = req.nextUrl;

    if (pathname === '/dashboard') {
        const token = req.cookies.token;

        if (!token) {
            return NextResponse.redirect(new URL('/login', req.nextUrl.origin)); // Mutlak URL kullanılıyor
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard'],
};
