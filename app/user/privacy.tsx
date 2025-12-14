import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Eye, UserX, Download, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [privateAccount, setPrivateAccount] = useState(false);
    const [hideActivity, setHideActivity] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const privacyData = await AsyncStorage.getItem('privacy_settings');
            if (privacyData) {
                const settings = JSON.parse(privacyData);
                setPrivateAccount(settings.privateAccount || false);
                setHideActivity(settings.hideActivity || false);
            }
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        }
    };

    const saveSettings = async (key: string, value: boolean) => {
        try {
            const currentData = await AsyncStorage.getItem('privacy_settings');
            const settings = currentData ? JSON.parse(currentData) : {};
            settings[key] = value;
            await AsyncStorage.setItem('privacy_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving privacy settings:', error);
        }
    };

    const handlePrivateToggle = (value: boolean) => {
        setPrivateAccount(value);
        saveSettings('privateAccount', value);
    };

    const handleActivityToggle = (value: boolean) => {
        setHideActivity(value);
        saveSettings('hideActivity', value);
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear cached images and data. The app may load slower temporarily.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => Alert.alert('Success', 'Cache cleared successfully')
                }
            ]
        );
    };

    const handleDownloadData = () => {
        Alert.alert(
            'Download Your Data',
            'We\'ll prepare a copy of your data and send it to your email within 24 hours.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Request', onPress: () => Alert.alert('Success', 'Data request submitted! Check your email.') }
            ]
        );
    };

    const handleBlockedUsers = () => {
        Alert.alert('Blocked Users', 'You haven\'t blocked any users yet.');
    };

    const SettingRow = ({ icon: Icon, label, description, value, onToggle, onPress, isDestructive }: any) => (
        <Pressable
            style={styles.settingRow}
            onPress={onPress}
            disabled={!!onToggle}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, isDestructive && styles.iconDestructive]}>
                    <Icon size={20} color={isDestructive ? '#ef4444' : Colors.light.tint} />
                </View>
                <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, isDestructive && styles.destructiveText]}>{label}</Text>
                    {description && <Text style={styles.settingDescription}>{description}</Text>}
                </View>
            </View>
            {onToggle && (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ true: Colors.light.tint }}
                />
            )}
        </Pressable>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Privacy & Security</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionHeader}>Account Privacy</Text>

                <SettingRow
                    icon={Eye}
                    label="Private Account"
                    description="Only approved followers can see your posts"
                    value={privateAccount}
                    onToggle={handlePrivateToggle}
                />

                <SettingRow
                    icon={Shield}
                    label="Hide Activity Status"
                    description="Others won't see when you're active"
                    value={hideActivity}
                    onToggle={handleActivityToggle}
                />

                <SettingRow
                    icon={UserX}
                    label="Blocked Users"
                    description="Manage users you've blocked"
                    onPress={handleBlockedUsers}
                />

                <Text style={styles.sectionHeader}>Data & Storage</Text>

                <SettingRow
                    icon={Download}
                    label="Download Your Data"
                    description="Get a copy of your Pixo data"
                    onPress={handleDownloadData}
                />

                <SettingRow
                    icon={Trash2}
                    label="Clear Cache"
                    description="Free up storage space"
                    onPress={handleClearCache}
                    isDestructive
                />
            </ScrollView>
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
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconDestructive: {
        backgroundColor: '#fef2f2',
    },
    settingText: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    settingDescription: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    destructiveText: {
        color: '#ef4444',
    },
});
