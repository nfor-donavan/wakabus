import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing, ActivityIndicator, StyleSheet } from "react-native";
import { BRAND } from "../utils/branding";

/**
 * In-app preloader shown right after the native splash while essential
 * start-up work (saved theme + language) finishes. Same white background and
 * emblem as the native splash so the hand-over is seamless. Animation is
 * deliberately short and restrained: a fade-in plus a slow, gentle pulse.
 * Uses the built-in Animated API, so no extra dependency is needed.
 */
export default function BrandPreloader({ text }) {
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade, pulse]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, alignItems: "center" }}>
        <Animated.Image
          source={BRAND.logo}
          resizeMode="contain"
          accessibilityLabel={BRAND.company}
          style={[styles.logo, { transform: [{ scale: pulse }] }]}
        />
        <ActivityIndicator size="small" color={BRAND.blue} style={styles.spinner} />
        {!!text && <Text style={styles.text}>{text}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fixed brand colors (not theme colors): this screen continues the white native splash.
  container: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", padding: 32 },
  logo: { width: 200, height: 205 },
  spinner: { marginTop: 28 },
  text: { marginTop: 14, fontSize: 13, color: "#6B7280", letterSpacing: 0.3 },
});
