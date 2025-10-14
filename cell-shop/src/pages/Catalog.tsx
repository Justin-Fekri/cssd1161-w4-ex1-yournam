import { useMemo, useState } from 'react';
import { products, getBrands } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export default function Catalog() {
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [is5g, setIs5g] = useState(false);

  const brands = getBrands();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (is5g && !p.is5g) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!(`${p.brand} ${p.model} ${p.name}`.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [query, brand, is5g]);

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Catalog</h1>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models, brands..."
          className="w-full rounded-md border px-3 py-2"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-md border px-3 py-2">
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={is5g} onChange={(e) => setIs5g(e.target.checked)} />
          5G only
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {filtered.length === 0 && (
          <div className="text-gray-600">No products match your filters.</div>
        )}
      </div>
    </main>
  );
}
