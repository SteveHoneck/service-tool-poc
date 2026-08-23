import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function BackLink({onPress, testID, style}: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={[styles.control, style]}>
      <View style={styles.row}>
        <Text style={styles.arrow}>←</Text>
        <Text style={styles.label}>Back</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    height: 40,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    color: '#2563EB',
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{translateY: -5}],
    marginRight: 4,
  },
  label: {
    color: '#2563EB',
    fontSize: 18,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
