import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useApiUser } from "../../contexts/ApiUserContext";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";
import {
  updateUserProfile,
  updateUserPaymentConfig,
  updateUserGamification,
} from "../../services/api";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { apiUserId, apiUser, refreshUser } = useApiUser();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Payment config state
  const [paymentMode, setPaymentMode] = useState<
    "manual_payout" | "razorpay_direct"
  >("manual_payout");
  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: "",
    secret: "",
  });

  // Gamification state
  const [gamification, setGamification] = useState({
    points: 0,
    level: 1,
    badges: [] as string[],
  });

  useEffect(() => {
    if (apiUser && user) {
      setProfile({
        name: apiUser.name || user.displayName || "",
        email: user.email || "",
        phone: apiUser.phone || "",
      });

      if (apiUser.paymentConfig) {
        setPaymentMode(apiUser.paymentConfig.mode || "manual_payout");
        if (apiUser.paymentConfig.razorpayKeyId) {
          setRazorpayConfig({
            keyId: apiUser.paymentConfig.razorpayKeyId,
            secret: "", // Don't show the secret
          });
        }
      }

      if (apiUser.gamification) {
        setGamification(apiUser.gamification);
      }
    }
  }, [apiUser, user]);

  const saveProfile = async () => {
    if (!apiUserId) return;

    setLoading(true);
    try {
      await updateUserProfile(apiUserId, {
        name: profile.name,
        phone: profile.phone,
      });

      await refreshUser();
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been saved successfully.",
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: e instanceof Error ? e.message : "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePaymentConfig = async () => {
    if (!apiUserId) return;

    setLoading(true);
    try {
      const paymentConfig: any = { mode: paymentMode };

      if (paymentMode === "razorpay_direct") {
        if (!razorpayConfig.keyId || !razorpayConfig.secret) {
          Toast.show({
            type: "error",
            text1: "Missing Credentials",
            text2: "Please provide both Razorpay Key ID and Secret",
          });
          setLoading(false);
          return;
        }
        paymentConfig.razorpayKeyId = razorpayConfig.keyId;
        paymentConfig.razorpaySecret = razorpayConfig.secret;
      }

      await updateUserPaymentConfig(apiUserId, { paymentConfig });
      await refreshUser();

      Toast.show({
        type: "success",
        text1: "Payment Config Updated",
        text2: "Your payment configuration has been saved.",
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2:
          e instanceof Error ? e.message : "Failed to update payment config",
      });
    } finally {
      setLoading(false);
    }
  };

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
          } catch (e) {
            Toast.show({
              type: "error",
              text1: "Sign Out Failed",
              text2: "Please try again",
            });
          }
        },
      },
    ]);
  };

  const clearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: () => {
            Toast.show({
              type: "success",
              text1: "Cache Cleared",
              text2: "All cached data has been cleared.",
            });
          },
        },
      ]
    );
  };

  const refreshData = async () => {
    try {
      await refreshUser();
      Toast.show({
        type: "success",
        text1: "Data Refreshed",
        text2: "Your data has been refreshed successfully.",
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Refresh Failed",
        text2: "Failed to refresh data",
      });
    }
  };

  const renderSection = (
    title: string,
    icon: string,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const renderFormGroup = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    props?: any
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props?.disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );

  const renderButton = (
    title: string,
    onPress: () => void,
    style?: any,
    textStyle?: any
  ) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account preferences and payment configuration
        </Text>
        {/* Debug Info */}
        <Text style={styles.debugText}>
          User: {user?.email} | API ID: {apiUserId}
        </Text>
      </View>

      {/* Profile Information */}
      {renderSection(
        "Profile Information",
        "👤",
        <View>
          {renderFormGroup("Full Name", profile.name, (text) =>
            setProfile((prev) => ({ ...prev, name: text }))
          )}
          {renderFormGroup("Email Address", profile.email, () => {}, {
            disabled: true,
            placeholder: "Your email address",
          })}
          {renderFormGroup(
            "Phone Number",
            profile.phone,
            (text) => setProfile((prev) => ({ ...prev, phone: text })),
            {
              placeholder: "Enter your phone number",
              keyboardType: "phone-pad",
            }
          )}
          {renderButton("Save Profile", saveProfile, styles.primaryButton)}
        </View>
      )}

      {/* Payment Configuration */}
      {renderSection(
        "Payment Configuration",
        "💳",
        <View>
          <Text style={styles.subsectionTitle}>Payment Options</Text>

          {/* Manual Payout Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMode === "manual_payout" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMode("manual_payout")}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    paymentMode === "manual_payout" && styles.radioActive,
                  ]}
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Manual Payout</Text>
                <Text style={styles.paymentDescription}>
                  Receive payments manually through bank transfers or other
                  methods.
                </Text>
                <View style={styles.paymentFeatures}>
                  <Text style={styles.feature}>✓ Simple setup</Text>
                  <Text style={styles.feature}>✓ No integration required</Text>
                  <Text style={styles.feature}>✓ Manual processing</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Razorpay Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMode === "razorpay_direct" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMode("razorpay_direct")}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    paymentMode === "razorpay_direct" && styles.radioActive,
                  ]}
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Razorpay Integration</Text>
                <Text style={styles.paymentDescription}>
                  Connect your Razorpay account for automated payments.
                </Text>
                <View style={styles.paymentFeatures}>
                  <Text style={styles.feature}>✓ Automatic processing</Text>
                  <Text style={styles.feature}>✓ Real-time payments</Text>
                  <Text style={styles.feature}>✓ Advanced analytics</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Razorpay Configuration */}
          {paymentMode === "razorpay_direct" && (
            <View style={styles.razorpayConfig}>
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Security Notice</Text>
                  <Text style={styles.warningText}>
                    Your Razorpay credentials will be securely stored. We
                    recommend using test credentials for development.
                  </Text>
                </View>
              </View>

              {renderFormGroup(
                "Razorpay Key ID",
                razorpayConfig.keyId,
                (text) =>
                  setRazorpayConfig((prev) => ({ ...prev, keyId: text })),
                { placeholder: "rzp_test_xxxxxxxxxxxxxxx" }
              )}
              {renderFormGroup(
                "Razorpay Secret",
                razorpayConfig.secret,
                (text) =>
                  setRazorpayConfig((prev) => ({ ...prev, secret: text })),
                {
                  placeholder: "Enter your Razorpay secret",
                  secureTextEntry: true,
                }
              )}
            </View>
          )}

          {renderButton(
            "Save Payment Configuration",
            savePaymentConfig,
            styles.primaryButton
          )}
        </View>
      )}

      {/* Gamification & Rewards */}
      {renderSection(
        "Gamification & Rewards",
        "🏆",
        <View>
          <View style={styles.gamificationStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Current Level</Text>
              <Text style={styles.statValue}>{gamification.level}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Eco Points</Text>
              <Text style={styles.statValue}>{gamification.points}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Badges Earned</Text>
              <Text style={styles.statValue}>{gamification.badges.length}</Text>
            </View>
          </View>

          <View style={styles.badgesContainer}>
            <Text style={styles.subsectionTitle}>Your Badges</Text>
            <View style={styles.badgesList}>
              {gamification.badges.length > 0 ? (
                gamification.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeEmoji}>🏆</Text>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noBadges}>
                  No badges earned yet. Start shopping to earn badges!
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Account Actions */}
      {renderSection(
        "Account Actions",
        "⚙️",
        <View style={styles.actionButtons}>
          {renderButton(
            "🔄 Refresh Data",
            refreshData,
            styles.secondaryButton,
            styles.secondaryButtonText
          )}
          {renderButton(
            "🗑️ Clear Cache",
            clearCache,
            styles.warningButton,
            styles.warningButtonText
          )}
          {renderButton(
            "🚪 Sign Out",
            handleSignOut,
            styles.dangerButton,
            styles.dangerButtonText
          )}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8F5E9",
  },
  section: {
    margin: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  secondaryButtonText: {
    color: "#fff",
  },
  warningButton: {
    backgroundColor: "#ffc107",
  },
  warningButtonText: {
    color: "#000",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  dangerButtonText: {
    color: "#fff",
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  paymentOptionActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#F8F8F8",
  },
  paymentOptionContent: {
    flexDirection: "row",
    padding: 15,
  },
  radioContainer: {
    marginRight: 15,
    paddingTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  radioActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  paymentFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  feature: {
    fontSize: 12,
    color: "#4CAF50",
    marginRight: 15,
    marginBottom: 5,
  },
  razorpayConfig: {
    marginTop: 15,
  },
  warningCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
  },
  gamificationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  badgesContainer: {
    marginTop: 10,
  },
  badgesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  noBadges: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actionButtons: {
    gap: 10,
  },
  bottomSpacer: {
    height: 40,
  },
  debugText: {
    fontSize: 12,
    color: "#E8F5E9",
    marginTop: 10,
    fontFamily: "monospace",
  },
});
