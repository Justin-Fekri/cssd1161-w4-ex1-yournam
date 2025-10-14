export type Product = {
  id: string;
  brand: string;
  model: string;
  name: string;
  price: number;
  rating: number;
  storageGb: number;
  color: string;
  image: string;
  description: string;
  is5g: boolean;
  stock: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartState = {
  itemsById: Record<string, number>;
};

export type CartContextValue = {
  items: Array<{ product: Product; quantity: number }>;
  itemCount: number;
  subtotal: number;
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};
