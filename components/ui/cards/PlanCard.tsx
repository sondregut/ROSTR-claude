import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PlanEntry } from '@/contexts/DateContext';
import { InlineComments } from '../feed/InlineComments';

interface PlanCardProps {
  plan: PlanEntry;
  onLike: () => void;
  onSubmitComment?: (text: string) => Promise<void>;
  onAddDetails?: () => void;
  onPersonPress?: () => void;
  onEdit?: () => void;
  showEditOptions?: boolean;
}

export default function PlanCard({ 
  plan, 
  onLike, 
  onSubmitComment, 
  onAddDetails,
  onPersonPress,
  onEdit,
  showEditOptions = true
}: PlanCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showComments, setShowComments] = useState(plan.comments && plan.comments.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: plan.authorAvatar || '/placeholder.svg?height=40&width=40' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <View style={styles.headerText}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {plan.authorName}
            </Text>
            <View style={styles.planIndicator}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.planType, { color: colors.primary }]}>
                Planning a date
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
              Just now
            </Text>
            {showEditOptions && onEdit && (
              <Pressable 
                style={styles.menuButton}
                onPress={onEdit}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Plan Content */}
      <View style={styles.content}>
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, { color: colors.text }]}>
            Date with{' '}
            <Text 
              style={[styles.personName, { color: colors.primary }]}
              onPress={onPersonPress}
            >
              {plan.personName}
            </Text>
          </Text>
        </View>

        {/* Date, Time, Location */}
        <View style={styles.planDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {plan.date}
              {plan.time && (
                <Text style={{ color: colors.textSecondary }}> • {plan.time}</Text>
              )}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {plan.location}
            </Text>
          </View>
        </View>

        {/* Plan Description */}
        {plan.content && (
          <Text style={[styles.planDescription, { color: colors.text }]}>
            {plan.content}
          </Text>
        )}

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {plan.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Pressable style={styles.actionButton} onPress={onLike}>
          <Ionicons 
            name={plan.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={plan.isLiked ? colors.error : colors.textSecondary} 
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {plan.likeCount > 0 && plan.likeCount}
          </Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => setShowComments(!showComments)}>
          <Ionicons name={showComments ? "chatbubble" : "chatbubble-outline"} size={20} color={showComments ? colors.primary : colors.textSecondary} />
          <Text style={[styles.actionText, { color: showComments ? colors.primary : colors.textSecondary }]}>
            {plan.commentCount > 0 ? `${plan.commentCount} Comment${plan.commentCount > 1 ? 's' : ''}` : 'Comment'}
          </Text>
        </Pressable>

        {onAddDetails && (
          <Pressable 
            style={[styles.addDetailsButton, { backgroundColor: colors.primary }]}
            onPress={onAddDetails}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addDetailsText}>Add Details</Text>
          </Pressable>
        )}
      </View>

      {/* Inline Comments Section */}
      <InlineComments
        comments={plan.comments || []}
        isExpanded={showComments}
        onSubmitComment={onSubmitComment || (async () => {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  planIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planType: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 14,
  },
  menuButton: {
    padding: 4,
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  planHeader: {
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  personName: {
    fontWeight: '600',
  },
  planDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  planDescription: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  addDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  addDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});