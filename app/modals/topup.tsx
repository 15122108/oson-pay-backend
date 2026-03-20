import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';

const QUICK = [100000, 200000, 500000, 1000000, 2000000];

export default function TopUpModal() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleTopUp() {
    if (!amount || Number(amount) < 1000) {
      Alert.alert('', "Minimum 1,000 UZS kiriting");
      return;
    }
    setLoading(true);
    try {
      await api.topUp(Number(amount));
      Alert.alert('✅ Muvaffaqiyatli!', `${formatMoney(Number(amount))} UZS hisobingizga qo'shildi`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
          <Text style={s.title}>Hisob to'ldirish</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.iconWrap}>
            <LinearGradient colors={C.gOrange} style={s.iconCircle}>
              <Text style={{ fontSize: 36 }}>+</Text>
            </LinearGradient>
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
            <Text style={s.cur}>UZS</Text>
          </View>

          <View style={s.quickRow}>
            {QUICK.map(q => (
              <TouchableOpacity
                key={q}
                style={[s.quickBtn, amount === String(q) && s.quickBtnOn]}
                onPress={() => setAmount(String(q))}
              >
                <Text style={[s.quickTxt, amount === String(q) && s.quickTxtOn]}>
                  {formatMoney(q)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTxt}>✅ Komissiyasiz to'ldirish</Text>
            <Text style={s.infoTxt}>⚡ Bir zumda hisobga o'tadi</Text>
          </View>

          <TouchableOpacity
            onPress={handleTopUp}
            disabled={loading || !amount || Number(amount) < 1000}
            style={[s.btnWrap, (!amount || Number(amount) < 1000) && { opacity: 0.4 }]}
          >
            <LinearGradient colors={C.gOrange} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>
                {amount ? `${formatMoney(Number(amount))} UZS to'ldirish` : "Miqdor kiriting"}
              </Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  close: { fontSize: 20, color: C.t2, width: 36, textAlign: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.t1 },
  content: { padding: S.lg, gap: S.md, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginBottom: S.md },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, color: C.t3, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 70 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: C.t1 },
  cur: { fontSize: 16, color: C.t3, fontWeight: '600' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  quickBtnOn: { backgroundColor: C.orangeBg, borderColor: C.orange },
  quickTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  quickTxtOn: { color: C.orange, fontWeight: '700' },
  infoBox: { backgroundColor: C.successBg, borderRadius: R.lg, padding: S.md, gap: 6, borderWidth: 1, borderColor: C.successBorder },
  infoTxt: { fontSize: 13, color: C.success },
  btnWrap: { borderRadius: R.xl, overflow: 'hidden' },
  btn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
