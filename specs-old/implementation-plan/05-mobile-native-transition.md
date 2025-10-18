# Centrid.ai Mobile & Native App Transition - Implementation PRD

**Version**: 3.0 - Supabase Plus Cross-Platform Architecture  
**Date**: 2024-01-15  
**Status**: Ready for Implementation  
**Estimated Time**: 120 hours (Weeks 13-20) - 25% faster with Supabase  
**Priority**: Phase 2 - Platform Expansion  
**Dependencies**: Supabase PWA Application (04-frontend-pwa-application.md)

---

## 🎯 **OVERVIEW**

### **Objective**

Transition from PWA to native React Native apps while maintaining 80%+ code sharing, adding native device features, and delivering true native performance for iOS and Android.

### **Success Criteria**

- React Native apps launched in both app stores
- **85%+ code sharing** between web PWA and native apps (higher with Supabase)
- Native device integration (camera, push notifications, biometric auth)
- **Same real-time performance** as PWA (Supabase subscriptions work identically)
- App store ratings >4.5 stars within 30 days of launch
- **Performance Target**: 60fps interactions, <1.5 second startup time

---

## 🏗️ **NATIVE TRANSITION STRATEGY**

### **Universal Codebase Architecture**

**Code Sharing Strategy with Supabase**:

```
Shared Code (85%):
├── Supabase Client Integration (100% shared - same API)
├── Business Logic (hooks, utils, GraphQL queries)
├── State Management (Zustand UI + Apollo Client server state)
├── AI Agent Integration (same Edge Function calls)
├── Real-time Subscriptions (identical implementation)
├── Authentication Logic (same Supabase Auth)
├── Data Models & Types (auto-generated from Supabase)
├── Core Components (abstracted)
└── Navigation Logic

Platform-Specific (15%):
├── UI Components (native adaptations)
├── Platform APIs (camera, push notifications, biometrics)
├── App Store Configurations
├── Platform-specific Navigation Styling
└── Native Module Integrations
```

### **Technology Stack**

**Cross-Platform Framework**:

- **Framework**: React Native 0.72+ with New Architecture (Fabric + TurboModules)
- **Development**: Expo SDK 49+ for rapid development and deployment
- **Navigation**: React Navigation 6 with native stack navigators
- **State**: Zustand (same as web) with AsyncStorage persistence
- **Styling**: NativeWind for Tailwind CSS compatibility
- **Icons**: React Native Vector Icons with platform-specific sets

**Native Modules & Device Integration**:

- **Camera**: Expo Camera for document scanning and text extraction
- **File System**: Expo FileSystem for offline document storage
- **Push Notifications**: Expo Notifications with FCM/APNs integration
- **Biometric Auth**: Expo Local Authentication for fingerprint/face unlock
- **Background Tasks**: Expo TaskManager for background sync
- **Deep Linking**: Expo Linking for universal links and app schemes

---

## 📋 **IMPLEMENTATION REQUIREMENTS**

### **Phase 1: Architecture Foundation (Weeks 13-14 - 40 hours)**

#### **1.1 Project Setup & Code Extraction (16 hours)**

**Monorepo Structure Setup**:

```
centrid/
├── apps/
│   ├── web/                 # Next.js PWA
│   ├── mobile/              # React Native app
│   └── mobile-web/          # Expo web (optional)
├── packages/
│   ├── shared/              # Shared business logic
│   │   ├── api/            # tRPC client & types
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript types
│   ├── ui/                  # Shared components
│   │   ├── components/     # Universal components
│   │   ├── tokens/         # Design tokens
│   │   └── themes/         # Theme definitions
│   └── config/              # Shared configuration
├── tools/                   # Build tools & scripts
└── docs/                   # Documentation
```

**Shared Package Extraction**:

```typescript
// packages/shared/api/index.ts - Shared API client
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../apps/web/src/server/api/root";

export const api = createTRPCReact<AppRouter>();

// Universal API client factory
export const createApiClient = (
  baseUrl: string,
  getToken: () => string | null
) => {
  return api.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers() {
          const token = getToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
};

// packages/shared/stores/authStore.ts - Shared auth state
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        // Platform-specific storage will be injected
        return globalThis.__STORAGE__;
      }),
    }
  )
);

// packages/shared/hooks/useAgentRequest.ts - Shared agent logic
import { useState } from "react";
import { api } from "../api";

export const useAgentRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);

  const executeAgent = api.agents.executeAgent.useMutation({
    onSuccess: (response) => {
      setResult(response);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Agent request failed:", error);
      setIsLoading(false);
    },
  });

  const submitRequest = async (request: AgentRequest) => {
    setIsLoading(true);
    setResult(null);
    await executeAgent.mutateAsync(request);
  };

  return {
    submitRequest,
    isLoading,
    result,
    error: executeAgent.error,
  };
};
```

**Universal Component Abstraction**:

```typescript
// packages/ui/components/Button/Button.tsx
import React from "react";
import { Platform } from "react-native";
import { ButtonWeb } from "./Button.web";
import { ButtonNative } from "./Button.native";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = (props) => {
  if (Platform.OS === "web") {
    return <ButtonWeb {...props} />;
  }
  return <ButtonNative {...props} />;
};

// packages/ui/components/Button/Button.native.tsx
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { styled } from "nativewind";
import type { ButtonProps } from "./Button";

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

export const ButtonNative: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
}) => {
  const variantClasses = {
    primary: "bg-primary-600 active:bg-primary-700",
    secondary: "bg-gray-200 active:bg-gray-300",
    ghost: "active:bg-gray-100",
  };

  const sizeClasses = {
    sm: "px-3 py-2 min-h-[36px]",
    md: "px-4 py-3 min-h-[44px]",
    lg: "px-6 py-4 min-h-[52px]",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <StyledPressable
      className={`
        items-center justify-center rounded-lg flex-row
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? "opacity-50" : ""}
      `}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "white" : "#6B7280"}
          style={{ marginRight: 8 }}
        />
      )}
      <StyledText
        className={`
          font-medium 
          ${textSizes[size]}
          ${variant === "primary" ? "text-white" : "text-gray-900"}
        `}
      >
        {title}
      </StyledText>
    </StyledPressable>
  );
};
```

**Deliverable**: Monorepo structure with 80%+ shared code extraction

#### **1.2 React Native App Initialization (12 hours)**

**Expo Configuration**:

```json
// apps/mobile/app.config.js
export default {
  expo: {
    name: "AI Docs",
    slug: "ai-docs-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      bundleIdentifier: "com.aidocs.mobile",
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan documents and extract text",
        NSMicrophoneUsageDescription: "This app uses the microphone for voice input to AI agents"
      }
    },
    android: {
      package: "com.aidocs.mobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-camera",
      "expo-document-picker",
      "expo-file-system",
      "expo-notifications",
      "expo-local-authentication",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          },
          ios: {
            deploymentTarget: "13.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "your-project-id-here"
      }
    }
  }
};
```

**Native App Entry Point**:

```typescript
// apps/mobile/App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api, createApiClient } from "@aidocs/shared";
import { AuthProvider } from "./src/providers/AuthProvider";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { NotificationProvider } from "./src/providers/NotificationProvider";
import { setupStorage } from "./src/utils/storage";

// Setup platform-specific storage
setupStorage();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const apiClient = createApiClient(
  __DEV__ ? "http://localhost:3000" : "https://api.aidocs.com",
  () => {
    // Get token from secure storage
    return globalThis.__AUTH_TOKEN__;
  }
);

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <api.Provider client={apiClient} queryClient={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </AuthProvider>
        </api.Provider>
      </QueryClientProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
```

**Native Storage Integration**:

```typescript
// apps/mobile/src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const setupStorage = () => {
  // Setup storage for Zustand persistence
  globalThis.__STORAGE__ = {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };

  // Setup secure token storage
  globalThis.__AUTH_TOKEN__ = null;

  // Load initial auth token
  SecureStore.getItemAsync("auth_token").then((token) => {
    globalThis.__AUTH_TOKEN__ = token;
  });
};

export const tokenStorage = {
  setToken: async (token: string) => {
    globalThis.__AUTH_TOKEN__ = token;
    await SecureStore.setItemAsync("auth_token", token);
  },

  getToken: async (): Promise<string | null> => {
    if (globalThis.__AUTH_TOKEN__) {
      return globalThis.__AUTH_TOKEN__;
    }
    const token = await SecureStore.getItemAsync("auth_token");
    globalThis.__AUTH_TOKEN__ = token;
    return token;
  },

  removeToken: async () => {
    globalThis.__AUTH_TOKEN__ = null;
    await SecureStore.deleteItemAsync("auth_token");
  },
};
```

**Deliverable**: Fully configured React Native app with shared code integration

#### **1.3 Navigation & Routing (12 hours)**

**Native Navigation Structure**:

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@aidocs/shared";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { LoadingScreen } from "../screens/LoadingScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// apps/mobile/src/navigation/MainNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { AgentsScreen } from "../screens/AgentsScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabBarIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          paddingBottom: 8,
          height: 88,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: "Documents" }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{ title: "AI Agents" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Search" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

// Type definitions for navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Documents: undefined;
  Agents: undefined;
  Search: undefined;
  Settings: undefined;
};

export type AgentStackParamList = {
  AgentHome: undefined;
  AgentRequest: undefined;
  AgentPreview: { previewId: string };
  AgentResult: { resultId: string };
};
```

**Deep Linking Configuration**:

```typescript
// apps/mobile/src/navigation/linking.ts
import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, "https://aidocs.com", "aidocs://"],
  config: {
    screens: {
      Main: {
        screens: {
          Documents: "documents",
          Agents: {
            screens: {
              AgentHome: "agents",
              AgentRequest: "agents/request",
              AgentPreview: "agents/preview/:previewId",
              AgentResult: "agents/result/:resultId",
            },
          },
          Search: "search",
          Settings: "settings",
        },
      },
      Auth: {
        screens: {
          Login: "login",
          Register: "register",
        },
      },
    },
  },
};
```

**Deliverable**: Native navigation system with deep linking and shared routing logic

### **Phase 2: Core Feature Implementation (Weeks 15-17 - 80 hours)**

#### **2.1 Native UI Components & Interactions (30 hours)**

**Native Agent Request Interface**:

```typescript
// apps/mobile/src/screens/AgentRequestScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "@aidocs/ui";
import { useAgentRequest } from "@aidocs/shared";
import { VoiceInputButton } from "../components/VoiceInputButton";
import { AgentTypeSelector } from "../components/AgentTypeSelector";
import { QuickActionGrid } from "../components/QuickActionGrid";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);

export const AgentRequestScreen: React.FC = () => {
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("auto");
  const { submitRequest, isLoading } = useAgentRequest();
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    try {
      await submitRequest({
        content: input,
        agentType: selectedAgent,
        timestamp: new Date(),
      });

      setInput("");
      inputRef.current?.blur();
    } catch (error) {
      console.error("Failed to submit request:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Agent Type Selector */}
          <AgentTypeSelector
            selectedType={selectedAgent}
            onSelect={setSelectedAgent}
          />

          {/* Input Area */}
          <Card className="p-4 mb-6">
            <StyledTextInput
              ref={inputRef}
              className="text-base leading-6 min-h-[120px]"
              value={input}
              onChangeText={setInput}
              placeholder="Ask your AI agent..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              style={{ fontFamily: "System" }}
            />

            {/* Action Row */}
            <StyledView className="flex-row items-center justify-between mt-4">
              <VoiceInputButton onVoiceInput={setInput} />

              <Button
                title={isLoading ? "Processing..." : "Send"}
                onPress={handleSubmit}
                disabled={!input.trim() || isLoading}
                loading={isLoading}
                size="md"
              />
            </StyledView>
          </Card>

          {/* Quick Actions */}
          <QuickActionGrid onActionSelect={(template) => setInput(template)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

**Native Gesture Handling for Agent Previews**:

```typescript
// apps/mobile/src/components/AgentPreviewCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Card } from "@aidocs/ui";
import type { AgentPreview } from "@aidocs/shared";

interface AgentPreviewCardProps {
  preview: AgentPreview;
  onApprove: () => void;
  onReject: () => void;
  onViewAlternatives: () => void;
}

export const AgentPreviewCard: React.FC<AgentPreviewCardProps> = ({
  preview,
  onApprove,
  onReject,
  onViewAlternatives,
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;

      // Visual feedback for swipe actions
      if (event.translationX > 100) {
        // Approve (right swipe)
        opacity.value = 1 - Math.abs(event.translationX) / 300;
      } else if (event.translationX < -100) {
        // Reject (left swipe)
        opacity.value = 1 - Math.abs(event.translationX) / 300;
      }
    },
    onEnd: (event) => {
      scale.value = withSpring(1);

      const { translationX, velocityX } = event;
      const swipeThreshold = 100;
      const velocityThreshold = 500;

      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        // Approve (right swipe)
        translateX.value = withSpring(400);
        opacity.value = withSpring(0);
        runOnJS(onApprove)();
      } else if (
        translationX < -swipeThreshold ||
        velocityX < -velocityThreshold
      ) {
        // Reject (left swipe)
        translateX.value = withSpring(-400);
        opacity.value = withSpring(0);
        runOnJS(onReject)();
      } else {
        // Snap back
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const rightSwipe = translateX.value > 50;
    const leftSwipe = translateX.value < -50;

    return {
      backgroundColor: rightSwipe
        ? "#10B981"
        : leftSwipe
        ? "#EF4444"
        : "#F3F4F6",
    };
  });

  return (
    <View className="mx-4 mb-4">
      {/* Background indicators */}
      <Animated.View
        className="absolute inset-0 rounded-xl flex-row items-center justify-between px-6"
        style={backgroundStyle}
      >
        <Text className="text-white font-semibold text-lg">✓ Approve</Text>
        <Text className="text-white font-semibold text-lg">✗ Reject</Text>
      </Animated.View>

      {/* Main card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          <Card className="p-6">
            <AgentPreviewContent preview={preview} />
          </Card>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
```

**Native File Upload with Camera Integration**:

```typescript
// apps/mobile/src/components/DocumentUploader.tsx
import React, { useState } from "react";
import { View, Alert, ActionSheetIOS, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { Button } from "@aidocs/ui";
import { useDocumentUpload } from "@aidocs/shared";

export const DocumentUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const { uploadDocument } = useDocumentUpload();

  const showUploadOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Choose from Files",
            "Scan with Camera",
            "Photo Library",
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              pickDocument();
              break;
            case 2:
              scanDocument();
              break;
            case 3:
              pickFromLibrary();
              break;
          }
        }
      );
    } else {
      // Android - show custom modal
      showAndroidPicker();
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/markdown", "application/json"],
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        await uploadFile(result.uri, result.name, result.size);
      }
    } catch (error) {
      console.error("Document picker error:", error);
    }
  };

  const scanDocument = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to scan documents"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled && result.uri) {
        // Process image for text extraction
        await processScannedDocument(result.uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const uploadFile = async (uri: string, name: string, size: number) => {
    setUploading(true);

    try {
      await uploadDocument({
        uri,
        name,
        size,
        type: "file",
      });
    } catch (error) {
      Alert.alert("Upload failed", "Please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      title="Upload Document"
      onPress={showUploadOptions}
      loading={uploading}
      variant="primary"
    />
  );
};
```

**Deliverable**: Native UI components with gesture handling and device integration

#### **2.2 Offline Capabilities & Background Sync (25 hours)**

**Offline Storage System**:

```typescript
// apps/mobile/src/services/OfflineStorage.ts
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

class OfflineStorageService {
  private readonly documentsDir = `${FileSystem.documentDirectory}documents/`;
  private readonly cacheDir = `${FileSystem.cacheDirectory}ai-cache/`;

  async initializeStorage() {
    // Ensure directories exist
    await FileSystem.makeDirectoryAsync(this.documentsDir, {
      intermediates: true,
    });
    await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
  }

  async storeDocument(document: Document, content: string): Promise<void> {
    const filePath = `${this.documentsDir}${document.id}.md`;

    // Store file content
    await FileSystem.writeAsStringAsync(filePath, content);

    // Store metadata
    await AsyncStorage.setItem(
      `doc_meta_${document.id}`,
      JSON.stringify({
        ...document,
        localPath: filePath,
        lastModified: new Date().toISOString(),
      })
    );
  }

  async getOfflineDocuments(): Promise<OfflineDocument[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const docKeys = keys.filter((key) => key.startsWith("doc_meta_"));

      const documents = await AsyncStorage.multiGet(docKeys);

      return documents
        .map(([_, value]) => (value ? JSON.parse(value) : null))
        .filter(Boolean);
    } catch (error) {
      console.error("Failed to get offline documents:", error);
      return [];
    }
  }

  async cacheAgentResponse(
    requestId: string,
    response: AgentResponse
  ): Promise<void> {
    const cacheFile = `${this.cacheDir}response_${requestId}.json`;
    await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(response));
  }

  async getCachedResponse(requestId: string): Promise<AgentResponse | null> {
    try {
      const cacheFile = `${this.cacheDir}response_${requestId}.json`;
      const exists = await FileSystem.getInfoAsync(cacheFile);

      if (exists.exists) {
        const content = await FileSystem.readAsStringAsync(cacheFile);
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Failed to get cached response:", error);
    }

    return null;
  }
}

export const offlineStorage = new OfflineStorageService();
```

**Background Sync with Task Manager**:

```typescript
// apps/mobile/src/services/BackgroundSync.ts
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { api } from "@aidocs/shared";
import { offlineStorage } from "./OfflineStorage";

const BACKGROUND_SYNC_TASK = "background-sync";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log("Running background sync...");

    // Sync pending agent requests
    await syncPendingRequests();

    // Sync document changes
    await syncDocumentChanges();

    // Cache frequently accessed content
    await preloadFrequentContent();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background sync failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function syncPendingRequests() {
  const pendingRequests = await getPendingAgentRequests();

  for (const request of pendingRequests) {
    try {
      const response = await api.agents.executeAgent.mutate(request);

      // Cache response locally
      await offlineStorage.cacheAgentResponse(request.id, response);

      // Remove from pending queue
      await removePendingRequest(request.id);

      // Send local notification
      await scheduleLocalNotification({
        title: "AI Agent Complete",
        body: "Your request has been processed",
        data: { requestId: request.id },
      });
    } catch (error) {
      console.error("Failed to sync request:", request.id, error);
    }
  }
}

export class BackgroundSyncManager {
  static async initialize() {
    // Register background task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  static async queueAgentRequest(request: AgentRequest) {
    // Store request for background processing
    const pendingRequests = await getPendingAgentRequests();
    pendingRequests.push({
      ...request,
      id: generateId(),
      queuedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(
      "pending_requests",
      JSON.stringify(pendingRequests)
    );

    // Trigger immediate background fetch if app is active
    if (AppState.currentState === "active") {
      BackgroundFetch.fetchAsync(BACKGROUND_SYNC_TASK);
    }
  }

  static async syncNow(): Promise<boolean> {
    try {
      const result = await BackgroundFetch.fetchAsync(BACKGROUND_SYNC_TASK);
      return result === BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error("Manual sync failed:", error);
      return false;
    }
  }
}
```

**Offline-First Agent Requests**:

```typescript
// apps/mobile/src/hooks/useOfflineAgent.ts
import { useState, useEffect } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAgentRequest } from "@aidocs/shared";
import { BackgroundSyncManager } from "../services/BackgroundSync";
import { offlineStorage } from "../services/OfflineStorage";

export const useOfflineAgent = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedRequests, setQueuedRequests] = useState<AgentRequest[]>([]);
  const { submitRequest: submitOnlineRequest, ...rest } = useAgentRequest();

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    return unsubscribe;
  }, []);

  const submitRequest = async (request: AgentRequest) => {
    if (isOnline) {
      try {
        return await submitOnlineRequest(request);
      } catch (error) {
        // If online request fails, queue for later
        console.log("Online request failed, queueing for background sync");
        await queueForBackground(request);
      }
    } else {
      // Queue request for when online
      await queueForBackground(request);
    }
  };

  const queueForBackground = async (request: AgentRequest) => {
    await BackgroundSyncManager.queueAgentRequest(request);
    setQueuedRequests((prev) => [...prev, request]);

    // Show user feedback
    showOfflineNotification("Request queued for when you're back online");
  };

  const checkForCachedResponse = async (requestId: string) => {
    const cached = await offlineStorage.getCachedResponse(requestId);
    if (cached) {
      // Remove from queue
      setQueuedRequests((prev) => prev.filter((r) => r.id !== requestId));
      return cached;
    }
    return null;
  };

  return {
    submitRequest,
    checkForCachedResponse,
    isOnline,
    queuedRequests,
    syncNow: BackgroundSyncManager.syncNow,
    ...rest,
  };
};
```

**Deliverable**: Complete offline functionality with background sync and queue management

#### **2.3 Push Notifications & Real-time Updates (25 hours)**

**Push Notification Setup**:

```typescript
// apps/mobile/src/services/NotificationService.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async initialize() {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  static async registerForPushNotifications(userId: string) {
    const token = await this.initialize();

    if (token) {
      // Send token to backend
      await api.notifications.registerDevice.mutate({
        userId,
        token,
        platform: Platform.OS,
      });
    }

    return token;
  }

  static async scheduleLocalNotification(notification: LocalNotification) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: true,
      },
      trigger: notification.delay ? { seconds: notification.delay } : null,
    });
  }

  static setupNotificationHandlers() {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        // Update UI or trigger actions
      }
    );

    // Handle user tapping notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data.type === "agent_complete") {
          // Navigate to agent result
          navigationRef.current?.navigate("AgentResult", {
            resultId: data.resultId,
          });
        } else if (data.type === "document_processed") {
          // Navigate to documents
          navigationRef.current?.navigate("Documents");
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }
}
```

**Real-time Updates with WebSockets**:

```typescript
// apps/mobile/src/services/RealtimeService.ts
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@aidocs/shared";

export const useRealtimeUpdates = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const { token } = useAuthStore();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!token) return;

    setConnectionStatus("connecting");

    const wsUrl = `${
      __DEV__ ? "ws://localhost:3000" : "wss://api.aidocs.com"
    }/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealtimeMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");

      // Attempt reconnection with exponential backoff
      if (AppState.currentState === "active") {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  };

  const handleRealtimeMessage = (data: any) => {
    switch (data.type) {
      case "agent_status_update":
        // Update agent processing status
        updateAgentStatus(data.requestId, data.status);
        break;

      case "agent_completed":
        // Agent request completed
        handleAgentCompletion(data.result);
        break;

      case "document_processed":
        // Document processing completed
        handleDocumentProcessed(data.documentId);
        break;

      case "usage_limit_warning":
        // Show usage limit warning
        showUsageLimitWarning(data.usage);
        break;
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        // Reconnect when app becomes active
        if (connectionStatus === "disconnected") {
          connect();
        }
      } else {
        // Disconnect when app goes to background
        disconnect();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Initial connection
    if (token) {
      connect();
    }

    return () => {
      subscription.remove();
      disconnect();
    };
  }, [token]);

  return {
    connectionStatus,
    connect,
    disconnect,
  };
};
```

**Smart Badge Management**:

```typescript
// apps/mobile/src/services/BadgeService.ts
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class BadgeService {
  private static BADGE_KEY = "app_badge_count";

  static async updateBadge(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
      await AsyncStorage.setItem(this.BADGE_KEY, count.toString());
    } catch (error) {
      console.error("Failed to update badge:", error);
    }
  }

  static async incrementBadge() {
    const current = await this.getBadgeCount();
    await this.updateBadge(current + 1);
  }

  static async clearBadge() {
    await this.updateBadge(0);
  }

  static async getBadgeCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(this.BADGE_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  static async handleNotificationInteraction(type: string) {
    // Decrement badge when user interacts with notifications
    const current = await this.getBadgeCount();
    if (current > 0) {
      await this.updateBadge(current - 1);
    }
  }
}
```

**Deliverable**: Complete push notification system with real-time updates and smart badge management

### **Phase 3: App Store Deployment (Weeks 18-20 - 40 hours)**

#### **3.1 App Store Optimization & Assets (15 hours)**

**App Store Assets & Metadata**:

```typescript
// App store configuration and assets
const appStoreConfig = {
  ios: {
    bundleId: "com.aidocs.mobile",
    version: "1.0.0",
    buildNumber: "1",
    icons: {
      "20x20": "assets/ios/Icon-20.png",
      "29x29": "assets/ios/Icon-29.png",
      "40x40": "assets/ios/Icon-40.png",
      "58x58": "assets/ios/Icon-58.png",
      "60x60": "assets/ios/Icon-60.png",
      "80x80": "assets/ios/Icon-80.png",
      "87x87": "assets/ios/Icon-87.png",
      "120x120": "assets/ios/Icon-120.png",
      "180x180": "assets/ios/Icon-180.png",
      "1024x1024": "assets/ios/Icon-1024.png",
    },
    screenshots: {
      'iPhone 6.5"': [
        "assets/screenshots/ios/6.5/01-home.png",
        "assets/screenshots/ios/6.5/02-agents.png",
        "assets/screenshots/ios/6.5/03-preview.png",
        "assets/screenshots/ios/6.5/04-documents.png",
        "assets/screenshots/ios/6.5/05-search.png",
      ],
    },
  },
  android: {
    package: "com.aidocs.mobile",
    versionCode: 1,
    versionName: "1.0.0",
    icons: {
      mdpi: "assets/android/ic_launcher_48.png",
      hdpi: "assets/android/ic_launcher_72.png",
      xhdpi: "assets/android/ic_launcher_96.png",
      xxhdpi: "assets/android/ic_launcher_144.png",
      xxxhdpi: "assets/android/ic_launcher_192.png",
    },
  },
  metadata: {
    name: "AI Docs - Smart Knowledge Assistant",
    shortDescription: "AI agents that work with your documents",
    description: `Transform your document workflow with AI agents that understand your entire knowledge base.

Key Features:
• Create Agent: Generate complete documents from simple requests
• Edit Agent: Improve existing content with contextual understanding  
• Research Agent: Synthesize insights across your document library
• Mobile-First: Full functionality on phone and tablet
• Offline Support: Work anywhere, sync when connected
• Voice Input: Speak your requests naturally
• Smart Search: Find information by meaning, not just keywords

Perfect for developers, writers, researchers, and knowledge workers who want AI assistance that truly understands their content.`,
    keywords: [
      "AI",
      "productivity",
      "documents",
      "writing",
      "assistant",
      "knowledge",
      "markdown",
      "notes",
    ],
    category: "Productivity",
    ageRating: "4+",
    privacyPolicyUrl: "https://aidocs.com/privacy",
    supportUrl: "https://aidocs.com/support",
  },
};
```

**Performance Optimization for App Stores**:

```typescript
// apps/mobile/src/utils/performance.ts
export class PerformanceOptimizer {
  static optimizeForProduction() {
    // Disable console logs in production
    if (!__DEV__) {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }

    // Enable layout optimization
    if (Platform.OS === "ios") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  static async preloadCriticalAssets() {
    // Preload fonts
    await Font.loadAsync({
      "System-Medium": require("../../assets/fonts/System-Medium.ttf"),
      "System-Bold": require("../../assets/fonts/System-Bold.ttf"),
    });

    // Preload images
    const imageAssets = [
      require("../../assets/images/onboarding-1.png"),
      require("../../assets/images/onboarding-2.png"),
      require("../../assets/images/onboarding-3.png"),
    ];

    await Promise.all(
      imageAssets.map((asset) => Asset.fromModule(asset).downloadAsync())
    );
  }

  static setupPerformanceMonitoring() {
    // Monitor JS thread performance
    const jsThreadMonitor = setInterval(() => {
      const start = Date.now();
      setTimeout(() => {
        const diff = Date.now() - start;
        if (diff > 16.67) {
          // 60fps threshold
          console.log("JS thread blocking detected:", diff + "ms");
        }
      }, 0);
    }, 1000);

    return () => clearInterval(jsThreadMonitor);
  }
}
```

**Deliverable**: Complete app store assets and performance optimization

#### **3.2 Testing & Quality Assurance (15 hours)**

**Automated Testing Setup**:

```typescript
// apps/mobile/__tests__/AgentRequest.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { AgentRequestScreen } from "../src/screens/AgentRequestScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("AgentRequestScreen", () => {
  it("should submit agent request with valid input", async () => {
    const queryClient = createTestQueryClient();

    const { getByPlaceholderText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AgentRequestScreen />
      </QueryClientProvider>
    );

    const input = getByPlaceholderText("Ask your AI agent...");
    const sendButton = getByText("Send");

    fireEvent.changeText(input, "Create a summary of my project notes");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(getByText("Processing...")).toBeTruthy();
    });
  });

  it("should handle voice input correctly", async () => {
    // Mock voice recognition
    const mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onend: null,
    };

    global.SpeechRecognition = jest.fn(() => mockRecognition);

    const { getByTestId } = render(<AgentRequestScreen />);
    const voiceButton = getByTestId("voice-input-button");

    fireEvent.press(voiceButton);

    expect(mockRecognition.start).toHaveBeenCalled();
  });
});
```

**E2E Testing with Detox**:

```typescript
// apps/mobile/e2e/agent-workflow.test.js
describe("Agent Workflow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should complete full agent request workflow", async () => {
    // Navigate to Agents tab
    await element(by.text("AI Agents")).tap();

    // Enter request
    await element(by.id("agent-input")).typeText("Create a project overview");

    // Select Create agent
    await element(by.id("agent-type-create")).tap();

    // Submit request
    await element(by.id("submit-button")).tap();

    // Wait for processing to complete
    await waitFor(element(by.id("agent-preview")))
      .toBeVisible()
      .withTimeout(30000);

    // Approve the result
    await element(by.id("approve-button")).tap();

    // Verify success
    await expect(element(by.text("Applied successfully"))).toBeVisible();
  });

  it("should work offline and sync when online", async () => {
    // Disable network
    await device.setNetworkConnection("airplane");

    // Submit request (should queue)
    await element(by.id("agent-input")).typeText("Offline test request");
    await element(by.id("submit-button")).tap();

    // Should show queued message
    await expect(element(by.text("Queued for sync"))).toBeVisible();

    // Re-enable network
    await device.setNetworkConnection("wifi");

    // Should sync automatically
    await waitFor(element(by.text("Request completed")))
      .toBeVisible()
      .withTimeout(60000);
  });
});
```

**Device Testing Matrix**:

```typescript
const testMatrix = {
  ios: [
    { device: "iPhone 12", os: "15.0" },
    { device: "iPhone 13 Pro", os: "16.0" },
    { device: "iPhone 14", os: "17.0" },
    { device: "iPad Air", os: "16.0" },
  ],
  android: [
    { device: "Pixel 4", os: "11" },
    { device: "Pixel 6", os: "12" },
    { device: "Samsung Galaxy S21", os: "13" },
    { device: "Samsung Galaxy Tab", os: "12" },
  ],
};
```

**Deliverable**: Comprehensive testing suite with automated E2E tests

#### **3.3 App Store Submission & Launch (10 hours)**

**EAS Build Configuration**:

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.aidocs.com"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.aidocs.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

**App Store Review Guidelines Compliance**:

```typescript
// Compliance checklist implementation
const appStoreCompliance = {
  ios: {
    // App Store Review Guidelines compliance
    dataUsage: {
      description: "Clearly explain AI data processing in privacy policy",
      implementation: "Privacy policy accessible in app settings",
      status: "compliant",
    },
    permissions: {
      description: "Request permissions only when needed",
      implementation: "Camera permission requested only for document scanning",
      status: "compliant",
    },
    subscription: {
      description: "Use App Store billing for subscriptions",
      implementation: "Revenue Cat integration for iOS billing",
      status: "pending",
    },
  },
  android: {
    // Google Play Console compliance
    targetSDK: {
      description: "Target latest Android SDK",
      implementation: "Target SDK 34",
      status: "compliant",
    },
    permissions: {
      description: "Minimal permissions with runtime requests",
      implementation: "Camera and storage permissions on-demand only",
      status: "compliant",
    },
  },
};
```

**Launch Monitoring & Analytics**:

```typescript
// apps/mobile/src/services/AnalyticsService.ts
import { Analytics } from "expo-analytics";
import * as Sentry from "sentry-expo";

class LaunchAnalyticsService {
  static setupCrashReporting() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enableInExpoDevelopment: false,
      debug: __DEV__,
    });
  }

  static trackAppLaunch() {
    Analytics.track("app_launched", {
      platform: Platform.OS,
      version: Constants.nativeAppVersion,
      buildNumber: Constants.nativeBuildVersion,
    });
  }

  static trackFirstTimeUser() {
    Analytics.track("first_time_user", {
      source: "app_store",
      platform: Platform.OS,
    });
  }

  static trackAgentUsage(agentType: string, success: boolean) {
    Analytics.track("agent_used", {
      agent_type: agentType,
      success,
      platform: Platform.OS,
    });
  }
}
```

**Deliverable**: Successful app store submissions with monitoring and analytics

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Weeks 13-14 Deliverables**

- [ ] Monorepo structure with 80%+ shared code extraction
- [ ] React Native app initialization with Expo
- [ ] Native navigation system with deep linking
- [ ] Platform-specific storage integration
- [ ] Universal component abstraction layer
- [ ] Development workflow and build pipeline

### **Weeks 15-17 Deliverables**

- [ ] Native UI components with gesture handling
- [ ] Camera integration for document scanning
- [ ] Offline storage and background sync
- [ ] Push notification system setup
- [ ] Real-time WebSocket integration
- [ ] Performance optimization for mobile devices

### **Weeks 18-20 Deliverables**

- [ ] App store assets and metadata preparation
- [ ] Comprehensive testing suite (unit + E2E)
- [ ] Performance benchmarking and optimization
- [ ] App store submission and approval
- [ ] Launch monitoring and analytics
- [ ] User feedback collection system

### **Quality Gates**

- [ ] 80%+ code sharing between web PWA and native apps
- [ ] App launches in <2 seconds on mid-range devices
- [ ] All core features work offline
- [ ] Push notifications deliver within 30 seconds
- [ ] App store ratings >4.5 stars within 30 days
- [ ] Zero critical crashes in production

---

## 📊 **SUCCESS METRICS**

### **Technical Performance**

- **Code Sharing**: 80%+ shared code between platforms
- **Launch Time**: <2 seconds cold start on mid-range devices
- **Memory Usage**: <150MB RAM during normal usage
- **Battery Impact**: <3% drain per hour of active usage
- **Crash Rate**: <0.1% crash-free sessions

### **User Adoption**

- **App Store Approval**: Approved on first submission
- **Download Rate**: 1000+ downloads in first month
- **User Ratings**: 4.5+ stars average across both stores
- **Daily Active Users**: 40% of app users return daily
- **Feature Adoption**: 70% use native features (camera, push notifications)

### **Business Impact**

- **Native App Revenue**: 60% of new subscriptions from mobile apps
- **User Retention**: 50% higher retention for native app users
- **Platform Distribution**: 70% iOS, 30% Android user split
- **Upgrade Rate**: 25% of PWA users upgrade to native app

---

## 🚀 **SUPABASE UNIVERSAL CLIENT ARCHITECTURE ADVANTAGES**

### **React Native Transition Revolution - Supabase Benefits**

**This document has been updated to reflect Supabase's universal client approach. Key advantages:**

#### **Seamless Cross-Platform Development**

- **Single API Client**: Identical Supabase client works on web PWA and React Native
- **Same Authentication**: Social logins work identically across platforms
- **Identical Real-time**: Subscriptions use the same code on web and mobile
- **Shared State Management**: Apollo Client cache works the same way
- **85% Code Sharing**: Higher than traditional approaches due to unified backend

#### **React Native-Specific Advantages**

| Aspect                | Traditional Approach            | Supabase Approach            | Advantage                |
| --------------------- | ------------------------------- | ---------------------------- | ------------------------ |
| **API Integration**   | Separate mobile API adaptations | Same Supabase client         | 100% code reuse          |
| **Real-time Updates** | Custom WebSocket handling       | Same subscriptions API       | Identical implementation |
| **Authentication**    | Platform-specific OAuth flows   | Same Supabase Auth           | Zero custom auth code    |
| **Offline Storage**   | Custom React Native solutions   | Same Apollo + Supabase cache | Consistent behavior      |
| **Type Safety**       | Manual type definitions         | Auto-generated from schema   | Always in sync           |
| **Error Handling**    | Platform-specific error logic   | Same RLS and validation      | Unified error states     |

#### **Implementation Timeline Acceleration**

| Phase                     | Traditional Migration | Supabase Migration | Time Saved        |
| ------------------------- | --------------------- | ------------------ | ----------------- |
| **Client Setup**          | 20 hours              | 5 hours            | 75% faster        |
| **API Integration**       | 30 hours              | 8 hours            | 73% faster        |
| **Real-time Features**    | 25 hours              | 10 hours           | 60% faster        |
| **Authentication**        | 15 hours              | 3 hours            | 80% faster        |
| **Offline Capabilities**  | 20 hours              | 12 hours           | 40% faster        |
| **State Management**      | 15 hours              | 8 hours            | 47% faster        |
| **Testing & Integration** | 20 hours              | 15 hours           | 25% faster        |
| **App Store Preparation** | 15 hours              | 12 hours           | 20% faster        |
| **Total**                 | **160 hours**         | **73 hours**       | **54% reduction** |

### **Universal Supabase Client Benefits**

#### **Development Experience**

```typescript
// Same exact code works on web PWA and React Native
const { data: documents, error } = useQuery(GET_DOCUMENTS);
const { progress } = useAgentProgress(requestId);
const { user } = useSupabaseAuth();

// No platform-specific adaptations needed!
```

#### **Real-time Subscriptions (Identical)**

```typescript
// Exactly the same code on web and mobile
useEffect(() => {
  const subscription = supabase
    .channel(`agent_progress:${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "agent_requests",
        filter: `id=eq.${requestId}`,
      },
      handleProgress
    )
    .subscribe();

  return () => supabase.removeChannel(subscription);
}, [requestId]);
```

#### **Authentication (Universal)**

```typescript
// Same social login code works everywhere
const signInWithGoogle = () => {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        Platform.OS === "web" ? "https://app.centrid.ai" : "centrid://auth",
    },
  });
};
```

### **Native-Specific Enhancements with Supabase**

#### **Enhanced Security**

- **Biometric Authentication**: Easy integration with Supabase Auth
- **App Transport Security**: Supabase handles SSL/TLS automatically
- **Certificate Pinning**: Available in Supabase client configuration
- **Keychain Storage**: Automatic secure token storage on iOS/Android

#### **Improved Performance**

- **Edge Caching**: Supabase global CDN works with React Native
- **Connection Pooling**: Automatic connection management
- **Background Sync**: Built-in with Supabase client
- **Optimistic Updates**: Same Apollo Client optimistic UI

#### **Better Offline Experience**

- **Smart Caching**: Apollo Client + Supabase client offline storage
- **Conflict Resolution**: Built-in last-write-wins with custom logic support
- **Queue Management**: Automatic request queueing when offline
- **Sync Indicators**: Real-time connection status

### **Platform-Specific Integration Benefits**

#### **iOS Enhancements**

- **App Clips**: Easy integration with Supabase Edge Functions
- **Shortcuts**: Siri integration with GraphQL queries
- **Widgets**: Real-time data via Supabase subscriptions
- **Background App Refresh**: Efficient with event-driven updates

#### **Android Enhancements**

- **Widgets**: Live data from Supabase real-time
- **Shortcuts**: Quick actions calling Edge Functions
- **Background Tasks**: Efficient with subscription-based updates
- **Adaptive Icons**: Dynamic based on user activity

### **App Store Success Factors**

#### **Performance Advantages**

- **Faster Startup**: Supabase client initializes quickly
- **Smooth Scrolling**: Apollo Client cache prevents loading jank
- **Real-time Responsiveness**: Sub-second updates impress reviewers
- **Battery Efficiency**: Event-driven vs polling saves battery

#### **Feature Completeness**

- **Offline First**: Works without internet connection
- **Social Login**: Professional authentication flows
- **Push Notifications**: Via Supabase real-time (if needed)
- **Native Integrations**: Camera, biometrics, file system

### **Business Impact Amplification**

✅ **54% faster development**: 160 hours → 73 hours  
✅ **85% code sharing**: Higher than industry standard  
✅ **Identical feature parity**: Everything from PWA works identically  
✅ **Better performance**: Native app feels faster than PWA  
✅ **Lower maintenance**: Same backend, same APIs, same logic  
✅ **Future-proof**: Easy to add new platforms (Windows, macOS)

### **Migration Path Simplicity**

**Traditional Approach:** Rewrite APIs → Adapt authentication → Build real-time → Test cross-platform → Debug differences → App store submission

**Supabase Approach:** Install React Native client → Copy business logic → Adapt UI components → Test native features → App store submission

---

**This Supabase-powered native app transition strategy for Centrid delivers true native performance while maximizing code efficiency through universal client architecture, positioning the platform for rapid, cost-effective growth across all mobile platforms.**
