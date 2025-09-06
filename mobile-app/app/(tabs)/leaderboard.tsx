import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useApiUser } from "../../contexts/ApiUserContext";
import { useAuth } from "../../contexts/AuthContext";

interface LeaderboardUser {
  _id: string;
  name: string;
  email: string;
  gamification: {
    points: number;
    level: number;
    badges: string[];
  };
  rank?: number;
}

export default function LeaderboardScreen() {
  const { apiUser } = useApiUser();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [impactStats, setImpactStats] = useState({
    totalCO2Saved: "0 kg",
    totalWaterSaved: "0 L",
    totalWastePrevented: "0 g",
    totalEcoWarriors: 0,
  });

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Mock leaderboard data - in real app, this would come from API
      const mockData: LeaderboardUser[] = [
        {
          _id: "1",
          name: "Eco Champion",
          email: "champion@ecofinds.com",
          gamification: {
            points: 2500,
            level: 5,
            badges: ["eco-warrior", "green-seller", "carbon-saver"],
          },
        },
        {
          _id: "2",
          name: "Green Guru",
          email: "guru@ecofinds.com",
          gamification: {
            points: 2200,
            level: 4,
            badges: ["eco-warrior", "frequent-buyer"],
          },
        },
        {
          _id: "3",
          name: "Nature Lover",
          email: "nature@ecofinds.com",
          gamification: { points: 1800, level: 3, badges: ["eco-warrior"] },
        },
        {
          _id: "4",
          name: "Sustainable Sam",
          email: "sam@ecofinds.com",
          gamification: { points: 1500, level: 3, badges: ["first-sale"] },
        },
        {
          _id: "5",
          name: "Planet Protector",
          email: "protector@ecofinds.com",
          gamification: { points: 1200, level: 2, badges: ["eco-warrior"] },
        },
      ];

      // Add current user if not in top 5
      if (apiUser && !mockData.find((u) => u.email === user?.email)) {
        mockData.push({
          _id: apiUser._id,
          name: apiUser.name || user?.displayName || "You",
          email: user?.email || "",
          gamification: apiUser.gamification || {
            points: 0,
            level: 1,
            badges: [],
          },
        });
      }

      // Sort by points and add ranks
      const sortedData = mockData
        .sort((a, b) => b.gamification.points - a.gamification.points)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setLeaderboard(sortedData);

      // Find current user's rank
      const currentUserRank = sortedData.find(
        (u) => u.email === user?.email
      )?.rank;
      setUserRank(currentUserRank || null);

      // Mock impact stats
      setImpactStats({
        totalCO2Saved: "1,250 kg",
        totalWaterSaved: "5,400 L",
        totalWastePrevented: "850 g",
        totalEcoWarriors: sortedData.length,
      });
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [apiUser, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const renderUserRankCard = () => (
    <View style={styles.userRankCard}>
      <View style={styles.rankInfo}>
        <View style={styles.rankPosition}>
          <Text style={styles.rankPositionText}>#{userRank || "--"}</Text>
        </View>
        <View style={styles.rankDetails}>
          <Text style={styles.rankName}>
            {apiUser?.name || user?.displayName || "Your Name"}
          </Text>
          <Text style={styles.rankPoints}>
            {apiUser?.gamification?.points || 0} points
          </Text>
        </View>
      </View>
      <View style={styles.rankBadge}>
        <Text style={styles.badgeIcon}>🌱</Text>
        <Text style={styles.badgeText}>Your Rank</Text>
      </View>
    </View>
  );

  const renderPodium = () => {
    const top3 = leaderboard.slice(0, 3);
    if (top3.length < 3) return null;

    return (
      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>🥇 Top 3 Eco Champions</Text>
        <View style={styles.podium}>
          {/* Second Place */}
          <View style={styles.podiumPlace}>
            <View style={[styles.podiumAvatar, styles.secondPlace]}>
              <Text style={styles.avatarText}>2</Text>
            </View>
            <Text style={styles.podiumName}>{top3[1]?.name}</Text>
            <Text style={styles.podiumPoints}>
              {top3[1]?.gamification.points} pts
            </Text>
            <Text style={styles.podiumMedal}>🥈</Text>
          </View>

          {/* First Place */}
          <View style={[styles.podiumPlace, styles.firstPlace]}>
            <View style={[styles.podiumAvatar, styles.winner]}>
              <Text style={styles.avatarText}>1</Text>
            </View>
            <Text style={styles.podiumName}>{top3[0]?.name}</Text>
            <Text style={styles.podiumPoints}>
              {top3[0]?.gamification.points} pts
            </Text>
            <Text style={styles.podiumMedal}>🥇</Text>
          </View>

          {/* Third Place */}
          <View style={styles.podiumPlace}>
            <View style={[styles.podiumAvatar, styles.thirdPlace]}>
              <Text style={styles.avatarText}>3</Text>
            </View>
            <Text style={styles.podiumName}>{top3[2]?.name}</Text>
            <Text style={styles.podiumPoints}>
              {top3[2]?.gamification.points} pts
            </Text>
            <Text style={styles.podiumMedal}>🥉</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardUser }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankCircle}>
        <Text style={styles.rankCircleText}>#{item.rank}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userPoints}>{item.gamification.points} points</Text>
        <View style={styles.badges}>
          {item.gamification.badges.slice(0, 3).map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeEmoji}>🏆</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>Lv. {item.gamification.level}</Text>
      </View>
    </View>
  );

  const renderImpactStats = () => (
    <View style={styles.impactSection}>
      <Text style={styles.sectionTitle}>🌍 Collective Eco Impact</Text>
      <View style={styles.impactGrid}>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>🌱</Text>
          <Text style={styles.impactValue}>{impactStats.totalCO2Saved}</Text>
          <Text style={styles.impactLabel}>CO2 Saved</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>💧</Text>
          <Text style={styles.impactValue}>{impactStats.totalWaterSaved}</Text>
          <Text style={styles.impactLabel}>Water Conserved</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>🗑️</Text>
          <Text style={styles.impactValue}>
            {impactStats.totalWastePrevented}
          </Text>
          <Text style={styles.impactLabel}>Waste Prevented</Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactIcon}>👥</Text>
          <Text style={styles.impactValue}>{impactStats.totalEcoWarriors}</Text>
          <Text style={styles.impactLabel}>Eco Warriors</Text>
        </View>
      </View>
      <Text style={styles.impactMessage}>
        Together, we're making a real difference for our planet! Every
        eco-friendly purchase counts. 🌍💚
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={leaderboard}
      keyExtractor={(item) => item._id}
      renderItem={renderLeaderboardItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🏆 Eco Champions Leaderboard</Text>
            <Text style={styles.headerSubtitle}>
              Celebrating our top eco-warriors making a difference!
            </Text>
          </View>

          {/* User Rank Card */}
          {renderUserRankCard()}

          {/* Podium */}
          {renderPodium()}

          {/* Full Leaderboard Header */}
          <View style={styles.fullLeaderboardHeader}>
            <Text style={styles.sectionTitle}>Complete Rankings</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListFooterComponent={renderImpactStats()}
      showsVerticalScrollIndicator={false}
    />
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
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8F5E9",
    textAlign: "center",
  },
  userRankCard: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankPosition: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rankPositionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  rankPoints: {
    fontSize: 14,
    color: "#666",
  },
  rankBadge: {
    alignItems: "center",
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  badgeText: {
    fontSize: 12,
    color: "#666",
  },
  podiumSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 200,
  },
  podiumPlace: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    backgroundColor: "#FFF9C4",
    marginTop: -20,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  winner: {
    backgroundColor: "#FFD700",
  },
  secondPlace: {
    backgroundColor: "#C0C0C0",
  },
  thirdPlace: {
    backgroundColor: "#CD7F32",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  podiumPoints: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  podiumMedal: {
    fontSize: 24,
  },
  fullLeaderboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  refreshBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  leaderboardItem: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rankCircleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  userPoints: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  badges: {
    flexDirection: "row",
  },
  badge: {
    marginRight: 5,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  levelBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  levelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  impactSection: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  impactItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 15,
  },
  impactIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  impactLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  impactMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
  },
});
