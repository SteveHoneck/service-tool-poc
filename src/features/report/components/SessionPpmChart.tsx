import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { plotPpmSamples } from '../../../domain/report/plotPpmSamples';
import { PpmSample } from '../../../types';

const CHART_HEIGHT = 160;
const CHART_PADDING = 8;

interface Props {
  samples: PpmSample[];
  isDark: boolean;
}

export function SessionPpmChart({ samples, isDark }: Props) {
  const [width, setWidth] = useState(0);
  const plot =
    width > 0
      ? plotPpmSamples(samples, {
          width,
          height: CHART_HEIGHT,
          padding: CHART_PADDING,
        })
      : { points: [], polyline: '' };

  return (
    <View
      testID="report-details-chart"
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={[styles.box, isDark && styles.boxDark]}
    >
      {width > 0 && plot.polyline !== '' ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Polyline
            points={plot.polyline}
            fill="none"
            stroke={isDark ? '#60A5FA' : '#2563EB'}
            strokeWidth={2}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: CHART_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  boxDark: {
    borderColor: '#374151',
    backgroundColor: '#111827',
  },
});
