import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Plus, CreditCard, Clock, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const balance = 0.00;
    const transactions: any[] = [];

    const handleAddFunds = () => {
        Alert.alert(
            'Add Funds',
            'This feature will allow you to add money to your Pixo wallet for purchases.',
            [{ text: 'OK' }]
        );
    };

    const handleWithdraw = () => {
        Alert.alert(
            'Withdraw',
            'You need a minimum balance of $10 to withdraw funds.',
            [{ text: 'OK' }]
        );
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
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>

                <View style={styles.balanceActions}>
                    <Pressable style={styles.balanceButton} onPress={handleAddFunds}>
                        <Plus size={20} color="#fff" />
                        <Text style={styles.balanceButtonText}>Add Funds</Text>
                    </Pressable>
                    <Pressable style={[styles.balanceButton, styles.balanceButtonOutline]} onPress={handleWithdraw}>
                        <ArrowUpRight size={20} color="#fff" />
                        <Text style={styles.balanceButtonText}>Withdraw</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.contentSection}>
                <Text style={styles.sectionTitle}>Transaction History</Text>

                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Clock size={40} color="#ccc" />
                        </View>
                        <Text style={styles.emptyTitle}>No transactions yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your purchase and earning history will appear here
                        </Text>
                    </View>
                ) : (
                    <ScrollView>
                        {transactions.map((tx, index) => (
                            <View key={index} style={styles.transactionItem}>
                                <View style={styles.txIcon}>
                                    {tx.type === 'credit' ? (
                                        <ArrowDownLeft size={20} color="#22c55e" />
                                    ) : (
                                        <ArrowUpRight size={20} color="#ef4444" />
                                    )}
                                </View>
                                <View style={styles.txDetails}>
                                    <Text style={styles.txTitle}>{tx.title}</Text>
                                    <Text style={styles.txDate}>{tx.date}</Text>
                                </View>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.type === 'credit' ? '#22c55e' : '#ef4444' }
                                ]}>
                                    {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.paymentMethods}>
                    <Text style={styles.methodsTitle}>Payment Methods</Text>
                    <Pressable style={styles.addMethodButton} onPress={() => Alert.alert('Add Payment Method', 'Connect a payment method to make purchases.')}>
                        <CreditCard size={20} color={Colors.light.tint} />
                        <Text style={styles.addMethodText}>Add Payment Method</Text>
                        <Plus size={18} color={Colors.light.tint} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.light.tint,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    balanceSection: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginVertical: 8,
    },
    balanceActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
    },
    balanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    balanceButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    balanceButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    contentSection: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txDetails: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    txDate: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    paymentMethods: {
        marginTop: 'auto',
    },
    methodsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    addMethodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    addMethodText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: Colors.light.tint,
        fontWeight: '600',
    },
});
