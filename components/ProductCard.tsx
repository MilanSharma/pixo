import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>${product.price}</Text>

        <View style={styles.brandContainer}>
          <Image
            source={{ uri: product.brandLogo }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName} numberOfLines={1}>
            {product.brandName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
    margin: 5,
    maxWidth: '47%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
  },
  content: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  brandName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});