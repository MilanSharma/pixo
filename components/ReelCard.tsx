import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Image, Share, Alert } from 'react-native';
import { Heart, Bookmark, MessageCircle, Share2, MoreVertical } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Note } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelCardProps {
    note: Note;
    isActive: boolean;
    onLike?: () => void;
    onCollect?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    isLiked?: boolean;
    isCollected?: boolean;
}

export const ReelCard = ({
    note,
    isActive,
    onLike,
    onCollect,
    onComment,
    onShare,
    isLiked = false,
    isCollected = false,
}: ReelCardProps) => {
    const router = useRouter();
    
    // Animation values
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const likeButtonScale = useRef(new Animated.Value(1)).current;

    // Trigger the big heart animation in the center
    const animateHeart = () => {
        scale.setValue(0);
        opacity.setValue(0);

        Animated.sequence([
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
                Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]),
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(scale, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
        ]).start();
    };

    const handleDoubleTap = () => {
        // If not liked yet, like it. 
        // Standard UX: Double tap usually only "Likes", it doesn't "Unlike".
        if (!isLiked) {
            onLike?.();
        }
        animateHeart();
    };

    const handleLikePress = () => {
        // This toggles the like state in the parent
        onLike?.();
        
        // Bounce animation for the side button
        Animated.sequence([
            Animated.spring(likeButtonScale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
            Animated.spring(likeButtonScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
        ]).start();
    };

    const handleCollectPress = () => {
        onCollect?.();
    };

    const handleUserPress = () => {
        router.push(`/user/${note.userId}`);
    };

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

    const handleMorePress = () => {
        Alert.alert('Options', undefined, [
            { text: 'Report', style: 'destructive' },
            { text: 'Not Interested' },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.imagePressable}
                onPress={handleDoubleTap}
                // Reduce delay to make double tap snappier if supported, 
                // but standard Pressable doesn't support double tap natively easily without GestureHandler.
                // We simulate it or rely on the logic that a single press triggers this if configured.
                // For simplicity here, we assume single press interactions are reserved for specific zones 
                // or we treat a press here as a potential double tap area.
            >
                <Image
                    source={{ uri: note.media[0] }}
                    style={styles.image}
                    resizeMode="cover"
                />

                {/* Big Animated Heart in Center */}
                <View style={styles.centerHeartContainer} pointerEvents="none">
                    <Animated.View style={{ transform: [{ scale }], opacity }}>
                        <Heart
                            size={100}
                            color="#fff"
                            fill="rgba(255, 255, 255, 0.9)"
                            strokeWidth={0}
                        />
                    </Animated.View>
                </View>

                {/* Gradient overlay for bottom text visibility */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                    style={styles.bottomGradient}
                    pointerEvents="none"
                />
            </Pressable>

            {/* Right side action buttons */}
            <View style={styles.actionsContainer}>
                <Pressable onPress={handleUserPress} style={styles.actionButton}>
                    <Image
                        source={{ uri: note.user.avatar }}
                        style={styles.userAvatar}
                    />
                </Pressable>

                <Pressable onPress={handleLikePress} style={styles.actionButton}>
                    <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
                        <Heart
                            size={32}
                            color="#fff"
                            fill={isLiked ? '#ff2d55' : 'transparent'}
                            stroke={isLiked ? '#ff2d55' : '#fff'}
                            strokeWidth={2}
                        />
                    </Animated.View>
                    <Text style={styles.actionText}>{formatCount(note.likes)}</Text>
                </Pressable>

                <Pressable onPress={handleCollectPress} style={styles.actionButton}>
                    <Bookmark
                        size={30}
                        color="#fff"
                        fill={isCollected ? '#facc15' : 'transparent'}
                        stroke={isCollected ? '#facc15' : '#fff'}
                        strokeWidth={2}
                    />
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

                <Pressable onPress={handleMorePress} style={styles.actionButton}>
                    <MoreVertical size={28} color="#fff" strokeWidth={2} />
                </Pressable>
            </View>

            {/* Bottom info section */}
            <View style={styles.infoContainer}>
                <Pressable onPress={handleUserPress} style={styles.userInfo}>
                    <Image
                        source={{ uri: note.user.avatar }}
                        style={styles.bottomAvatar}
                    />
                    <Text style={styles.username}>@{note.user.username}</Text>
                    {note.user.isVerified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓</Text>
                        </View>
                    )}
                </Pressable>

                <Text style={styles.title} numberOfLines={2}>
                    {note.title}
                </Text>

                <Text style={styles.description} numberOfLines={3}>
                    {note.description}
                </Text>

                {note.location && (
                    <View style={styles.locationContainer}>
                        <Text style={styles.locationText}>📍 {note.location}</Text>
                    </View>
                )}

                {note.tags && note.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {note.tags.slice(0, 3).map((tag, index) => (
                            <Text key={index} style={styles.tag}>
                                #{tag}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#000',
    },
    imagePressable: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: undefined,
        height: undefined,
    },
    centerHeartContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    bottomGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    actionsContainer: {
        position: 'absolute',
        right: 12,
        bottom: 120, // Sit above bottom tabs
        gap: 20,
        alignItems: 'center',
        zIndex: 50,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
        marginBottom: 10,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    infoContainer: {
        position: 'absolute',
        left: 12,
        right: 80,
        bottom: 40, // Increased bottom padding
        gap: 8,
        zIndex: 50,
        marginBottom: 50, // Space for bottom tab bar
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    bottomAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    username: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    verifiedBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 18,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    locationContainer: {
        marginTop: 4,
    },
    locationText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
