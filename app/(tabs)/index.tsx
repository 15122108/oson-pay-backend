import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function OsonMini() {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }}>
      <LinearGradient colors={['#7B2FBE', '#FF6B00']} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFB347' }}>P</Text>
      </LinearGradient>
    </View>
  );
}

const ACTIONS = [
  { label: "Jo'natish", icon: '↑', route: '/modals/send', grad: C.gBrand },
  { label: 'Qabul', icon: '↓', route: '/modals/receive', grad: C.gSuccess },
  { label: "To'ldirish", icon: '+', route: '/modals/topup', grad: C.gOrange },
  { label: "To'lovlar", icon: '⊙', route: '/modals/send', grad: ['#C44AFF', '#8B2FC9'] as [string,string] },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [txRes, statsRes] = await Promise.all([
        api.getHistory(1),
        api.getStats(30),
      ]);
      setTransactions(txRes.transactions?.slice(0, 5) || []);
      setStats(statsRes.stats);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadData()]);
    setRefreshing(false);
  }, []);

  const balance = user?.balance ?? 0;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greet}>Xush kelibsiz 👋</Text>
            <Text style={s.uname}>{user?.fullName || 'Foydalanuvchi'}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.notifBtn}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
              <View style={s.badge} />
            </TouchableOpacity>
            <OsonMini />
          </View>
        </View>

        {/* Balance card */}
        <View style={s.cardWrap}>
          <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.balanceCard}>
            <View style={s.cardRow}>
              <View>
                <Text style={s.balLabel}>Asosiy balans</Text>
                <Text style={s.balAmount}>{formatMoney(balance)}</Text>
                <Text style={s.balCurrency}>UZS</Text>
              </View>
              <View style={s.cardBadge}>
                <Text style={s.cardBadgeTxt}>OSON PAY</Text>
              </View>
            </View>
            <Text style={s.cardPhone}>{user?.phone}</Text>
            {/* Decorative circles */}
            <View style={[s.deco, { width: 200, height: 200, top: -60, right: -50, opacity: 0.12 }]} />
            <View style={[s.deco, { width: 140, height: 140, bottom: -40, left: 30, opacity: 0.08 }]} />
          </LinearGradient>
        </View>

        {/* Stats row */}
        {stats && (
          <View style={s.statsRow}>
            <View style={[s.statCard, { borderColor: C.successBorder }]}>
              <Text style={s.statIcon}>📥</Text>
              <Text style={s.statVal}>+{formatMoney(stats.total_in)}</Text>
              <Text style={s.statLbl}>Keldi</Text>
            </View>
            <View style={[s.statCard, { borderColor: C.dangerBorder }]}>
              <Text style={s.statIcon}>📤</Text>
              <Text style={[s.statVal, { color: C.danger }]}>-{formatMoney(stats.total_out)}</Text>
              <Text style={s.statLbl}>Ketdi</Text>
            </View>
            <View style={[s.statCard, { borderColor: C.primaryBorder }]}>
              <Text style={s.statIcon}>🔄</Text>
              <Text style={s.statVal}>{stats.total_count}</Text>
              <Text style={s.statLbl}>Jami</Text>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tezkor amallar</Text>
          <View style={s.actionsRow}>
            {ACTIONS.map(a => (
              <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)} activeOpacity={0.8}>
                <LinearGradient colors={a.grad} style={s.actionBtn} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={s.actionIcon}>{a.icon}</Text>
                </LinearGradient>
                <Text style={s.actionLbl}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>So'nggi tranzaksiyalar</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history' as any)}>
              <Text style={{ color: C.orange, fontSize: 13, fontWeight: '600' }}>Barchasi</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTxt}>Tranzaksiyalar yo'q</Text>
            </View>
          ) : (
            transactions.map(tx => <TxRow key={tx.id} tx={tx} userId={user?.id} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TxRow({ tx, userId }: { tx: any; userId?: string }) {
  const isCredit = tx.receiver_id === userId;
  const amount = parseFloat(tx.amount);
  const name = isCredit ? (tx.sender_name || 'Noma\'lum') : (tx.receiver_name || 'Noma\'lum');

  const typeIcon: Record<string, string> = {
    send: '↑', receive: '↓', payment: '⊙', topup: '+', withdraw: '↧',
  };
  const typeColor: Record<string, string> = {
    send: C.primary, receive: C.success, payment: C.danger, topup: C.warning, withdraw: C.orange,
  };

  const statusColor: Record<string, string> = {
    completed: C.success, pending: C.warning, failed: C.danger,
  };

  const date = new Date(tx.created_at);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  const timeStr = diff < 3600 ? `${Math.floor(diff / 60)} daq` :
    diff < 86400 ? `${Math.floor(diff / 3600)} soat` :
    date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity
      style={s.txRow}
      onPress={() => router.push({ pathname: '/modals/transaction', params: { id: tx.id } })}
      activeOpacity={0.7}
    >
      <View style={[s.txAvatar, { backgroundColor: typeColor[tx.type] + '20' }]}>
        <Text style={[s.txAvatarTxt, { color: typeColor[tx.type] }]}>{typeIcon[tx.type]}</Text>
      </View>
      <View style={s.txInfo}>
        <Text style={s.txName}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.txTime}>{timeStr}</Text>
          <View style={[s.statusDot, { backgroundColor: statusColor[tx.status] }]} />
        </View>
      </View>
      <Text style={[s.txAmount, { color: isCredit ? C.success : C.t1 }]}>
        {isCredit ? '+' : '-'}{formatMoney(amount)} UZS
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md,
  },
  greet: { fontSize: 13, color: C.t3, marginBottom: 2 },
  uname: { fontSize: 20, fontWeight: '800', color: C.t1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  notifBtn: { position: 'relative' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.danger, borderWidth: 1.5, borderColor: C.bg,
  },
  cardWrap: { paddingHorizontal: S.lg, marginBottom: S.md },
  balanceCard: { borderRadius: R.xxl, padding: S.lg, minHeight: 160, justifyContent: 'space-between', overflow: 'hidden' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, marginBottom: 6 },
  balAmount: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  balCurrency: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  cardBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.full, height: 32, justifyContent: 'center' },
  cardBadgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  cardPhone: { color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: 0.5 },
  deco: { position: 'absolute', borderRadius: 9999, backgroundColor: '#FFF' },
  statsRow: { flexDirection: 'row', paddingHorizontal: S.lg, gap: S.sm, marginBottom: S.sm },
  statCard: {
    flex: 1, backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.sm + 4, alignItems: 'center', gap: 4,
    borderWidth: 1,
  },
  statIcon: { fontSize: 18 },
  statVal: { fontSize: 13, fontWeight: '800', color: C.success },
  statLbl: { fontSize: 10, color: C.t3 },
  section: { paddingHorizontal: S.lg, marginTop: S.lg },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.t1, marginBottom: S.md },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { width: 64, height: 64, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionIcon: { fontSize: 26, color: '#FFF', fontWeight: '800' },
  actionLbl: { fontSize: 11, color: C.t2, textAlign: 'center', fontWeight: '500' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.md, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  txAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  txAvatarTxt: { fontSize: 20, fontWeight: '800' },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 3 },
  txTime: { fontSize: 11, color: C.t3 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { color: C.t3, fontSize: 14 },
});
