import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

export default function Cart() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Your cart</h1>
      {items.length === 0 ? (
        <div className="text-gray-600">Your cart is empty. <Link to="/catalog" className="text-blue-600 underline">Browse phones</Link>.</div>
      ) : (
        <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
          <div className="space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg ring-1 ring-gray-200 bg-white">
                <img src={product.image} alt="" className="h-20 w-28 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(product.price)}</div>
                </div>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                  className="w-20 rounded-md border px-2 py-1"
                />
                <button onClick={() => remove(product.id)} className="text-sm text-red-600 hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={clear} className="text-sm text-gray-600 hover:underline">Clear cart</button>
          </div>
          <aside className="p-6 rounded-lg ring-1 ring-gray-200 bg-white h-fit">
            <div className="font-semibold mb-2">Summary</div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <Link to="/checkout" className="mt-4 block rounded-md bg-blue-600 px-4 py-2.5 text-white text-center font-medium hover:bg-blue-700">Checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
