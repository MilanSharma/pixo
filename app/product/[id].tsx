import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Share, Platform, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Share as ShareIcon, Heart, ShoppingBag, ExternalLink, BarChart2, Flag, ShieldCheck, Zap } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_PRODUCTS } from '@/mocks/data';
import { Product } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { getProductById, trackProductClick, boostProduct, reportContent, getVerifiedStatus } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';
import { PaymentModal } from '@/components/PaymentModal';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const productId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart } = useCart();
    const { user } = useAuth();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [clicks, setClicks] = useState(0); 
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadProduct();
    }, [productId]);

    useEffect(() => {
        if (product && productId) {
            setIsSaved(isInCart(productId));
        }
    }, [product, productId, isInCart]);

    const loadProduct = async () => {
        if (!productId) return;
        setLoading(true);

        try {
            if (UUID_REGEX.test(productId)) {
                // Fetch from DB
                const data = await getProductById(productId);
                if (data) {
                    setProduct({
                        id: data.id,
                        brandId: data.brand_id || 'unknown',
                        title: data.title,
                        price: data.price,
                        image: data.image_url || data.image || 'https://via.placeholder.com/300',
                        description: data.description || '',
                        brandName: data.brand_name || 'Generic',
                        brandLogo: data.brand_logo || '',
                        externalUrl: data.external_url,
                        userId: data.user_id 
                    });
                    setClicks(data.clicks || 0);
                    
                    // Check if seller is verified
                    if (data.user_id) {
                        const verified = await getVerifiedStatus(data.user_id);
                        setIsVerifiedSeller(verified);
                    }
                }
            } else {
                // Fetch from Mocks
                const found = MOCK_PRODUCTS.find(p => p.id === productId);
                if (found) setProduct(found);
            }
        } catch (error) {
            console.error(error);
            const found = MOCK_PRODUCTS.find(p => p.id === productId);
            if (found) setProduct(found);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/shop');
        }
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            setIsSaved(true);
            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
            ]).start();
        }
    };

    const handleBuyNow = async () => {
        if (productId && UUID_REGEX.test(productId)) {
            trackProductClick(productId);
        }

        const url = product?.externalUrl;
        if (url && url.startsWith('http')) {
            await WebBrowser.openBrowserAsync(url);
        } else {
            const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(product?.title || '')}`;
            await WebBrowser.openBrowserAsync(searchUrl);
        }
    };

    const handleShare = async () => {
        if (!product) return;
        try {
            const message = `Check out this ${product.title} on Pixo! - $${product.price}`;
            const url = product.image; 
            
            await Share.share({
                message: Platform.OS === 'ios' ? message : `${message} ${url}`,
                url: Platform.OS === 'ios' ? url : undefined,
                title: 'Share Product'
            });
        } catch (error) {
            // Ignored
        }
    };

    const handleSave = () => {
        if (!isSaved) {
            handleAddToCart();
        } else {
            setIsSaved(false);
        }
    };

    const handleGoToShop = () => {
        router.replace('/(tabs)/shop');
    };

    const handleReport = () => {
        if (!user) {
            Alert.alert('Sign In', 'Please sign in to report content.');
            return;
        }
        
        Alert.alert(
            'Report Product',
            'Why are you reporting this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Scam / Fake', onPress: () => submitReport('scam') },
                { text: 'Inappropriate', onPress: () => submitReport('inappropriate') },
                { text: 'Broken Link', onPress: () => submitReport('broken_link') },
            ]
        );
    };

    const submitReport = async (reason: string) => {
        try {
            if (product && user) {
                await reportContent(user.id, product.id, 'product', reason);
                Alert.alert('Report Sent', 'Thank you for helping keep Pixo safe.');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not send report. Please try again.');
        }
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

    const isOwner = user && product.userId === user.id;
    const handleBoost = () => {
        setShowPayment(true);
    };

    const processBoost = async () => {
        if(!user || !product) return;
        setLoading(true);
        try {
            await boostProduct(user.id, product.id);
            Alert.alert("Success", "Your post is now promoted!");
        } catch(e) {
            Alert.alert("Error", "Payment failed or insufficient funds.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" />
                    <Pressable style={[styles.iconButton, styles.backIcon, { top: insets.top + 10 }]} onPress={handleBack}>
                        <ArrowLeft size={24} color="#000" />
                    </Pressable>
                    <Pressable 
                        style={[styles.iconButton, styles.shareIcon, { top: insets.top + 10 }]} 
                        onPress={handleShare}
                    >
                        <ShareIcon size={24} color="#000" />
                    </Pressable>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <View>
                            <View style={styles.priceRow}>
                                <Text style={styles.price}>${product.price}</Text>
                            </View>
                            <Text style={styles.title}>{product.title}</Text>
                        </View>
                        
{isOwner && (
                            <View style={{flexDirection:'row', gap:8}}>
                                <View style={styles.analyticsBadge}>
                                    <BarChart2 size={16} color={Colors.light.tint} />
                                    <Text style={styles.analyticsText}>{clicks} clicks</Text>
                                </View>
                                <Pressable style={[styles.analyticsBadge, {backgroundColor: '#fef9c3'}]} onPress={handleBoost}>
                                    <Zap size={16} color="#ca8a04" />
                                    <Text style={[styles.analyticsText, {color: '#ca8a04'}]}>Boost</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    <View style={styles.brandRow}>
                        <View style={styles.brandContainer}>
                            {product.brandLogo ? <Image source={{ uri: product.brandLogo }} style={styles.brandLogo} /> : null}
                            <Text style={styles.brandName}>{product.brandName || 'Brand'}</Text>
                            {isVerifiedSeller && <ShieldCheck size={16} color={Colors.light.tint} style={{marginLeft: 4}} />}
                        </View>
                        
                        <Pressable onPress={handleReport} style={styles.reportBtn}>
                            <Flag size={16} color="#999" />
                            <Text style={styles.reportText}>Report</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <Text style={styles.sectionTitle}>Delivery</Text>
                    <Text style={styles.deliveryText}>Free delivery on orders over $50. Estimated delivery: 3-5 business days.</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.iconActions}>
                    <Pressable style={styles.footerIcon} onPress={handleGoToShop}>
                        <ShoppingBag size={24} color={Colors.light.text} />
                        <Text style={styles.footerIconText}>Shop</Text>
                    </Pressable>
                    <Pressable style={styles.footerIcon} onPress={handleSave}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Heart size={24} color={isSaved ? Colors.light.tint : Colors.light.text} fill={isSaved ? Colors.light.tint : 'none'} />
                        </Animated.View>
                        <Text style={styles.footerIconText}>Save</Text>
                    </Pressable>
                </View>
                <View style={styles.buttonActions}>
                    <Pressable style={styles.cartButton} onPress={handleAddToCart}>
                        <Text style={styles.cartButtonText}>{isSaved ? 'Saved' : 'Save to Wishlist'}</Text>
                    </Pressable>
                    <Pressable style={styles.buyButton} onPress={handleBuyNow}>
                        <Text style={styles.buyButtonText}>Buy on Store</Text>
                        <ExternalLink size={14} color="#fff" />
                    </Pressable>
                </View>
            </View>
            <PaymentModal 
                visible={showPayment} 
                onClose={() => setShowPayment(false)}
                onPay={processBoost}
                amount={5.00}
                title="Boost Post"
                description="Promote this product for 7 days"
            />
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    analyticsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff0f2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    analyticsText: {
        color: Colors.light.tint,
        fontWeight: 'bold',
        fontSize: 14,
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
        maxWidth: 250,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    reportText: {
        fontSize: 12,
        color: '#999',
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
        zIndex: 100, 
        elevation: 10,
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
        flexDirection: 'row',
        gap: 6,
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
