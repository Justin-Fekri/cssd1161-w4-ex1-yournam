import { useParams } from 'react-router-dom';
import { getProductById } from '../data/products';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = id ? getProductById(id) : undefined;
  const { add } = useCart();

  if (!product) return <main className="container py-8">Product not found.</main>;

  return (
    <main className="container py-8 grid lg:grid-cols-2 gap-8">
      <div className="aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-gray-200">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="text-gray-600">{product.storageGb} GB • {product.color} • {product.is5g ? '5G' : '4G'}</div>
        <div className="text-2xl text-blue-600 font-semibold">{formatCurrency(product.price)}</div>
        <p className="text-gray-700">{product.description}</p>
        <button onClick={() => add(product.id, 1)} className="rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700">Add to cart</button>
      </div>
    </main>
  );
}
