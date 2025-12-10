import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Settings, Share2, Menu } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MasonryList } from '@/components/MasonryList';
import { CURRENT_USER, MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Notes', 'Collects', 'Likes'];

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Notes');

  // Filter notes for the profile
  const userNotes = MOCK_NOTES.filter(n => n.userId === CURRENT_USER.id);
  const collectedNotes = MOCK_NOTES.slice(0, 4); // Mock data
  
  const displayNotes = activeTab === 'Notes' ? userNotes : collectedNotes;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Menu size={24} color={Colors.light.text} />
        <View style={styles.topBarRight}>
          <Share2 size={24} color={Colors.light.text} />
          <Settings size={24} color={Colors.light.text} />
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Image source={{ uri: CURRENT_USER.avatar }} style={styles.avatar} />
        <View style={styles.statsContainer}>
           <View style={styles.statItem}>
             <Text style={styles.statNumber}>{CURRENT_USER.following}</Text>
             <Text style={styles.statLabel}>Following</Text>
           </View>
           <View style={styles.statItem}>
             <Text style={styles.statNumber}>{CURRENT_USER.followers}</Text>
             <Text style={styles.statLabel}>Followers</Text>
           </View>
           <View style={styles.statItem}>
             <Text style={styles.statNumber}>{CURRENT_USER.likes}</Text>
             <Text style={styles.statLabel}>Likes</Text>
           </View>
        </View>
      </View>

      <View style={styles.bioContainer}>
        <Text style={styles.username}>{CURRENT_USER.username}</Text>
        <Text style={styles.bio}>{CURRENT_USER.bio}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}><Text style={styles.tagText}>♀ 24</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>New York</Text></View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
        <Pressable style={styles.editButton}>
          <Text style={styles.editButtonText}>Share Profile</Text>
        </Pressable>
      </View>

      {/* Tabs */}
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
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MasonryList
        data={displayNotes}
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
  headerContainer: {
    backgroundColor: Colors.light.background,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  bioContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 40,
  },
  tabItem: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 2,
    backgroundColor: Colors.light.tint,
  },
});
