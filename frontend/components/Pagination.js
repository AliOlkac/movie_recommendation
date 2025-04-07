export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Gösterilecek sayfa numarası sayısı
  const maxPageNumbers = 5;
  
  // Sayfa numaralarını oluşturma
  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= maxPageNumbers) {
      // Toplam sayfa sayısı az ise tümünü göster
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sayfa sayısı fazla ise akıllı sayfalama uygula
      let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
      let endPage = startPage + maxPageNumbers - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPageNumbers + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination">
      {/* İlk sayfa butonu */}
      {currentPage > 1 && (
        <button onClick={() => onPageChange(1)}>
          &laquo;
        </button>
      )}
      
      {/* Önceki sayfa butonu */}
      {currentPage > 1 && (
        <button onClick={() => onPageChange(currentPage - 1)}>
          &lsaquo;
        </button>
      )}
      
      {/* Sayfa numaraları */}
      {getPageNumbers().map(pageNumber => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={currentPage === pageNumber ? 'active' : ''}
        >
          {pageNumber}
        </button>
      ))}
      
      {/* Sonraki sayfa butonu */}
      {currentPage < totalPages && (
        <button onClick={() => onPageChange(currentPage + 1)}>
          &rsaquo;
        </button>
      )}
      
      {/* Son sayfa butonu */}
      {currentPage < totalPages && (
        <button onClick={() => onPageChange(totalPages)}>
          &raquo;
        </button>
      )}
    </div>
  );
} 