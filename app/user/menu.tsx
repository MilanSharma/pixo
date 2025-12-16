import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { X, Crown, Wallet, Activity, ChevronRight, Zap, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

interface MenuItemProps {
  icon: any;
  label: string;
  route: string;
  color?: string;
  bgColor?: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const menuItems: MenuItemProps[] = [
    { icon: Crown, label: 'Subscription', route: '/user/subscription', color: '#b45309', bgColor: '#fef3c7' },
    { icon: Wallet, label: 'Wallet & Cards', route: '/user/wallet', color: '#000', bgColor: '#f3f4f6' },
    { icon: Zap, label: 'Creator Portal', route: '/user/creator', color: Colors.light.tint, bgColor: '#fff0f2' },
    { icon: Activity, label: 'Insights', route: '/user/insights' },
    
  ];

  const handleMenuPress = (route: string) => {
    router.back(); 
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
            <X size={24} color="#333" />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor || '#f9f9f9' }]}>
                  <item.icon size={22} color={item.color || '#333'} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color="#ccc" />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Logged in as {profile?.username}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#000' },
  closeBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 20 },
  grid: { gap: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { fontSize: 17, fontWeight: '600', color: '#111' },
  footer: { marginTop: 'auto', marginBottom: 40, alignItems: 'center' },
  footerText: { color: '#ccc', fontSize: 13 },
});
