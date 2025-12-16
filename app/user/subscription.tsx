import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown, Zap, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { PaymentModal } from '@/components/PaymentModal';
import { purchaseSubscription, cancelSubscription } from '@/lib/database';

export default function SubscriptionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const isPro = profile?.subscription_tier === 'pro';

    const handleSubscribe = () => {
        setShowPayment(true);
    };

    const processSubscription = async () => {
        if (!user) return;
        try {
            await purchaseSubscription(user.id);
            await refreshProfile();
            Alert.alert("Success", "Welcome to Pixo Pro!");
        } catch (error: any) {
            Alert.alert("Error", "Transaction failed. Please try again.");
        }
    };

    const FeatureRow = ({ text }: { text: string }) => (
        <View style={styles.featureRow}>
            <View style={styles.checkContainer}>
                <Check size={14} color="#fff" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    
    const handleCancel = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await cancelSubscription(user.id);
            await refreshProfile();
            Alert.alert("Subscription Canceled", "You are now on the Free plan.");
        } catch (error) {
            Alert.alert("Error", "Could not cancel subscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Subscription</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <Crown size={64} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.heroTitle}>Pixo Pro</Text>
                    <Text style={styles.heroSubtitle}>Unlock your business potential</Text>
                </View>

                                {isPro ? (
                    <View style={styles.currentPlanCard}>
                        <Text style={styles.currentPlanTitle}>Current Plan: PRO</Text>
                        <Text style={styles.currentPlanText}>You have access to all features.</Text>
                        <Pressable style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
                            <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.pricingCard}>
                        <Text style={styles.price}>$10<Text style={styles.period}>/month</Text></Text>
                        <Text style={styles.cancelAnytime}>Cancel anytime</Text>
                        
                        <View style={styles.divider} />
                        
                        <FeatureRow text="Unlimited Product Listings" />
                        <FeatureRow text="Advanced Analytics" />
                        <FeatureRow text="Verified Seller Badge" />
                        <FeatureRow text="Priority Support" />
                        
                        <Pressable 
                            style={styles.subscribeBtn} 
                            onPress={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.subscribeBtnText}>Upgrade Now</Text>
                            )}
                        </Pressable>
                    </View>
                )}

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Why Upgrade?</Text>
                    <Text style={styles.infoText}>
                        Pro users get 3x more visibility on average. Access detailed insights on who is viewing your products and boost your sales.
                    </Text>
                </View>
            </ScrollView>
            <PaymentModal 
                visible={showPayment} 
                onClose={() => setShowPayment(false)}
                onPay={processSubscription}
                amount={10.00}
                title="Pixo Pro Subscription"
                description="Monthly subscription for unlimited access"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    cancelBtn: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#047857', borderRadius: 20 },
    cancelBtnText: { color: '#047857', fontSize: 12, fontWeight: '600' },
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 24, paddingBottom: 40 },
    
    hero: { alignItems: 'center', marginBottom: 30 },
    heroTitle: { fontSize: 32, fontWeight: '800', color: '#111', marginTop: 12 },
    heroSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },

    pricingCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 24,
    },
    price: { fontSize: 42, fontWeight: '800', color: Colors.light.tint, textAlign: 'center' },
    period: { fontSize: 16, color: '#666', fontWeight: '500' },
    cancelAnytime: { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 4, marginBottom: 16 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
    
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    checkContainer: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
    featureText: { fontSize: 16, color: '#333', fontWeight: '500' },

    subscribeBtn: { backgroundColor: '#111', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
    subscribeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    currentPlanCard: {
        backgroundColor: '#ecfdf5',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10b981',
        marginBottom: 24,
    },
    currentPlanTitle: { fontSize: 20, fontWeight: 'bold', color: '#047857', marginBottom: 8 },
    currentPlanText: { fontSize: 14, color: '#065f46' },

    infoSection: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 16 },
    infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    infoText: { fontSize: 14, color: '#666', lineHeight: 22 },
});
