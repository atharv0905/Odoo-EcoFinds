import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useApiUser } from "../../contexts/ApiUserContext";
import { useAuth } from "../../contexts/AuthContext";
import { getPurchases, getCart } from "../../services/api";

export default function ProfileScreen() {
  const { apiUser, refreshUser } = useApiUser();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    ecoPoints: 0,
    totalSpent: 0,
    carbonSaved: "0kg",
  });

  const [recentActivity] = useState([
    {
      id: "1",
      action: "Purchased Eco-Friendly Water Bottle",
      time: "2 hours ago",
      icon: "🛒",
    },
    { id: "2", action: "Earned 50 Eco Points", time: "1 day ago", icon: "🏆" },
    {
      id: "3",
      action: "Listed Bamboo Toothbrush",
      time: "3 days ago",
      icon: "📦",
    },
  ]);

  const [achievements] = useState([
    { id: "1", name: "Eco Warrior", icon: "🌱", earned: true },
    { id: "2", name: "First Sale", icon: "💰", earned: true },
    { id: "3", name: "Green Seller", icon: "🏪", earned: false },
    { id: "4", name: "Carbon Saver", icon: "🌍", earned: false },
  ]);

  const loadStats = async () => {
    if (!apiUser?._id) return;

    try {
      const [purchasesRes, cartRes] = await Promise.all([
        getPurchases(apiUser._id),
        getCart(apiUser._id),
      ]);

      setStats({
        totalOrders: purchasesRes.count || 0,
        ecoPoints: apiUser.gamification?.points || 0,
        totalSpent: 0, // Would calculate from purchases
        carbonSaved: "125kg", // Mock data
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  useEffect(() => {
    loadStats();
    setLoading(false);
  }, [apiUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadStats()]);
    setRefreshing(false);
  };

  const renderStatCard = (
    icon: string,
    value: string | number,
    label: string,
    bgColor: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderQuickAction = (
    icon: string,
    text: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionText}>{text}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(apiUser?.name || user?.displayName || "U")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {apiUser?.name || user?.displayName || "User"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.profileBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌱 Eco Warrior</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Level {apiUser?.gamification?.level || 1}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Profile Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard("📦", stats.totalOrders, "Total Orders", "#E3F2FD")}
        {renderStatCard("🏆", stats.ecoPoints, "Eco Points", "#F3E5F5")}
        {renderStatCard("💰", `$${stats.totalSpent}`, "Total Spent", "#E8F5E9")}
        {renderStatCard("🌍", stats.carbonSaved, "CO2 Saved", "#FFF3E0")}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{item.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{item.action}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements & Badges</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.earned
                  ? styles.achievementEarned
                  : styles.achievementLocked,
              ]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              {!achievement.earned && (
                <Text style={styles.achievementLock}>🔒</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {renderQuickAction("🛍️", "Browse Products", () =>
            router.push("/(tabs)/dashboard")
          )}
          {renderQuickAction("🛒", "View Cart", () =>
            router.push("/(tabs)/cart")
          )}
          {renderQuickAction("📦", "Order History", () =>
            router.push("/(tabs)/purchases")
          )}
          {renderQuickAction("⚙️", "Settings", () =>
            router.push("/(tabs)/settings")
          )}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "#E8F5E9",
    marginBottom: 10,
  },
  profileBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 14,
    color: "#666",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
  },
  achievementEarned: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  achievementLocked: {
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  achievementLock: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
