import { useState, useCallback } from "react";

export function useBookingCart() {
  const [cart, setCart] = useState({});

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const currentQty = prev[item.DAYMENUID]?.qty || 0;
      const availableLimit = Math.min(item.AVAILQTY, item.MAXQTY);
      
      if (currentQty >= availableLimit) return prev; // Cannot exceed limits

      return {
        ...prev,
        [item.DAYMENUID]: {
          ...item,
          qty: currentQty + 1
        }
      };
    });
  }, []);

  const removeFromCart = useCallback((item) => {
    setCart((prev) => {
      const currentQty = prev[item.DAYMENUID]?.qty || 0;
      
      if (currentQty <= 1) {
        const newCart = { ...prev };
        delete newCart[item.DAYMENUID];
        return newCart;
      }

      return {
        ...prev,
        [item.DAYMENUID]: {
          ...item,
          qty: currentQty - 1
        }
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const totalAmount = Object.values(cart).reduce((sum, item) => {
    return sum + (item.qty * (item.DISPLAYPRICE || 0));
  }, 0);

  const totalItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    totalAmount,
    totalItemsCount
  };
}
