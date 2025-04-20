"use client";

import React from 'react';
import Image from 'next/image';
// Movie type is no longer needed here
// import { Movie } from '@/lib/api';
import { FaTimes, FaStar, FaTrash } from 'react-icons/fa'; // İkonlar
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion eklendi

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; // Daha küçük resimler için w200

// Updated type definitions matching MovieList.tsx
interface RatingInfo {
  rating: number;
  title: string;
  posterUrl: string | null; // Add posterUrl
}
interface UserRatings {
  [tmdbId: number]: RatingInfo;
}

interface RatedMoviesPanelProps {
  isOpen: boolean; // Panel açık mı?
  onClose: () => void; // Paneli kapatma fonksiyonu
  ratings: UserRatings; // Use the updated type
  // movies: Movie[]; // REMOVE this prop
  onRemoveRating: (tmdbId: number) => void; // Yeni prop eklendi
  onGetRecommendations: () => void; // Add prop for recommendation request
}

// Animasyon varyantları
const panelVariants = {
  hidden: { x: "100%", opacity: 0.5 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    } 
  },
  exit: { 
    x: "100%", 
    opacity: 0,
    transition: { 
      duration: 0.3, 
      ease: "easeInOut" 
    } 
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.05,
      duration: 0.4,
      ease: "easeOut"
    }
  }),
  removed: {
    opacity: 0,
    x: 50,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: "anticipate"
    }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: "0 10px 15px -3px rgba(253, 224, 71, 0.3), 0 4px 6px -4px rgba(253, 224, 71, 0.2)",
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  },
  tap: { 
    scale: 0.95, 
    boxShadow: "0 4px 6px -1px rgba(253, 224, 71, 0.2), 0 2px 4px -2px rgba(253, 224, 71, 0.1)"
  }
};

const RatedMoviesPanel: React.FC<RatedMoviesPanelProps> = ({ 
  isOpen, 
  onClose, 
  ratings, 
  // movies, // Remove from destructuring
  onRemoveRating, 
  onGetRecommendations // Receive the new prop
}) => {
  if (!isOpen) {
    return null; // Panel kapalıysa render etme
  }

  // Convert ratings object into an array for rendering
  // Also parse the tmdbId back to a number
  const ratedItems = Object.entries(ratings).map(([tmdbIdStr, info]) => ({
    tmdbId: parseInt(tmdbIdStr, 10),
    title: info.title,
    rating: info.rating,
    posterUrl: info.posterUrl // Get posterUrl from info
  }));

  // Sort by rating (descending)
  ratedItems.sort((a, b) => b.rating - a.rating); 

  return (
    <AnimatePresence>
      {isOpen && (
        // Panel - Apply gold theme and glassmorphism
        <motion.div 
          className="fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-yellow-900/10 via-black/20 to-yellow-900/10 backdrop-blur-lg border-l border-yellow-600/20 shadow-lg z-40 flex flex-col"
          style={{ backdropFilter: 'blur(16px)' }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={panelVariants}
        >
          {/* Panel Header - Gold theme */}
          <motion.div 
            className="flex justify-between items-center p-4 border-b border-yellow-600/20 flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Rated Movies</h2>
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="text-yellow-100/60 hover:text-yellow-300 bg-black/40 rounded-full p-2 transition-colors"
              aria-label="Close Panel"
            >
              <FaTimes size={16} />
            </motion.button>
          </motion.div>

          {/* Rated Movies List - Scrollable body */}
          <div className="p-4 overflow-y-auto flex-grow">
            <AnimatePresence>
              {ratedItems.length > 0 ? (
                <motion.ul 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, staggerChildren: 0.05 }}
                >
                  {ratedItems.map((item, index) => (
                    <motion.li 
                      key={item.tmdbId}
                      className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-yellow-600/10 hover:border-yellow-600/30 transition-all duration-300 relative group p-2"
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="removed"
                      custom={index}
                      whileHover={{ 
                        y: -2, 
                        borderColor: "rgba(217, 119, 6, 0.5)",
                        boxShadow: "0 4px 12px rgba(234, 179, 8, 0.15)"
                      }}
                    >
                      {/* ** Display Poster Image ** */}
                      <motion.div 
                        className="flex-shrink-0 w-12 h-18 relative rounded overflow-hidden bg-black/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        {item.posterUrl ? (
                          <Image
                            src={`${TMDB_IMAGE_BASE_URL}${item.posterUrl}`}
                            alt={`${item.title} poster`}
                            fill
                            sizes="100px"
                            style={{ objectFit: 'cover' }}
                            className="rounded"
                          />
                        ) : (
                          // Placeholder if no poster
                          <div className="w-full h-full flex items-center justify-center">
                             <motion.div
                               animate={{ rotate: 360 }}
                               transition={{ 
                                 repeat: Infinity, 
                                 duration: 20, 
                                 ease: "linear" 
                               }}
                             >
                               <FaStar className="text-yellow-600/50" size={24}/>
                             </motion.div>
                          </div>
                        )}
                      </motion.div>
                      {/* Movie Info & Rating - Use item.title and item.rating */}
                      <div className="flex-grow min-w-0 pr-8"> 
                        <h3 className="text-sm font-medium text-yellow-50 truncate" title={item.title}>
                          {item.title}
                        </h3>
                        {/* Genre info is unavailable now */}
                        {/* <p className="text-xs text-yellow-100/60 truncate">...</p> */}
                        <div className="flex items-center mt-1 text-yellow-400">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            <FaStar size={14} className="mr-1"/> 
                          </motion.div>
                          <motion.span 
                            className="text-sm font-bold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                          >
                            {item.rating}
                          </motion.span>
                          <span className="text-xs text-yellow-100/50 ml-1">/ 5</span>
                        </div>
                      </div>
                      {/* Remove Button - Use item.tmdbId */}
                      <motion.button
                        onClick={() => onRemoveRating(item.tmdbId)}
                        className="absolute top-1 right-1 text-yellow-100/70 hover:text-red-500 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-all duration-200 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Remove rating for ${item.title}`}
                        title="Remove Rating"
                        whileHover={{ scale: 1.2, backgroundColor: "rgba(0, 0, 0, 0.6)" }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTrash size={10} />
                      </motion.button>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.p 
                  className="text-center text-yellow-100/50 mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  You haven&apos;t rated any movies yet.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Recommendations Button - Sticky at the bottom */}
          <motion.div 
            className="p-4 mt-auto border-t border-yellow-600/20 flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
             {ratedItems.length >= 5 ? (
                 <motion.button 
                   onClick={onGetRecommendations} 
                   className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                   variants={buttonVariants}
                   initial="idle"
                   whileHover="hover"
                   whileTap="tap"
                 >
                   Get Recommendations
                 </motion.button>
             ) : (
                 <motion.p 
                   className="text-center text-xs text-yellow-100/60"
                   initial={{ opacity: 0 }}
                   animate={{ 
                     opacity: 1, 
                     transition: { delay: 0.4 }
                   }}
                 >
                   Rate at least {5 - ratedItems.length} more movie{5 - ratedItems.length > 1 ? 's' : ''} to get recommendations.
                 </motion.p>
             )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RatedMoviesPanel; 