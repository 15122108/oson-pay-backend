import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R, formatPhone } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notif, setNotif] = React.useState(true);

  function handleLogout() {
    Alert.alert('Chiqish', 'Hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Profil</Text>
        </View>

        {/* Profile card */}
        <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={s.profileName}>{user?.fullName || 'Foydalanuvchi'}</Text>
          <Text style={s.profilePhone}>{user?.phone ? formatPhone(user.phone) : ''}</Text>
          <View style={s.verifiedRow}>
            <Text style={s.verifiedTxt}>✅ Tasdiqlangan hisob</Text>
          </View>
          <View style={[s.deco, { width: 200, height: 200, top: -60, right: -50 }]} />
        </LinearGradient>

        {/* Account */}
        <Section title="Hisob">
          <MenuItem icon="👤" label="Shaxsiy ma'lumotlar" onPress={() => {}} />
          <MenuItem icon="💳" label="Kartalarim" onPress={() => router.push('/(tabs)/cards' as any)} />
          <MenuItem icon="📊" label="Statistika" onPress={() => {}} />
        </Section>

        {/* Security */}
        <Section title="Xavfsizlik">
          <MenuItem icon="🔐" label="PIN kod" onPress={() => {}} />
          <MenuItem icon="👆" label="Biometrik kirish" onPress={() => {}} />
          <MenuItem icon="📱" label="Qurilmalar" value="1 ta" onPress={() => {}} />
        </Section>

        {/* Settings */}
        <Section title="Sozlamalar">
          <MenuToggle icon="🔔" label="Bildirishnomalar" value={notif} onChange={setNotif} />
          <MenuItem icon="🌐" label="Til" value="O'zbek" onPress={() => {}} />
          <MenuItem icon="💱" label="Valyuta" value="UZS" onPress={() => {}} />
        </Section>

        {/* Support */}
        <Section title="Yordam">
          <MenuItem icon="💬" label="Qo'llab-quvvatlash" onPress={() => {}} />
          <MenuItem icon="📋" label="Foydalanish shartlari" onPress={() => {}} />
          <MenuItem icon="🔒" label="Maxfiylik siyosati" onPress={() => {}} />
          <MenuItem icon="ℹ️" label="Versiya" value="1.0.0" showArrow={false} onPress={() => {}} />
        </Section>

        {/* Logout */}
        <View style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutTxt}>🚪 Hisobdan chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.menuGroup}>{children}</View>
    </View>
  );
}

function MenuItem({ icon, label, value, onPress, showArrow = true }: any) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <View style={s.menuRight}>
        {value && <Text style={s.menuValue}>{value}</Text>}
        {showArrow && <Text style={s.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

function MenuToggle({ icon, label, value, onChange }: any) {
  return (
    <View style={s.menuItem}>
      <View style={s.menuIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md },
  title: { fontSize: 22, fontWeight: '800', color: C.t1 },
  profileCard: {
    marginHorizontal: S.lg, borderRadius: R.xxl,
    padding: S.xl, alignItems: 'center', overflow: 'hidden', marginBottom: S.sm,
  },
  avatarWrap: { marginBottom: S.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTxt: { fontSize: 34, fontWeight: '900', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: S.md },
  verifiedRow: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: R.full },
  verifiedTxt: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  deco: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' },
  section: { paddingHorizontal: S.lg, marginTop: S.lg },
  sectionTitle: { fontSize: 11, color: C.t3, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.sm },
  menuGroup: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.md, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  menuIcon: { width: 36, height: 36, backgroundColor: C.card, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  menuLabel: { flex: 1, fontSize: 15, color: C.t1 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuValue: { fontSize: 13, color: C.t2 },
  arrow: { fontSize: 22, color: C.t4, lineHeight: 24 },
  logoutBtn: {
    backgroundColor: C.dangerBg, borderRadius: R.lg,
    padding: S.md, alignItems: 'center',
    borderWidth: 1, borderColor: C.dangerBorder,
  },
  logoutTxt: { color: C.danger, fontWeight: '700', fontSize: 15 },
});
