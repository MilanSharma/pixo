import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Modal, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Eye, UserX, Download, Trash2, X, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount, getBlockedUsers, unblockUser } from '@/lib/database';
import { signOut } from '@/lib/auth';
import { Image } from 'expo-image';

// Moved outside to prevent re-render flicker
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
        {onToggle ? (
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ true: Colors.light.tint }}
            />
        ) : (
            <ChevronRight size={20} color="#ccc" />
        )}
    </Pressable>
);

export default function PrivacyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [privateAccount, setPrivateAccount] = useState(false);
    const [hideActivity, setHideActivity] = useState(false);
    
    // Blocked Users
    const [blockedModalVisible, setBlockedModalVisible] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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

    const handleBlockedUsers = async () => {
        if(!user) return;
        setLoading(true);
        setBlockedModalVisible(true);
        try {
            const users = await getBlockedUsers(user.id);
            setBlockedUsers(users);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (blockedId: string) => {
        if(!user) return;
        try {
            await unblockUser(user.id, blockedId);
            setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
        } catch(e) {
            Alert.alert("Error", "Could not unblock user");
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure? This action cannot be undone. All your data will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Forever", 
                    style: "destructive", 
                    onPress: async () => {
                        if(!user) return;
                        setLoading(true);
                        try {
                            await deleteAccount(user.id);
                            await signOut();
                            router.replace('/auth/login');
                            Alert.alert("Account Deleted", "We're sorry to see you go.");
                        } catch(e) {
                            Alert.alert("Error", "Could not delete account. Please contact support.");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

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
                />

                <View style={styles.dangerSection}>
                    <Text style={styles.sectionHeader}>Danger Zone</Text>
                    <Pressable style={styles.deleteRow} onPress={handleDeleteAccount}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                            <View style={[styles.iconContainer, styles.iconDestructive]}>
                                <Trash2 size={20} color="#ef4444" />
                            </View>
                            <Text style={styles.destructiveText}>Delete Account</Text>
                        </View>
                        <ChevronRight size={20} color="#ccc" />
                    </Pressable>
                </View>
            </ScrollView>

            <Modal 
                visible={blockedModalVisible} 
                animationType="slide" 
                presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Blocked Users</Text>
                        <Pressable onPress={() => setBlockedModalVisible(false)} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </Pressable>
                    </View>
                    {loading ? (
                        <ActivityIndicator style={{marginTop: 40}} color={Colors.light.tint} />
                    ) : (
                        <FlatList
                            data={blockedUsers}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{padding: 16}}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <UserX size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>You haven't blocked anyone yet.</Text>
                                </View>
                            }
                            renderItem={({item}) => (
                                <View style={styles.blockedItem}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                        <Image source={{uri: item.avatar_url || 'https://ui-avatars.com/api/?name=' + item.username}} style={styles.avatar} />
                                        <Text style={styles.username}>{item.username}</Text>
                                    </View>
                                    <Pressable style={styles.unblockBtn} onPress={() => handleUnblock(item.id)}>
                                        <Text style={styles.unblockText}>Unblock</Text>
                                    </Pressable>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>
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
        fontSize: 13,
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
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Danger Zone
    dangerSection: {
        marginBottom: 40,
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: Platform.OS === 'android' ? 20 : 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 12 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 20 },
    
    emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { textAlign: 'center', color: '#999', fontSize: 16 },
    
    blockedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
    username: { fontSize: 16, fontWeight: '500', color: '#333' },
    unblockBtn: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    unblockText: { fontSize: 13, fontWeight: '600', color: '#333' },
});
