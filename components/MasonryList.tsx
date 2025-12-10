import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NoteCard } from './NoteCard';
import { Note } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MasonryListProps {
  data: Note[];
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactNode;
}

export const MasonryList = ({ data, onRefresh, refreshing, ListHeaderComponent }: MasonryListProps) => {
  const insets = useSafeAreaInsets();
  
  const [column1, column2] = useMemo(() => {
    const col1: Note[] = [];
    const col2: Note[] = [];

    data.forEach((item, index) => {
      if (index % 2 === 0) {
        col1.push(item);
      } else {
        col2.push(item);
      }
    });

    return [col1, col2];
  }, [data]);

  return (
    <ScrollView
      contentContainerStyle={{ 
        paddingHorizontal: 10, 
        paddingTop: 10,
        paddingBottom: insets.bottom + 60 // Add bottom padding for tab bar
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {ListHeaderComponent}
      <View style={styles.container}>
        <View style={styles.column}>
          {column1.map((item) => (
            <NoteCard key={item.id} note={item} />
          ))}
        </View>
        <View style={styles.column}>
          {column2.map((item) => (
            <NoteCard key={item.id} note={item} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48.5%', // Slightly less than 50% to account for gap
  },
});
