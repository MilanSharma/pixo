import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Settings, Share2, Menu } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MasonryList } from '@/components/MasonryList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getUserNotes, getUserCollections, getUserLikes, deleteNote, collectNote, likeNote } from '@/lib/database';
import { useRouter, useFocusEffect } from 'expo-router';
import { Note } from '@/types';
import { MOCK_NOTES } from '@/mocks/data'; // Import Mock Data
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABS = ['Notes', 'Collects', 'Likes'];

function transformDBNote(dbNote: any): Note {
  const profile = dbNote.profiles || { id: dbNote.user_id, username: 'Unknown', avatar_url: '' };
  return {
    id: dbNote.id,
    userId: dbNote.user_id,
    user: { id: profile.id, username: profile.username || 'Unknown', avatar: profile.avatar_url || 'https://ui-avatars.com/api/?name=User' },
    title: dbNote.title,
    description: dbNote.content || '',
    media: dbNote.images || [],
    tags: [],
    likes: dbNote.likes_count || 0,
    collects: dbNote.collects_count || 0,
    commentsCount: dbNote.comments_count || 0,
    createdAt: dbNote.created_at,
  };
}

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('Notes');

  const [notes, setNotes] = useState<Note[]>([]);
  const [collectedNotes, setCollectedNotes] = useState<Note[]>([]);
  const [likedNotes, setLikedNotes] = useState<Note[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mockFollowingCount, setMockFollowingCount] = useState(0);

  // Reload data silently when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        refreshProfile(); // <--- Added this to force profile refresh
        loadUserData(false);
        countMockFollows();
      }
    }, [user])
  );

  const countMockFollows = async () => {
    if (!user) return;
    const keys = await AsyncStorage.getAllKeys();
    const followKeys = keys.filter(k => k.startsWith('followed_mock_'));
    let count = 0;
    for (const k of followKeys) {
      const val = await AsyncStorage.getItem(k);
      if (val === 'true') count++;
    }
    setMockFollowingCount(count);
  };

  const loadUserData = async (showSpinner = false) => {
    if (!user) return;
    if (showSpinner) setIsRefreshing(true);

    try {
      // 1. Load Real Data
      const [userNotes, userCollections, userLikes] = await Promise.all([
        getUserNotes(user.id),
        getUserCollections(user.id),
        getUserLikes(user.id),
      ]);

      const realNotes = userNotes?.map(transformDBNote) || [];
      const realCollections = userCollections?.map(transformDBNote) || [];
      const realLikes = userLikes?.map(transformDBNote) || [];

      // 2. Load Mock Data from Storage
      const likedMockIdsStr = await AsyncStorage.getItem(`liked_mock_notes_${user.id}`);
      const collectedMockIdsStr = await AsyncStorage.getItem(`collected_mock_notes_${user.id}`);

      const likedMockIds = likedMockIdsStr ? JSON.parse(likedMockIdsStr) : [];
      const collectedMockIds = collectedMockIdsStr ? JSON.parse(collectedMockIdsStr) : [];

      const mockLikedNotes = MOCK_NOTES.filter(n => likedMockIds.includes(n.id));
      const mockCollectedNotes = MOCK_NOTES.filter(n => collectedMockIds.includes(n.id));

      // 3. Merge & Set
      setNotes(realNotes);
      setCollectedNotes([...realCollections, ...mockCollectedNotes]);
      setLikedNotes([...realLikes, ...mockLikedNotes]);

    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };







  const handleRemoveItem = (targetNote: Note) => {
    let title = "Remove Item";
    let message = "Are you sure?";
    let action = async () => { };

    if (activeTab === 'Notes') {
      title = "Delete Note";
      message = "Permanently delete this note?";
      action = async () => {
        setNotes(prev => prev.filter(n => n.id !== targetNote.id));
        await deleteNote(targetNote.id);
      };
    } else if (activeTab === 'Collects') {
      title = "Remove from Collection";
      message = "Remove this note from your collection?";
      action = async () => {
        setCollectedNotes(prev => prev.filter(n => n.id !== targetNote.id));
        await collectNote(user?.id || '', targetNote.id); // Toggles off
      };
    } else if (activeTab === 'Likes') {
      title = "Unlike Note";
      message = "Remove this note from your likes?";
      action = async () => {
        setLikedNotes(prev => prev.filter(n => n.id !== targetNote.id));
        await likeNote(user?.id || '', targetNote.id); // Toggles off
      };
    }

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          try {
            await action();
          } catch (error) {
            Alert.alert("Error", "Action failed.");
            loadUserData(false); // Revert on error
          }
        }
      }
    ]);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/user/menu')} style={styles.iconBtn}><Menu size={24} color={Colors.light.text} /></Pressable>
        <View style={styles.topBarRight}>
          <Pressable onPress={() => { }} style={styles.iconBtn}><Share2 size={24} color={Colors.light.text} /></Pressable>
          <Pressable onPress={() => router.push('/user/settings')} style={styles.iconBtn}><Settings size={24} color={Colors.light.text} /></Pressable>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Image
          key={profile?.avatar_url || 'default-avatar'}
          source={{ uri: profile?.avatar_url || 'https://ui-avatars.com/api/?name=User' }}
          style={styles.avatar}
          cachePolicy="none"
        />
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{(profile?.following_count || 0) + mockFollowingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.likes_count || 0}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioContainer}>
        <Text style={styles.username}>{profile?.display_name || profile?.username}</Text>
        <Text style={styles.handle}>@{profile?.username}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={styles.editButton} onPress={() => router.push('/user/edit')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
        <Pressable style={styles.editButton} onPress={() => { }}>
          <Text style={styles.editButtonText}>Share Profile</Text>
        </Pressable>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const displayNotes = activeTab === 'Notes' ? notes : activeTab === 'Collects' ? collectedNotes : likedNotes;

  if (!user || !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MasonryList
        data={displayNotes}
        ListHeaderComponent={renderHeader()}
        refreshing={isRefreshing}
        onRefresh={() => loadUserData(true)}
        onRemoveItem={handleRemoveItem}

        removeType={activeTab === 'Notes' ? 'delete' : 'remove'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: Colors.light.background, paddingBottom: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 24, borderWidth: 1, borderColor: '#eee' },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  statLabel: { fontSize: 12, color: '#666' },
  bioContainer: { paddingHorizontal: 20, marginTop: 16 },
  username: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  handle: { fontSize: 14, color: '#666', marginBottom: 8 },
  bio: { fontSize: 14, color: Colors.light.text, lineHeight: 20, marginBottom: 16 },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 16, marginBottom: 20 },
  editButton: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, alignItems: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  tabsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 40 },
  tabItem: { alignItems: 'center', position: 'relative', paddingVertical: 12 },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  activeTabText: { color: Colors.light.text, fontWeight: 'bold' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 30, height: 2, backgroundColor: Colors.light.tint },
});
