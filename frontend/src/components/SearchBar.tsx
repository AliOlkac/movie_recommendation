"use client"; // Input değeri state ile yönetileceği için Client Component olmalı

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { FaSearch } from 'react-icons/fa'; // Search icon

// Props arayüzünü tanımla
interface SearchBarProps {
  initialSearchTerm?: string;
  onSearchChange: (term: string) => void; // Arama terimi değiştiğinde çağrılacak fonksiyon
}

// Props'ları al
const SearchBar: React.FC<SearchBarProps> = ({ initialSearchTerm = '', onSearchChange }) => {
  const [term, setTerm] = useState<string>(initialSearchTerm);

  // Prop değişirse state'i güncelle
  useEffect(() => {
    setTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Handle input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setTerm(newTerm);
    onSearchChange(newTerm); // Değişikliği üst bileşene bildir
  };
  
  // Handle form submission (e.g., pressing Enter)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission which reloads the page
    // We are already notifying on change, but we could potentially trigger
    // a more specific search action here if needed.
    console.log("Search submitted (optional action):", term);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <FaSearch className="text-gray-400" /> 
      </div>
      <input
        type="text"
        placeholder="Search for movies..."
        value={term}
        onChange={handleChange}
        className="w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm shadow-md"
      />
      {/* İsteğe bağlı: Arama butonu eklenebilir */}
      {/* <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 ...">Ara</button> */}
    </form>
  );
};

export default SearchBar; 