import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentMethod {
  id: string;
  brand: 'Visa' | 'MasterCard' | 'Amex';
  last4: string;
  expiry: string;
}

const STORAGE_KEY = 'pixo_payment_methods';

export const PaymentService = {
  getMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addMethod: async (card: PaymentMethod) => {
    const methods = await PaymentService.getMethods();
    const newMethods = [...methods, card];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMethods));
    return newMethods;
  },

  removeMethod: async (id: string) => {
    const methods = await PaymentService.getMethods();
    const newMethods = methods.filter(m => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMethods));
    return newMethods;
  },
  
  // Simulation of a charge
  charge: async (amount: number, methodId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 90% success rate simulation
            resolve(true);
        }, 2000);
    });
  }
};
