import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export const PPM_BAR_RISE_DURATION_MS = 850;
export const PPM_BAR_DROP_DURATION_MS = 280;

interface Props {
  fraction: number;
  isDark: boolean;
}

export function LivePpmLevelBar({fraction, isDark}: Props) {
  const clamped = Math.min(1, Math.max(0, fraction));
  const animated = useRef(new Animated.Value(0)).current;
  const previous = useRef(0);

  useEffect(() => {
    const dropping = clamped + 0.02 < previous.current;
    previous.current = clamped;

    const animation = Animated.timing(animated, {
      toValue: clamped,
      duration: dropping ? PPM_BAR_DROP_DURATION_MS : PPM_BAR_RISE_DURATION_MS,
      easing: dropping ? Easing.out(Easing.quad) : Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, clamped]);

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  const levelPercent = Math.round(clamped * 100);

  return (
    <View
      testID="ppm-level-bar"
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: levelPercent}}
      style={[styles.track, isDark && styles.trackDark]}>
      <Animated.View
        testID="ppm-level-bar-fill"
        style={[styles.fill, {width}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 12,
  },
  trackDark: {
    backgroundColor: '#374151',
  },
  fill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 6,
  },
});
