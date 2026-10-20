import React from 'react'

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (style: any): any => {
    if (!style) return {}
    const resolved = typeof style === 'function' ? style({ pressed: false }) : style
    if (Array.isArray(resolved)) {
      return Object.assign({}, ...resolved.filter(Boolean).map(s => StyleSheet.flatten(s)))
    }
    if (typeof resolved === 'object') {
      return resolved
    }
    return {}
  },
}

export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios ?? obj.default,
}

export const useColorScheme = () => 'light'

export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
}

export const Keyboard = {
  addListener: (_event: string, _callback: () => void) => ({
    remove: () => {},
  }),
  dismiss: () => {},
}

export const Dimensions = {
  get: () => ({ width: 390, height: 844 }),
  addEventListener: () => ({ remove: () => {} }),
}

export const Linking = {
  openURL: async () => {},
  canOpenURL: async () => true,
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}

export const Share = {
  share: async () => ({ action: 'sharedAction' }),
}

export const Alert = {
  alert: (_title: string, _message?: string, _buttons?: any[]) => {},
}

export const StatusBar = () => null

export const Animated = {
  Value: function (_val: number) {
    return {
      setValue: () => {},
      interpolate: () => 0,
    }
  },
  timing: () => ({ start: (cb?: any) => cb && cb(), stop: () => {} }),
  sequence: () => ({ start: (cb?: any) => cb && cb(), stop: () => {} }),
  loop: () => ({ start: (cb?: any) => cb && cb(), stop: () => {} }),
  View: ({ children, ...props }: any) => createDomElement('div', props, children),
}

function sanitizeProps(props: any) {
  const {
    style,
    accessibilityRole,
    accessibilityLabel,
    accessibilityState,
    hitSlop,
    contentContainerStyle,
    refreshControl,
    showsHorizontalScrollIndicator,
    showsVerticalScrollIndicator,
    keyboardShouldPersistTaps,
    activeOpacity,
    numberOfLines,
    ...rest
  } = props || {}

  const cleanStyle = StyleSheet.flatten(style)

  const domProps: any = { ...rest }
  if (cleanStyle && Object.keys(cleanStyle).length > 0) {
    // Only pass scalar CSS properties that React DOM accepts without error
    const domStyle: Record<string, any> = {}
    for (const [key, val] of Object.entries(cleanStyle)) {
      if (val !== undefined && val !== null && typeof val !== 'object') {
        domStyle[key] = val
      }
    }
    if (Object.keys(domStyle).length > 0) {
      domProps.style = domStyle
    }
  }

  if (accessibilityRole) {
    domProps.role = accessibilityRole
  }
  if (accessibilityLabel) {
    domProps['aria-label'] = accessibilityLabel
  }
  return domProps
}

function createDomElement(tag: string, props: any, children?: any) {
  const domProps = sanitizeProps(props)
  return React.createElement(tag, domProps, children)
}

// Minimal mock components for tests
export const View = ({ children, ...props }: any) => createDomElement('div', props, children)
export const Text = ({ children, ...props }: any) => createDomElement('span', props, children)
export const ScrollView = ({ children, ...props }: any) => createDomElement('div', props, children)
export const Image = (props: any) => createDomElement('img', props)
export const TextInput = (props: any) => createDomElement('input', props)
export const Pressable = ({ children, onPress, ...props }: any) =>
  createDomElement('button', { onClick: onPress, ...props }, children)
export const TouchableOpacity = ({ children, onPress, ...props }: any) =>
  createDomElement('button', { onClick: onPress, ...props }, children)
export const ActivityIndicator = (props: any) =>
  createDomElement('div', { 'data-testid': 'activity-indicator', ...props })
export const SafeAreaView = ({ children, ...props }: any) => createDomElement('div', props, children)
export const KeyboardAvoidingView = ({ children, ...props }: any) => createDomElement('div', props, children)
export const RefreshControl = (_props: any) => null
export const Switch = ({ value, onValueChange, ...props }: any) =>
  createDomElement('input', { type: 'checkbox', checked: value, onChange: (e: any) => onValueChange?.(e.target.checked), ...props })
export const Modal = ({ visible, children, ...props }: any) =>
  visible !== false ? createDomElement('div', { 'data-testid': 'modal', ...props }, children) : null
export const FlatList = ({ data, renderItem, ListEmptyComponent, ...props }: any) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent
      ? React.isValidElement(ListEmptyComponent)
        ? ListEmptyComponent
        : React.createElement(ListEmptyComponent)
      : null
  }
  return createDomElement(
    'div',
    props,
    data.map((item: any, index: number) =>
      React.createElement(React.Fragment, { key: item.id || index }, renderItem({ item, index }))
    )
  )
}

export type TextStyle = any
export type ViewStyle = any
export type ImageStyle = any
