import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, ArrowLeft, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MasonryList } from '@/components/MasonryList';
import { MOCK_NOTES } from '@/mocks/data';
import { searchNotes } from '@/lib/database';
import { Note } from '@/types';

const TRENDING_SEARCHES = [
  'OOTD Inspiration',
  'Healthy Recipes',
  'Travel Photography',
  'Vintage Fashion',
  'DIY Home Decor',
  'Streetwear',
  'Gluten Free',
  'Digital Nomad',
];

const TABS = ['All', 'Products', 'Users', 'Locations'];

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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Note[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Summer Outfit', 'Cafe Tokyo', 'Minimalist Home', 'Skincare']);

  useEffect(() => {
    if (params.q) {
      const searchTerm = params.q as string;
      setQuery(searchTerm);
      performSearch(searchTerm);
    }
  }, [params.q]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setLoading(true);
    
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 3)]);
    }
    
    try {
      const data = await searchNotes(searchQuery);
      if (data && data.length > 0) {
        setResults(data.map((n: DBNote) => transformDBNote(n)));
      } else {
        const mockResults = MOCK_NOTES.filter(n => 
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          n.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(mockResults);
      }
    } catch (error) {
      console.error('Error searching:', error);
      const mockResults = MOCK_NOTES.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setResults(mockResults);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
    setResults([]);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </Pressable>
        
        <View style={styles.inputContainer}>
          <Search size={18} color="#999" />
          <TextInput
            style={styles.input}
            placeholder="Search..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <X size={18} color="#666" />
            </Pressable>
          )}
        </View>
        
        <Pressable onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {!isSearching ? (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.pillsContainer}>
                {recentSearches.map((item, index) => (
                  <Pressable 
                    key={index} 
                    style={styles.pill}
                    onPress={() => handleQuickSearch(item)}
                  >
                    <Text style={styles.pillText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingList}>
              {TRENDING_SEARCHES.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={styles.trendingItem}
                  onPress={() => handleQuickSearch(item)}
                >
                  <Text style={[
                    styles.rank, 
                    index < 3 ? styles.topRank : styles.normalRank
                  ]}>
                    {index + 1}
                  </Text>
                  <Text style={styles.trendingText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
           <View style={styles.tabsRow}>
            {TABS.map((tab) => (
              <Pressable 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabItem,
                  activeTab === tab && styles.activeTabItem
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  activeTab === tab && styles.activeTabText
                ]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
          ) : results.length > 0 ? (
            <MasonryList data={results} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.light.text,
    fontSize: 16,
  },
  searchButtonText: {
    color: Colors.light.tint,
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pillText: {
    fontSize: 14,
    color: '#666',
  },
  trendingList: {
    gap: 4,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  topRank: {
    color: Colors.light.tint,
  },
  normalRank: {
    color: '#999',
  },
  trendingText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  resultsContainer: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    backgroundColor: '#fff',
  },
  tabItem: {
    paddingVertical: 4,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.text,
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});