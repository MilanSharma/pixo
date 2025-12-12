import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Heart, UserPlus, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getUserConversations } from '@/lib/database';
import { supabase } from '@/lib/supabase';

const TABS = ['Notifications', 'Chats'];

// Keep mock notifications for now as we don't have a notifications table yet
const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'like', user: { username: 'fashion_daily', avatar: 'https://github.com/shadcn.png' }, text: 'liked your note.', time: '2m' },
  { id: '2', type: 'follow', user: { username: 'cafe_hopper', avatar: 'https://github.com/shadcn.png' }, text: 'started following you.', time: '1h' },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Chats'); // Default to Chats to see functionality
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'Chats') {
      loadChats();
      
      // Subscribe to new messages to update the list live
      const channel = supabase.channel('inbox_updates')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`, 
            },
            () => loadChats() // Reload list on new message
        )
        .subscribe();

        return () => { supabase.removeChannel(channel); };
    }
  }, [user, activeTab]);

  const loadChats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserConversations(user.id);
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const renderNotification = ({ item }: any) => (
      <View style={styles.notificationItem}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.user.username}</Text> {item.text}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
  );

  const renderChat = ({ item }: any) => {
    const time = new Date(item.time);
    const timeString = time.toLocaleDateString() === new Date().toLocaleDateString()
      ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : time.toLocaleDateString();

    return (
    <Pressable style={styles.chatItem} onPress={() => handleChatPress(item.user.id)}>
      <Image source={{ uri: item.user.avatar }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatUsername}>{item.user.username}</Text>
          <Text style={styles.chatTime}>{timeString}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[
            styles.lastMessage, 
            item.unread > 0 && styles.unreadMessage
          ]} numberOfLines={1}>
            {item.sender_id === user?.id ? 'You: ' : ''}{item.lastMessage}
          </Text>
        </View>
      </View>
    </Pressable>
  )};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

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

      {activeTab === 'Notifications' ? (
        <FlatList
          data={MOCK_NOTIFICATIONS}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={{ flex: 1 }}>
            {loading && chats.length === 0 ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={Colors.light.tint} />
            ) : (
                <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderChat}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No messages yet. Start a conversation from a profile!</Text>
                }
                />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
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
    width: 20,
    height: 3,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  username: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  }
});
