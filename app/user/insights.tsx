import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Eye, Heart, Users, TrendingUp, BarChart3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();

    // Mock data for insights
    const insights = {
        profileViews: 234,
        profileViewsChange: 12,
        totalLikes: profile?.likes_count || 0,
        likesChange: 8,
        followers: profile?.followers_count || 0,
        followersChange: 3,
        following: profile?.following_count || 0,
    };

    const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Icon size={20} color={color} />
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <Text style={styles.statValue}>{value.toLocaleString()}</Text>
            {change !== undefined && (
                <Text style={[styles.statChange, { color: change >= 0 ? '#22c55e' : '#ef4444' }]}>
                    {change >= 0 ? '+' : ''}{change}% this week
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Insights</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <Text style={styles.sectionSubtitle}>Last 7 days</Text>

                <View style={styles.statsGrid}>
                    <StatCard
                        icon={Eye}
                        label="Profile Views"
                        value={insights.profileViews}
                        change={insights.profileViewsChange}
                        color="#3b82f6"
                    />
                    <StatCard
                        icon={Heart}
                        label="Total Likes"
                        value={insights.totalLikes}
                        change={insights.likesChange}
                        color="#ef4444"
                    />
                    <StatCard
                        icon={Users}
                        label="Followers"
                        value={insights.followers}
                        change={insights.followersChange}
                        color="#22c55e"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Following"
                        value={insights.following}
                        color="#8b5cf6"
                    />
                </View>

                <Text style={styles.sectionTitle}>Engagement</Text>

                <View style={styles.chartPlaceholder}>
                    <BarChart3 size={48} color="#ddd" />
                    <Text style={styles.placeholderText}>Engagement chart</Text>
                    <Text style={styles.placeholderSubtext}>Post more to see detailed analytics</Text>
                </View>

                <View style={styles.tipCard}>
                    <Text style={styles.tipTitle}>💡 Tip</Text>
                    <Text style={styles.tipText}>
                        Post consistently to grow your audience. The best time to post is between 6-9 PM when your followers are most active.
                    </Text>
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginTop: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (width - 44) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111',
    },
    statChange: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    chartPlaceholder: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        marginTop: 12,
    },
    placeholderSubtext: {
        fontSize: 13,
        color: '#aaa',
        marginTop: 4,
    },
    tipCard: {
        backgroundColor: '#fef3c7',
        borderRadius: 16,
        padding: 16,
    },
    tipTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400e',
        marginBottom: 6,
    },
    tipText: {
        fontSize: 14,
        color: '#78350f',
        lineHeight: 20,
    },
});
