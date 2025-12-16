import { supabase } from './supabase';
import { uploadImage } from './storage';
import { setReferral } from './database'; // Import the new function

const phoneRegex = /^\+?[0-9]{7,15}$/;

export async function signUp(params: { identifier: string; password: string; username: string; dateOfBirth?: string; avatarUri?: string; referralCode?: string }) {
  const isPhone = phoneRegex.test(params.identifier);
  const signUpPayload = isPhone
    ? { phone: params.identifier, password: params.password }
    : { email: params.identifier, password: params.password, options: { emailRedirectTo: undefined } };

  const { data: authData, error: authError } = await supabase.auth.signUp(signUpPayload);

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('This email/phone is already registered. Please sign in instead.');
    } else if (authError.message.includes('Password')) {
      throw new Error('Password must be at least 6 characters long.');
    }
    throw authError;
  }

  if (!authData.user) throw new Error('Failed to create user');

  let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(params.username)}&background=random`;

  if (params.avatarUri) {
    try {
      avatarUrl = await uploadImage(authData.user.id, params.avatarUri, 'avatar.jpg');
    } catch (err) {
      console.error('Avatar upload failed, using default:', err);
    }
  }

  // Create or update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      username: params.username,
      display_name: params.username,
      avatar_url: avatarUrl,
      date_of_birth: params.dateOfBirth ?? null,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile creation error:', profileError);
  }
  
  // === REFERRAL HANDLING ===
  if (params.referralCode) {
      await setReferral(authData.user.id, params.referralCode);
  }

  // Check if email verification is required
  if (!isPhone && authData.user && !authData.session) {
    throw new Error('VERIFICATION_REQUIRED:Please check your email for a verification link before logging in.');
  }

  return authData;
}

export async function signIn(identifier: string, password: string) {
  const isPhone = phoneRegex.test(identifier);

  let data, error;

  if (isPhone) {
    const result = await supabase.auth.signInWithPassword({
      phone: identifier,
      password,
    });
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    data = result.data;
    error = result.error;
  }

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email/phone or password. Please try again.');
    } else if (error.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email before logging in. Check your inbox for a verification link.');
    }
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}
