import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase, getCurrentUser } from './src/services/supabase'
import { AuthScreen } from './src/screens/AuthScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { RegisterScreen } from './src/screens/RegisterScreen'
import { ReviewScreen } from './src/screens/ReviewScreen'
import { StatsScreen } from './src/screens/StatsScreen'
import { SessionProvider } from './src/stores/useSessionStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const Tab = createBottomTabNavigator()

function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Registrar" component={RegisterScreen} />
      <Tab.Screen name="Revisar" component={ReviewScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SessionProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            {user ? <AppNavigator /> : <AuthScreen />}
          </NavigationContainer>
        </SessionProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}