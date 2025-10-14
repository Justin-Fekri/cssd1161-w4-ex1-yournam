import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main className="container py-12 text-center">
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="text-gray-600 mt-2">Your order has been received. A confirmation email is on its way.</p>
      </main>
    );
  }

  if (items.length === 0) {
    return <main className="container py-12">Your cart is empty.</main>;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clear();
    setSubmitted(true);
  }

  return (
    <main className="container py-8 grid lg:grid-cols-[2fr,1fr] gap-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <input required placeholder="Full name" className="rounded-md border px-3 py-2" />
          <input required type="email" placeholder="Email" className="rounded-md border px-3 py-2" />
          <input required placeholder="Address" className="rounded-md border px-3 py-2 sm:col-span-2" />
          <input required placeholder="City" className="rounded-md border px-3 py-2" />
          <input required placeholder="ZIP" className="rounded-md border px-3 py-2" />
          <input required placeholder="Country" className="rounded-md border px-3 py-2" />
        </div>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700">Place order</button>
      </form>

      <aside className="p-6 rounded-lg ring-1 ring-gray-200 bg-white h-fit">
        <div className="font-semibold mb-2">Order summary</div>
        <ul className="text-sm text-gray-700 space-y-1">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between">
              <span>{product.name} × {quantity}</span>
              <span>{formatCurrency(product.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between font-medium mt-3">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </aside>
    </main>
  );
}
