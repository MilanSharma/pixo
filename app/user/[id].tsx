import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Share2, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MasonryList } from '@/components/MasonryList';
import { MOCK_USERS, MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Notes');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Simulate Fetch
    const u = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
    setUser(u);
    // Filter notes
    const userNotes = MOCK_NOTES.filter(n => n.userId === id);
    setNotes(userNotes);
  }, [id]);

  const handleShare = () => {
    Share.share({ message: `Check out ${user?.username}'s profile on Pixo!` });
  };

  const handleMore = () => {
    Alert.alert('Options', 'Select an action', [
        { text: 'Report User', style: 'destructive' },
        { text: 'Block', style: 'cancel' },
        { text: 'Cancel', style: 'cancel' }
    ]);
  };

  if (!user) return <ActivityIndicator />;

  const displayNotes = activeTab === 'Notes' ? notes : []; // Empty for collects in mock

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.navBar}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><ArrowLeft size={24} color="#333" /></Pressable>
        <Pressable onPress={handleMore}><MoreHorizontal size={24} color="#333" /></Pressable>
      </View>

      <View style={styles.profileHeader}>
         <Image source={{ uri: user.avatar }} style={styles.avatar} />
         <View style={styles.stats}>
             <Text style={styles.statNum}>{user.followers}</Text><Text>Followers</Text>
         </View>
         <View style={styles.stats}>
             <Text style={styles.statNum}>{user.following}</Text><Text>Following</Text>
         </View>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.bio}>{user.bio}</Text>

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.followBtn]} onPress={() => setIsFollowing(!isFollowing)}>
            <Text style={{color:'#fff'}}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.shareBtn]} onPress={handleShare}>
            <Share2 size={20} color="#333" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {['Notes', 'Collects'].map(t => (
            <Pressable key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                <Text style={{color: activeTab === t ? '#333' : '#999', fontWeight:'bold'}}>{t}</Text>
            </Pressable>
        ))}
      </View>

      <MasonryList data={displayNotes} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, height: 44, alignItems: 'center' },
  profileHeader: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 20 },
  stats: { alignItems: 'center', marginRight: 20 },
  statNum: { fontWeight: 'bold', fontSize: 18 },
  username: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20 },
  bio: { paddingHorizontal: 20, color: '#666', marginVertical: 10 },
  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  btn: { borderRadius: 20, alignItems: 'center', justifyContent: 'center', height: 40 },
  followBtn: { flex: 1, backgroundColor: Colors.light.tint },
  shareBtn: { width: 40, borderWidth: 1, borderColor: '#ddd' },
  tabs: { flexDirection: 'row', marginTop: 20, borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  activeTab: { borderBottomWidth: 2, borderColor: Colors.light.tint },
});
