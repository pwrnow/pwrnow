import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Line,
  SvgXml,
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

interface StartupAnimationProps {
  visible: boolean;
  onEnd?: () => void;
}

const ACCENT_BLUE = '#2066DF';
const ACCENT_PINK = '#EC2E81';
const ACCENT_PURPLE = '#8B5CF6';
const ACCENT_CYAN = '#06B6D4';

export default function StartupAnimation({
  visible,
  onEnd,
}: StartupAnimationProps) {
  const { colors, isDark } = useThemeColors();
  const { width, height } = useWindowDimensions();

  const progress = useSharedValue(0);
  const logoProgress = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);

  // Keep latest onEnd without causing effect restarts
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      logoProgress.value = 0;
      particleProgress.value = 0;
      glowProgress.value = 0;

      // Staggered animation sequence for buttery smooth effect
      progress.value = withTiming(1, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });

      logoProgress.value = withDelay(
        300,
        withSequence(
          withTiming(1, {
            duration: 1100,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          }),
          withTiming(1.1, { duration: 150 }),
          withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
        )
      );

      particleProgress.value = withDelay(
        200,
        withTiming(1, {
          duration: 1600,
          easing: Easing.out(Easing.cubic),
        })
      );

      glowProgress.value = withDelay(
        400,
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0.7, { duration: 600 }),
          withTiming(0, { duration: 400 })
        )
      );

      // Complete animation callback
      setTimeout(() => {
        if (onEndRef.current) {
          onEndRef.current();
        }
      }, 2300);
    }
  }, [visible]);

  // Simple overlay fade without scaling - stays full screen
  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.9, 1], [1, 1, 0]);
    return {
      opacity,
    };
  });

  // Premium logo entrance with micro-interactions
  const logoStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      logoProgress.value,
      [0, 0.4, 0.7, 1],
      [0.7, 1.15, 0.98, 1.0]
    );
    const translateY = interpolate(logoProgress.value, [0, 1], [20, 0]);
    const opacity = interpolate(logoProgress.value, [0, 0.2, 0.5], [0, 0.8, 1]);
    const rotateZ = interpolate(logoProgress.value, [0, 0.3, 1], [0, 2, 0]);

    return {
      transform: [{ scale }, { translateY }, { rotateZ: `${rotateZ}deg` }],
      opacity,
    };
  });

  // Dynamic glow effect behind logo
  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glowProgress.value, [0, 1], [0.5, 2.5]);
    const opacity = interpolate(glowProgress.value, [0, 0.5, 1], [0, 0.4, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Enhanced particle system
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      startAngle: i * 30 + Math.random() * 20,
      radius: 80 + Math.random() * 60,
      size: 2 + Math.random() * 4,
      color: [ACCENT_BLUE, ACCENT_PINK, ACCENT_PURPLE, ACCENT_CYAN][i % 4],
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  const particleStyles = particles.map((particle) =>
    useAnimatedStyle(() => {
      const animProgress = interpolate(
        particleProgress.value,
        [particle.delay, particle.delay + particle.duration],
        [0, 1],
        'clamp'
      );

      const angle = particle.startAngle + animProgress * 180;
      const radius =
        particle.radius * interpolate(animProgress, [0, 1], [0.3, 1.2]);
      const opacity = interpolate(animProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
      const scale = interpolate(animProgress, [0, 0.5, 1], [0, 1.2, 0.8]);

      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;

      return {
        transform: [{ translateX: x }, { translateY: y }, { scale }],
        opacity,
      };
    })
  );

  // Sophisticated background lines with fluid motion
  const linesA = useMemo(() => {
    const count = 6;
    return new Array(count).fill(0).map((_, idx) => ({
      key: `a-${idx}`,
      color: [ACCENT_BLUE, ACCENT_PINK, ACCENT_PURPLE][idx % 3],
      strokeWidth: interpolate(idx, [0, count - 1], [2.5, 1.0]),
      offset: (idx - (count - 1) / 2) * (height / (count + 2)),
      opacity: isDark ? 0.25 : 0.18,
      phase: idx * 0.1,
    }));
  }, [height, isDark]);

  const linesB = useMemo(() => {
    const count = 4;
    return new Array(count).fill(0).map((_, idx) => ({
      key: `b-${idx}`,
      color: [ACCENT_PINK, ACCENT_CYAN, ACCENT_PURPLE][idx % 3],
      strokeWidth: interpolate(idx, [0, count - 1], [2.0, 1.2]),
      offset: (idx - (count - 1) / 2) * (width / (count + 3)),
      opacity: isDark ? 0.22 : 0.16,
      phase: idx * 0.15,
    }));
  }, [width, isDark]);

  const linesStyleA = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-width * 0.4, width * 0.3]
    );
    const rotateZ = interpolate(progress.value, [0, 1], [15, 25]);
    const opacity = interpolate(
      progress.value,
      [0, 0.3, 0.8, 1],
      [0, 0.8, 1, 0.3]
    );

    return {
      transform: [{ translateX }, { rotateZ: `${rotateZ}deg` }],
      opacity,
    };
  });

  const linesStyleB = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [height * 0.3, -height * 0.25]
    );
    const rotateZ = interpolate(progress.value, [0, 1], [-20, -30]);
    const opacity = interpolate(
      progress.value,
      [0, 0.2, 0.7, 1],
      [0, 0.6, 0.9, 0.2]
    );

    return {
      transform: [{ translateY }, { rotateZ: `${rotateZ}deg` }],
      opacity,
    };
  });

  if (!visible) return null;

  const bg = colors.background;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <Animated.View
      pointerEvents='auto'
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: bg, zIndex: 9999 },
        overlayStyle,
      ]}
    >
      {/* Enhanced background lines - group A */}
      <Animated.View
        style={[styles.linesContainer, { width, height }, linesStyleA]}
      >
        <Svg width={width * 1.8} height={height * 1.8}>
          <Defs>
            <RadialGradient id='lineGradient' cx='50%' cy='50%' r='50%'>
              <Stop offset='0%' stopColor={ACCENT_BLUE} stopOpacity='0.8' />
              <Stop offset='100%' stopColor={ACCENT_PINK} stopOpacity='0.2' />
            </RadialGradient>
          </Defs>
          {linesA.map((l) => (
            <Line
              key={l.key}
              x1={0}
              y1={height / 2 + l.offset}
              x2={width * 1.8}
              y2={height / 2 + l.offset}
              stroke={l.color}
              strokeOpacity={l.opacity}
              strokeWidth={l.strokeWidth}
              strokeLinecap='round'
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Enhanced background lines - group B */}
      <Animated.View
        style={[styles.linesContainer, { width, height }, linesStyleB]}
      >
        <Svg width={width * 1.8} height={height * 1.8}>
          {linesB.map((l) => (
            <Line
              key={l.key}
              x1={0}
              y1={height / 2 + l.offset}
              x2={width * 1.8}
              y2={height / 2 + l.offset}
              stroke={l.color}
              strokeOpacity={l.opacity}
              strokeWidth={l.strokeWidth}
              strokeLinecap='round'
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Glow effect behind logo */}
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]}>
          <Svg width={300} height={300}>
            <Defs>
              <RadialGradient id='glowGradient' cx='50%' cy='50%' r='50%'>
                <Stop offset='0%' stopColor={ACCENT_PINK} stopOpacity='0.3' />
                <Stop offset='30%' stopColor={ACCENT_BLUE} stopOpacity='0.2' />
                <Stop offset='100%' stopColor={ACCENT_PURPLE} stopOpacity='0' />
              </RadialGradient>
            </Defs>
            <Circle cx={150} cy={150} r={150} fill='url(#glowGradient)' />
          </Svg>
        </Animated.View>
      </View>

      {/* Particle system */}
      <View style={styles.center}>
        {particles.map((particle, index) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              particleStyles[index],
              {
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
              },
            ]}
          />
        ))}
      </View>

      {/* Center logo with enhanced styling */}
      <View style={styles.center}>
        <Animated.View style={[logoStyle, styles.logoContainer]}>
          <SvgXml xml={LOGO_XML} width={180} height={180} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linesContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  logoContainer: {
    shadowColor: '#2066DF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#EC2E81',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});

// Enhanced logo XML with better gradients
const LOGO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="621" height="645" viewBox="0 0 621 645" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="paint0_linear_134_4" x1="54.1924" y1="56.001" x2="638.692" y2="625.001" gradientUnits="userSpaceOnUse">
<stop stop-color="#EC2E81"/>
<stop offset="0.3" stop-color="#8B5CF6"/>
<stop offset="0.7" stop-color="#06B6D4"/>
<stop offset="1" stop-color="#2066DF"/>
</linearGradient>
<linearGradient id="paint1_linear_134_4" x1="116.192" y1="112.001" x2="608.192" y2="644.001" gradientUnits="userSpaceOnUse">
<stop stop-color="#EC2E81"/>
<stop offset="0.163354" stop-color="#D2358D"/>
<stop offset="0.4" stop-color="#8B5CF6"/>
<stop offset="0.608145" stop-color="#3C5ED2"/>
<stop offset="0.8" stop-color="#06B6D4"/>
<stop offset="1" stop-color="#2066DF"/>
</linearGradient>
<filter id="glow">
<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
<feMerge>
<feMergeNode in="coloredBlur"/>
<feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>
</defs>
<path d="M350.192 625H483.692C523.192 625 602.192 585 602.192 484V134.5" stroke="url(#paint0_linear_134_4)" stroke-width="37" stroke-miterlimit="10.4334" stroke-linecap="round" filter="url(#glow)"/>
<path d="M19.6924 162.5L38.1917 162.663L38.1924 162.581V162.5H19.6924ZM161.692 22.5L162.206 40.9929L161.692 22.5ZM419.692 19L434.876 29.5696C438.812 23.9152 439.28 16.5419 436.09 10.4352C432.901 4.32843 426.582 0.5 419.692 0.5V19ZM230.692 290.5L215.509 279.93C211.573 285.585 211.105 292.958 214.294 299.065C217.484 305.172 223.803 309 230.692 309V290.5ZM424.193 290.5L439.225 301.283C443.268 295.647 443.818 288.222 440.651 282.051C437.483 275.88 431.129 272 424.193 272V290.5ZM21.6926 496.5L40.1182 494.842C37.9644 470.911 37.4421 388.552 37.505 310.765C37.5362 272.182 37.7079 235.153 37.8718 207.767C37.9538 194.075 38.0338 182.796 38.0933 174.941C38.123 171.014 38.1476 167.942 38.1648 165.854C38.1734 164.81 38.1801 164.011 38.1847 163.474C38.187 163.205 38.1888 163.002 38.1899 162.866C38.1905 162.798 38.191 162.747 38.1913 162.713C38.1914 162.696 38.1915 162.684 38.1916 162.675C38.1916 162.671 38.1917 162.668 38.1917 162.666C38.1917 162.664 38.1917 162.663 19.6924 162.5C1.19314 162.337 1.19313 162.338 1.19311 162.341C1.19309 162.343 1.19306 162.346 1.19302 162.351C1.19294 162.36 1.19283 162.373 1.19268 162.39C1.19237 162.425 1.19192 162.477 1.19132 162.546C1.19013 162.683 1.18837 162.888 1.18606 163.159C1.18146 163.699 1.1747 164.501 1.16607 165.549C1.14883 167.646 1.12415 170.725 1.09433 174.661C1.0347 182.532 0.954559 193.831 0.872471 207.546C0.708305 234.972 0.53628 272.068 0.50502 310.735C0.443001 387.448 0.920805 472.089 3.26711 498.158L21.6926 496.5ZM19.6924 162.5H38.1924C38.1924 104.58 83.1311 43.1903 162.206 40.9929L161.692 22.5L161.178 4.00714C60.2537 6.8117 1.19242 86.4203 1.19242 162.5H19.6924ZM161.692 22.5L162.206 40.9929C280.492 37.7059 287.366 37.5 419.692 37.5V19V0.5C287.019 0.5 279.802 0.710766 161.178 4.00714L161.692 22.5ZM419.692 19L404.509 8.4304L215.509 279.93L230.692 290.5L245.876 301.07L434.876 29.5696L419.692 19ZM230.692 290.5V309H424.193V290.5V272H230.692V290.5ZM424.193 290.5C409.16 279.717 409.16 279.717 409.158 279.719C409.157 279.721 409.155 279.724 409.152 279.728C409.146 279.737 409.137 279.749 409.125 279.766C409.101 279.799 409.065 279.849 409.017 279.916C408.922 280.049 408.778 280.249 408.589 280.512C408.21 281.04 407.647 281.824 406.911 282.849C405.437 284.898 403.271 287.91 400.501 291.755C394.96 299.446 387.005 310.47 377.351 323.795C358.043 350.448 331.951 386.292 304.807 423.078C277.649 459.881 249.494 497.549 226.042 527.878C214.309 543.051 203.827 556.292 195.275 566.631C186.45 577.3 180.418 583.967 177.339 586.729L189.692 600.5L202.046 614.271C207.467 609.408 215.138 600.668 223.786 590.214C232.706 579.43 243.466 565.831 255.312 550.512C279.016 519.857 307.361 481.93 334.578 445.047C361.809 408.145 387.967 372.208 407.315 345.502C416.99 332.147 424.964 321.097 430.521 313.383C433.3 309.526 435.474 306.504 436.954 304.444C437.695 303.414 438.261 302.625 438.644 302.093C438.835 301.827 438.979 301.625 439.077 301.49C439.125 301.422 439.162 301.37 439.187 301.336C439.199 301.319 439.209 301.306 439.215 301.297C439.218 301.293 39.221 301.289 439.222 301.287C439.224 301.285 439.225 301.283 424.193 290.5ZM189.692 600.5L177.339 586.729C162.3 600.221 149.795 605.917 137.72 607.42C125.269 608.97 110.861 606.375 91.4341 598.773L84.6924 616.001L77.9507 633.229C100.024 641.867 121.115 646.772 142.29 644.137C163.839 641.454 183.085 631.28 202.046 614.271L189.692 600.5ZM84.6924 616.001L91.4341 598.773C76.6289 592.979 64.9003 580.13 56.105 561.137C47.3015 542.125 42.2552 518.587 40.1182 494.842L21.6926 496.5L3.26711 498.158C5.63008 524.413 11.3338 552.505 22.53 576.684C33.7347 600.881 51.2559 622.783 77.9507 633.229L84.6924 616.001Z" fill="url(#paint1_linear_134_4)" filter="url(#glow)"/>
</svg>`;
