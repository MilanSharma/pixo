import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { ArrowLeft, Bell, Lock, HelpCircle, FileText, LogOut, ChevronRight, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error(error);
    }
  };

  const SettingItem = ({ icon: Icon, label, onPress, value, isSwitch }: any) => (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Icon size={22} color="#444" />
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch value={value} onValueChange={onPress} trackColor={{ true: Colors.light.tint }} />
      ) : (
        <ChevronRight size={20} color="#ccc" />
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>Account</Text>
        <SettingItem icon={Lock} label="Privacy & Security" onPress={() => router.push('/user/privacy')} />
        <SettingItem icon={Bell} label="Notifications" onPress={() => router.push('/user/notifications')} />
        <SettingItem icon={Moon} label="Dark Mode" isSwitch value={false} onPress={() => Alert.alert('Dark Mode', 'Dark mode will be available in a future update.')} />

        <Text style={styles.sectionHeader}>Support</Text>
        <SettingItem icon={HelpCircle} label="Help Center" onPress={() => router.push('/user/help')} />
        <SettingItem icon={FileText} label="Terms of Service" onPress={() => router.push('/user/terms')} />
        <SettingItem icon={FileText} label="Privacy Policy" onPress={() => WebBrowser.openBrowserAsync('https://pixo.com/privacy')} />

        <View style={styles.spacer} />

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.light.tint} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: '#333',
  },
  spacer: {
    height: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#FFF0F1',
    borderRadius: 12,
  },
  logoutText: {
    color: Colors.light.tint,
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
