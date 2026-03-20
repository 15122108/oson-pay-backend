// app/modals/receive.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Share, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatPhone } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function ReceiveModal() {
  const { user } = useAuth();

  async function handleShare() {
    await Share.share({ message: `Oson Pay orqali menga pul yuboring!\nTelefon: ${user?.phone}` });
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
        <Text style={s.title}>Qabul qilish</Text>
        <TouchableOpacity onPress={handleShare}><Text style={s.share}>Ulashish</Text></TouchableOpacity>
      </View>

      <View style={s.content}>
        <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.card}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarTxt}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.phone}>{user?.phone ? formatPhone(user.phone) : ''}</Text>

          {/* QR placeholder */}
          <View style={s.qrBox}>
            <View style={s.qrInner}>
              {Array.from({length:49}).map((_,i) => (
                <View key={i} style={[s.qrCell, ((i*7+Math.floor(i/7)*3+i)%4===0) && s.qrCellFilled]} />
              ))}
            </View>
          </View>
          <Text style={s.qrHint}>QR kodni skanerlang</Text>
        </LinearGradient>

        <View style={s.infoBox}>
          <InfoRow label="Telefon raqami" value={user?.phone ? formatPhone(user.phone) : ''} onCopy={() => Alert.alert('Nusxalandi', user?.phone)} />
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.shareBtnGrad}>
            <Text style={s.shareBtnTxt}>📤 Ma'lumotni ulashish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md }}>
      <View><Text style={{ fontSize: 11, color: C.t3, marginBottom: 3 }}>{label}</Text><Text style={{ fontSize: 15, fontWeight: '600', color: C.t1 }}>{value}</Text></View>
      {onCopy && <TouchableOpacity onPress={onCopy} style={{ backgroundColor: C.primaryBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: R.full, borderWidth: 1, borderColor: C.primaryBorder }}><Text style={{ color: C.primaryLight, fontSize: 12, fontWeight: '700' }}>Nusxa</Text></TouchableOpacity>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  close: { fontSize: 20, color: C.t2, width: 36, textAlign: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.t1 },
  share: { color: C.orange, fontWeight: '700', fontSize: 14 },
  content: { flex: 1, padding: S.lg, gap: S.md },
  card: { borderRadius: R.xxl, padding: S.xl, alignItems: 'center', gap: S.md },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 30, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  qrBox: { backgroundColor: '#FFF', borderRadius: R.lg, padding: 16 },
  qrInner: { width: 168, height: 168, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  qrCell: { width: 22, height: 22, borderRadius: 2, backgroundColor: '#EEE' },
  qrCellFilled: { backgroundColor: '#111' },
  qrHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  infoBox: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  shareBtn: { borderRadius: R.xl, overflow: 'hidden' },
  shareBtnGrad: { height: 58, alignItems: 'center', justifyContent: 'center' },
  shareBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
