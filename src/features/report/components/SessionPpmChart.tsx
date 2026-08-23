import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { plotPpmSamples } from '../../../domain/report/plotPpmSamples';
import { PpmSample } from '../../../types';

const CHART_HEIGHT = 160;
const CHART_PADDING = 8;

interface Props {
  samples: PpmSample[];
  isDark: boolean;
}

function formatTick(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function formatSeconds(value: number): string {
  return `${formatTick(value)} s`;
}

export function SessionPpmChart({ samples, isDark }: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const plot = plotPpmSamples(samples, {
    width: Math.max(plotWidth, 1),
    height: CHART_HEIGHT,
    padding: CHART_PADDING,
  });
  const labelColor = isDark ? '#9CA3AF' : '#6B7280';
  const axisColor = isDark ? '#6B7280' : '#9CA3AF';
  const svgWidth = Math.max(plotWidth, 1);

  return (
    <View
      testID="report-details-chart"
      style={[styles.box, isDark && styles.boxDark]}
    >
      <View style={styles.plotRow}>
        <View style={styles.yTitle}>
          <Text
            testID="report-details-y-label"
            style={[styles.axisTitle, styles.yTitleText, { color: labelColor }]}
          >
            PPM
          </Text>
        </View>
        <View style={styles.yAxis}>
          <Text
            testID="report-details-y-high"
            style={[styles.tick, { color: labelColor }]}
          >
            {formatTick(plot.yTicks.high)}
          </Text>
          <Text
            testID="report-details-y-mid"
            style={[styles.tick, { color: labelColor }]}
          >
            {formatTick(plot.yTicks.mid)}
          </Text>
          <Text
            testID="report-details-y-low"
            style={[styles.tick, { color: labelColor }]}
          >
            {formatTick(plot.yTicks.low)}
          </Text>
        </View>
        <View
          style={styles.plot}
          onLayout={event => setPlotWidth(event.nativeEvent.layout.width)}
        >
          <Svg width={svgWidth} height={CHART_HEIGHT}>
            <Line
              testID="report-details-y-axis"
              x1={plot.yAxis.x1}
              y1={plot.yAxis.y1}
              x2={plot.yAxis.x2}
              y2={plot.yAxis.y2}
              stroke={axisColor}
              strokeWidth={1}
            />
            <Line
              testID="report-details-x-axis"
              x1={plot.xAxis.x1}
              y1={plot.xAxis.y1}
              x2={plot.xAxis.x2}
              y2={plot.xAxis.y2}
              stroke={axisColor}
              strokeWidth={1}
            />
            {plotWidth > 0 && plot.polyline !== '' ? (
              <Polyline
                points={plot.polyline}
                fill="none"
                stroke={isDark ? '#60A5FA' : '#2563EB'}
                strokeWidth={2}
              />
            ) : null}
          </Svg>
        </View>
      </View>
      <View style={styles.xAxis}>
        <Text
          testID="report-details-x-start"
          style={[styles.tick, { color: labelColor }]}
        >
          {formatSeconds(plot.xTicks.startSeconds)}
        </Text>
        <Text
          testID="report-details-x-mid"
          style={[styles.tick, { color: labelColor }]}
        >
          {formatSeconds(plot.xTicks.midSeconds)}
        </Text>
        <Text
          testID="report-details-x-end"
          style={[styles.tick, { color: labelColor }]}
        >
          {formatSeconds(plot.xTicks.endSeconds)}
        </Text>
      </View>
      <Text
        testID="report-details-x-label"
        style={[styles.axisTitle, styles.xTitle, { color: labelColor }]}
      >
        Time (s)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 8,
  },
  boxDark: {
    borderColor: '#374151',
    backgroundColor: '#111827',
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yTitle: {
    width: 18,
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yTitleText: {
    transform: [{ rotate: '-90deg' }],
    width: CHART_HEIGHT,
    textAlign: 'center',
  },
  yAxis: {
    width: 36,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  plot: {
    flex: 1,
    height: CHART_HEIGHT,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 54,
    marginTop: 4,
  },
  xTitle: {
    marginLeft: 54,
    marginTop: 2,
    textAlign: 'center',
  },
  axisTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  tick: {
    fontSize: 11,
  },
});
