import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types';
import { Alert } from 'react-native';

interface CartContextType {
  items: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  count: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  isInCart: () => false,
  count: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    setItems(current => {
      // Prevent duplicates in wishlist
      if (current.find(i => i.id === product.id)) {
        // Optional: Simple alert if already added, or just ignore
        return current;
      }
      return [...current, product];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(current => current.filter(i => i.id !== productId));
  };

  const isInCart = (productId: string) => {
      return items.some(i => i.id === productId);
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, isInCart, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
