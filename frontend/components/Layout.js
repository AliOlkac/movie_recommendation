import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaFilm, FaHome, FaStar, FaUser } from 'react-icons/fa'

export default function Layout({ children, title = 'Film Öneri Sistemi' }) {
  const [popcorns, setPopcorns] = useState([])
  
  // Popcorn efekti oluşturma
  useEffect(() => {
    // Mevcut popcorn'ları temizle
    const existingPopcorns = document.querySelectorAll('.popcorn')
    existingPopcorns.forEach(el => el.remove())
    
    // Yeni popcorn'lar oluştur
    const newPopcorns = []
    const popcornCount = 15
    
    for (let i = 0; i < popcornCount; i++) {
      newPopcorns.push({
        id: i,
        left: `${Math.floor(Math.random() * 100)}%`,
        size: `${Math.floor(Math.random() * 10) + 15}px`,
        delay: `${Math.floor(Math.random() * 5)}s`,
        duration: `${Math.floor(Math.random() * 5) + 5}s`
      })
    }
    
    setPopcorns(newPopcorns)
  }, [])
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Film Öneri Sistemi" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Popcorn Efekti */}
      {popcorns.map(popcorn => (
        <div
          key={popcorn.id}
          className="popcorn"
          style={{
            left: popcorn.left,
            width: popcorn.size,
            height: popcorn.size,
            animationDelay: popcorn.delay,
            animationDuration: popcorn.duration
          }}
        />
      ))}
      
      <div className="container">
        <header className="header">
          <Link href="/" className="logo">
            <FaFilm /> FilmÖneri
          </Link>
          <nav>
            <Link href="/" className="btn" title="Ana Sayfa">
              <FaHome /> Filmler
            </Link>
            <Link href="/ratings" className="btn" title="Değerlendirmelerim">
              <FaStar /> Puanlamalarım
            </Link>
            <Link href="/profile" className="btn" title="Profilim">
              <FaUser /> Profil
            </Link>
          </nav>
        </header>
        
        <main className="main">
          {children}
        </main>
        
        <footer className="footer">
          <p>Film Öneri Sistemi &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  )
} 