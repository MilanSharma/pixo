import { getProfile } from '@/lib/auth';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Share2, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MasonryList } from '@/components/MasonryList';
import { MOCK_USERS, MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { followUser, getFollowStatus, getUserNotes, blockUser } from '@/lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Notes');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      if (UUID_REGEX.test(userId)) {
        // --- REAL USER ---
        const profile = await getProfile(userId);
        setUserProfile({
          id: profile.id,
          username: profile.username,
          avatar: profile.avatar_url,
          bio: profile.bio,
          followers: profile.followers_count || 0,
          following: profile.following_count || 0,
        });

        const userNotes = await getUserNotes(userId);
        const mappedNotes = userNotes?.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          user: { username: profile.username, avatar: profile.avatar_url },
          title: n.title,
          media: n.images || [],
          likes: n.likes_count,
          collects: n.collects_count,
        })) || [];
        setNotes(mappedNotes);

        if (currentUser) {
          const status = await getFollowStatus(currentUser.id, userId);
          setIsFollowing(status);
        }

      } else {
        // --- MOCK USER ---
        const u = MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
        setUserProfile(u);
        const userNotes = MOCK_NOTES.filter(n => n.userId === userId);
        setNotes(userNotes);

        if (currentUser) {
          const stored = await AsyncStorage.getItem(`followed_mock_${userId}`);
          setIsFollowing(stored === 'true');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      Alert.alert('Sign In', 'Please sign in to follow users.');
      return;
    }

    const newState = !isFollowing;
    setIsFollowing(newState);
    setFollowLoading(true);

    try {
      if (UUID_REGEX.test(userId)) {
        await followUser(currentUser.id, userId);
      } else {
        await AsyncStorage.setItem(`followed_mock_${userId}`, newState ? 'true' : 'false');
      }
    } catch (error) {
      setIsFollowing(!newState);
      console.error(error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!currentUser) {
      Alert.alert('Sign In', 'Please sign in to send messages.');
      return;
    }
    router.push(`/chat/${userId}`);
  };

  const handleShare = () => {
    Share.share({ message: `Check out ${userProfile?.username}'s profile on Pixo!` });
  };

  const handleOptions = () => {
    Alert.alert(
      'User Options',
      `Manage your interaction with @${userProfile?.username}`,
      [
        { 
          text: 'Report User', 
          onPress: () => Alert.alert('Reported', 'Thank you. We will review this profile.') 
        },
        { 
          text: 'Block User', 
          style: 'destructive', 
          onPress: async () => {
             if(!currentUser) return;
             try {
                 await blockUser(currentUser.id, userId);
                 Alert.alert('Blocked', `You have blocked @${userProfile?.username}.`, [
                     { text: 'Go Home', onPress: () => router.replace('/') }
                 ]);
             } catch(e) {
                 Alert.alert('Error', 'Could not block user.');
             }
          } 
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        }
      ]
    );
  };

  const displayNotes = activeTab === 'Notes' ? notes : [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      {loading || !userProfile ? (
        <View style={[styles.contentContainer, styles.center]}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          {/* Navbar */}
          <View style={styles.navBar}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={10} style={styles.backBtn}>
              <ArrowLeft size={24} color="#333" />
            </Pressable>
            <Text style={styles.navUsername}>{userProfile.username}</Text>
            <Pressable onPress={handleOptions} hitSlop={10}>
              <MoreHorizontal size={24} color="#333" />
            </Pressable>
          </View>

          <MasonryList
            data={displayNotes}
            ListHeaderComponent={
              <>
                <View style={styles.profileHeader}>
                  <Image
                    key={userProfile.avatar || 'default-avatar'}
                    source={{ uri: userProfile.avatar || 'https://ui-avatars.com/api/?name=User' }}
                    style={styles.avatar}
                    cachePolicy="none"
                  />
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{userProfile.followers}</Text>
                      <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{userProfile.following}</Text>
                      <Text style={styles.statLabel}>Following</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bioSection}>
                  <Text style={styles.username}>{userProfile.username}</Text>
                  {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={[
                      styles.btn,
                      isFollowing ? styles.followingBtn : styles.followBtn,
                      { flex: 1 }
                    ]}
                    onPress={handleFollow}
                    disabled={followLoading}
                  >
                    <Text style={[
                      styles.btnText,
                      isFollowing ? styles.followingText : styles.followText
                    ]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.btn, styles.messageBtn, { flex: 1 }]}
                    onPress={handleMessage}
                  >
                    <Text style={styles.messageText}>Message</Text>
                  </Pressable>

                  <Pressable style={[styles.btn, styles.iconBtn]} onPress={handleShare}>
                    <Share2 size={20} color="#333" />
                  </Pressable>
                </View>

                <View style={styles.tabs}>
                  {['Notes', 'Collects'].map(t => (
                    <Pressable key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                      <Text style={{ color: activeTab === t ? '#333' : '#999', fontWeight: 'bold' }}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  navUsername: { fontWeight: 'bold', fontSize: 16 },
  profileHeader: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  avatar: { width: 86, height: 86, borderRadius: 43, marginRight: 24, borderWidth: 1, borderColor: '#eee' },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  statLabel: { color: '#666', fontSize: 13 },
  bioSection: { paddingHorizontal: 20, marginBottom: 16 },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  bio: { color: '#444', lineHeight: 20 },
  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  btn: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', height: 36 },
  btnText: { fontWeight: '600', fontSize: 14 },
  followBtn: { backgroundColor: Colors.light.tint },
  followText: { color: '#fff' },
  followingBtn: { backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
  followingText: { color: '#333' },
  messageBtn: { backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
  messageText: { color: '#333', fontWeight: '600' },
  iconBtn: { width: 36, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginTop: 10, borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', padding: 12 },
  activeTab: { borderBottomWidth: 2, borderColor: '#333' },
});
