import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getUserConversations, getNotifications } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { MOCK_USERS } from '@/mocks/data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, MessageCircle, UserPlus } from 'lucide-react-native';

const TABS = ['Notifications', 'Chats'];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('Chats');
  
  // Data State
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Loading State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
        if (user) {
            if (activeTab === 'Chats') {
                loadChats(false);
            } else {
                loadNotifications(false);
            }
        }
    }, [user, activeTab])
  );

  const loadChats = async (showSpinner = false) => {
    if (!user) return;
    if (showSpinner) setIsRefreshing(true);

    try {
      const dbChats = await getUserConversations(user.id);
      
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

  const loadNotifications = async (showSpinner = false) => {
      if (!user) return;
      if (showSpinner) setIsRefreshing(true);
      
      try {
          const data = await getNotifications(user.id);
          setNotifications(data || []);
      } catch (error) {
          console.error("Error loading notifications", error);
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

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'like': return <Heart size={16} color="#fff" fill="#fff" />;
          case 'comment': return <MessageCircle size={16} color="#fff" fill="#fff" />;
          case 'follow': return <UserPlus size={16} color="#fff" fill="#fff" />;
          default: return <MessageCircle size={16} color="#fff" />;
      }
  };

  const getNotificationColor = (type: string) => {
      switch(type) {
          case 'like': return '#ff4757';
          case 'comment': return '#3b82f6';
          case 'follow': return '#2ed573';
          default: return '#999';
      }
  };

  const getNotificationText = (item: any) => {
      switch(item.type) {
          case 'like': return 'liked your post.';
          case 'comment': return `commented: "${item.content}"`;
          case 'follow': return 'started following you.';
          default: return 'interacted with you.';
      }
  };

  const renderNotification = ({ item }: any) => (
      <View style={styles.notificationItem}>
          <View style={styles.notifAvatarContainer}>
              <Image source={{ uri: item.actor?.avatar_url || 'https://ui-avatars.com/api/?name=User' }} style={styles.chatAvatar} />
              <View style={[styles.notifIconBadge, { backgroundColor: getNotificationColor(item.type) }]}>
                  {getNotificationIcon(item.type)}
              </View>
          </View>
          <View style={styles.notifContent}>
              <Text style={styles.notifText}>
                  <Text style={styles.notifUsername}>{item.actor?.username} </Text>
                  {getNotificationText(item)}
              </Text>
              <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          {item.type !== 'follow' && (
             <View style={styles.notifImagePlaceholder} /> 
          )}
      </View>
  );

  
  if (!loading && !user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <MessageCircle size={64} color="#ccc" />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginTop: 16 }}>
          Messages
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 12, paddingHorizontal: 32 }}>
          Sign in to view your messages and notifications
        </Text>
        <Pressable 
          style={{ backgroundColor: Colors.light.tint, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign In</Text>
        </Pressable>
      </View>
    );
  }


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
      
      {activeTab === 'Chats' ? (
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
      ) : (
        isInitialLoad && notifications.length === 0 ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotification}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
              refreshing={isRefreshing}
              onRefresh={() => loadNotifications(true)}
            />
        )
      )}
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
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  
  notificationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  notifAvatarContainer: { position: 'relative', marginRight: 12 },
  notifIconBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, color: '#333', lineHeight: 20 },
  notifUsername: { fontWeight: 'bold' },
  notifTime: { fontSize: 12, color: '#999', marginTop: 2 },
  notifImagePlaceholder: { width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 8 },
});
