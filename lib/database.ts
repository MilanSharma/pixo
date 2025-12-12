import { supabase } from './supabase';

export async function getNotes(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getNoteById(id: string) {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url,
        followers_count
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createNote(userId: string, note: {
  title: string;
  content?: string;
  images: string[];
  category?: string;
  location?: string;
  productTags?: string[];
}) {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: note.title,
      content: note.content,
      images: note.images,
      category: note.category,
      location: note.location,
      product_tags: note.productTags,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function likeNote(userId: string, noteId: string) {
  const { error: likeError } = await supabase
    .from('likes')
    .insert({ user_id: userId, note_id: noteId });

  if (likeError) {
    if (likeError.code === '23505') {
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('note_id', noteId);
      if (unlikeError) throw unlikeError;
      await supabase.rpc('decrement_likes', { note_id: noteId });
      return false;
    }
    throw likeError;
  }

  await supabase.rpc('increment_likes', { note_id: noteId });
  return true;
}

export async function collectNote(userId: string, noteId: string) {
  const { error: collectError } = await supabase
    .from('collects')
    .insert({ user_id: userId, note_id: noteId });

  if (collectError) {
    if (collectError.code === '23505') {
      const { error: uncollectError } = await supabase
        .from('collects')
        .delete()
        .eq('user_id', userId)
        .eq('note_id', noteId);
      if (uncollectError) throw uncollectError;
      await supabase.rpc('decrement_collects', { note_id: noteId });
      return false;
    }
    throw collectError;
  }

  await supabase.rpc('increment_collects', { note_id: noteId });
  return true;
}

export async function followUser(followerId: string, followingId: string) {
  const { error: followError } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (followError) {
    if (followError.code === '23505') {
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (unfollowError) throw unfollowError;
      return false;
    }
    throw followError;
  }

  return true;
}

export async function getComments(noteId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addComment(userId: string, noteId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      note_id: noteId,
      content,
    })
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;

  await supabase
    .from('notes')
    .update({ comments_count: supabase.rpc('increment_value', { row_id: noteId }) })
    .eq('id', noteId);

  return data;
}

export async function getUserNotes(userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserCollections(userId: string) {
  const { data, error } = await supabase
    .from('collects')
    .select(`
      notes (
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(c => c.notes) || [];
}

export async function getUserLikes(userId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      notes (
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .not('note_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(l => l.notes) || [];
}

export async function checkUserInteractions(userId: string, noteId: string) {
  const [likeResult, collectResult] = await Promise.all([
    supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .maybeSingle(),
    supabase
      .from('collects')
      .select('id')
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .maybeSingle(),
  ]);

  return {
    isLiked: !!likeResult.data,
    isCollected: !!collectResult.data,
  };
}

export async function searchNotes(query: string) {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function getProducts(limit = 20) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getChatMessages(userId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserConversations(userId: string) {
  // Fetch all messages where user is sender or receiver
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, username, avatar_url),
      receiver:receiver_id(id, username, avatar_url)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by the "other" user to get the latest message for each conversation
  const conversationsMap = new Map();

  messages.forEach((msg: any) => {
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
    
    // Safety check if user relation is missing
    if (!otherUser) return;

    const otherUserId = otherUser.id;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        id: otherUserId, // Use other user's ID as conversation ID for simplicity in routing
        user: {
            id: otherUser.id,
            username: otherUser.username || 'Unknown',
            avatar: otherUser.avatar_url || 'https://ui-avatars.com/api/?name=User'
        },
        lastMessage: msg.content,
        time: msg.created_at,
        unread: 0, // Real unread count would require a separate 'read_at' field logic
        sender_id: msg.sender_id // to check if last message was from me
      });
    }
  });

  return Array.from(conversationsMap.values());
}
