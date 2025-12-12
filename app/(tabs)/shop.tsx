import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { Search, ShoppingBag, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_PRODUCTS } from '@/mocks/data';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const { count, total, items } = useCart();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = MOCK_PRODUCTS.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(MOCK_PRODUCTS);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredProducts(MOCK_PRODUCTS);
  };

  const handleSaleBannerPress = () => {
    Alert.alert('Summer Sale', 'Check out our special summer deals! Up to 50% off on selected items.');
  };

  const handleCartPress = () => {
    if (count === 0) {
      Alert.alert('Cart', 'Your shopping cart is empty');
    } else {
      const itemList = items.map(i => `${i.quantity}x ${i.title}`).join('\n');
      Alert.alert(
        'Your Cart',
        `${itemList}\n\nTotal: $${total.toFixed(2)}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Checkout', onPress: () => Alert.alert('Checkout', 'Proceeding to checkout...') }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <X size={16} color="#999" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleCartPress} style={styles.cartContainer}>
          <ShoppingBag size={24} color={Colors.light.text} />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={() => (
          <Pressable style={styles.banner} onPress={handleSaleBannerPress}>
             <Text style={styles.bannerTitle}>Summer Sale</Text>
             <Text style={styles.bannerSubtitle}>Up to 50% off</Text>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: Colors.light.text,
    fontSize: 15,
  },
  cartContainer: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  banner: {
    backgroundColor: Colors.light.yellow,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
