import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Heart, UserPlus, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_USERS } from '@/mocks/data';
import { useRouter } from 'expo-router';

const TABS = ['Notifications', 'Chats'];

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'like', user: MOCK_USERS[1], text: 'liked your note.', time: '2m', noteId: 'n1' },
  { id: '2', type: 'follow', user: MOCK_USERS[2], text: 'started following you.', time: '1h' },
  { id: '3', type: 'comment', user: MOCK_USERS[3], text: 'commented: "Love this!"', time: '3h', noteId: 'n3' },
  { id: '4', type: 'like', user: MOCK_USERS[1], text: 'liked your note.', time: '5h', noteId: 'n5' },
];

const MOCK_CHATS = [
  { id: 'c1', user: MOCK_USERS[1], lastMessage: 'Hey, where did you get that?', time: '2m', unread: 2 },
  { id: 'c2', user: MOCK_USERS[2], lastMessage: 'Thanks for sharing!', time: '1d', unread: 0 },
  { id: 'c3', user: MOCK_USERS[3], lastMessage: 'See you there.', time: '3d', unread: 0 },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Notifications');

  const handleNotificationPress = (notification: any) => {
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.noteId) {
        router.push(`/note/${notification.noteId}`);
      }
    } else if (notification.type === 'follow') {
      Alert.alert('User Profile', `${notification.user.username}\n\nFollowers: ${notification.user.followers}\nFollowing: ${notification.user.following}`);
    }
  };

  const handleChatPress = (chat: any) => {
    Alert.alert(
      `Chat with ${chat.user.username}`,
      'Direct messaging is coming soon!',
      [{ text: 'OK' }]
    );
  };

  const renderNotification = ({ item }: any) => {
    let Icon;
    let iconColor;
    
    switch(item.type) {
      case 'like': Icon = Heart; iconColor = Colors.light.tint; break;
      case 'follow': Icon = UserPlus; iconColor = Colors.light.blue; break;
      case 'comment': Icon = MessageCircle; iconColor = Colors.light.secondary; break;
      default: Icon = Heart; iconColor = Colors.light.tint;
    }

    return (
      <Pressable style={styles.notificationItem} onPress={() => handleNotificationPress(item)}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          <View style={[styles.iconBadge, { backgroundColor: iconColor }]}>
            <Icon size={10} color="#fff" fill={iconColor} />
          </View>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.user.username}</Text> {item.text}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=100&auto=format&fit=crop' }} 
          style={styles.notificationImage} 
        />
      </Pressable>
    );
  };

  const renderChat = ({ item }: any) => (
    <Pressable style={styles.chatItem} onPress={() => handleChatPress(item)}>
      <Image source={{ uri: item.user.avatar }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatUsername}>{item.user.username}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
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
        <FlatList
          data={MOCK_CHATS}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.listContent}
        />
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
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
  notificationImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: 8,
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
  unreadBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});