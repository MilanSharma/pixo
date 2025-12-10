import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ArrowLeft, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MasonryList } from '@/components/MasonryList';
import { MOCK_NOTES } from '@/mocks/data';

const RECENT_SEARCHES = ['Summer Outfit', 'Cafe Tokyo', 'Minimalist Home', 'Skincare'];
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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  // Filter mock data based on query (simple check)
  const results = isSearching 
    ? MOCK_NOTES.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.tags.some(t => t.includes(query.toLowerCase())))
    : [];

  const handleSearch = () => {
    if (query.trim()) {
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch}>
              <X size={16} color="#999" />
            </Pressable>
          )}
        </View>
        
        <Pressable onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {!isSearching ? (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <Pressable>
                <Text style={styles.clearText} onPress={() => {}}>Clear</Text>
              </Pressable>
            </View>
            <View style={styles.pillsContainer}>
              {RECENT_SEARCHES.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={styles.pill}
                  onPress={() => {
                    setQuery(item);
                    setIsSearching(true);
                  }}
                >
                  <Text style={styles.pillText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingContainer}>
              {TRENDING_SEARCHES.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={styles.trendingItem}
                  onPress={() => {
                    setQuery(item);
                    setIsSearching(true);
                  }}
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

          {results.length > 0 ? (
            <MasonryList data={results} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found.</Text>
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
  },
  clearText: {
    fontSize: 14,
    color: '#999',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pillText: {
    fontSize: 14,
    color: '#666',
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendingItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  topRank: {
    color: '#FFD700', // Gold or specific color for top 3
  },
  normalRank: {
    color: '#ccc',
  },
  trendingText: {
    fontSize: 14,
    color: '#333',
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
