import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { formatMoney } from '../../lib/format';

interface CountUpProps {
  value: number;
  currency?: string;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  currency,
  duration = 1200,
  style,
  prefix = '',
  suffix = '',
}) => {
  const [displayed, setDisplayed] = useState(0);
  const startTime = useRef<number | null>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    startTime.current = null;
    const start = displayed;
    const diff = value - start;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  const formatted = currency
    ? formatMoney(displayed, currency)
    : `${prefix}${displayed.toLocaleString('ru-KZ')}${suffix}`;

  return <Text style={style}>{formatted}</Text>;
};
