import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { X, CreditCard, Plus, CheckCircle, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentService, PaymentMethod } from '@/lib/payment';
import { useRouter } from 'expo-router';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPay: () => Promise<void>;
  amount: number;
  title: string;
  description: string;
}

export const PaymentModal = ({ visible, onClose, onPay, amount, title, description }: PaymentModalProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) loadMethods();
  }, [visible]);

  const loadMethods = async () => {
    const data = await PaymentService.getMethods();
    setMethods(data);
    if (data.length > 0) setSelectedId(data[0].id);
  };

  const handlePay = async () => {
    if (!selectedId) {
        Alert.alert('No Payment Method', 'Please select or add a payment method.');
        return;
    }
    setLoading(true);
    
    // Process via Service
    const success = await PaymentService.charge(amount, selectedId);
    
    if (success) {
        await onPay(); // Execute the callback (Database update)
        setLoading(false);
        onClose();
    } else {
        setLoading(false);
        Alert.alert("Payment Failed", "Card declined. Please try another method.");
    }
  };

  const handleAddCard = () => {
      onClose();
      // Wait for modal to close before navigating
      setTimeout(() => {
          router.push('/user/wallet');
      }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={20}>
              <X size={24} color="#333" />
            </Pressable>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View>
                <Text style={styles.summaryTitle}>{title}</Text>
                <Text style={styles.summaryDesc}>{description}</Text>
            </View>
            <Text style={styles.amount}>${amount.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Payment Methods */}
          <Text style={styles.sectionLabel}>Pay with</Text>
          
          <ScrollView style={styles.methodList} contentContainerStyle={{gap: 10}}>
            {methods.map((method) => (
                <Pressable 
                    key={method.id} 
                    style={[styles.methodOption, selectedId === method.id && styles.methodSelected]}
                    onPress={() => setSelectedId(method.id)}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <View style={styles.cardIcon}>
                            <CreditCard size={20} color="#333" />
                        </View>
                        <View>
                            <Text style={styles.methodBrand}>{method.brand} ending in {method.last4}</Text>
                            <Text style={styles.methodExpiry}>Expires {method.expiry}</Text>
                        </View>
                    </View>
                    <View style={styles.radio}>
                        {selectedId === method.id && <View style={styles.radioInner} />}
                    </View>
                </Pressable>
            ))}

            <Pressable style={styles.addMethodBtn} onPress={handleAddCard}>
                <Plus size={20} color={Colors.light.tint} />
                <Text style={styles.addMethodText}>Add Payment Method</Text>
            </Pressable>
          </ScrollView>

          {/* Footer */}
          <View style={styles.secureBadge}>
            <Lock size={12} color="#666" />
            <Text style={styles.secureText}>Secure SSL Connection</Text>
          </View>

          <Pressable 
            style={[styles.payButton, (loading || methods.length === 0) && styles.disabledBtn]} 
            onPress={handlePay} 
            disabled={loading || methods.length === 0}
          >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.payText}>
                    {methods.length === 0 ? 'Add Card to Pay' : `Pay $${amount.toFixed(2)}`}
                </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  summaryDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.tint,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  methodList: {
    maxHeight: 200,
    marginBottom: 24,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  methodSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#fff0f2',
  },
  cardIcon: {
    width: 40,
    height: 30,
    backgroundColor: '#eee',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodBrand: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  methodExpiry: {
    fontSize: 12,
    color: '#888',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  addMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addMethodText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#111',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secureBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
  },
});
