/**
 * 🛍️ PRODUCT CARD - VERSÃO MELHORADA
 * Design profissional e moderno para exibição de produtos
 */

import React from 'react';

interface Product {
  title: string;
  price: string;
  priceRaw: number;
  url: string;
  store: string;
  storeIcon: string;
  image?: string;
}

interface ProductCardProps {
  product: Product;
  isCheapest?: boolean;
  rank?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isCheapest, rank }) => {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.02]"
    >
      {/* Badge de Melhor Preço */}
      {isCheapest && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-4 py-2 text-center flex items-center justify-center gap-2">
          <span className="text-lg">🏆</span>
          <span>MELHOR PREÇO</span>
        </div>
      )}
      
      {/* Ranking */}
      {rank && !isCheapest && (
        <div className="absolute top-3 left-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10">
          {rank}
        </div>
      )}
      
      <div className="p-5">
        <div className="flex gap-4">
          {/* Imagem do Produto */}
          {product.image ? (
            <div className="flex-shrink-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-28 h-28 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-28 h-28 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-4xl">{product.storeIcon}</span>
            </div>
          )}
          
          {/* Informações do Produto */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Título */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {product.title}
              </h3>
              
              {/* Loja */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span className="text-lg">{product.storeIcon}</span>
                <span className="font-medium">{product.store}</span>
              </div>
            </div>
            
            {/* Preço e Botão */}
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Preço
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {product.price}
                </div>
              </div>
              
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-xl flex items-center gap-2 group-hover:scale-105">
                <span>Ver Oferta</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

interface ProductGridProps {
  products: Product[];
  comparison?: any;
}

export const ProductSearchResults: React.FC<ProductGridProps> = ({ products, comparison }) => {
  if (products.length === 0) {
    return null;
  }

  // Ordenar por preço
  const sortedProducts = [...products].sort((a, b) => a.priceRaw - b.priceRaw);
  const cheapestPrice = sortedProducts[0]?.priceRaw;

  return (
    <div className="space-y-6 my-6">
      {/* Resumo Estatístico */}
      {comparison && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span>{products.length} Produtos Encontrados</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Mais Barato */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mais Barato
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {comparison.cheapest?.price}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {comparison.cheapest?.store}
              </div>
            </div>
            
            {/* Mais Caro */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mais Caro
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {comparison.mostExpensive?.price}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {comparison.mostExpensive?.store}
              </div>
            </div>
            
            {/* Preço Médio */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Preço Médio
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                R$ {comparison.averagePrice}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Média geral
              </div>
            </div>
            
            {/* Maior Economia */}
            {comparison.bestDeals && comparison.bestDeals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Maior Economia
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {comparison.bestDeals[0].savings}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {comparison.bestDeals[0].savingsPercent}% de desconto
                </div>
              </div>
            )}
          </div>
          
          {/* Melhores Ofertas */}
          {comparison.bestDeals && comparison.bestDeals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span>💰</span>
                <span>Melhores Ofertas (Economize Mais!)</span>
              </h4>
              <div className="space-y-2">
                {comparison.bestDeals.slice(0, 3).map((deal: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {deal.product}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {deal.cheapest.store}: {deal.cheapest.price} vs {deal.mostExpensive.store}: {deal.mostExpensive.price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        Economize {deal.savings}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({deal.savingsPercent}% de desconto)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Grid de Produtos */}
      <div className="space-y-4">
        {sortedProducts.map((product, index) => (
          <ProductCard
            key={index}
            product={product}
            isCheapest={product.priceRaw === cheapestPrice}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCard;
