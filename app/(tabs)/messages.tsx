import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getUserConversations } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { MOCK_USERS } from '@/mocks/data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABS = ['Notifications', 'Chats'];
const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'like', user: { username: 'fashion_daily', avatar: 'https://github.com/shadcn.png' }, text: 'liked your note.', time: '2m' },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Chats');
  const [chats, setChats] = useState<any[]>([]);
  
  // State for different loading types
  const [isRefreshing, setIsRefreshing] = useState(false); // For pull-to-refresh
  const [isInitialLoad, setIsInitialLoad] = useState(true); // For first mount

  useFocusEffect(
    React.useCallback(() => {
        if (user && activeTab === 'Chats') {
            // Pass false to not trigger the pull-down spinner on tab switch
            loadChats(false);
        }
    }, [user, activeTab])
  );

  const loadChats = async (showSpinner = false) => {
    if (!user) return;
    
    if (showSpinner) {
        setIsRefreshing(true);
    }

    try {
      // 1. Load Real Chats
      const dbChats = await getUserConversations(user.id);
      
      // 2. Load Mock Chats from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter(k => k.startsWith(`mock_chat_${user.id}_`));
      
      const mockChats = [];
      for (const key of chatKeys) {
          const otherUserId = key.split('_').pop();
          const mockUser = MOCK_USERS.find(u => u.id === otherUserId);
          const messagesStr = await AsyncStorage.getItem(key);
          const messages = messagesStr ? JSON.parse(messagesStr) : [];
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

          if (mockUser && lastMsg) {
              mockChats.push({
                  id: mockUser.id,
                  user: { id: mockUser.id, username: mockUser.username, avatar: mockUser.avatar },
                  lastMessage: lastMsg.text,
                  time: lastMsg.time,
                  unread: 0,
                  sender_id: lastMsg.sender === 'me' ? user.id : mockUser.id
              });
          }
      }

      setChats([...dbChats, ...mockChats]);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  };

  const handleChatPress = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const renderChat = ({ item }: any) => (
    <Pressable style={styles.chatItem} onPress={() => handleChatPress(item.user.id)}>
      <Image source={{ uri: item.user.avatar || 'https://ui-avatars.com/api/?name=User' }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatUsername}>{item.user.username}</Text>
          <Text style={styles.chatTime}>
             {item.time && item.time.includes && item.time.includes('T') ? new Date(item.time).toLocaleDateString() : item.time}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.sender_id === user?.id ? 'You: ' : ''}{item.lastMessage}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </Pressable>
        ))}
      </View>
      
      {activeTab === 'Chats' && (
        isInitialLoad && chats.length === 0 ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              renderItem={renderChat}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
              refreshing={isRefreshing}
              onRefresh={() => loadChats(true)}
            />
        )
      )}
      
      {activeTab === 'Notifications' && <Text style={styles.emptyText}>No notifications.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  tabsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tabItem: { alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  activeTabText: { color: Colors.light.text, fontWeight: 'bold' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 20, height: 3, backgroundColor: Colors.light.tint, borderRadius: 2 },
  listContent: { padding: 16 },
  chatItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  chatAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatUsername: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  chatTime: { fontSize: 12, color: '#999' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#666', flex: 1, marginRight: 8 },
  unreadMessage: { color: Colors.light.text, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});
