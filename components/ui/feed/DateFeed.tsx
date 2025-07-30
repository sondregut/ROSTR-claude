import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { DateCard } from '../cards/DateCard';
import PlanCard from '../cards/PlanCard';
import { RosterCard } from '../cards/RosterCard';

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
  isOwnPost?: boolean;
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
  entryType?: 'date' | 'roster_addition' | 'plan';
  rosterInfo?: {
    age?: number;
    occupation?: string;
    howWeMet?: string;
    interests?: string;
    instagram?: string;
    phone?: string;
    photos?: string[];
  };
  // Plan-specific fields
  time?: string;
  content?: string;
  rawDate?: string;
  isCompleted?: boolean;
}

interface DateFeedProps {
  data: DateEntry[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onDatePress?: (dateId: string) => void;
  onPersonPress?: (personName: string, authorName?: string) => void;
  onPersonHistoryPress?: (personName: string, authorName?: string) => void;
  onAuthorPress?: (authorName: string) => void;
  onLike?: (dateId: string) => void;
  onSubmitComment?: (dateId: string, text: string) => Promise<void>;
  onEdit?: (dateId: string) => void;
  onEditRoster?: (dateId: string) => void;
  onLikePlan?: (planId: string) => void;
  onSubmitPlanComment?: (planId: string, text: string) => Promise<void>;
  onEditPlan?: (planId: string) => void;
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
  onSubmitComment,
  onEdit,
  onEditRoster,
  onLikePlan,
  onSubmitPlanComment,
  onEditPlan,
  onPollVote,
  ListEmptyComponent,
  ListHeaderComponent,
}: DateFeedProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();

  const renderItem = ({ item }: { item: DateEntry }) => {
    if (item.entryType === 'roster_addition') {
      return (
        <RosterCard
          id={item.id}
          personName={item.personName}
          date={item.date}
          authorName={item.authorName || 'Unknown'}
          authorAvatar={item.authorAvatar}
          isOwnPost={item.isOwnPost}
          imageUri={item.imageUri}
          rosterInfo={item.rosterInfo}
          onPress={() => onDatePress?.(item.id)}
          onPersonPress={() => onPersonPress?.(item.personName, item.authorName)}
          onAuthorPress={() => onAuthorPress?.(item.authorName || item.personName)}
          onLike={() => {
            console.log('🔍 DateFeed: onLike called for item:', item.id, item.personName);
            onLike?.(item.id);
          }}
          onSubmitComment={onSubmitComment ? (text) => onSubmitComment(item.id, text) : undefined}
          onEdit={item.isOwnPost && onEditRoster ? () => onEditRoster(item.id) : undefined}
          likeCount={item.likeCount}
          commentCount={item.commentCount}
          isLiked={item.isLiked}
          comments={item.comments}
        />
      );
    }

    if (item.entryType === 'plan') {
      const planData = {
        id: item.id,
        personName: item.personName,
        date: item.date,
        rawDate: item.rawDate || item.date,
        time: item.time,
        location: item.location,
        content: item.content,
        tags: item.tags || [],
        authorName: item.authorName || 'Unknown',
        authorAvatar: item.authorAvatar,
        createdAt: item.date,
        isCompleted: item.isCompleted || false,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        isLiked: item.isLiked || false,
        comments: item.comments || [],
      };

      return (
        <PlanCard
          plan={planData}
          onLike={() => onLikePlan?.(item.id)}
          onSubmitComment={onSubmitPlanComment ? (text) => onSubmitPlanComment(item.id, text) : undefined}
          onPersonPress={() => onPersonPress?.(item.personName, item.authorName)}
          onEdit={item.isOwnPost && onEditPlan ? () => onEditPlan(item.id) : undefined}
          showEditOptions={item.isOwnPost}
        />
      );
    }

    return (
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
        isOwnPost={item.isOwnPost}
        poll={item.poll}
        userPollVote={item.userPollVote}
        comments={item.comments}
        likeCount={item.likeCount}
        commentCount={item.commentCount}
        isLiked={item.isLiked}
        onPress={() => onDatePress?.(item.id)}
        onPersonPress={() => onPersonPress?.(item.personName, item.authorName)}
        onPersonHistoryPress={() => onPersonHistoryPress?.(item.personName, item.authorName)}
        onAuthorPress={() => onAuthorPress?.(item.authorName || item.personName)}
        onLike={() => {
          console.log('🔍 DateFeed: onLike called for item:', item.id, item.personName);
          onLike?.(item.id);
        }}
        onSubmitComment={onSubmitComment ? (text) => onSubmitComment(item.id, text) : undefined}
        onEdit={item.isOwnPost && onEdit ? () => onEdit(item.id) : undefined}
        onPollVote={onPollVote}
      />
    );
  };

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
