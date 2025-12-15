import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Dimensions, Alert } from 'react-native';
import { Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ReelCard } from '@/components/ReelCard';
import { getNotes, likeNote, collectNote } from '@/lib/database';
import { MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Note } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FEED_TABS = ['Following', 'Explore'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DBNote {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  images: string[];
  likes_count: number;
  collects_count: number;
  comments_count: number;
  created_at: string;
  product_tags?: string[];
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

function transformDBNote(dbNote: DBNote): Note {
  return {
    id: dbNote.id,
    userId: dbNote.user_id,
    user: {
      id: dbNote.profiles.id,
      username: dbNote.profiles.username,
      avatar: dbNote.profiles.avatar_url || 'https://ui-avatars.com/api/?name=User',
      followers: 0,
      following: 0,
      likes: 0,
      collects: 0,
    },
    title: dbNote.title,
    description: dbNote.content || '',
    media: dbNote.images,
    tags: [],
    productTags: dbNote.product_tags || [],
    location: (dbNote as any).location || undefined,
    likes: dbNote.likes_count,
    collects: dbNote.collects_count,
    commentsCount: dbNote.comments_count,
    createdAt: dbNote.created_at,
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [feedTab, setFeedTab] = useState('Explore');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [likedNotes, setLikedNotes] = useState<Set<string>>(new Set());
  const [collectedNotes, setCollectedNotes] = useState<Set<string>>(new Set());

  // Use focus effect to reload data whenever the screen is focused (e.g. after posting)
  useFocusEffect(
    useCallback(() => {
      loadNotes();
      loadLocalInteractions();
    }, [feedTab])
  );

  const loadLocalInteractions = async () => {
      if (!user) return;
      try {
          const liked = await AsyncStorage.getItem(`liked_mock_notes_${user.id}`);
          if (liked) setLikedNotes(new Set(JSON.parse(liked)));
          
          const collected = await AsyncStorage.getItem(`collected_mock_notes_${user.id}`);
          if (collected) setCollectedNotes(new Set(JSON.parse(collected)));
      } catch (e) {
          console.error("Failed to load local interactions", e);
      }
  };

  const loadNotes = async () => {
    try {
      // Only show full spinner if we have no data yet to avoid flickering on refresh
      if (notes.length === 0) setLoading(true);
      
      if (feedTab === 'Explore') {
        const data = await getNotes(60, 0);
        if (data && data.length > 0) {
          setNotes(data.map((n: DBNote) => transformDBNote(n)));
        } else {
          setNotes(MOCK_NOTES);
        }
      } else {
        const followedNotes = MOCK_NOTES.filter(note => ['u2', 'u3', 'u5'].includes(note.userId));
        setNotes(followedNotes);
      }
    } catch (error) {
      console.error("Failed to load notes", error);
      if (notes.length === 0) setNotes(MOCK_NOTES);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (noteId: string) => {
    if (!user) {
        Alert.alert('Login Required', 'Please login to like posts');
        return;
    }

    const isLiked = likedNotes.has(noteId);
    const newLikedNotes = new Set(likedNotes);
    if (isLiked) newLikedNotes.delete(noteId);
    else newLikedNotes.add(noteId);
    
    setLikedNotes(newLikedNotes);

    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, likes: note.likes + (isLiked ? -1 : 1) }
          : note
      )
    );

    if (UUID_REGEX.test(noteId)) {
      try { await likeNote(user.id, noteId); } catch (e) { console.error(e); }
    } else {
      try {
          await AsyncStorage.setItem(`liked_mock_notes_${user.id}`, JSON.stringify(Array.from(newLikedNotes)));
      } catch (e) { console.error(e); }
    }
  };

  const handleCollect = async (noteId: string) => {
    if (!user) {
        Alert.alert('Login Required', 'Please login to save posts');
        return;
    }

    const isCollected = collectedNotes.has(noteId);
    const newCollectedNotes = new Set(collectedNotes);
    if (isCollected) newCollectedNotes.delete(noteId);
    else newCollectedNotes.add(noteId);

    setCollectedNotes(newCollectedNotes);

    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, collects: note.collects + (isCollected ? -1 : 1) }
          : note
      )
    );

    if (UUID_REGEX.test(noteId)) {
      try { await collectNote(user.id, noteId); } catch (e) { console.error(e); }
    } else {
      try {
          await AsyncStorage.setItem(`collected_mock_notes_${user.id}`, JSON.stringify(Array.from(newCollectedNotes)));
      } catch (e) { console.error(e); }
    }
  };

  const handleComment = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleShare = () => {};

  const handleSearchPress = () => {
    router.push('/search');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }: { item: Note; index: number }) => (
    <ReelCard
      note={item}
      isActive={index === currentIndex && isFocused}
      onLike={() => handleLike(item.id)}
      onCollect={() => handleCollect(item.id)}
      onComment={() => handleComment(item.id)}
      onShare={handleShare}
      isLiked={likedNotes.has(item.id)}
      isCollected={collectedNotes.has(item.id)}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
            style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
        >
            <View style={styles.headerRow}>
            <View style={styles.toggleRow}>
                {FEED_TABS.map(tab => (
                <Pressable key={tab} onPress={() => setFeedTab(tab)} style={styles.toggleBtn}>
                    <Text style={[styles.toggleText, feedTab === tab && styles.toggleTextActive]}>
                    {tab}
                    </Text>
                    {feedTab === tab && <View style={styles.toggleUnderline} />}
                </Pressable>
                ))}
            </View>
            <Pressable onPress={handleSearchPress} style={styles.searchIconBtn}>
                <Search size={22} color="#fff" />
            </Pressable>
            </View>
        </LinearGradient>
      </View>

      <FlatList
        ref={flatListRef}
        data={notes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleRow: { flexDirection: 'row', gap: 20 },
  toggleBtn: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { fontSize: 17, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  toggleTextActive: { color: '#fff', fontWeight: '800' },
  toggleUnderline: { marginTop: 4, height: 2.5, backgroundColor: '#fff', borderRadius: 2, width: 28 },
  searchIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
