import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartContextValue, CartState, Product } from '../types';
import { products } from '../data/products';

const CartContext = createContext<CartContextValue | undefined>(undefined);

function computeItems(state: CartState): Array<{ product: Product; quantity: number }> {
  const items: Array<{ product: Product; quantity: number }> = [];
  for (const [productId, quantity] of Object.entries(state.itemsById)) {
    const product = products.find((p) => p.id === productId);
    if (product && quantity > 0) items.push({ product, quantity });
  }
  return items;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ itemsById: {} });

  const value = useMemo<CartContextValue>(() => {
    const items = computeItems(state);
    const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
    const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

    function add(productId: string, quantity: number = 1) {
      setState((prev) => {
        const currentQty = prev.itemsById[productId] ?? 0;
        return { itemsById: { ...prev.itemsById, [productId]: currentQty + quantity } };
      });
    }

    function remove(productId: string) {
      setState((prev) => {
        const { [productId]: _omit, ...rest } = prev.itemsById;
        return { itemsById: rest };
      });
    }

    function setQuantity(productId: string, quantity: number) {
      setState((prev) => {
        const next = { ...prev.itemsById };
        if (quantity <= 0) delete next[productId];
        else next[productId] = quantity;
        return { itemsById: next };
      });
    }

    function clear() {
      setState({ itemsById: {} });
    }

    return { items, itemCount, subtotal, add, remove, setQuantity, clear };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
