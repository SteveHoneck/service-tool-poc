import React from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BackLink} from '../../shared/BackLink';

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({onBack}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="settings-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <BackLink onPress={onBack} testID="settings-back" />
        <Text style={[styles.title, isDark && styles.textLight]}>Settings</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  containerDark: {
    backgroundColor: '#121417',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
});
