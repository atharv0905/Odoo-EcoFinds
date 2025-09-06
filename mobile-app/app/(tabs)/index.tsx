import { Image } from "expo-image";
import { Platform, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "../../contexts/AuthContext";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/login");
          } catch (error) {
            console.error("Sign out error:", error);
          }
        },
      },
    ]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to EcoFinds!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.userContainer}>
        <ThemedText type="subtitle">
          Hello, {user?.displayName || user?.email}! 👋
        </ThemedText>
        <ThemedText>Welcome to your sustainable marketplace.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">
          🌱 Discover Eco-Friendly Products
        </ThemedText>
        <ThemedText>
          Browse through our curated selection of sustainable products that help
          reduce your environmental footprint.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">♻️ Make a Difference</ThemedText>
        <ThemedText>
          Every purchase you make contributes to a more sustainable future.
          Track your environmental impact and see the difference you're making.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🛍️ Start Shopping</ThemedText>
        <ThemedText>
          Tap the Explore tab to start browsing our eco-friendly products and
          begin your sustainable shopping journey.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userContainer: {
    gap: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f0f8f0",
    borderRadius: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  signOutContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  signOutButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "600",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
