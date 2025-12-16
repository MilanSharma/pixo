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

// === PRODUCTS ===

export async function createProduct(userId: string, product: {
  title: string;
  description?: string;
  price: number;
  image: string;
  brandName?: string;
  externalUrl?: string;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      title: product.title,
      description: product.description,
      price: product.price,
      image: product.image,
      brand_name: product.brandName,
      external_url: product.externalUrl,
      in_stock: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProducts(userId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
  return true;
}

export async function getProductByTitle(title: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .ilike('title', title) 
    .limit(1)
    .maybeSingle();

  if (error) {
      console.error(error);
      return null;
  }
  return data;
}

export async function getProductById(id: string) {
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
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Search functionality for tagging
export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('title', `%${query}%`)
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

export async function trackProductClick(productId: string) {
  const { error } = await supabase.rpc('increment_product_clicks', { row_id: productId });
  if (error) console.error("Error tracking click:", error);
}

// === END PRODUCTS ===

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

  const conversationsMap = new Map();

  messages.forEach((msg: any) => {
    const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
    
    if (!otherUser) return;

    const otherUserId = otherUser.id;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        id: otherUserId,
        user: {
            id: otherUser.id,
            username: otherUser.username || 'Unknown',
            avatar: otherUser.avatar_url || 'https://ui-avatars.com/api/?name=User'
        },
        lastMessage: msg.content,
        time: msg.created_at,
        unread: 0,
        sender_id: msg.sender_id
      });
    }
  });

  return Array.from(conversationsMap.values());
}


export async function getFollowStatus(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  
  if (error) {
     console.error('Error checking follow status:', error);
     return false;
  }
  return !!data;
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// === TRUST & SAFETY ===
export async function reportContent(userId: string, targetId: string, type: 'product' | 'note' | 'user', reason: string) {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: userId,
      target_id: targetId,
      target_type: type,
      reason: reason
    });
  
  if (error) throw error;
  return true;
}

export async function getVerifiedStatus(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', userId)
    .single();
  return data?.is_verified || false;
}

// === REFERRAL SYSTEM ===
export async function checkReferralCode(code: string) {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();
    
  if (error || !data) return false;
  return true;
}

export async function setReferral(userId: string, code: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
        referred_by: code.toUpperCase(),
        is_verified: true 
    })
    .eq('id', userId);
    
  if (error) console.error("Error setting referral:", error);
}

// === CREATOR PORTAL ===
export async function getMyReferralCode(userId: string) {
  const { data } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('owner_id', userId)
    .single();
  return data;
}

export async function getReferralCount(code: string) {
  const { data, error } = await supabase.rpc('get_referral_count', { ref_code: code });
  if (error) return 0;
  return data;
}

// === SAAS & MONETIZATION LOGIC ===

export async function checkProductLimit(userId: string) {
  // 1. Get User Tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (profile?.subscription_tier === 'pro') return true; // Unlimited

  // 2. Count Products
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return false;
  
  // Limit is 3 for free users
  return (count || 0) < 3;
}

export async function purchaseSubscription(userId: string) {
  // 1. Update User to Pro
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: 'pro' })
    .eq('id', userId);

  if (error) throw error;

  // 2. Handle Referral Cut (The "Influencer Logic")
  // Fetch who referred this user
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .single();

  if (userProfile?.referred_by) {
    // Find the influencer
    const { data: refCode } = await supabase
      .from('referral_codes')
      .select('owner_id')
      .eq('code', userProfile.referred_by)
      .single();

    if (refCode) {
      // Give them $2 (20% of $10)
      await supabase.rpc('increment_wallet', { 
        row_id: refCode.owner_id, 
        amount: 2.00 
      });
      
      // Log the earning
      await supabase.from('transactions').insert({
        user_id: refCode.owner_id,
        amount: 2.00,
        type: 'referral_bonus',
        description: 'Commission from new Pro subscriber'
      });
    }
  }

  return true;
}

export async function boostProduct(userId: string, productId: string) {
  // 1. Mark product as promoted
  const { error } = await supabase
    .from('products')
    .update({ 
      is_promoted: true,
      promoted_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 Days
    })
    .eq('id', productId);

  if (error) throw error;

  return true;
}

export async function getWalletData(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();
    
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    balance: profile?.wallet_balance || 0,
    transactions: transactions || []
  };
}

export async function cancelSubscription(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

// === TRUST & SAFETY (BLOCKING & DELETION) ===

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  
  if (error) throw error;
  return true;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) throw error;
  return true;
}

export async function getBlockedUsers(userId: string) {
  // 1. Get blocked IDs
  const { data: blocks, error: blockError } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);

  if (blockError) throw blockError;
  if (!blocks || blocks.length === 0) return [];

  const blockedIds = blocks.map(b => b.blocked_id);

  // 2. Get Profiles for those IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', blockedIds);
    
  if (profileError) throw profileError;
  return profiles || [];
}

export async function deleteAccount(userId: string) {
  // 1. Delete Profile (Cascades to most data usually, but explicit safety here)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  // Note: Actual Auth User deletion requires Admin API or Edge Function.
  // Deleting the profile effectively "kills" the account in the app.
  
  if (error) throw error;
  return true;
}
