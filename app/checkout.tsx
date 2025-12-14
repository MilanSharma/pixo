import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useCart } from '@/context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total } = useCart();
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
        setLoading(false);
        Alert.alert('Success!', 'Your order has been placed successfully.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/shop') }
        ]);
    }, 2000);
  };

  if (items.length === 0) {
      return (
          <View style={[styles.container, styles.center]}>
              <Text style={styles.emptyText}>Your cart is empty</Text>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                  <Text style={styles.backText}>Go Shopping</Text>
              </Pressable>
          </View>
      );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <ArrowLeft size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item, index) => (
            <View key={item.id + index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
        ))}
        
        <View style={styles.divider} />
        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <TextInput style={styles.input} placeholder="Full Name" />
        <TextInput style={styles.input} placeholder="Address Line 1" />
        <TextInput style={styles.input} placeholder="City, State, ZIP" />

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentRow}>
            <CreditCard size={24} color={Colors.light.tint} />
            <Text style={styles.paymentText}>•••• •••• •••• 4242</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={styles.payButton} onPress={handlePay} disabled={loading}>
              <Text style={styles.payText}>{loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}</Text>
          </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemTitle: { fontSize: 14, color: '#333' },
  itemSubtitle: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.light.tint },
  input: { backgroundColor: '#f9f9f9', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#f0f9ff', borderRadius: 8, borderWidth: 1, borderColor: '#bae6fd' },
  paymentText: { fontSize: 14, fontWeight: '600', color: '#0369a1' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  payButton: { backgroundColor: Colors.light.tint, padding: 16, borderRadius: 12, alignItems: 'center' },
  payText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { fontSize: 18, color: '#888', marginBottom: 20 },
  backBtn: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },
  backText: { fontWeight: '600' }
});
