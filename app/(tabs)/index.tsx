import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MasonryList } from '@/components/MasonryList';
import { getNotes } from '@/lib/database';
import { MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Note } from '@/types';

const TABS = ['Follow', 'Explore', 'Nearby'];

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
    likes: dbNote.likes_count,
    collects: dbNote.collects_count,
    commentsCount: dbNote.comments_count,
    createdAt: dbNote.created_at,
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Explore');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [activeTab]);

  const loadNotes = async () => {
    try {
      setLoading(true);

      if (activeTab === 'Explore') {
        const data = await getNotes(20, 0);
        if (data && data.length > 0) {
          setNotes(data.map((n: DBNote) => transformDBNote(n)));
        } else {
          setNotes(MOCK_NOTES);
        }
      } else if (activeTab === 'Follow') {
        const followedNotes = MOCK_NOTES.filter(note =>
          ['u2', 'u3', 'u5'].includes(note.userId)
        );
        setNotes(followedNotes);
      } else if (activeTab === 'Nearby') {
        const nearbyNotes = MOCK_NOTES.filter(note => !!note.location);
        setNotes(nearbyNotes);
      }
    } catch (error) {
      setNotes(MOCK_NOTES);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.searchBar} onPress={handleSearchPress}>
        <Search size={18} color="#999" />
        <Text style={styles.searchPlaceholder}>Search for &quot;Summer Outfit&quot;</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MasonryList
        data={notes}
        ListHeaderComponent={renderHeader()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.light.background,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 24,
  },
  tabItem: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.light.text,
    fontWeight: 'bold',
    fontSize: 17,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 15,
  },
});