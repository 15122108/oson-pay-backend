import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatMoney, formatPhone } from '../../constants/theme';
import { api } from '../../services/api';

const QUICK = [50000, 100000, 250000, 500000, 1000000];

export default function SendModal() {
  const [step, setStep] = useState<'phone' | 'amount' | 'confirm'>('phone');
  const [receiverPhone, setReceiverPhone] = useState('998');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const digits = receiverPhone.replace(/\D/g, '');

  function displayPhone() {
    const d = digits.slice(0, 12);
    if (d.length <= 3) return '+' + d;
    if (d.length <= 5) return `+${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5)}`;
    if (d.length <= 10) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8)}`;
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  }

  const e164 = `+${digits.startsWith('998') ? digits : '998' + digits}`;

  async function handleSend() {
    setLoading(true);
    try {
      await api.sendMoney(e164, Number(amount), note || undefined);
      Alert.alert('✅ Muvaffaqiyatli!', `${formatMoney(Number(amount))} UZS yuborildi`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Xato', e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step === 'phone' ? router.back() : setStep(step === 'confirm' ? 'amount' : 'phone')}>
            <Text style={s.headerBtn}>{step === 'phone' ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {step === 'phone' ? "Kimga jo'natish" : step === 'amount' ? 'Miqdor' : 'Tasdiqlash'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress */}
        <View style={s.progress}>
          {[0,1,2].map(i => (
            <View key={i} style={[s.progDot, ['phone','amount','confirm'].indexOf(step) >= i && s.progDotOn]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <View style={s.form}>
              <Text style={s.label}>Qabul qiluvchi telefon raqami</Text>
              <View style={s.phoneBox}>
                <Text style={{ fontSize: 20 }}>🇺🇿</Text>
                <TextInput
                  style={s.phoneInput}
                  value={displayPhone()}
                  onChangeText={t => setReceiverPhone(t.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  placeholder="+998 90 123 45 67"
                  placeholderTextColor={C.t3}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={() => setStep('amount')}
                disabled={digits.length < 12}
                style={[s.btnWrap, digits.length < 12 && { opacity: 0.4 }]}
              >
                <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
                  <Text style={s.btnTxt}>Davom etish →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <View style={s.form}>
              <View style={s.recipientInfo}>
                <Text style={{ fontSize: 20 }}>📱</Text>
                <Text style={s.recipientPhone}>{displayPhone()}</Text>
              </View>

              <Text style={s.label}>Miqdor (UZS)</Text>
              <View style={s.amountBox}>
                <TextInput
                  style={s.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.t3}
                  autoFocus
                />
                <Text style={s.amountCurrency}>UZS</Text>
              </View>

              <View style={s.quickAmounts}>
                {QUICK.map(q => (
                  <TouchableOpacity
                    key={q}
                    style={[s.quickBtn, amount === String(q) && s.quickBtnActive]}
                    onPress={() => setAmount(String(q))}
                  >
                    <Text style={[s.quickBtnTxt, amount === String(q) && s.quickBtnTxtActive]}>
                      {formatMoney(q)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Izoh (ixtiyoriy)</Text>
              <TextInput
                style={s.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Masalan: Tushlik uchun"
                placeholderTextColor={C.t3}
              />

              <TouchableOpacity
                onPress={() => setStep('confirm')}
                disabled={!amount || Number(amount) < 1000}
                style={[s.btnWrap, (!amount || Number(amount) < 1000) && { opacity: 0.4 }]}
              >
                <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
                  <Text style={s.btnTxt}>Davom etish →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <View style={s.form}>
              <View style={s.confirmCard}>
                <Row label="Qabul qiluvchi" value={displayPhone()} />
                <Row label="Miqdor" value={`${formatMoney(Number(amount))} UZS`} highlight />
                {note ? <Row label="Izoh" value={note} /> : null}
                <Row label="Komissiya" value="0 UZS 🎉" />
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Jami to'lanadigan:</Text>
                  <Text style={s.totalAmount}>{formatMoney(Number(amount))} UZS</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleSend} disabled={loading} style={s.btnWrap}>
                <LinearGradient colors={C.gSuccess} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>✓ Tasdiqlash va yuborish</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.confirmRow}>
      <Text style={s.confirmLabel}>{label}</Text>
      <Text style={[s.confirmValue, highlight && { color: C.orange, fontSize: 18, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.lg, paddingVertical: S.md,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerBtn: { fontSize: 22, color: C.t2, width: 36, textAlign: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.t1 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: S.md },
  progDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  progDotOn: { width: 24, backgroundColor: C.primary },
  content: { padding: S.lg, paddingBottom: 40 },
  form: { gap: S.md },
  label: { fontSize: 12, color: C.t3, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.elevated, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: S.md, height: 58,
  },
  phoneInput: { flex: 1, fontSize: 18, fontWeight: '600', color: C.t1, letterSpacing: 0.5 },
  btnWrap: { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  recipientInfo: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.md, borderWidth: 1, borderColor: C.primaryBorder,
  },
  recipientPhone: { fontSize: 16, fontWeight: '600', color: C.t1 },
  amountBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.elevated, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: S.md, height: 70,
  },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '900', color: C.t1 },
  amountCurrency: { fontSize: 16, color: C.t3, fontWeight: '600' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full,
    backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border,
  },
  quickBtnActive: { backgroundColor: C.orangeBg, borderColor: C.orange },
  quickBtnTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  quickBtnTxtActive: { color: C.orange, fontWeight: '700' },
  noteInput: {
    backgroundColor: C.elevated, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.md, height: 50, color: C.t1, fontSize: 15,
  },
  confirmCard: {
    backgroundColor: C.elevated, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.md, paddingVertical: S.md,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  confirmLabel: { fontSize: 13, color: C.t3 },
  confirmValue: { fontSize: 15, fontWeight: '600', color: C.t1 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.md, paddingVertical: S.md,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.t1 },
  totalAmount: { fontSize: 20, fontWeight: '900', color: C.t1 },
});
