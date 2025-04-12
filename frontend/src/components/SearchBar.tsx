"use client"; // Input değeri state ile yönetileceği için Client Component olmalı

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { FaSearch } from 'react-icons/fa'; // Search icon

// Props arayüzünü tanımla
interface SearchBarProps {
  initialSearchTerm?: string;
  onSearchChange: (searchTerm: string) => void; // Arama terimi değiştiğinde çağrılacak fonksiyon
}

// Props'ları al
const SearchBar: React.FC<SearchBarProps> = ({ initialSearchTerm = '', onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Prop değişirse state'i güncelle
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Handle input changes
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    onSearchChange(newTerm); // Değişikliği üst bileşene bildir
  };
  
  // Handle form submission (e.g., pressing Enter)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission which reloads the page
    // We are already notifying on change, but we could potentially trigger
    // a more specific search action here if needed.
    console.log("Search submitted (optional action):", searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        placeholder="Search for movies..." // Changed placeholder to English
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 pl-10 text-white bg-gray-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
      />
      <FaSearch 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        size={18}
      />
      {/* İsteğe bağlı: Arama butonu eklenebilir */}
      {/* <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 ...">Ara</button> */}
    </form>
  );
};

export default SearchBar; 