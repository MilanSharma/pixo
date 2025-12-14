import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Package, ShoppingBag, Truck, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function OrdersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Empty orders for now
    const orders: any[] = [];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'processing': return <Package size={20} color="#f59e0b" />;
            case 'shipped': return <Truck size={20} color="#3b82f6" />;
            case 'delivered': return <CheckCircle size={20} color="#22c55e" />;
            default: return <Package size={20} color="#888" />;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={{ width: 24 }} />
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <ShoppingBag size={56} color="#ccc" />
                    </View>
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySubtitle}>
                        When you make a purchase, your orders will appear here
                    </Text>
                    <Pressable style={styles.shopButton} onPress={() => router.push('/(tabs)/shop')}>
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView style={styles.ordersList} contentContainerStyle={styles.ordersContent}>
                    {orders.map((order, index) => (
                        <Pressable key={index} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>Order #{order.id}</Text>
                                <View style={styles.statusBadge}>
                                    {getStatusIcon(order.status)}
                                    <Text style={styles.statusText}>{order.status}</Text>
                                </View>
                            </View>
                            <View style={styles.orderDetails}>
                                <Text style={styles.orderItems}>{order.itemCount} items</Text>
                                <Text style={styles.orderTotal}>${order.total}</Text>
                            </View>
                            <Text style={styles.orderDate}>{order.date}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <View style={styles.helpSection}>
                <Text style={styles.helpText}>Need help with an order?</Text>
                <Pressable onPress={() => router.push('/user/help')}>
                    <Text style={styles.helpLink}>Contact Support</Text>
                </Pressable>
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    shopButton: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 24,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    ordersList: {
        flex: 1,
    },
    ordersContent: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'capitalize',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderItems: {
        fontSize: 14,
        color: '#666',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.tint,
    },
    orderDate: {
        fontSize: 13,
        color: '#999',
    },
    helpSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    helpText: {
        fontSize: 14,
        color: '#666',
    },
    helpLink: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.tint,
    },
});
