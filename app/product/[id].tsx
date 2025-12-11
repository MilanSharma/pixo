import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Share, Heart, ShoppingBag } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_PRODUCTS } from '@/mocks/data';
import { Product } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const found = MOCK_PRODUCTS.find(p => p.id === id);
            if (found) {
                setProduct(found);
            }
            setLoading(false);
        }
    }, [id]);

    const handleBack = () => {
        router.back();
    };

    const handleBuy = () => {
        Alert.alert('Success', 'Added to cart!');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Text>Product not found</Text>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" />
                    <Pressable style={[styles.iconButton, styles.backIcon, { top: insets.top + 10 }]} onPress={handleBack}>
                        <ArrowLeft size={24} color="#000" />
                    </Pressable>
                    <Pressable style={[styles.iconButton, styles.shareIcon, { top: insets.top + 10 }]}>
                        <Share size={24} color="#000" />
                    </Pressable>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>${product.price}</Text>
                    </View>

                    <Text style={styles.title}>{product.title}</Text>

                    <View style={styles.brandContainer}>
                        {product.brandLogo && <Image source={{ uri: product.brandLogo }} style={styles.brandLogo} />}
                        <Text style={styles.brandName}>{product.brandName}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <Text style={styles.sectionTitle}>Delivery</Text>
                    <Text style={styles.deliveryText}>Free delivery on orders over $50. Estimated delivery: 3-5 business days.</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.iconActions}>
                    <Pressable style={styles.footerIcon}>
                        <ShoppingBag size={24} color={Colors.light.text} />
                        <Text style={styles.footerIconText}>Shop</Text>
                    </Pressable>
                    <Pressable style={styles.footerIcon}>
                        <Heart size={24} color={Colors.light.text} />
                        <Text style={styles.footerIconText}>Save</Text>
                    </Pressable>
                </View>
                <View style={styles.buttonActions}>
                    <Pressable style={styles.cartButton} onPress={handleBuy}>
                        <Text style={styles.cartButtonText}>Add to Cart</Text>
                    </Pressable>
                    <Pressable style={styles.buyButton} onPress={handleBuy}>
                        <Text style={styles.buyButtonText}>Buy Now</Text>
                    </Pressable>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    imageContainer: {
        width: '100%',
        height: 450,
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    iconButton: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backIcon: {
        left: 20,
    },
    shareIcon: {
        right: 20,
    },
    contentContainer: {
        padding: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
        lineHeight: 28,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    brandLogo: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    brandName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
        marginBottom: 24,
    },
    deliveryText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    iconActions: {
        flexDirection: 'row',
        gap: 20,
        marginRight: 20,
    },
    footerIcon: {
        alignItems: 'center',
        gap: 4,
    },
    footerIconText: {
        fontSize: 10,
        color: '#666',
    },
    buttonActions: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
    },
    cartButton: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartButtonText: {
        color: Colors.light.tint,
        fontWeight: '600',
        fontSize: 14,
    },
    buyButton: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#000',
        borderRadius: 5,
    },
    backButtonText: {
        color: '#fff',
    }
});
