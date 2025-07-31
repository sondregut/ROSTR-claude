import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BarData {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  barColor?: string;
  showValues?: boolean;
}

export function MiniBarChart({ 
  data, 
  height = 100, 
  barColor,
  showValues = true 
}: MiniBarChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = `${85 / data.length}%`;
  
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          return (
            <View key={index} style={[styles.barContainer, { width: barWidth }]}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor || colors.primary,
                    },
                  ]}
                />
              </View>
              {showValues && item.value > 0 && (
                <Text style={[styles.value, { color: colors.text }]}>
                  {item.value}
                </Text>
              )}
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 4,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minHeight: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
});