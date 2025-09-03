import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    Keyboard,
    Dimensions,
    KeyboardEvent
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
  authorUsername?: string;
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
    imageUri?: string;
  }[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  reactions?: any;
  userReaction?: any;
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
  onPersonPress?: (personName: string, authorName?: string, authorUsername?: string) => void;
  onPersonHistoryPress?: (personName: string, authorName?: string, authorUsername?: string) => void;
  onAuthorPress?: (authorUsername: string) => void;
  onLike?: (dateId: string) => void;
  onReact?: (dateId: string, reaction: any) => void;
  onSubmitComment?: (dateId: string, text: string) => Promise<void>;
  onEdit?: (dateId: string) => void;
  onEditRoster?: (dateId: string) => void;
  onLikePlan?: (planId: string) => void;
  onReactPlan?: (planId: string, reaction: any) => void;
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
  onReact,
  onSubmitComment,
  onEdit,
  onEditRoster,
  onLikePlan,
  onReactPlan,
  onSubmitPlanComment,
  onEditPlan,
  onPollVote,
  ListEmptyComponent,
  ListHeaderComponent,
}: DateFeedProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const itemRefs = useRef<Map<string, View>>(new Map());
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Listen for keyboard events to get exact height
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle scrolling to a specific item when comment input is focused
  const handleCommentFocus = useCallback((itemId: string) => {
    const itemIndex = data.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1 && flatListRef.current) {
      const item = itemRefs.current.get(itemId);
      if (item) {
        // Wait a bit for keyboard to start showing
        setTimeout(() => {
          item.measureInWindow((x, y, width, height) => {
            const screenHeight = Dimensions.get('window').height;
            const currentKeyboardHeight = keyboardHeight || (Platform.OS === 'ios' ? 336 : 280);
            
            // Calculate the visible area when keyboard is shown
            const visibleAreaHeight = screenHeight - currentKeyboardHeight;
            
            // We want the comment input (at bottom of card) to be just above the keyboard
            // with some of the card content visible above
            const commentInputOffset = 60; // Approximate height of comment input area
            const desiredCardBottom = visibleAreaHeight - 10; // 10px padding above keyboard
            const desiredCardTop = desiredCardBottom - height;
            
            // Only scroll if the card would be obscured
            if (y + height > desiredCardBottom || y < 50) {
              // Calculate the new scroll position
              // We want the bottom of the card to be at desiredCardBottom
              const currentOffset = flatListRef.current._listRef?._scrollMetrics?.offset || 0;
              const scrollDelta = (y + height) - desiredCardBottom;
              const newOffset = Math.max(0, currentOffset + scrollDelta);
              
              flatListRef.current.scrollToOffset({
                offset: newOffset,
                animated: true,
              });
            }
          });
        }, 100);
      }
    }
  }, [data, keyboardHeight]);

  const renderItem = ({ item }: { item: DateEntry }) => {
    if (item.entryType === 'roster_addition') {
      return (
        <View
          ref={(ref) => {
            if (ref) itemRefs.current.set(item.id, ref);
          }}
        >
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
            onPersonPress={() => onPersonPress?.(item.personName, item.authorName, item.authorUsername)}
            onAuthorPress={() => {
              console.log('🔍 DateFeed: RosterCard onAuthorPress - item.authorUsername:', item.authorUsername, 'item.authorName:', item.authorName);
              onAuthorPress?.(item.authorUsername || '');
            }}
            onLike={() => {
              console.log('🔍 DateFeed: onLike called for item:', item.id, item.personName);
              onLike?.(item.id);
            }}
            onSubmitComment={onSubmitComment ? (text) => onSubmitComment(item.id, text) : undefined}
            onEdit={item.isOwnPost && onEditRoster ? () => onEditRoster(item.id) : undefined}
            onReact={onReact ? (reaction) => onReact(item.id, reaction) : undefined}
            likeCount={item.likeCount}
            commentCount={item.commentCount}
            isLiked={item.isLiked}
            reactions={item.reactions}
            userReaction={item.userReaction}
            comments={item.comments}
            onCommentFocus={() => handleCommentFocus(item.id)}
          />
        </View>
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
        reactions: item.reactions,
        userReaction: item.userReaction,
        comments: item.comments || [],
      };

      return (
        <View
          ref={(ref) => {
            if (ref) itemRefs.current.set(item.id, ref);
          }}
        >
          <PlanCard
            plan={planData}
            personPhoto={item.rosterInfo?.photos?.[0]}
            onLike={() => onLikePlan?.(item.id)}
            onReact={onReactPlan ? (reaction) => onReactPlan(item.id, reaction) : undefined}
            onSubmitComment={onSubmitPlanComment ? (text) => onSubmitPlanComment(item.id, text) : undefined}
            onPersonPress={() => onPersonPress?.(item.personName, item.authorName, item.authorUsername)}
            onAuthorPress={() => {
              console.log('🔍 DateFeed: PlanCard onAuthorPress - item.authorUsername:', item.authorUsername, 'item.authorName:', item.authorName);
              onAuthorPress?.(item.authorUsername || '');
            }}
            onEdit={item.isOwnPost && onEditPlan ? () => onEditPlan(item.id) : undefined}
            showEditOptions={item.isOwnPost}
            onCommentFocus={() => handleCommentFocus(item.id)}
          />
        </View>
      );
    }

    return (
      <View
        ref={(ref) => {
          if (ref) itemRefs.current.set(item.id, ref);
        }}
      >
        <DateCard
          id={item.id}
          personName={item.personName}
          personPhoto={item.rosterInfo?.photos?.[0]}
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
          entryType={item.entryType}
          poll={item.poll}
          userPollVote={item.userPollVote}
          comments={item.comments}
          likeCount={item.likeCount}
          commentCount={item.commentCount}
          isLiked={item.isLiked}
          reactions={item.reactions}
          userReaction={item.userReaction}
          onPress={() => onDatePress?.(item.id)}
          onPersonPress={() => onPersonPress?.(item.personName, item.authorName, item.authorUsername)}
          onPersonHistoryPress={() => onPersonHistoryPress?.(item.personName, item.authorName, item.authorUsername)}
          onAuthorPress={() => {
            console.log('🔍 DateFeed: DateCard onAuthorPress - item.authorUsername:', item.authorUsername, 'item.authorName:', item.authorName);
            onAuthorPress?.(item.authorUsername || '');
          }}
          onLike={() => {
            console.log('🔍 DateFeed: RosterCard onLike called for item:', item.id, item.personName, 'entryType:', item.entryType);
            if (onLike) {
              console.log('🔍 DateFeed: Calling parent onLike function');
              onLike(item.id);
            } else {
              console.log('❌ DateFeed: No onLike handler provided');
            }
          }}
          onReact={onReact ? (reaction) => onReact(item.id, reaction) : undefined}
          onSubmitComment={onSubmitComment ? (text) => onSubmitComment(item.id, text) : undefined}
          onEdit={item.isOwnPost && onEdit ? () => onEdit(item.id) : undefined}
          onPollVote={onPollVote}
          onCommentFocus={() => handleCommentFocus(item.id)}
        />
      </View>
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
          ref={flatListRef}
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScrollBeginDrag={() => {
            // Dismiss keyboard when user starts scrolling on iOS
            // Android handles this via keyboardDismissMode
            if (Platform.OS === 'ios') {
              Keyboard.dismiss();
            }
          }}
          onScrollToIndexFailed={(info) => {
            // Handle scroll failure gracefully
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          onEndReachedThreshold={0.5}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={21}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={true}
          updateCellsBatchingPeriod={50}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
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
