import React from 'react';
import { Product } from '../../types';
import { Search, Filter, X } from 'lucide-react';

interface FiltersProps {
  filters: {
    search: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    rating: number;
    brands: string[];
  };
  onFilterChange: (filters: any) => void;
  products: Product[];
}

const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange, products }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Extrair categorias e marcas únicas
  const categories = ['all', ...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand))];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ ...filters, brands: newBrands });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, rating: filters.rating === rating ? 0 : rating });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, maxPrice: Number(e.target.value) });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: 'all',
      minPrice: 0,
      maxPrice: 10000,
      rating: 0,
      brands: [],
    });
  };

  const hasActiveFilters = filters.search || filters.category !== 'all' || 
    filters.brands.length > 0 || filters.rating > 0 || filters.maxPrice < 10000;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pesquisar
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar produtos..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorias
        </label>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                filters.category === category
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Marcas
        </label>
        <div className="space-y-1">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Avaliação Mínima
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filters.rating === rating
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {rating}★
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preço Máximo: Kz {filters.maxPrice.toFixed(0)}
        </label>
        <input
          type="range"
          min="0"
          max="10000"
          value={filters.maxPrice}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Kz 0</span>
          <span>Kz 10,000</span>
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
        <FilterContent />
      </div>

      {/* Mobile - Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      >
        <Filter className="h-6 w-6" />
      </button>

      {/* Mobile - Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Filters;