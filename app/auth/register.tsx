import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { signUp } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, User, Camera, ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { z } from 'zod';

const accountSchema = z.object({
  identifier: z.string().min(1, 'Enter email or phone').refine((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  }, 'Enter a valid email or phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, { message: 'Passwords must match', path: ['confirm'] });

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Account', 'Profile', 'Photo'];

  const isOver13 = () => {
    if (!dob) return false;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return false;
    const now = new Date();
    const thirteenYears = 13 * 365.25 * 24 * 60 * 60 * 1000;
    return now.getTime() - birth.getTime() >= thirteenYears;
  };

  const handleNextFromStep1 = () => {
    const parsed = accountSchema.safeParse({ identifier, password, confirm: confirmPassword });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Check your inputs';
      setError(firstError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!isOver13()) {
      setError('You must be at least 13 years old');
      return;
    }
    setError('');
    setStep(3);
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!identifier || !password || !username || !isOver13()) {
      setError('Please complete all steps');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp({
        identifier,
        password,
        username: username.trim(),
        dateOfBirth: dob,
        avatarUri: avatar || undefined,
      });

      // If successful and session exists, go to main app
      Alert.alert(
        'Account Created!',
        'Welcome to Pixo! Your account has been created successfully.',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      // Check if this is a verification required error
      if (err.message && err.message.startsWith('VERIFICATION_REQUIRED:')) {
        const message = err.message.replace('VERIFICATION_REQUIRED:', '');
        Alert.alert(
          'Verify Your Email',
          message + '\n\nOnce verified, you can log in.',
          [{ text: 'Go to Login', onPress: () => router.replace('/auth/login') }]
        );
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Set up your login</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Email or phone"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextFromStep1}>
            <Text style={styles.nextText}>Continue</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Your profile</Text>
          <View style={styles.inputRow}>
            <User size={18} color="#777" />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputRow}>
            <Calendar size={18} color="#777" />
            <TextInput
              style={styles.input}
              placeholder="Date of birth (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={dob}
              onChangeText={setDob}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextFromStep2}>
            <Text style={styles.nextText}>Continue</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <ArrowLeft size={16} color="#111" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.stepTitle}>Add a profile photo</Text>
        <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={26} color="#555" />
              <Text style={styles.avatarText}>Upload photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.nextText}>Create account</Text>
              <Check size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <ArrowLeft size={16} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#f7f8fa', '#eef2f5']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backCircle}>
            <ArrowLeft size={20} color="#111" />
          </TouchableOpacity>
          <View style={styles.brandBlock}>
            <Text style={styles.logo}>pixo</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.stepper}>
            {steps.map((label, index) => {
              const current = index + 1;
              const active = current === step;
              const done = current < step;
              return (
                <View key={label} style={styles.stepItem}>
                  <View style={[styles.stepCircle, active && styles.stepCircleActive, done && styles.stepCircleDone]}>
                    {done ? <Check size={14} color="#fff" /> : <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{current}</Text>}
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
                </View>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {renderStepContent()}

          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.footerLink}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.footerBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 32,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepCircleActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  stepCircleDone: {
    borderColor: '#16a34a',
    backgroundColor: '#16a34a',
  },
  stepNumber: {
    fontWeight: '700',
    color: '#6b7280',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  error: {
    color: '#d14343',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eceef1',
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  nextButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarPicker: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#f7f7f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  avatarText: {
    color: '#555',
    fontWeight: '600',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  footerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  footerText: {
    color: '#444',
    fontSize: 14,
  },
  footerBold: {
    color: '#111827',
    fontWeight: '700',
  },
});