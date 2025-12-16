import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Clipboard, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Copy, Users, DollarSign, Award } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getMyReferralCode, getReferralCount } from '@/lib/database';

export default function CreatorPortalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState<any>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            const data = await getMyReferralCode(user.id);
            if (data) {
                setReferralData(data);
                const c = await getReferralCount(data.code);
                setCount(c);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (referralData?.code) {
            Clipboard.setString(referralData.code);
            Alert.alert("Copied", "Referral code copied to clipboard!");
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    if (!referralData) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Creator Portal</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyState}>
                    <Award size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Become a Creator</Text>
                    <Text style={styles.emptyText}>
                        You are not part of the partner program yet. Contact us to get your unique referral code and start earning.
                    </Text>
                    <Pressable style={styles.contactBtn} onPress={() => router.push('/user/help')}>
                        <Text style={styles.contactBtnText}>Contact Support</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // Mock Earnings Calculation (e.g., $5 per user)
    const earnings = count * 5;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Creator Dashboard</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardLabel}>Your Referral Code</Text>
                <Pressable style={styles.codeBox} onPress={copyCode}>
                    <Text style={styles.codeText}>{referralData.code}</Text>
                    <Copy size={20} color={Colors.light.tint} />
                </Pressable>
                <Text style={styles.hint}>Share this code with your followers to track signups.</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                        <Users size={24} color="#0284c7" />
                    </View>
                    <Text style={styles.statValue}>{count}</Text>
                    <Text style={styles.statLabel}>Total Signups</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                        <DollarSign size={24} color="#16a34a" />
                    </View>
                    <Text style={styles.statValue}>${earnings}</Text>
                    <Text style={styles.statLabel}>Est. Earnings</Text>
                </View>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Program Status: Active ✅</Text>
                <Text style={styles.infoText}>
                    You earn $5 for every active user who lists at least 3 products. Payouts are processed monthly via PayPal.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    
    card: { backgroundColor: '#fff', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardLabel: { fontSize: 14, color: '#666', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    codeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff0f2', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ffdce0' },
    codeText: { fontSize: 24, fontWeight: '800', color: Colors.light.tint, letterSpacing: 2 },
    hint: { marginTop: 16, fontSize: 13, color: '#999', textAlign: 'center' },

    statsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 28, fontWeight: 'bold', color: '#111' },
    statLabel: { fontSize: 13, color: '#666', marginTop: 4 },

    infoBox: { margin: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16 },
    infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    infoText: { fontSize: 14, color: '#555', lineHeight: 22 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    emptyText: { textAlign: 'center', color: '#666', lineHeight: 22, marginBottom: 30 },
    contactBtn: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
    contactBtnText: { color: '#fff', fontWeight: '600' }
});
