import React from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  Text,
  useColorScheme,
  Platform
} from 'react-native';
import { DateCard } from '../cards/DateCard';
import { Colors } from '../../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

interface DateEntry {
  id: string;
  personName: string;
  date: string;
  location: string;
  rating?: number;
  notes?: string;
  imageUri?: string;
  tags?: string[];
  poll?: {
    question: string;
    options: {
      text: string;
      votes: number;
    }[];
  };
  comments?: {
    author: string;
    text: string;
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
  onLike?: (dateId: string) => void;
  onComment?: (dateId: string) => void;
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
  onLike,
  onComment,
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
      poll={item.poll}
      comments={item.comments}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      isLiked={item.isLiked}
      onPress={() => onDatePress?.(item.id)}
      onLike={() => onLike?.(item.id)}
      onComment={() => onComment?.(item.id)}
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
