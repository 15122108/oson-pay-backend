import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function TransactionModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.getTransaction(id).then(r => setTx(r.transaction)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SafeAreaView style={s.root}><ActivityIndicator color={C.primary} style={{ marginTop: 100 }} /></SafeAreaView>;
  if (!tx) return <SafeAreaView style={s.root}><Text style={{ color: C.t1, textAlign: 'center', marginTop: 100 }}>Topilmadi</Text></SafeAreaView>;

  const isCredit = tx.receiver_id === user?.id;
  const amount = parseFloat(tx.amount);
  const typeColor: Record<string,string> = { send: C.primary, receive: C.success, payment: C.danger, topup: C.warning };
  const statusGrad: Record<string,[string,string]> = {
    completed: C.gSuccess, pending: C.gWarning, failed: C.gDanger,
  };
  const statusLabel: Record<string,string> = { completed: '✓ Bajarildi', pending: '⏳ Jarayonda', failed: '✕ Muvaffaqiyatsiz' };
  const date = new Date(tx.created_at);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
        <Text style={s.title}>Tranzaksiya</Text>
        <TouchableOpacity onPress={() => Share.share({ message: `Oson Pay tranzaksiya: ${formatMoney(amount)} UZS\nRef: ${tx.reference}` })}>
          <Text style={{ fontSize: 20 }}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={[s.heroIcon, { backgroundColor: (typeColor[tx.type] || C.primary) + '20' }]}>
            <Text style={[s.heroIconTxt, { color: typeColor[tx.type] || C.primary }]}>
              {tx.type === 'send' ? '↑' : tx.type === 'receive' ? '↓' : tx.type === 'topup' ? '+' : '⊙'}
            </Text>
          </View>
          <Text style={[s.heroAmount, { color: isCredit ? C.success : C.t1 }]}>
            {isCredit ? '+' : '-'}{formatMoney(amount)} UZS
          </Text>
          <View style={s.statusWrap}>
            <LinearGradient colors={statusGrad[tx.status] || C.gSuccess} start={{x:0,y:0}} end={{x:1,y:0}} style={s.statusBadge}>
              <Text style={s.statusTxt}>{statusLabel[tx.status]}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Details */}
        <View style={s.detailsCard}>
          <DetailRow label="Tur" value={{ send: "Jo'natma", receive: 'Qabul', payment: "To'lov", topup: "To'ldirish" }[tx.type] || tx.type} />
          {tx.sender_name && <DetailRow label="Yuboruvchi" value={tx.sender_name} />}
          {tx.receiver_name && <DetailRow label="Qabul qiluvchi" value={tx.receiver_name} />}
          {tx.description && <DetailRow label="Izoh" value={tx.description} />}
          <DetailRow label="Komissiya" value={`${formatMoney(tx.fee || 0)} UZS`} />
          <DetailRow label="Sana" value={date.toLocaleString('uz-UZ')} />
          <DetailRow label="Referens" value={tx.reference || tx.id?.slice(0,8).toUpperCase()} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  close: { fontSize: 20, color: C.t2, width: 36, textAlign: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.t1 },
  content: { padding: S.lg, gap: S.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: S.xl, gap: S.md },
  heroIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  heroIconTxt: { fontSize: 32, fontWeight: '900' },
  heroAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  statusWrap: { borderRadius: R.full, overflow: 'hidden' },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 8 },
  statusTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  detailsCard: { backgroundColor: C.elevated, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLabel: { fontSize: 14, color: C.t3 },
  rowValue: { fontSize: 14, fontWeight: '600', color: C.t1, maxWidth: '60%', textAlign: 'right' },
});
