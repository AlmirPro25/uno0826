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
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isCheapest }) => {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
    >
      {isCheapest && (
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 text-center">
          🏆 MELHOR PREÇO
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-20 h-20 object-cover rounded"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
              {product.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {product.price}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <span>{product.storeIcon}</span>
                  <span>{product.store}</span>
                </div>
              </div>
              
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                Ver Oferta
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
    <div className="space-y-4 my-4">
      {/* Resumo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
          🛍️ {products.length} Produtos Encontrados
        </h3>
        
        {comparison && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Mais Barato</div>
              <div className="font-bold text-green-600 dark:text-green-400">
                {comparison.cheapest?.price}
              </div>
              <div className="text-xs text-gray-500">{comparison.cheapest?.store}</div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Mais Caro</div>
              <div className="font-bold text-red-600 dark:text-red-400">
                {comparison.mostExpensive?.price}
              </div>
              <div className="text-xs text-gray-500">{comparison.mostExpensive?.store}</div>
            </div>
            
            <div>
              <div className="text-gray-600 dark:text-gray-400">Preço Médio</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">
                R$ {comparison.averagePrice}
              </div>
            </div>
            
            {comparison.bestDeals && comparison.bestDeals.length > 0 && (
              <div>
                <div className="text-gray-600 dark:text-gray-400">Maior Economia</div>
                <div className="font-bold text-green-600 dark:text-green-400">
                  {comparison.bestDeals[0].savings}
                </div>
                <div className="text-xs text-gray-500">
                  ({comparison.bestDeals[0].savingsPercent}% off)
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Melhores Ofertas */}
      {comparison?.bestDeals && comparison.bestDeals.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-3">
            💰 Melhores Ofertas (Economize Mais!)
          </h4>
          <div className="space-y-2">
            {comparison.bestDeals.map((deal: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {deal.product}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {deal.cheapest.store}: {deal.cheapest.price} vs {deal.mostExpensive.store}: {deal.mostExpensive.price}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 dark:text-green-400">
                    Economize {deal.savings}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({deal.savingsPercent}% off)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProducts.slice(0, 12).map((product, index) => (
          <ProductCard
            key={index}
            product={product}
            isCheapest={product.priceRaw === cheapestPrice}
          />
        ))}
      </div>

      {sortedProducts.length > 12 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          + {sortedProducts.length - 12} produtos não exibidos
        </div>
      )}
    </div>
  );
};
