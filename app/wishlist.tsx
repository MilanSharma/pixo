import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useCart } from '@/context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, removeFromCart } = useCart();

  const handleBuy = async (url?: string) => {
      if (url) {
          await WebBrowser.openBrowserAsync(url);
      } else {
          Alert.alert("Error", "Link not available");
      }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {items.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your wishlist is empty.</Text>
                <Pressable onPress={() => router.back()} style={styles.shopBtn}>
                    <Text style={styles.shopBtnText}>Discover Products</Text>
                </Pressable>
            </View>
        ) : (
            items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                    <View style={styles.info}>
                        <Text style={styles.brand}>{item.brandName}</Text>
                        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.price}>${item.price}</Text>
                        
                        <View style={styles.actions}>
                            <Pressable 
                                style={styles.buyBtn} 
                                onPress={() => handleBuy(item.externalUrl || `https://google.com/search?q=${item.title}`)}
                            >
                                <Text style={styles.buyText}>Buy Now</Text>
                                <ExternalLink size={12} color="#fff" />
                            </Pressable>
                            
                            <Pressable style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                                <Trash2 size={20} color="#999" />
                            </Pressable>
                        </View>
                    </View>
                </View>
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  backButton: {
      padding: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 20 },
  emptyText: { fontSize: 16, color: '#888' },
  shopBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: Colors.light.tint, borderRadius: 24 },
  shopBtnText: { color: '#fff', fontWeight: 'bold' },
  
  itemCard: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  image: { width: 100, height: 120, backgroundColor: '#f5f5f5' },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  brand: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: Colors.light.tint },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  buyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeBtn: { padding: 8 },
});
