import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert, ActivityIndicator, Animated } from 'react-native';
import { Search, Heart, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_PRODUCTS } from '@/mocks/data';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getProducts } from '@/lib/database';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { count } = useCart();
  
  // Animation value for the heart icon
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Trigger animation when count increases
  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
          speed: 50,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
        }),
      ]).start();
    }
  }, [count]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      
      if (data && data.length > 0) {
        // Map DB columns to Product type
        const mappedProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          brandId: p.brand_id || 'unknown',
          title: p.title,
          price: p.price,
          image: p.image_url || p.image || 'https://via.placeholder.com/300', 
          description: p.description || '',
          brandName: p.brand_name || 'Generic',
          brandLogo: p.brand_logo || '',
          externalUrl: p.external_url
        }));
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      } else {
        setProducts(MOCK_PRODUCTS);
        setFilteredProducts(MOCK_PRODUCTS);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts(MOCK_PRODUCTS);
      setFilteredProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = products.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredProducts(products);
  };

  const handleSaleBannerPress = () => {
    Alert.alert('Summer Sale', 'Check out our special summer deals! Up to 50% off on selected items.');
  };

  const handleWishlistPress = () => {
    router.push('/wishlist');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

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
        <Pressable onPress={handleWishlistPress} style={styles.cartContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart size={24} color={Colors.light.text} fill={count > 0 ? Colors.light.tint : 'transparent'} stroke={count > 0 ? Colors.light.tint : Colors.light.text} />
          </Animated.View>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
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
