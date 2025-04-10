/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... (varsa diğer ayarlarınız) ...

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '', // Varsayılan port için boş bırakın
        pathname: '/t/p/**', // /t/p/ ile başlayan tüm yollara izin ver
      },
    ],
  },
};

module.exports = nextConfig; 