import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatCurrency } from '../utils/format';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-gray-50">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
      </Link>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-sm text-gray-500">{product.brand}</div>
        <Link to={`/product/${product.id}`} className="font-medium line-clamp-1 hover:underline">{product.name}</Link>
        <div className="text-blue-600 font-semibold">{formatCurrency(product.price)}</div>
        <div className="text-xs text-gray-500">{product.storageGb} GB • {product.color} • {product.is5g ? '5G' : '4G'}</div>
        <Link to={`/product/${product.id}`} className="mt-2 inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700">View details</Link>
      </div>
    </div>
  );
}
