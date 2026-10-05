import React from 'react';
import { Product } from '../../types';
import {
  Search,
  Filter,
  X,
  Star,
  Tag,
  DollarSign,
  SlidersHorizontal,
  Sparkles,
  Check,
  Building2,
} from 'lucide-react';

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

  const categories = ['all', ...new Set(products.map((p) => p.category))];
  const brands = [...new Set(products.map((p) => p.brand))];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
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

  const hasActiveFilters =
    filters.search ||
    filters.category !== 'all' ||
    filters.brands.length > 0 ||
    filters.rating > 0 ||
    filters.maxPrice < 10000;

  const SectionLabel: React.FC<{
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }> = ({ children, icon: Icon }) => (
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </label>
  );

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <SectionLabel icon={Search}>Pesquisar</SectionLabel>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-9 py-2.5 border border-slate-200 bg-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 outline-none transition-all text-sm font-medium text-slate-900 placeholder-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <SectionLabel icon={Tag}>Categorias</SectionLabel>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {categories.map((category) => {
            const isActive = filters.category === category;
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`group w-full flex items-center justify-between text-left px-3 py-2 rounded-xl transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-bold border border-blue-200 shadow-sm'
                    : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium border border-transparent'
                }`}
              >
                <span className="truncate">
                  {category === 'all' ? 'Todas as categorias' : category}
                </span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div>
        <SectionLabel icon={Building2}>Marcas</SectionLabel>
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          {brands.map((brand) => {
            const isChecked = filters.brands.includes(brand);
            return (
              <label
                key={brand}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isChecked
                    ? 'bg-blue-50/60 border border-blue-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(brand)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${
                      isChecked
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500/20'
                    }`}
                  >
                    {isChecked && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    isChecked ? 'text-blue-800' : 'text-slate-700'
                  }`}
                >
                  {brand}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <SectionLabel icon={Star}>Avaliação mínima</SectionLabel>
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5].map((rating) => {
            const isActive = filters.rating === rating;
            return (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <Star
                  className={`w-3 h-3 ${
                    isActive ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                  }`}
                />
                {rating}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div>
        <SectionLabel icon={DollarSign}>
          Preço até{' '}
          <span className="text-blue-600 normal-case tracking-normal font-bold">
            Kz {filters.maxPrice.toFixed(0)}
          </span>
        </SectionLabel>
        <div className="px-1">
          <input
            type="range"
            min="0"
            max="10000"
            value={filters.maxPrice}
            onChange={handlePriceChange}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
            <span>Kz 0</span>
            <span>Kz 10,000</span>
          </div>
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200/70 group"
        >
          <X className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
          Limpar todos os filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 sticky top-20 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            Filtros
          </h2>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
              Ativos
            </span>
          )}
        </div>
        <FilterContent />
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-300/50 hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-300 group"
        aria-label="Abrir filtros"
      >
        <Filter className="h-5 w-5 group-hover:scale-110 transition-transform" />
        {hasActiveFilters && (
          <>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
              !
            </span>
            <span className="absolute inset-0 rounded-2xl bg-blue-500 animate-ping opacity-20" />
          </>
        )}
      </button>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 border-l border-slate-200/70 p-6 overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                </div>
                Filtros
              </h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight {
          from { transform: translateX(100%) }
          to { transform: translateX(0) }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in-out }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) }
      `}</style>
    </>
  );
};

export default Filters;