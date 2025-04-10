"use client"; // Input değeri state ile yönetileceği için Client Component olmalı

import { useState, useEffect } from 'react';

// Props arayüzünü tanımla
interface SearchBarProps {
  initialSearchTerm?: string;
  onSearchChange: (term: string) => void; // Arama terimi değiştiğinde çağrılacak fonksiyon
}

// Props'ları al
export default function SearchBar({ initialSearchTerm = '', onSearchChange }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Prop değişirse state'i güncelle
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    onSearchChange(newTerm); // Değişikliği üst bileşene bildir
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md"> {/* Genişlik ana sayfadakiyle aynı */}
      <input 
        type="text" 
        placeholder="Film ara..." 
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:border-white/30"
      />
      {/* İsteğe bağlı: Arama butonu eklenebilir */}
      {/* <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 ...">Ara</button> */}
    </form>
  );
} 