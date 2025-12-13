import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Share } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, Bookmark, MessageCircle, Share2, MoreVertical, Volume2, VolumeX, Play, Pause } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Note } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelCardProps {
    note: Note;
    isActive: boolean;
    onLike?: () => void;
    onCollect?: () => void;
    onComment?: () => void;
    isLiked?: boolean;
    isCollected?: boolean;
}

export const ReelCard = ({
    note,
    isActive,
    onLike,
    onCollect,
    onComment,
    isLiked = false,
    isCollected = false,
}: ReelCardProps) => {
    const router = useRouter();
    
    // UI States
    const [isMuted, setIsMuted] = useState(false);
    const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);
    
    // Animation values
    const controlIconOpacity = useRef(new Animated.Value(0)).current;
    const likeButtonScale = useRef(new Animated.Value(1)).current;

    // 1. Detect if the media is a video
    const isVideo = useMemo(() => {
        const uri = note.media[0] || '';
        const lower = uri.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
    }, [note.media]);

    // 2. Setup Video Player
    const player = useVideoPlayer(isVideo ? note.media[0] : null, player => {
        player.loop = true;
        player.muted = isMuted;
    });

    // 3. Handle Scroll Active State
    useEffect(() => {
        if (!isVideo) return;
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isVideo, player]);

    // 4. Handle Mute Toggle
    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        player.muted = newMutedState;
    };

    // 5. Handle Play/Pause Tap
    const togglePlayback = () => {
        if (!isVideo) return;

        if (player.playing) {
            player.pause();
            showIconAnimation('pause');
        } else {
            player.play();
            showIconAnimation('play');
        }
    };

    const showIconAnimation = (type: 'play' | 'pause') => {
        setShowControlIcon(type);
        controlIconOpacity.setValue(1);
        Animated.sequence([
            Animated.timing(controlIconOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(600),
            Animated.timing(controlIconOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowControlIcon(null));
    };

    const handleLikePress = () => {
        onLike?.();
        Animated.sequence([
            Animated.spring(likeButtonScale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
            Animated.spring(likeButtonScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
        ]).start();
    };

    const handleUserPress = () => router.push(`/user/${note.userId}`);

    const handleSharePress = async () => {
        try {
            await Share.share({
                message: `Check out this post by @${note.user.username} on Pixo!`,
                url: note.media[0],
                title: note.title,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <View style={styles.container}>
            <Pressable style={styles.imagePressable} onPress={togglePlayback}>
                {isVideo ? (
                    <VideoView
                        style={styles.image}
                        player={player}
                        contentFit="cover"
                        nativeControls={false}
                    />
                ) : (
                    <Image
                        source={{ uri: note.media[0] }}
                        style={styles.image}
                        contentFit="cover"
                    />
                )}

                {/* Play/Pause Center Icon Animation */}
                {showControlIcon && (
                    <View style={styles.centerIconContainer} pointerEvents="none">
                        <Animated.View style={{ opacity: controlIconOpacity, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 50 }}>
                            {showControlIcon === 'play' ? (
                                <Play size={40} color="#fff" fill="#fff" />
                            ) : (
                                <Pause size={40} color="#fff" fill="#fff" />
                            )}
                        </Animated.View>
                    </View>
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                    style={styles.bottomGradient}
                    pointerEvents="none"
                />

                {/* Mute Button (Bottom Right of Video Area) */}
                {isVideo && (
                    <Pressable 
                        style={styles.muteButton} 
                        onPress={(e) => {
                            e.stopPropagation(); // Prevent triggering play/pause
                            toggleMute();
                        }}
                        hitSlop={20}
                    >
                        <View style={styles.muteIconWrapper}>
                            {isMuted ? (
                                <VolumeX size={20} color="#fff" />
                            ) : (
                                <Volume2 size={20} color="#fff" />
                            )}
                        </View>
                    </Pressable>
                )}
            </Pressable>

            {/* Right Side Actions */}
            <View style={styles.actionsContainer}>
                <Pressable onPress={handleUserPress} style={styles.actionButton}>
                    <Image source={{ uri: note.user.avatar }} style={styles.userAvatar} />
                </Pressable>

                <Pressable onPress={handleLikePress} style={styles.actionButton}>
                    <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
                        <Heart size={32} color="#fff" fill={isLiked ? '#ff2d55' : 'transparent'} stroke={isLiked ? '#ff2d55' : '#fff'} strokeWidth={2} />
                    </Animated.View>
                    <Text style={styles.actionText}>{formatCount(note.likes)}</Text>
                </Pressable>

                <Pressable onPress={onCollect} style={styles.actionButton}>
                    <Bookmark size={30} color="#fff" fill={isCollected ? '#facc15' : 'transparent'} stroke={isCollected ? '#facc15' : '#fff'} strokeWidth={2} />
                    <Text style={styles.actionText}>{formatCount(note.collects)}</Text>
                </Pressable>

                <Pressable onPress={onComment} style={styles.actionButton}>
                    <MessageCircle size={30} color="#fff" strokeWidth={2} />
                    <Text style={styles.actionText}>{formatCount(note.commentsCount)}</Text>
                </Pressable>

                <Pressable onPress={handleSharePress} style={styles.actionButton}>
                    <Share2 size={28} color="#fff" strokeWidth={2} />
                    <Text style={styles.actionText}>Share</Text>
                </Pressable>

                <Pressable style={styles.actionButton}>
                    <MoreVertical size={28} color="#fff" strokeWidth={2} />
                </Pressable>
            </View>

            {/* Bottom Info */}
            <View style={styles.infoContainer}>
                <Pressable onPress={handleUserPress} style={styles.userInfo}>
                    <Image source={{ uri: note.user.avatar }} style={styles.bottomAvatar} />
                    <Text style={styles.username}>@{note.user.username}</Text>
                </Pressable>
                <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
                <Text style={styles.description} numberOfLines={3}>{note.description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
    imagePressable: { flex: 1, width: '100%', height: '100%' },
    image: { width: '100%', height: '100%', backgroundColor: '#1a1a1a' },
    centerIconContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
    bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
    
    // Mute Button Styles
    muteButton: {
        position: 'absolute',
        bottom: 140, // Above bottom gradient/info
        right: 16, // Left of action buttons
        zIndex: 60,
    },
    muteIconWrapper: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
    },

    actionsContainer: { position: 'absolute', right: 12, bottom: 120, gap: 20, alignItems: 'center', zIndex: 50 },
    actionButton: { alignItems: 'center', gap: 4 },
    userAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff', marginBottom: 10 },
    actionText: { color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width:0,height:1}, textShadowRadius:3 },
    
    infoContainer: { position: 'absolute', left: 12, right: 80, bottom: 120, gap: 8, zIndex: 50 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    bottomAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#fff' },
    username: { color: '#fff', fontSize: 15, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width:0,height:1}, textShadowRadius:3 },
    title: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width:0,height:1}, textShadowRadius:3 },
    description: { color: '#fff', fontSize: 14, lineHeight: 18, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width:0,height:1}, textShadowRadius:3 },
});
