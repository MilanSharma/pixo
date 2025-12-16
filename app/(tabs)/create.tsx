import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal, PanResponder, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, X, SlidersHorizontal, Tag, Search, Check, Play, Film, ShoppingBag, Link, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleImages, uploadImage } from '@/lib/storage';
import { createNote, getProducts, createProduct, searchProducts } from '@/lib/database';
import { Product } from '@/types';

const ITEM_WIDTH = 120;

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  duration?: number;
}

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [createMode, setCreateMode] = useState<'story' | 'product'>('story');
  
  // --- STORY STATE ---
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descHeight, setDescHeight] = useState(160);
  const [location, setLocation] = useState('');
  const [productTags, setProductTags] = useState<string[]>([]);
  
  // --- PRODUCT STATE ---
  const [prodImage, setProdImage] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodLink, setProdLink] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // --- SHARED ---
  const [isPublishing, setIsPublishing] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorTab, setEditorTab] = useState<'Crop' | 'Filter' | 'Tags'>('Crop');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  
  // Product Tagging State
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadInitialProducts();
  }, []);

  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (productQuery.trim().length > 2) {
              performSearch(productQuery);
          } else if (productQuery.trim().length === 0) {
              loadInitialProducts();
          }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [productQuery]);

  const loadInitialProducts = async () => {
    try {
      const data = await getProducts(20); 
      if (data) {
        setSearchResults(mapProducts(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const performSearch = async (query: string) => {
      setIsSearching(true);
      try {
          const data = await searchProducts(query);
          if (data) {
              setSearchResults(mapProducts(data));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearching(false);
      }
  };

  const mapProducts = (data: any[]): Product[] => {
      return data.map((p: any) => ({
          id: p.id,
          brandId: 'unknown',
          title: p.title,
          price: p.price,
          image: p.image,
          description: p.description,
          brandName: p.brand_name,
          brandLogo: p.brand_logo,
          externalUrl: p.external_url
      }));
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => draggingIndex !== null,
    onPanResponderMove: (_, gesture) => {
      if (draggingIndex === null) return;
      const targetIndex = Math.min(media.length - 1, Math.max(0, Math.floor(gesture.moveX / ITEM_WIDTH)));
      if (targetIndex !== draggingIndex) {
        const updated = [...media];
        const [moved] = updated.splice(draggingIndex, 1);
        updated.splice(targetIndex, 0, moved);
        setMedia(updated);
        setDraggingIndex(targetIndex);
      }
    },
    onPanResponderRelease: () => setDraggingIndex(null),
    onPanResponderTerminate: () => setDraggingIndex(null),
  }), [draggingIndex, media]);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'livePhotos'],
        allowsMultipleSelection: true,
        selectionLimit: 9 - media.length,
        quality: 1,
        videoMaxDuration: 60, 
      });

      if (!result.canceled) {
        const newItems: MediaItem[] = result.assets.map(a => ({
          uri: a.uri,
          type: a.type === 'video' ? 'video' : 'image',
          duration: a.duration
        }));
        setMedia(prev => [...prev, ...newItems].slice(0, 9));
      }
    } catch (e: any) {
      Alert.alert('Error picking media', e.message);
    }
  };

  const pickProductImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProdImage(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error picking image', e.message);
    }
  };

  const removeMedia = (index: number) => {
    const updated = [...media];
    updated.splice(index, 1);
    setMedia(updated);
  };

  const openEditor = () => {
    if (media.length === 0) {
      Alert.alert('Add media first');
      return;
    }
    setEditorVisible(true);
  };

  const handlePublish = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (createMode === 'story') {
        await publishStory();
    } else {
        await publishProduct();
    }
  };

  const publishStory = async () => {
    if (media.length === 0) {
      Alert.alert('Error', 'Please add at least one photo or video');
      return;
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length === 0) {
      Alert.alert('Error', 'Please add a title to your note');
      return;
    }

    setIsPublishing(true);
    try {
      const uploadFiles = media.map((item, index) => {
        const ext = item.uri.split('.').pop()?.toLowerCase() || (item.type === 'video' ? 'mp4' : 'jpg');
        return {
          uri: item.uri,
          filename: `file_${index}.${ext}`
        };
      });

      const uploadedUrls = await uploadMultipleImages(user!.id, uploadFiles);

      await createNote(user!.id, {
        title: cleanTitle,
        content: description.trim(),
        images: uploadedUrls,
        location: location.trim() || undefined,
        productTags,
      });

      Alert.alert('Success', 'Your story has been published!', [
        { text: 'OK', onPress: resetForm }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to publish story');
    } finally {
      setIsPublishing(false);
    }
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    const lowerUrl = url.toLowerCase();
    // Allow any HTTP/HTTPS link for now (Relaxed for testing)
    return lowerUrl.startsWith('http');
  };

  const publishProduct = async () => {
      if (!prodImage) {
          Alert.alert('Error', 'Please add a product image');
          return;
      }
      if (!prodTitle.trim() || !prodPrice.trim()) {
          Alert.alert('Error', 'Title and Price are required');
          return;
      }
      if (prodLink.trim() && !isValidUrl(prodLink.trim())) {
          Alert.alert(
              'Invalid Link', 
              'Please enter a valid URL starting with http:// or https://'
          );
          return;
      }

      setIsPublishing(true);
      try {
          const imageUrl = await uploadImage(user!.id, prodImage, `prod_${Date.now()}.jpg`);
          
          await createProduct(user!.id, {
              title: prodTitle.trim(),
              description: prodDesc.trim(),
              price: parseFloat(prodPrice),
              image: imageUrl,
              brandName: prodBrand.trim(),
              externalUrl: prodLink.trim() || undefined,
          });

          Alert.alert('Success', 'Product added successfully!', [
              { text: 'OK', onPress: resetForm }
          ]);
      } catch (error: any) {
          console.error(error);
          Alert.alert('Error', error.message || 'Failed to add product');
      } finally {
          setIsPublishing(false);
      }
  };

  const resetForm = () => {
      setMedia([]);
      setTitle('');
      setDescription('');
      setLocation('');
      setProductTags([]);
      
      setProdImage(null);
      setProdTitle('');
      setProdPrice('');
      setProdBrand('');
      setProdLink('');
      setProdDesc('');
      
      if (createMode === 'story') {
          router.replace('/(tabs)/');
      } else {
          router.replace('/(tabs)/shop');
      }
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.authContainer, { paddingTop: insets.top }]}>
        <Camera size={64} color="#ccc" />
        <Text style={styles.authTitle}>Create Your First Note</Text>
        <Text style={styles.authSubtitle}>Sign in to share your moments with the world</Text>
        <Pressable style={styles.authButton} onPress={() => router.push('/auth/login')}>
          <Text style={styles.authButtonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.tabSwitch}>
            <Pressable 
                style={[styles.tabBtn, createMode === 'story' && styles.tabBtnActive]} 
                onPress={() => setCreateMode('story')}
            >
                <Text style={[styles.tabBtnText, createMode === 'story' && styles.tabBtnTextActive]}>Story</Text>
            </Pressable>
            <Pressable 
                style={[styles.tabBtn, createMode === 'product' && styles.tabBtnActive]} 
                onPress={() => setCreateMode('product')}
            >
                <Text style={[styles.tabBtnText, createMode === 'product' && styles.tabBtnTextActive]}>Product</Text>
            </Pressable>
        </View>
        <Pressable
          onPress={handlePublish}
          disabled={isPublishing}
          style={[styles.publishButton, isPublishing && styles.disabledButton]}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishText}>{createMode === 'story' ? 'Publish' : 'Add'}</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {createMode === 'story' ? (
            <>
                <View style={styles.mediaRow} {...(draggingIndex !== null ? panResponder.panHandlers : {})}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaContainer}>
                    {media.map((item, index) => (
                    <Pressable
                        key={item.uri + index}
                        style={[styles.imagePreview, draggingIndex === index && styles.dragging]}
                        onLongPress={() => setDraggingIndex(index)}
                    >
                        <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                        {item.type === 'video' && (
                        <View style={styles.videoBadge}>
                            <Play size={12} color="#fff" fill="#fff" />
                        </View>
                        )}
                        <Pressable style={styles.removeButton} onPress={() => removeMedia(index)}>
                        <X size={12} color="#fff" />
                        </Pressable>
                    </Pressable>
                    ))}
                    {media.length < 9 && (
                    <Pressable style={styles.addMediaButton} onPress={pickMedia}>
                        <View style={styles.addIconRow}>
                        <Camera size={24} color="#555" />
                        <Film size={24} color="#555" />
                        </View>
                        <Text style={styles.addMediaText}>Add Photos/Videos</Text>
                    </Pressable>
                    )}
                </ScrollView>
                {media.length > 0 && (
                    <Pressable style={styles.editorButton} onPress={openEditor}>
                    <SlidersHorizontal size={16} color="#111" />
                    <Text style={styles.editorText}>Edit</Text>
                    </Pressable>
                )}
                </View>

                <View style={styles.form}>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Title (Required)"
                    placeholderTextColor="#aaa"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={80}
                    autoCorrect={false}
                />
                <TextInput
                    style={[styles.descInput, { height: Math.max(160, descHeight) }]}
                    placeholder="Tell the story... #hashtags"
                    placeholderTextColor="#999"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    onContentSizeChange={(e) => setDescHeight(e.nativeEvent.contentSize.height)}
                    textAlignVertical="top"
                />

                <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                    <MapPin size={18} color={Colors.light.text} />
                    <Text style={styles.metaLabel}>Add Location</Text>
                    </View>
                    <Pressable onPress={() => { setLocationInput(location); setLocationModalVisible(true); }}>
                    <Text style={styles.metaValue}>{location || 'Set location'}</Text>
                    </Pressable>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                    <Tag size={18} color={Colors.light.text} />
                    <Text style={styles.metaLabel}>Tag Products</Text>
                    </View>
                    <Pressable onPress={() => setProductModalVisible(true)}>
                    <Text style={styles.metaValue}>{productTags.length ? `${productTags.length} tagged` : 'Add products'}</Text>
                    </Pressable>
                </View>

                {productTags.length > 0 && (
                    <View style={styles.tagsRow}>
                    {productTags.map(tag => (
                        <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <Pressable onPress={() => setProductTags(productTags.filter(t => t !== tag))}>
                            <X size={12} color="#444" />
                        </Pressable>
                        </View>
                    ))}
                    </View>
                )}
                </View>
            </>
        ) : (
            <View style={styles.form}>
                <Pressable style={styles.productImagePicker} onPress={pickProductImage}>
                    {prodImage ? (
                        <Image source={{ uri: prodImage }} style={styles.prodImagePreview} />
                    ) : (
                        <View style={styles.prodImagePlaceholder}>
                            <Camera size={32} color="#999" />
                            <Text style={styles.prodImageText}>Add Product Photo</Text>
                        </View>
                    )}
                </Pressable>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Product Title</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Sony Headphones" 
                        value={prodTitle} 
                        onChangeText={setProdTitle} 
                    />
                </View>

                <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Price ($)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="0.00" 
                            value={prodPrice} 
                            onChangeText={setProdPrice} 
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.label}>Brand</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. Sony" 
                            value={prodBrand} 
                            onChangeText={setProdBrand} 
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                        <Text style={styles.label}>Affiliate / Store Link</Text>
                        {/* Removed Trust Shield for MVP to reduce confusion */}
                    </View>
                    <View style={styles.linkInputContainer}>
                        <Link size={18} color="#999" />
                        <TextInput 
                            style={styles.linkInput} 
                            placeholder="https://your-shop.com/..." 
                            value={prodLink} 
                            onChangeText={setProdLink} 
                            autoCapitalize="none"
                        />
                    </View>
                    <Text style={styles.helperText}>Any valid https link is allowed.</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                        style={[styles.input, { height: 100 }]} 
                        placeholder="Describe the product..." 
                        value={prodDesc} 
                        onChangeText={setProdDesc} 
                        multiline 
                        textAlignVertical="top"
                    />
                </View>
            </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={editorVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTabs}>
              {['Crop', 'Filter', 'Tags'].map(tab => (
                <Pressable key={tab} onPress={() => setEditorTab(tab as any)} style={[styles.modalTab, editorTab === tab && styles.modalTabActive]}>
                  <Text style={[styles.modalTabText, editorTab === tab && styles.modalTabTextActive]}>{tab}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalBody}>
              {editorTab === 'Crop' && (
                <View style={styles.editorContent}>
                  <Image source={{ uri: media[0]?.uri }} style={styles.previewImage} resizeMode="contain" />
                  <Text style={styles.editorLabel}>Aspect Ratio</Text>
                  <View style={styles.aspectButtons}>
                    <Pressable style={styles.aspectBtn}><Text style={styles.aspectText}>1:1</Text></Pressable>
                    <Pressable style={styles.aspectBtn}><Text style={styles.aspectText}>4:3</Text></Pressable>
                    <Pressable style={styles.aspectBtn}><Text style={styles.aspectText}>16:9</Text></Pressable>
                    <Pressable style={styles.aspectBtn}><Text style={styles.aspectText}>Free</Text></Pressable>
                  </View>
                </View>
              )}
              {editorTab === 'Filter' && (
                <View style={styles.editorContent}>
                  <Image source={{ uri: media[0]?.uri }} style={styles.previewImage} resizeMode="contain" />
                  <Text style={styles.editorLabel}>Filters</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {['Normal', 'Vivid', 'B&W', 'Warm', 'Cool', 'Fade', 'Drama'].map(filter => (
                      <Pressable key={filter} style={styles.filterBtn}>
                        <View style={styles.filterPreview} />
                        <Text style={styles.filterName}>{filter}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {editorTab === 'Tags' && (
                <View style={styles.editorContent}>
                  <Text style={styles.editorLabel}>Tag people or products in your media</Text>
                  <Text style={styles.editorHint}>Use the "Tag Products" option in the main form to add product tags to your post.</Text>
                </View>
              )}
            </View>
            <Pressable style={styles.closeButton} onPress={() => setEditorVisible(false)}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={locationModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.locationCard}>
            <Text style={styles.modalTitle}>Add Location</Text>
            <View style={styles.locationInputRow}>
              <Search size={16} color="#777" />
              <TextInput
                style={styles.locationInput}
                placeholder="Search city or place"
                value={locationInput}
                onChangeText={setLocationInput}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setLocationModalVisible(false)} style={styles.modalGhostBtn}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setLocation(locationInput); setLocationModalVisible(false); }} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={productModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.locationCard}>
            <Text style={styles.modalTitle}>Tag Products</Text>
            <View style={styles.locationInputRow}>
              <Search size={16} color="#777" />
              <TextInput
                style={styles.locationInput}
                placeholder="Search for products to tag..."
                value={productQuery}
                onChangeText={setProductQuery}
              />
            </View>
            <ScrollView style={{ maxHeight: 240, marginVertical: 10 }}>
              {searchResults.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No products found</Text>
              ) : (
                searchResults.map(p => (
                  <Pressable key={p.id} style={styles.productRow} onPress={() => {
                    if (!productTags.includes(p.title)) setProductTags([...productTags, p.title]);
                  }}>
                    <Image source={{ uri: p.image }} style={styles.productThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.productMeta}>{p.brandName}</Text>
                    </View>
                    {productTags.includes(p.title) ? (
                      <Check size={18} color={Colors.light.tint} />
                    ) : (
                      <View style={{width:18, height:18, borderRadius:9, borderWidth:1, borderColor:'#ddd'}} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setProductModalVisible(false)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  authContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 24,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  tabSwitch: {
      flexDirection: 'row',
      backgroundColor: '#f5f5f5',
      borderRadius: 20,
      padding: 2,
  },
  tabBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 18,
  },
  tabBtnActive: {
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {width:0, height:1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
  },
  tabBtnText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '600',
  },
  tabBtnTextActive: {
      color: '#000',
  },
  publishButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  publishText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  mediaRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addMediaButton: {
    width: ITEM_WIDTH,
    height: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addIconRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  addMediaText: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  imagePreview: {
    width: ITEM_WIDTH,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  dragging: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editorText: {
    color: '#111',
    fontWeight: '600',
  },
  form: {
    padding: 16,
    gap: 12,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    paddingVertical: 8,
  },
  descInput: {
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  metaValue: {
    color: '#666',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eceef1',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagText: {
    color: '#111',
    fontWeight: '600',
  },
  
  // Product Form Styles
  productImagePicker: {
      width: 120,
      height: 120,
      borderRadius: 12,
      backgroundColor: '#f5f5f5',
      alignSelf: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  prodImagePlaceholder: {
      alignItems: 'center',
      gap: 8,
  },
  prodImageText: {
      fontSize: 12,
      color: '#999',
      fontWeight: '600',
  },
  prodImagePreview: {
      width: '100%',
      height: '100%',
  },
  inputGroup: {
      gap: 6,
      marginBottom: 16,
  },
  rowInputs: {
      flexDirection: 'row',
      marginBottom: 16,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
  },
  input: {
      backgroundColor: '#f9fafb',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: '#111',
  },
  linkInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 10,
      paddingHorizontal: 12,
      gap: 10,
  },
  linkInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: 'blue',
  },
  helperText: {
      fontSize: 11,
      color: '#999',
      marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  modalTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTabActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  modalTabText: {
    color: '#555',
    fontWeight: '700',
  },
  modalTabTextActive: {
    color: '#fff',
  },
  modalBody: {
    padding: 16,
    backgroundColor: '#f7f7f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
  },
  locationCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalGhostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalGhostText: {
    color: '#444',
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  productMeta: {
    fontSize: 12,
    color: '#666',
  },
  editorContent: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  editorLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
  },
  editorHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  aspectButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aspectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aspectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  filterRow: {
    gap: 12,
    paddingHorizontal: 4,
  },
  filterBtn: {
    alignItems: 'center',
    gap: 6,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  filterName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
});
