"use client"; // Input değeri state ile yönetileceği için Client Component olmalı

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { FaSearch } from 'react-icons/fa'; // Search icon
import { motion } from 'framer-motion'; // Animasyonlar için

// Props arayüzünü tanımla
interface SearchBarProps {
  initialSearchTerm?: string;
  onSearchChange: (term: string) => void; // Arama terimi değiştiğinde çağrılacak fonksiyon
}

// Props'ları al
const SearchBar: React.FC<SearchBarProps> = ({ initialSearchTerm = '', onSearchChange }) => {
  const [term, setTerm] = useState<string>(initialSearchTerm);
  const [isFocused, setIsFocused] = useState<boolean>(false);

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
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className={`absolute inset-y-0 left-0 pl-2 sm:pl-4 flex items-center pointer-events-none transition-all duration-300 ${isFocused ? 'text-yellow-500' : 'text-gray-400'}`}>
        <motion.div
          animate={{ scale: isFocused ? 1.2 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <FaSearch className="text-xs sm:text-sm" /> 
        </motion.div>
      </div>
      <motion.input
        type="text"
        placeholder="Search for movies..."
        value={term}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-full backdrop-blur-sm shadow-md transition-all duration-300 ${isFocused ? 'ring-2 ring-yellow-500/50 bg-white/15' : 'focus:outline-none focus:ring-2 focus:ring-yellow-500/50'}`}
        whileFocus={{ scale: 1.02 }}
        initial={{ scale: 1 }}
      />
    </form>
  );
};

export default SearchBar; 