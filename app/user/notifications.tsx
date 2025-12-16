import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Bell, Mail, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

interface NotificationSettings {
    pushEnabled: boolean;
    likes: boolean;
    comments: boolean;
    followers: boolean;
    messages: boolean;
    trending: boolean;
}

const defaultSettings: NotificationSettings = {
    pushEnabled: true,
    likes: true,
    comments: true,
    followers: true,
    messages: true,
    trending: false,
};

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
            if (data) {
                setSettings({ ...defaultSettings, ...JSON.parse(data) });
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    };

    const NotificationRow = ({ icon: Icon, label, description, settingKey }: {
        icon: any;
        label: string;
        description: string;
        settingKey: keyof NotificationSettings;
    }) => (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Icon size={20} color={Colors.light.tint} />
                </View>
                <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>{label}</Text>
                    <Text style={styles.settingDescription}>{description}</Text>
                </View>
            </View>
            <Switch
                value={settings[settingKey]}
                onValueChange={(value) => updateSetting(settingKey, value)}
                trackColor={{ true: Colors.light.tint }}
            />
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionHeader}>General</Text>

                <NotificationRow
                    icon={Bell}
                    label="Push Notifications"
                    description="Enable or disable all notifications"
                    settingKey="pushEnabled"
                />

                <Text style={styles.sectionHeader}>Activity</Text>

                <NotificationRow
                    icon={Heart}
                    label="Likes"
                    description="When someone likes your post"
                    settingKey="likes"
                />

                <NotificationRow
                    icon={MessageCircle}
                    label="Comments"
                    description="When someone comments on your post"
                    settingKey="comments"
                />

                <NotificationRow
                    icon={UserPlus}
                    label="New Followers"
                    description="When someone follows you"
                    settingKey="followers"
                />

                <Text style={styles.sectionHeader}>Messages</Text>

                <NotificationRow
                    icon={Mail}
                    label="Direct Messages"
                    description="When you receive a new message"
                    settingKey="messages"
                />

                <Text style={styles.sectionHeader}>Discover</Text>

                <NotificationRow
                    icon={TrendingUp}
                    label="Trending Posts"
                    description="Popular content you might like"
                    settingKey="trending"
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
});
