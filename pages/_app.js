import '../src/app/globals.css'; // Global CSS dosyasını dahil ediyor

/**
 * MyApp bileşeni, tüm Next.js uygulaması için kök bileşen görevi görür.
 * Bu bileşen her sayfa için bir üst sarmalayıcı olarak kullanılır.
 * Sayfalar arasındaki ortak düzen ve stiller burada tanımlanabilir.
 */
function MyApp({ Component, pageProps }) {
    /**
     * Component: Next.js'in, her bir sayfa bileşenini temsil eden bir özelliği.
     * pageProps: Sayfa bileşenine özel propsları içerir.
     *
     * <Component {...pageProps} />: Sayfa bileşenini ve ilgili propsları render eder.
     */
    return <Component {...pageProps} />;
}

// MyApp bileşenini varsayılan olarak dışa aktarıyoruz
export default MyApp;
