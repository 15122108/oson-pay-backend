import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../constants/theme';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function OsonLogo() {
  return (
    <View style={ls.logoCircle}>
      <LinearGradient
        colors={['#7B2FBE', '#C44AFF', '#FF6B00']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ls.logoGrad}
      >
        <Text style={ls.logoP}>P</Text>
      </LinearGradient>
    </View>
  );
}

export default function LoginScreen() {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('998');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState('');
  const { login } = useAuth();
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const digits = phone.replace(/\D/g, '');
  const e164 = `+${digits.startsWith('998') ? digits : '998' + digits}`;

  function displayPhone() {
    const d = digits.slice(0, 12);
    if (d.length <= 3) return '+' + d;
    if (d.length <= 5) return `+${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5)}`;
    if (d.length <= 10) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8)}`;
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  }

  function startTimer(s: number) {
    setCountdown(s);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  async function sendOTP() {
    if (digits.length < 12) { Alert.alert('', "To'liq raqam kiriting"); return; }
    setLoading(true);
    try {
      const res = await api.sendOTP(e164);
      if (res.devCode) setDevCode(res.devCode);
      setStep('otp');
      startTimer(180);
    } catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setLoading(false); }
  }

  function handleOTP(val: string, i: number) {
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.join('').length === 6) setTimeout(() => verifyOTP(next.join('')), 200);
  }

  async function verifyOTP(code: string) {
    setLoading(true);
    try {
      const res = await api.verifyOTP(e164, code, fullName || undefined);
      if (res.isNewUser && !fullName) { setLoading(false); setStep('name'); return; }
      await login(res.token, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Xato', e.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={ls.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={ls.inner}>
          {/* Logo */}
          <View style={ls.logoArea}>
            <OsonLogo />
            <View style={ls.nameRow}>
              <Text style={ls.nameOson}>Oson</Text>
              <Text style={ls.namePay}>Pay</Text>
            </View>
            <Text style={ls.tagline}>Tez. Oson. Ishonchli.</Text>
          </View>

          {step === 'phone' && (
            <View style={ls.form}>
              <Text style={ls.h1}>Kirish</Text>
              <Text style={ls.sub}>Telefon raqamingizni kiriting</Text>
              <View style={ls.phoneBox}>
                <Text style={{ fontSize: 22 }}>🇺🇿</Text>
                <TextInput
                  style={ls.phoneField}
                  value={displayPhone()}
                  onChangeText={t => setPhone(t.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  placeholder="+998 90 123 45 67"
                  placeholderTextColor={C.t3}
                  maxLength={17}
                />
              </View>
              <TouchableOpacity
                onPress={sendOTP}
                disabled={loading || digits.length < 12}
                style={[ls.btnWrap, digits.length < 12 && { opacity: 0.4 }]}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ls.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={ls.btnTxt}>Davom etish →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={ls.form}>
              <Text style={ls.h1}>SMS kodni kiriting</Text>
              <Text style={ls.sub}>
                <Text style={{ color: C.orange }}>{displayPhone()}</Text>{' '}ga yuborildi
              </Text>
              {devCode ? (
                <View style={ls.devBox}>
                  <Text style={{ color: C.t2, fontSize: 13 }}>
                    🧪 Test kodi: <Text style={{ color: C.orange, fontWeight: '800' }}>{devCode}</Text>
                  </Text>
                </View>
              ) : null}
              <View style={ls.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={r => { otpRefs.current[i] = r; }}
                    style={[ls.otpBox, d ? ls.otpBoxActive : null]}
                    value={d}
                    onChangeText={v => handleOTP(v, i)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                        const n = [...otp]; n[i - 1] = ''; setOtp(n);
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    keyboardType="numeric" maxLength={1} textAlign="center"
                  />
                ))}
              </View>
              {loading && <ActivityIndicator color={C.primary} />}
              <View style={ls.otpFooter}>
                <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['','','','','','']); }}>
                  <Text style={{ color: C.t3, fontSize: 13 }}>← Raqamni o'zgartirish</Text>
                </TouchableOpacity>
                {countdown > 0
                  ? <Text style={{ color: C.t2, fontSize: 13, fontWeight: '600' }}>
                      {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </Text>
                  : <TouchableOpacity onPress={sendOTP}>
                      <Text style={{ color: C.orange, fontSize: 13, fontWeight: '600' }}>Qayta yuborish</Text>
                    </TouchableOpacity>
                }
              </View>
            </View>
          )}

          {step === 'name' && (
            <View style={ls.form}>
              <Text style={ls.h1}>Ismingiz</Text>
              <Text style={ls.sub}>Birinchi marta kiryapsiz. Ismingizni kiriting.</Text>
              <TextInput
                style={ls.nameInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ism Familiya"
                placeholderTextColor={C.t3}
                autoCapitalize="words"
                autoFocus
              />
              <TouchableOpacity
                onPress={() => verifyOTP(otp.join(''))}
                disabled={loading || !fullName.trim()}
                style={[ls.btnWrap, !fullName.trim() && { opacity: 0.4 }]}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ls.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={ls.btnTxt}>Boshlash 🚀</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, paddingHorizontal: S.lg, justifyContent: 'center', gap: 28 },
  logoArea: { alignItems: 'center' },
  logoCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 12 },
  logoGrad: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  logoP: { fontSize: 52, fontWeight: '900', color: '#FFB347' },
  nameRow: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  nameOson: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  namePay: { fontSize: 32, fontWeight: '900', color: C.orange },
  tagline: { fontSize: 13, color: C.t3, letterSpacing: 0.5 },
  form: { gap: 14 },
  h1: { fontSize: 22, fontWeight: '800', color: C.t1 },
  sub: { fontSize: 14, color: C.t2, lineHeight: 20 },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.elevated, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: S.md, height: 58,
  },
  phoneField: { flex: 1, fontSize: 18, fontWeight: '600', color: C.t1, letterSpacing: 0.5 },
  btnWrap: { borderRadius: R.xl, overflow: 'hidden' },
  btn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  devBox: {
    backgroundColor: C.orangeBg, borderRadius: R.md,
    padding: S.sm, borderWidth: 1, borderColor: C.orange + '40',
    alignItems: 'center',
  },
  otpRow: { flexDirection: 'row', gap: 8 },
  otpBox: {
    flex: 1, height: 62, borderRadius: R.md,
    backgroundColor: C.elevated, borderWidth: 1.5, borderColor: C.border,
    fontSize: 28, fontWeight: '900', color: C.t1,
  },
  otpBoxActive: { borderColor: C.primary, backgroundColor: C.primaryBg },
  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameInput: {
    backgroundColor: C.elevated, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: S.md, height: 58, fontSize: 18, color: C.t1,
  },
});
