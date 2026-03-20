import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';

export default function CardsScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await api.getCards();
      setCards(res.cards || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function setDefault(cardId: string) {
    try {
      await api.setDefaultCard(cardId);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); }
  }

  async function deleteCard(cardId: string) {
    Alert.alert("Kartani o'chirish", "Rostdan ham bu kartani o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: async () => {
        try { await api.deleteCard(cardId); load(); }
        catch (e: any) { Alert.alert('Xato', e.message); }
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Kartalarim</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => router.push('/modals/addcard' as any)}
          >
            <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.addBtnGrad}>
              <Text style={s.addBtnTxt}>+ Karta qo'shish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💳</Text>
            <Text style={s.emptyTitle}>Kartalar yo'q</Text>
            <Text style={s.emptyTxt}>Birinchi kartangizni qo'shing</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/modals/addcard' as any)}>
              <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.emptyBtnGrad}>
                <Text style={s.emptyBtnTxt}>Karta qo'shish</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.cardsList}>
            {cards.map(card => (
              <View key={card.id}>
                <LinearGradient
                  colors={[card.color_from || '#7B2FBE', card.color_to || '#FF6B00']}
                  start={{x:0,y:0}} end={{x:1,y:1}}
                  style={s.card}
                >
                  <View style={s.cardTop}>
                    <View>
                      <Text style={s.cardBalLbl}>Balans</Text>
                      <Text style={s.cardBal}>{formatMoney(card.balance)} UZS</Text>
                    </View>
                    <View style={s.cardTypeBadge}>
                      <Text style={s.cardType}>{(card.card_type || 'UZCARD').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={s.cardChip}>
                    <View style={s.chipLine} />
                    <View style={s.chipLine} />
                  </View>
                  <View style={s.cardBottom}>
                    <Text style={s.cardNum}>•••• •••• •••• {card.card_number?.slice(-4)}</Text>
                    <Text style={s.cardExp}>{card.expiry_month}/{card.expiry_year?.slice(-2)}</Text>
                  </View>
                  <Text style={s.cardHolder}>{card.card_holder}</Text>
                  {card.is_default && (
                    <View style={s.defaultTag}><Text style={s.defaultTagTxt}>Asosiy</Text></View>
                  )}
                  <View style={[s.deco,{width:180,height:180,top:-60,right:-40}]} />
                  <View style={[s.deco,{width:120,height:120,bottom:-30,left:20}]} />
                </LinearGradient>

                {/* Card actions */}
                <View style={s.cardActions}>
                  {!card.is_default && (
                    <TouchableOpacity style={s.cardAction} onPress={() => setDefault(card.id)}>
                      <Text style={s.cardActionTxt}>⭐ Asosiy qilish</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.cardAction, s.cardActionDanger]} onPress={() => deleteCard(card.id)}>
                    <Text style={[s.cardActionTxt, { color: C.danger }]}>🗑 O'chirish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: C.t1 },
  addBtn: { borderRadius: R.full, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 9 },
  addBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cardsList: { paddingHorizontal: S.lg, gap: S.md },
  card: { borderRadius: R.xxl, padding: S.lg, minHeight: 190, overflow: 'hidden', justifyContent: 'space-between', marginBottom: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBalLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  cardBal: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  cardTypeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.full, justifyContent: 'center' },
  cardType: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  cardChip: { width: 42, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: 4, gap: 4 },
  chipLine: { height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardNum: { color: 'rgba(255,255,255,0.8)', fontSize: 14, letterSpacing: 2 },
  cardExp: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  cardHolder: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 2, position: 'absolute', bottom: S.lg, left: S.lg },
  defaultTag: { position: 'absolute', top: S.md, left: S.md, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  defaultTagTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  deco: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardActions: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  cardAction: { flex: 1, backgroundColor: C.elevated, borderRadius: R.md, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cardActionDanger: { borderColor: C.dangerBorder },
  cardActionTxt: { color: C.t2, fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: S.xl },
  emptyIcon: { fontSize: 60, marginBottom: S.md },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.t1, marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: C.t3, marginBottom: S.xl, textAlign: 'center' },
  emptyBtn: { borderRadius: R.xl, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: S.xl, paddingVertical: 14 },
  emptyBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
