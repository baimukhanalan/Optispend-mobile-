import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../lib/theme';

type ScanPhase = 'idle' | 'scanning' | 'uploading' | 'processing' | 'done' | 'error';

export default function ReceiptScannerScreen() {
  const router = useRouter();
  const { session, user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [resultId, setResultId] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<CameraView>(null);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const uploadAndParse = async (uri: string, mimeType = 'image/jpeg') => {
    if (!session || !user) return;
    setPhase('uploading');
    startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const filename = `receipts/${user.id}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filename, blob, { contentType: mimeType, upsert: false });

      if (uploadError) throw uploadError;

      const { data: receipt, error: insertError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          storage_path: filename,
          ocr_status: 'pending',
          confirmed: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setPhase('processing');

      const { error: fnError } = await supabase.functions.invoke('parse-receipt', {
        body: { receipt_id: receipt.id, storage_path: filename },
      });

      if (fnError) throw fnError;

      setResultId(receipt.id);
      setPhase('done');
      stopPulse();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.push({ pathname: '/add-expense', params: { receiptId: receipt.id } });
      }, 800);
    } catch (err: unknown) {
      stopPulse();
      setPhase('error');
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обработать чек');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setPhase('scanning');
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
    if (photo?.uri) await uploadAndParse(photo.uri);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndParse(result.assets[0].uri);
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionTitle}>Нужен доступ к камере</Text>
        <Text style={styles.permissionSub}>Для сканирования чеков</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permissionBtnText}>Разрешить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Scan frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Сканирование чека</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.frameArea}>
            <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </Animated.View>
            <Text style={styles.frameHint}>Наведите на чек</Text>
          </View>

          <View style={styles.bottomArea}>
            {phase === 'idle' && (
              <View style={styles.controls}>
                <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                  <Text style={styles.galleryText}>🖼 Галерея</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shutterBtn} onPress={takePicture} activeOpacity={0.8}>
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
                <View style={{ width: 72 }} />
              </View>
            )}

            {(phase === 'uploading' || phase === 'processing') && (
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>
                  {phase === 'uploading' ? '⬆️ Загружаем...' : '🔍 Распознаём...'}
                </Text>
              </View>
            )}

            {phase === 'done' && (
              <View style={[styles.statusCard, { backgroundColor: colors.softGreen }]}>
                <Text style={styles.statusText}>✅ Готово! Открываем форму...</Text>
              </View>
            )}

            {phase === 'error' && (
              <View style={[styles.statusCard, { backgroundColor: colors.softRed }]}>
                <Text style={styles.statusText}>❌ Ошибка. Попробуйте ещё раз.</Text>
                <TouchableOpacity onPress={() => setPhase('idle')} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Снова</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20,
  },
  topBarTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 260, height: 380,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: '#fff', borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  frameHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 16, textAlign: 'center' },
  bottomArea: { paddingHorizontal: 24, paddingBottom: 48 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  galleryBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  galleryText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 10,
  },
  statusText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  retryBtn: {
    backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  permissionView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, backgroundColor: colors.background },
  permissionTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  permissionSub: { fontSize: 15, color: colors.secondary },
  permissionBtn: { backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
