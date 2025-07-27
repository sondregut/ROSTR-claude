import React from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  Text,
  Platform
} from 'react-native';
import { DateCard } from '../cards/DateCard';
import { Colors } from '../../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DateEntry {
  id: string;
  personName: string;
  date: string;
  location: string;
  rating?: number;
  notes?: string;
  imageUri?: string;
  tags?: string[];
  instagramUsername?: string;
  authorName?: string;
  authorAvatar?: string;
  poll?: {
    question: string;
    options: {
      text: string;
      votes: number;
    }[];
  };
  userPollVote?: number | null;
  comments?: {
    name: string;
    content: string;
  }[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

interface DateFeedProps {
  data: DateEntry[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onDatePress?: (dateId: string) => void;
  onPersonPress?: (personName: string) => void;
  onPersonHistoryPress?: (personName: string) => void;
  onAuthorPress?: (authorName: string) => void;
  onLike?: (dateId: string) => void;
  onComment?: (dateId: string) => void;
  onPollVote?: (dateId: string, optionIndex: number) => void;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
}

export function DateFeed({
  data,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  onDatePress,
  onPersonPress,
  onPersonHistoryPress,
  onAuthorPress,
  onLike,
  onComment,
  onPollVote,
  ListEmptyComponent,
  ListHeaderComponent,
}: DateFeedProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();

  const renderItem = ({ item }: { item: DateEntry }) => (
    <DateCard
      id={item.id}
      personName={item.personName}
      date={item.date}
      location={item.location}
      rating={item.rating}
      notes={item.notes}
      imageUri={item.imageUri}
      tags={item.tags}
      instagramUsername={item.instagramUsername}
      authorName={item.authorName}
      authorAvatar={item.authorAvatar}
      poll={item.poll}
      userPollVote={item.userPollVote}
      comments={item.comments}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      isLiked={item.isLiked}
      onPress={() => onDatePress?.(item.id)}
      onPersonPress={() => onPersonPress?.(item.personName)}
      onPersonHistoryPress={() => onPersonHistoryPress?.(item.personName)}
      onAuthorPress={() => onAuthorPress?.(item.authorName || item.personName)}
      onLike={() => onLike?.(item.id)}
      onComment={() => onComment?.(item.id)}
      onPollVote={onPollVote}
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    if (ListEmptyComponent) {
      return ListEmptyComponent;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No dates to show
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.contentContainer, 
            data.length === 0 ? styles.emptyListContent : null
          ]}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={renderEmpty()}
          ListFooterComponent={renderFooter()}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Adjust for tab bar height
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
