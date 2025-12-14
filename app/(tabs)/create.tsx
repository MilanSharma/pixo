import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal, PanResponder, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, X, SlidersHorizontal, Tag, Search, Check, Play, Film } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleImages } from '@/lib/storage';
import { createNote } from '@/lib/database';
import { MOCK_PRODUCTS } from '@/mocks/data';

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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descHeight, setDescHeight] = useState(160);
  const [location, setLocation] = useState('');
  const [productTags, setProductTags] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorTab, setEditorTab] = useState<'Crop' | 'Filter' | 'Tags'>('Crop');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [productQuery, setProductQuery] = useState('');

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'all',
      allowsMultipleSelection: true,
      selectionLimit: 9 - media.length,
      quality: 1,
      videoMaxDuration: 60, // Limit videos to 60 seconds
    });

    if (!result.canceled) {
      const newItems: MediaItem[] = result.assets.map(a => ({
        uri: a.uri,
        type: a.type === 'video' ? 'video' : 'image',
        duration: a.duration
      }));
      setMedia(prev => [...prev, ...newItems].slice(0, 9));
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
      Alert.alert('Sign In Required', 'Please sign in to create a note', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    if (media.length === 0) {
      Alert.alert('Error', 'Please add at least one photo or video');
      return;
    }
    
    // Explicit trim and check
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
      
      const uploadedUrls = await uploadMultipleImages(user.id, uploadFiles);
      
      await createNote(user.id, {
        title: cleanTitle,
        content: description.trim(),
        images: uploadedUrls,
        location: location.trim() || undefined,
        productTags,
      });
      
      Alert.alert('Success', 'Your note has been published!', [
        { text: 'OK', onPress: () => {
          setMedia([]);
          setTitle('');
          setDescription('');
          setLocation('');
          setProductTags([]);
          router.push('/');
        }}
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to publish note');
    } finally {
      setIsPublishing(false);
    }
  };

  const productResults = useMemo(() => {
    if (!productQuery.trim()) return MOCK_PRODUCTS.slice(0, 6);
    return MOCK_PRODUCTS.filter(p => p.title.toLowerCase().includes(productQuery.toLowerCase())).slice(0, 8);
  }, [productQuery]);

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
        <Text style={styles.headerTitle}>Create</Text>
        <Pressable 
          onPress={handlePublish} 
          disabled={isPublishing}
          style={[styles.publishButton, isPublishing && styles.disabledButton]}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }}>
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
      </ScrollView>

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
              <Text style={styles.modalPlaceholder}>{editorTab} coming soon</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={() => setEditorVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
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
                placeholder="Search products"
                value={productQuery}
                onChangeText={setProductQuery}
              />
            </View>
            <ScrollView style={{ maxHeight: 240 }}>
              {productResults.map(p => (
                <Pressable key={p.id} style={styles.productRow} onPress={() => {
                  if (!productTags.includes(p.title)) setProductTags([...productTags, p.title]);
                }}>
                  <Image source={{ uri: p.image }} style={styles.productThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.productMeta}>{p.brandName}</Text>
                  </View>
                  {productTags.includes(p.title) && <Check size={18} color={Colors.light.tint} />}
                </Pressable>
              ))}
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
  modalPlaceholder: {
    color: '#555',
    fontWeight: '600',
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
  },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
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
});
