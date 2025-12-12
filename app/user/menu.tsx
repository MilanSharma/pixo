import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { X, QrCode, Wallet, Activity, Star, CreditCard } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const MenuItem = ({ icon: Icon, label, color = '#333' }: any) => (
    <Pressable style={styles.menuItem} onPress={() => {}}>
      <Icon size={24} color={color} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                <X size={24} color="#333" />
            </Pressable>
        </View>

        <View style={styles.grid}>
            <MenuItem icon={QrCode} label="My QR Code" />
            <MenuItem icon={Activity} label="Insights" />
            <MenuItem icon={Wallet} label="Wallet" />
            <MenuItem icon={Star} label="Favorites" />
            <MenuItem icon={CreditCard} label="Orders" />
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Logged in as {profile?.username}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  grid: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 16,
  },
  menuLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 14,
  },
});
