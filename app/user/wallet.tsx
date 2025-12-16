import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Plus, CreditCard, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getWalletData } from '@/lib/database';
import { PaymentService, PaymentMethod } from '@/lib/payment';

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    // Wallet Data
    const [balance, setBalance] = useState(0.00);
    const [transactions, setTransactions] = useState<any[]>([]);
    
    // Cards Data
    const [cards, setCards] = useState<PaymentMethod[]>([]);
    
    // Add Card Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    useEffect(() => {
        if(user) {
            loadWallet();
            loadCards();
        }
    }, [user]);

    const loadWallet = async () => {
        try {
            if(!user) return;
            const data = await getWalletData(user.id);
            setBalance(data.balance);
            setTransactions(data.transactions);
        } catch(e) {
            console.error(e);
        }
    };

    const loadCards = async () => {
        const data = await PaymentService.getMethods();
        setCards(data);
    };

    const handleAddCard = async () => {
        if (cardNumber.length < 14 || expiry.length < 4 || cvc.length < 3) {
            Alert.alert("Invalid Input", "Please fill in valid card details.");
            return;
        }

        const newCard: PaymentMethod = {
            id: Date.now().toString(),
            brand: cardNumber.startsWith('4') ? 'Visa' : 'MasterCard',
            last4: cardNumber.slice(-4),
            expiry: expiry
        };

        await PaymentService.addMethod(newCard);
        setModalVisible(false);
        setCardNumber('');
        setExpiry('');
        setCvc('');
        loadCards();
        Alert.alert("Success", "Card added successfully");
    };

    const handleDeleteCard = async (id: string) => {
        await PaymentService.removeMethod(id);
        loadCards();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Wallet</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Total Earnings</Text>
                <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
                <Text style={styles.balanceSub}>Available for payout at end of month</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Payment Methods</Text>
                    <Pressable onPress={() => setModalVisible(true)}>
                        <Text style={styles.actionLink}>+ Add New</Text>
                    </Pressable>
                </View>

                {cards.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <CreditCard size={32} color="#ccc" />
                        <Text style={styles.emptyText}>No cards added yet.</Text>
                        <Pressable style={styles.smallBtn} onPress={() => setModalVisible(true)}>
                            <Text style={styles.smallBtnText}>Add Card</Text>
                        </Pressable>
                    </View>
                ) : (
                    cards.map(card => (
                        <View key={card.id} style={styles.cardItem}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                <View style={styles.cardIcon}>
                                    <CreditCard size={20} color="#333" />
                                </View>
                                <View>
                                    <Text style={styles.cardBrand}>{card.brand} •••• {card.last4}</Text>
                                    <Text style={styles.cardExp}>Exp {card.expiry}</Text>
                                </View>
                            </View>
                            <Pressable onPress={() => handleDeleteCard(card.id)} style={styles.trashBtn}>
                                <Trash2 size={18} color="#ef4444" />
                            </Pressable>
                        </View>
                    ))
                )}

                <Text style={[styles.sectionTitle, {marginTop: 24, marginBottom: 12}]}>Earnings History</Text>
                {transactions.length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>No transactions yet.</Text>
                ) : (
                    transactions.map((tx, index) => (
                        <View key={index} style={styles.txItem}>
                            <View>
                                <Text style={styles.txTitle}>{tx.description || tx.type}</Text>
                                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.txAmount}>+${tx.amount}</Text>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Card Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Card</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <X size={24} color="#333" />
                            </Pressable>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Card Number</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="0000 0000 0000 0000" 
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                maxLength={16}
                            />
                        </View>
                        <View style={{flexDirection: 'row', gap: 12}}>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>Expiry</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="MM/YY" 
                                    placeholderTextColor="#999"
                                    value={expiry}
                                    onChangeText={setExpiry}
                                    maxLength={5}
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>CVC</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="123" 
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    value={cvc}
                                    onChangeText={setCvc}
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <Pressable style={styles.saveBtn} onPress={handleAddCard}>
                            <Text style={styles.saveBtnText}>Save Card</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.light.tint,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    
    balanceSection: {
        backgroundColor: Colors.light.tint,
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
    balanceAmount: { color: '#fff', fontSize: 42, fontWeight: '800', marginTop: 8 },
    balanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },

    content: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
    actionLink: { color: Colors.light.tint, fontWeight: '600' },

    emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 12, alignItems: 'center', gap: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    emptyText: { color: '#888' },
    smallBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f0f0f0', borderRadius: 20 },
    smallBtnText: { color: '#333', fontWeight: '600', fontSize: 12 },

    cardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardIcon: { width: 40, height: 30, backgroundColor: '#eee', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    cardBrand: { fontWeight: '700', color: '#333' },
    cardExp: { color: '#888', fontSize: 12 },
    trashBtn: { padding: 8 },

    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    txTitle: { fontWeight: '600', color: '#333' },
    txDate: { color: '#999', fontSize: 12, marginTop: 2 },
    txAmount: { color: '#22c55e', fontWeight: '700', fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCard: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    inputGroup: { marginBottom: 4 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
    input: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12, fontSize: 16, color: '#111' },
    saveBtn: { backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
