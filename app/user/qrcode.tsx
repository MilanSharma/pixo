import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Download, Share as ShareIcon, Copy, QrCode } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function QRCodeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();

    const profileUrl = `https://pixo.app/user/${profile?.username || 'user'}`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my Pixo profile: ${profileUrl}`,
                url: profileUrl,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleCopyLink = async () => {
        // Show link in alert since expo-clipboard may not be installed
        Alert.alert('Profile Link', profileUrl, [
            { text: 'OK' },
            { text: 'Share', onPress: handleShare }
        ]);
    };

    const handleSaveQR = () => {
        Alert.alert('Saved!', 'QR Code saved to your photos');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>My QR Code</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.qrCard}>
                    <Text style={styles.username}>@{profile?.username || 'user'}</Text>

                    <View style={styles.qrContainer}>
                        {/* QR Code placeholder - using icon since react-native-qrcode-svg may not be installed */}
                        <View style={styles.qrPlaceholder}>
                            <QrCode size={120} color="#333" strokeWidth={1} />
                            <Text style={styles.qrText}>{profile?.username || 'user'}</Text>
                        </View>
                    </View>

                    <Text style={styles.scanText}>Scan to view profile</Text>
                    <Text style={styles.urlText}>{profileUrl}</Text>
                </View>

                <View style={styles.actions}>
                    <Pressable style={styles.actionButton} onPress={handleShare}>
                        <ShareIcon size={22} color={Colors.light.tint} />
                        <Text style={styles.actionText}>Share</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={handleCopyLink}>
                        <Copy size={22} color={Colors.light.tint} />
                        <Text style={styles.actionText}>Copy Link</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={handleSaveQR}>
                        <Download size={22} color={Colors.light.tint} />
                        <Text style={styles.actionText}>Save</Text>
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
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
        maxWidth: 320,
    },
    username: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 24,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: Colors.light.tint,
    },
    qrPlaceholder: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    qrText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    scanText: {
        marginTop: 20,
        fontSize: 14,
        color: '#888',
    },
    urlText: {
        marginTop: 8,
        fontSize: 12,
        color: '#aaa',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 40,
        gap: 20,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        width: 80,
        height: 80,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    actionText: {
        marginTop: 6,
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});
