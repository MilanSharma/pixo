import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function FavoritesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Redirect to Me page Collects tab since favorites = collects
    useEffect(() => {
        // We can navigate to me tab with collects active
        // For now, just show a redirect message
    }, []);

    const handleGoToCollects = () => {
        router.replace('/(tabs)/me');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Favorites</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Star size={64} color={Colors.light.tint} fill={Colors.light.tint} />
                </View>
                <Text style={styles.title}>Your Favorites</Text>
                <Text style={styles.description}>
                    Your favorite posts are saved in your Collects. Tap below to view all your saved content.
                </Text>
                <Pressable style={styles.button} onPress={handleGoToCollects}>
                    <Text style={styles.buttonText}>Go to My Collects</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    button: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
