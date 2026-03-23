import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/supabase'

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, fullName)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer login com Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>StudyPro</Text>
      <Text style={styles.subtitle}>Orquestrador de Estudos</Text>

      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.googleButtonText}>Continuar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 16,
  },
  switchText: {
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    color: '#DC2626',
    textAlign: 'center',
  },
})