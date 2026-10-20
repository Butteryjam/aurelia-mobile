import { vi } from 'vitest'

// Define React Native globals in test environment
;(globalThis as any).__DEV__ = true

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://upzkcqovqstfsizerulx.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_dummy_key_for_testing'
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000'

// Mock AsyncStorage
const storageMap = new Map<string, string>()
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storageMap.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storageMap.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      storageMap.delete(key)
    }),
    clear: vi.fn(async () => {
      storageMap.clear()
    }),
  },
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'test-user-id', email: 'chef@aurelia.app' } }, error: null })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(async () => ({ error: null })),
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        })),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        setSession: vi.fn(),
        exchangeCodeForSession: vi.fn(),
        verifyOtp: vi.fn(),
      },
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async () => ({ data: { path: 'test-user-id/mock-image.jpg' }, error: null })),
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://upzkcqovqstfsizerulx.supabase.co/storage/v1/object/public/recipe-images/test-user-id/mock-image.jpg' },
          })),
        })),
      },
    },
  }
})

// Mock Expo Image Picker
vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(async () => ({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/com.aurelia.mobile/cache/photo.jpg',
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 100,
        width: 1200,
        height: 800,
      },
    ],
  })),
  launchCameraAsync: vi.fn(async () => ({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/com.aurelia.mobile/cache/camera.jpg',
        fileName: 'camera.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 100,
        width: 1200,
        height: 800,
      },
    ],
  })),
  requestMediaLibraryPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
  requestCameraPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
  MediaTypeOptions: { Images: 'Images', All: 'All', Videos: 'Videos' },
}))

// Mock Expo Router
vi.mock('expo-router', () => {
  const ScreenMock = () => null
  const StackMock = Object.assign(({ children }: any) => children, { Screen: ScreenMock })
  const TabsMock = Object.assign(({ children }: any) => children, { Screen: ScreenMock })

  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      canGoBack: () => true,
    }),
    useSegments: () => ['(app)', '(tabs)', 'home'],
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    Redirect: () => null,
    Stack: StackMock,
    Tabs: TabsMock,
  }
})

vi.mock('expo-router/tabs', () => ({
  default: () => null,
  Tabs: () => null,
}))

// Mock Expo Linking
vi.mock('expo-linking', () => ({
  createURL: vi.fn((path: string) => `aurelia://${path}`),
  useURL: vi.fn(() => null),
  getInitialURL: vi.fn(async () => null),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  openURL: vi.fn(async () => {}),
}))

// Mock Expo Haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(async () => {}),
  selectionAsync: vi.fn(async () => {}),
  notificationAsync: vi.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}))

// Mock Safe Area Context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}))

// Mock Expo Image
vi.mock('expo-image', () => {
  const React = require('react')
  return {
    Image: ({ accessibilityLabel }: any) =>
      React.createElement('span', {
        'data-testid': 'expo-image',
        'aria-label': accessibilityLabel,
      }),
  }
})

// Mock Expo Keep Awake
vi.mock('expo-keep-awake', () => ({
  useKeepAwake: vi.fn(),
  activateKeepAwakeAsync: vi.fn(async () => {}),
  deactivateKeepAwake: vi.fn(),
}))

