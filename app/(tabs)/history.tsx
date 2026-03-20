import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const FILTERS = [
  { label: 'Barchasi', value: undefined },
  { label: "Jo'natish", value: 'send' },
  { label: 'Qabul', value: 'receive' },
  { label: "To'lov", value: 'payment' },
  { label: "To'ldirish", value: 'topup' },
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function load(p = 1, f = filter) {
    try {
      const res = await api.getHistory(p, f);
      if (p === 1) setTransactions(res.transactions || []);
      else setTransactions(prev => [...prev, ...(res.transactions || [])]);
      setHasMore(p < res.pagination?.pages);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { setPage(1); setLoading(true); load(1, filter); }, [filter]);

  const displayed = transactions.filter(tx => {
    if (!search) return true;
    const name = (tx.sender_name || tx.receiver_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const typeIcon: Record<string, string> = { send: '↑', receive: '↓', payment: '⊙', topup: '+', withdraw: '↧' };
  const typeColor: Record<string, string> = { send: C.primary, receive: C.success, payment: C.danger, topup: C.warning, withdraw: C.orange };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Tarix</Text>
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Ism yoki raqam..."
          placeholderTextColor={C.t3}
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: C.t3 }}>✕</Text></TouchableOpacity> : null}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[s.filterChip, filter === f.value && s.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[s.filterTxt, filter === f.value && s.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1); }} tintColor={C.primary} />}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={s.emptyTxt}>Tranzaksiyalar topilmadi</Text>
          </View>
        ) : (
          displayed.map(tx => {
            const isCredit = tx.receiver_id === user?.id;
            const amount = parseFloat(tx.amount);
            const name = isCredit ? (tx.sender_name || 'Tizim') : (tx.receiver_name || 'Tizim');
            const date = new Date(tx.created_at);
            const dateStr = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const color = typeColor[tx.type] || C.primary;
            const statusColors: Record<string,string> = { completed: C.success, pending: C.warning, failed: C.danger };

            return (
              <TouchableOpacity
                key={tx.id}
                style={s.txCard}
                onPress={() => router.push({ pathname: '/modals/transaction', params: { id: tx.id } })}
                activeOpacity={0.7}
              >
                <View style={[s.txIcon, { backgroundColor: color + '18' }]}>
                  <Text style={[s.txIconTxt, { color }]}>{typeIcon[tx.type] || '·'}</Text>
                </View>
                <View style={s.txMid}>
                  <Text style={s.txName}>{name}</Text>
                  <Text style={s.txDate}>{dateStr}</Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txAmt, { color: isCredit ? C.success : C.t1 }]}>
                    {isCredit ? '+' : '-'}{formatMoney(amount)}
                  </Text>
                  <View style={[s.txStatus, { backgroundColor: statusColors[tx.status] + '20' }]}>
                    <Text style={[s.txStatusTxt, { color: statusColors[tx.status] }]}>
                      {tx.status === 'completed' ? '✓' : tx.status === 'pending' ? '⏳' : '✕'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {hasMore && (
          <TouchableOpacity style={s.moreBtn} onPress={() => { const np = page + 1; setPage(np); load(np); }}>
            <Text style={s.moreTxt}>Ko'proq yuklash</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.sm },
  title: { fontSize: 22, fontWeight: '800', color: C.t1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    marginHorizontal: S.lg, marginBottom: S.sm,
    backgroundColor: C.elevated, borderRadius: R.lg,
    paddingHorizontal: S.md, height: 46,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.t1, fontSize: 14 },
  filters: { paddingHorizontal: S.lg, gap: S.sm, paddingBottom: S.sm },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  filterTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  filterTxtActive: { color: C.primaryLight, fontWeight: '700' },
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.md, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  txIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  txIconTxt: { fontSize: 20, fontWeight: '800' },
  txMid: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 3 },
  txDate: { fontSize: 11, color: C.t3 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  txStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.full },
  txStatusTxt: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { color: C.t3, fontSize: 14 },
  moreBtn: { padding: S.lg, alignItems: 'center' },
  moreTxt: { color: C.primary, fontWeight: '600' },
});
