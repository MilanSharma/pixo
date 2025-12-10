import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Search, ShoppingBag } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_PRODUCTS } from '@/mocks/data';
import { ProductCard } from '@/components/ProductCard';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color="#999" />
          <Text style={styles.searchText}>Search products</Text>
        </View>
        <ShoppingBag size={24} color={Colors.light.text} />
      </View>

      <FlatList
        data={MOCK_PRODUCTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={() => (
          <View style={styles.banner}>
             <Text style={styles.bannerTitle}>Summer Sale</Text>
             <Text style={styles.bannerSubtitle}>Up to 50% off</Text>
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
  searchText: {
    color: '#999',
    fontSize: 15,
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
});
