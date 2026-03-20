import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';

const CARD_TYPES = [
  { id: 'uzcard', label: 'UzCard', grad: ['#7B2FBE','#FF6B00'] as [string,string] },
  { id: 'humo', label: 'Humo', grad: ['#00C896','#0099AA'] as [string,string] },
  { id: 'visa', label: 'Visa', grad: ['#1A1A2E','#4040CC'] as [string,string] },
  { id: 'mastercard', label: 'Mastercard', grad: ['#FF3B5C','#FF8C00'] as [string,string] },
];

export default function AddCardModal() {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardType, setCardType] = useState('uzcard');
  const [loading, setLoading] = useState(false);

  function formatCardNumber(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return d.slice(0,2) + '/' + d.slice(2);
    return d;
  }

  async function handleAdd() {
    const rawNum = cardNumber.replace(/\s/g, '');
    if (rawNum.length !== 16) { Alert.alert('', "16 raqamli karta raqamini kiriting"); return; }
    if (!cardHolder.trim()) { Alert.alert('', "Karta egasining ismini kiriting"); return; }
    if (expiry.length < 5) { Alert.alert('', "Amal qilish muddatini kiriting"); return; }

    const [month, year] = expiry.split('/');
    setLoading(true);
    try {
      await api.addCard({
        cardNumber: rawNum,
        cardHolder: cardHolder.toUpperCase(),
        expiryMonth: month,
        expiryYear: '20' + year,
        cardType,
      });
      Alert.alert('✅ Karta qo\'shildi!', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setLoading(false); }
  }

  const selected = CARD_TYPES.find(t => t.id === cardType)!;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
          <Text style={s.title}>Karta qo'shish</Text>
          <View style={{width:36}} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Card Preview */}
          <LinearGradient colors={selected.grad} start={{x:0,y:0}} end={{x:1,y:1}} style={s.preview}>
            <View style={s.previewTop}>
              <Text style={s.previewType}>{selected.label.toUpperCase()}</Text>
            </View>
            <Text style={s.previewNum}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={s.previewBot}>
              <Text style={s.previewHolder}>{cardHolder || 'ISM FAMILIYA'}</Text>
              <Text style={s.previewExp}>{expiry || 'MM/YY'}</Text>
            </View>
            <View style={[s.deco,{width:180,height:180,top:-60,right:-40}]} />
            <View style={[s.deco,{width:120,height:120,bottom:-30,left:20}]} />
          </LinearGradient>

          {/* Card type */}
          <Text style={s.label}>Karta turi</Text>
          <View style={s.typeRow}>
            {CARD_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.typeBtn, cardType === t.id && s.typeBtnActive]}
                onPress={() => setCardType(t.id)}
              >
                <LinearGradient colors={t.grad} style={s.typeDot} />
                <Text style={[s.typeTxt, cardType === t.id && { color: C.t1 }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Karta raqami</Text>
          <TextInput
            style={s.input}
            value={formatCardNumber(cardNumber)}
            onChangeText={t => setCardNumber(t.replace(/\D/g,''))}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={C.t3}
            keyboardType="numeric"
            maxLength={19}
          />

          <Text style={s.label}>Karta egasi</Text>
          <TextInput
            style={s.input}
            value={cardHolder}
            onChangeText={setCardHolder}
            placeholder="ISM FAMILIYA"
            placeholderTextColor={C.t3}
            autoCapitalize="characters"
          />

          <Text style={s.label}>Amal qilish muddati</Text>
          <TextInput
            style={s.input}
            value={expiry}
            onChangeText={t => setExpiry(formatExpiry(t))}
            placeholder="MM/YY"
            placeholderTextColor={C.t3}
            keyboardType="numeric"
            maxLength={5}
          />

          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading}
            style={[s.addBtn, loading && {opacity:0.6}]}
          >
            <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.addBtnGrad}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.addBtnTxt}>+ Karta qo'shish</Text>}
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
  preview: { borderRadius: R.xxl, padding: S.lg, height: 180, justifyContent: 'space-between', overflow: 'hidden' },
  previewTop: { alignItems: 'flex-end' },
  previewType: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  previewNum: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  previewBot: { flexDirection: 'row', justifyContent: 'space-between' },
  previewHolder: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1 },
  previewExp: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  deco: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' },
  label: { fontSize: 12, color: C.t3, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  typeRow: { flexDirection: 'row', gap: S.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.elevated, borderRadius: R.md, padding: S.sm, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  typeBtnActive: { borderColor: C.primary, backgroundColor: C.primaryBg },
  typeDot: { width: 14, height: 14, borderRadius: 7 },
  typeTxt: { fontSize: 12, color: C.t3, fontWeight: '600' },
  input: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 54, fontSize: 16, color: C.t1, letterSpacing: 0.5 },
  addBtn: { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  addBtnGrad: { height: 58, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
