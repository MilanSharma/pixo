import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { X, QrCode, Wallet, Activity, Star, CreditCard, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

interface MenuItemProps {
  icon: any;
  label: string;
  route: string;
  color?: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const menuItems: MenuItemProps[] = [
    { icon: QrCode, label: 'My QR Code', route: '/user/qrcode' },
    { icon: Activity, label: 'Insights', route: '/user/insights' },
    { icon: Wallet, label: 'Wallet', route: '/user/wallet' },
    { icon: Star, label: 'Favorites', route: '/user/favorites' },
    { icon: CreditCard, label: 'Orders', route: '/user/orders' },
  ];

  const handleMenuPress = (route: string) => {
    router.back(); // Close the modal first
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
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
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
                <View style={styles.iconContainer}>
                  <item.icon size={22} color={Colors.light.tint} />
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
