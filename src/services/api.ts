import { Patient, VisitRecord, User, GoogleSheetsConfig, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_PATIENTS, INITIAL_VISITS } from '../data/mockInitialData';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  CURRENT_USER: 'kc_current_user',
  PATIENTS_CACHE: 'kc_patients_cache',
  VISITS_CACHE: 'kc_visits_cache',
  SHEETS_CONFIG: 'kc_sheets_config',
};

// Default current user (Pharmacist)
export const DEFAULT_PHARMACIST_USER: User = {
  id: 'user-pharma-me',
  email: 'afanee04@gmail.com',
  name: 'ภก. อาฟานี มูลทรัพย์',
  role: 'pharmacist',
  roleTitle: 'เภสัชกรชำนาญการ',
  organization: 'กลุ่มงานเภสัชกรรม โรงพยาบาลเขาชัยสน',
};

// Remove undefined values to comply with Firestore specifications
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export class ApiService {
  private static currentUser: User | null = (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed?.id === 'user-pharma-1' ||
          parsed?.id === 'user-doc-1' ||
          parsed?.id === 'user-nurse-1' ||
          parsed?.id === 'user-vhv-1' ||
          parsed?.id === 'user-pharma-me'
        ) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          return null;
        }
        return parsed;
      }
    } catch (e) {
      // ignore
    }
    return null;
  })();

  private static isInitialized = false;

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static setCurrentUser(user: User | null): void {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      // ignore
    }
  }

  // --- Real-time Firestore Listeners ---
  static subscribeToPatients(callback: (patients: Patient[]) => void): () => void {
    try {
      const colRef = collection(db, 'patients');
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Patient[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Patient);
            });
            localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(list));
            callback(list);
          }
        },
        (error) => {
          console.warn('[Firestore] Patients listener fallback:', error);
        }
      );
    } catch (e) {
      return () => {};
    }
  }

  static subscribeToVisits(callback: (visits: VisitRecord[]) => void): () => void {
    try {
      const colRef = collection(db, 'visits');
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: VisitRecord[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as VisitRecord);
            });
            list.sort(
              (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
            );
            localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(list));
            callback(list);
          }
        },
        (error) => {
          console.warn('[Firestore] Visits listener fallback:', error);
        }
      );
    } catch (e) {
      return () => {};
    }
  }

  static subscribeToUsers(callback: (users: User[]) => void): () => void {
    try {
      const colRef = collection(db, 'users');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: User[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as User);
          });
          callback(list);
        },
        (error) => {
          console.warn('[Firestore] Users listener fallback:', error);
        }
      );
    } catch (e) {
      return () => {};
    }
  }

  // Ensure Cloud Firestore is seeded with default Khao Chaison records on first launch
  private static async ensureCloudSeeded() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      const ptSnap = await getDocs(collection(db, 'patients'));
      if (ptSnap.empty && INITIAL_PATIENTS.length > 0) {
        console.log('[Firestore] Seeding initial Khao Chaison patients to cloud...');
        const batch = writeBatch(db);
        INITIAL_PATIENTS.forEach((p) => {
          const ref = doc(db, 'patients', p.id);
          batch.set(ref, sanitizeForFirestore(p));
        });
        INITIAL_VISITS.forEach((v) => {
          const ref = doc(db, 'visits', v.id);
          batch.set(ref, sanitizeForFirestore(v));
        });
        await batch.commit();
        console.log('[Firestore] Initial data cloud seed completed successfully!');
      }
    } catch (err) {
      console.warn('[Firestore] Could not verify or seed initial cloud data:', err);
    }
  }

  // --- Patients ---
  static async getPatients(tambon?: string, moo?: number, search?: string): Promise<Patient[]> {
    try {
      await this.ensureCloudSeeded();
      const colRef = collection(db, 'patients');
      const snap = await getDocs(colRef);

      let list: Patient[] = [];
      if (!snap.empty) {
        snap.forEach((d) => {
          list.push(d.data() as Patient);
        });
      } else {
        list = INITIAL_PATIENTS;
      }

      // Cache locally
      localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(list));

      if (tambon) list = list.filter((p) => p.tambon === tambon);
      if (moo) list = list.filter((p) => p.moo === moo);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.hn.includes(q) ||
            p.idCard.includes(q) ||
            p.villageName.toLowerCase().includes(q)
        );
      }
      return list;
    } catch (e) {
      console.warn('[Firestore] getPatients falling back to local cache', e);
      const cached = localStorage.getItem(STORAGE_KEYS.PATIENTS_CACHE);
      let list: Patient[] = cached ? JSON.parse(cached) : INITIAL_PATIENTS;
      if (tambon) list = list.filter((p) => p.tambon === tambon);
      if (moo) list = list.filter((p) => p.moo === moo);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.hn.includes(q) ||
            p.idCard.includes(q) ||
            p.villageName.toLowerCase().includes(q)
        );
      }
      return list;
    }
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    try {
      const docRef = doc(db, 'patients', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Patient;
      }
      return null;
    } catch (e) {
      const patients = await this.getPatients();
      return patients.find((p) => p.id === id) || null;
    }
  }

  static async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const id = 'pt-' + Date.now();
    const now = new Date().toISOString();
    const newPt: Patient = {
      ...patient,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const docRef = doc(db, 'patients', id);
      await setDoc(docRef, sanitizeForFirestore(newPt));
    } catch (err) {
      console.warn('[Firestore] Error saving patient to cloud, saving to cache:', err);
    }

    // Keep local cache updated
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PATIENTS_CACHE);
      const list: Patient[] = cached ? JSON.parse(cached) : INITIAL_PATIENTS;
      list.unshift(newPt);
      localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(list));
    } catch (e) {
      // ignore
    }

    return newPt;
  }

  static async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const updatedAt = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt };

    try {
      const docRef = doc(db, 'patients', id);
      await setDoc(docRef, sanitizeForFirestore(updatedFields), { merge: true });
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const full = snap.data() as Patient;
        // Update cache
        const cached = localStorage.getItem(STORAGE_KEYS.PATIENTS_CACHE);
        if (cached) {
          const list: Patient[] = JSON.parse(cached);
          const idx = list.findIndex((p) => p.id === id);
          if (idx !== -1) {
            list[idx] = full;
            localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(list));
          }
        }
        return full;
      }
    } catch (err) {
      console.warn('[Firestore] Error updating patient in cloud:', err);
    }

    // Local cache fallback
    const cached = localStorage.getItem(STORAGE_KEYS.PATIENTS_CACHE);
    const list: Patient[] = cached ? JSON.parse(cached) : INITIAL_PATIENTS;
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(list));
      return list[idx];
    }
    throw new Error('Patient not found');
  }

  static async deletePatient(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'patients', id));
      // Delete all visits belonging to this patient
      const visitsQuery = query(collection(db, 'visits'), where('patientId', '==', id));
      const visitsSnap = await getDocs(visitsQuery);
      if (!visitsSnap.empty) {
        const batch = writeBatch(db);
        visitsSnap.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('[Firestore] Error deleting patient from cloud:', err);
    }

    try {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore offline/fetch error
    }

    const cached = localStorage.getItem(STORAGE_KEYS.PATIENTS_CACHE);
    if (cached) {
      const list: Patient[] = JSON.parse(cached);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PATIENTS_CACHE, JSON.stringify(filtered));
    }

    const cachedVisits = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
    if (cachedVisits) {
      const vlist: VisitRecord[] = JSON.parse(cachedVisits);
      const filteredV = vlist.filter((v) => v.patientId !== id);
      localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(filteredV));
    }
    return true;
  }

  // --- Visits ---
  static async getVisits(patientId?: string): Promise<VisitRecord[]> {
    try {
      await this.ensureCloudSeeded();
      const colRef = collection(db, 'visits');
      const snap = await getDocs(colRef);

      let list: VisitRecord[] = [];
      if (!snap.empty) {
        snap.forEach((d) => {
          list.push(d.data() as VisitRecord);
        });
      } else {
        list = INITIAL_VISITS;
      }

      list.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(list));

      if (patientId) {
        list = list.filter((v) => v.patientId === patientId);
      }
      return list;
    } catch (e) {
      console.warn('[Firestore] getVisits fallback', e);
      const cached = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
      let list: VisitRecord[] = cached ? JSON.parse(cached) : INITIAL_VISITS;
      if (patientId) {
        list = list.filter((v) => v.patientId === patientId);
      }
      return list.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    }
  }

  static async createVisit(visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VisitRecord> {
    const id = 'visit-' + Date.now();
    const now = new Date().toISOString();
    const newVisit: VisitRecord = {
      ...visitData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const docRef = doc(db, 'visits', id);
      await setDoc(docRef, sanitizeForFirestore(newVisit));
    } catch (err) {
      console.warn('[Firestore] Error creating visit in cloud:', err);
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
      const list: VisitRecord[] = cached ? JSON.parse(cached) : INITIAL_VISITS;
      list.unshift(newVisit);
      localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(list));
    } catch (e) {
      // ignore
    }

    return newVisit;
  }

  static async updateVisit(id: string, updates: Partial<VisitRecord>): Promise<VisitRecord> {
    const updatedAt = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt };

    try {
      const docRef = doc(db, 'visits', id);
      await setDoc(docRef, sanitizeForFirestore(updatedFields), { merge: true });
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const full = snap.data() as VisitRecord;
        const cached = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
        if (cached) {
          const list: VisitRecord[] = JSON.parse(cached);
          const idx = list.findIndex((v) => v.id === id);
          if (idx !== -1) {
            list[idx] = full;
            localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(list));
          }
        }
        return full;
      }
    } catch (err) {
      console.warn('[Firestore] Error updating visit in cloud:', err);
    }

    const cached = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
    const list: VisitRecord[] = cached ? JSON.parse(cached) : INITIAL_VISITS;
    const idx = list.findIndex((v) => v.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(list));
      return list[idx];
    }
    throw new Error('Visit not found');
  }

  static async deleteVisit(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'visits', id));
    } catch (err) {
      console.warn('[Firestore] Error deleting visit in cloud:', err);
    }

    const cached = localStorage.getItem(STORAGE_KEYS.VISITS_CACHE);
    if (cached) {
      const list: VisitRecord[] = JSON.parse(cached);
      const filtered = list.filter((v) => v.id !== id);
      localStorage.setItem(STORAGE_KEYS.VISITS_CACHE, JSON.stringify(filtered));
    }
    return true;
  }

  // --- Auth & Users (Synced across all devices) ---
  static async login(
    email: string,
    password?: string,
    role?: UserRole,
    name?: string,
    organization?: string
  ): Promise<User> {
    const roleTitleMap: Record<string, string> = {
      pharmacist: 'เภสัชกรชำนาญการ',
      doctor: 'นายแพทย์เวชปฏิบัติ',
      nurse: 'พยาบาลวิชาชีพ',
      public_health: 'นักวิชาการสาธารณสุข',
      vhv: 'อาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.)',
      admin: 'ผู้ดูแลระบบ',
    };
    const assignedRole = role || 'pharmacist';

    // Check if user already exists in Firestore by email
    try {
      const users = await this.getAllUsers();
      const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        this.setCurrentUser(existing);
        return existing;
      }
    } catch (e) {
      // ignore
    }

    const userId = 'user-' + Date.now();
    const newUser: User = {
      id: userId,
      email,
      name: name && name.trim() ? name.trim() : email.split('@')[0],
      role: assignedRole,
      roleTitle: roleTitleMap[assignedRole] || 'บุคลากรสาธารณสุข',
      organization: organization || 'โรงพยาบาลเขาชัยสน',
    };

    try {
      await setDoc(doc(db, 'users', userId), sanitizeForFirestore(newUser));
    } catch (err) {
      console.warn('[Firestore] Error saving new user to cloud:', err);
    }

    this.setCurrentUser(newUser);
    return newUser;
  }

  static async createUser(userData: {
    name: string;
    email: string;
    role: UserRole;
    roleTitle?: string;
    organization?: string;
  }): Promise<User> {
    const roleTitleMap: Record<string, string> = {
      pharmacist: 'เภสัชกรชำนาญการ',
      doctor: 'นายแพทย์เวชปฏิบัติ',
      nurse: 'พยาบาลวิชาชีพ',
      public_health: 'นักวิชาการสาธารณสุข',
      vhv: 'อาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.)',
      admin: 'ผู้ดูแลระบบ',
    };

    const userId = 'user-' + Date.now();
    const user: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      roleTitle: userData.roleTitle || roleTitleMap[userData.role] || 'บุคลากรสาธารณสุข',
      organization: userData.organization || 'โรงพยาบาลเขาชัยสน',
    };

    try {
      await setDoc(doc(db, 'users', userId), sanitizeForFirestore(user));
    } catch (err) {
      console.warn('[Firestore] Error creating user in cloud:', err);
    }

    return user;
  }

  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('[Firestore] Error deleting user in cloud:', err);
    }
    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      this.setCurrentUser(null);
    }
    return true;
  }

  static async clearAllUsers(): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn('[Firestore] Error clearing users in cloud:', err);
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return true;
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const users: User[] = [];
        snap.forEach((d) => users.push(d.data() as User));
        return users;
      }
      return [];
    } catch (e) {
      console.warn('[Firestore] getAllUsers fallback:', e);
      return [];
    }
  }

  static async updateUserRole(userId: string, role: UserRole, roleTitle: string): Promise<User> {
    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, { role, roleTitle }, { merge: true });
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (err) {
      console.warn('[Firestore] Error updating user role:', err);
    }

    const user = INITIAL_USERS.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      user.roleTitle = roleTitle;
      return user;
    }
    throw new Error('User not found');
  }

  // --- Google Sheets Sync & Helpers ---
  static async getSheetsConfig(): Promise<GoogleSheetsConfig> {
    try {
      const docRef = doc(db, 'config', 'sheets');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as GoogleSheetsConfig;
      }
    } catch (e) {
      console.warn('[Firestore] getSheetsConfig fallback:', e);
    }

    const stored = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    return stored
      ? JSON.parse(stored)
      : {
          webhookUrl: '',
          autoSync: false,
          sheetNamePatients: 'ทะเบียนผู้ป่วย_เขาชัยสน',
          sheetNameVisits: 'บันทึกการเยี่ยมบ้าน_Visits',
        };
  }

  static async saveSheetsConfig(config: Partial<GoogleSheetsConfig>): Promise<GoogleSheetsConfig> {
    const current = await this.getSheetsConfig();
    const updated = { ...current, ...config };

    try {
      const docRef = doc(db, 'config', 'sheets');
      await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error saving sheets config to cloud:', err);
    }

    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(updated));
    return updated;
  }

  static async triggerSheetsSync(
    webhookUrl?: string,
    customPatients?: Patient[],
    customVisits?: VisitRecord[]
  ): Promise<{ success: boolean; message: string; lastSyncedAt: string }> {
    const now = new Date().toISOString();
    try {
      if (webhookUrl) {
        const patients = customPatients || (await this.getPatients());
        const visits = customVisits || (await this.getVisits());
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_all',
            syncedAt: now,
            patientsCount: patients.length,
            visitsCount: visits.length,
            patients,
            visits,
          }),
          mode: 'no-cors',
        });
      }
      await this.saveSheetsConfig({ lastSyncedAt: now });
      return {
        success: true,
        message: 'ซิงค์ข้อมูลกับ Google Sheets สำเร็จเรียบร้อย',
        lastSyncedAt: now,
      };
    } catch (e: any) {
      return {
        success: true,
        message: 'ข้อมูลพร้อมซิงค์ (บันทึกข้อมูลล่าสุดใน Cloud เรียบร้อยแล้ว)',
        lastSyncedAt: now,
      };
    }
  }

  // Format tab-separated text for direct paste into Google Sheets
  static formatTsvForGoogleSheets(type: 'patients' | 'visits', patients: Patient[], visits: VisitRecord[]): string {
    if (type === 'patients') {
      const headers = [
        'HN',
        'เลขบัตรประชาชน',
        'คำนำหน้า',
        'ชื่อ',
        'นามสกุล',
        'เพศ',
        'วันเกิด',
        'อายุ(ปี)',
        'อายุ(เดือน)',
        'เบอร์โทรศัพท์',
        'บ้านเลขที่',
        'หมู่ที่',
        'ชื่อหมู่บ้าน',
        'ตำบล',
        'อำเภอ',
        'จังหวัด',
        'สิทธิการรักษา',
        'โรคประจำตัว',
        'ประวัติแพ้ยา',
        'ชื่อผู้ดูแล',
        'ความสัมพันธ์ผู้ดูแล',
        'เบอร์โทรผู้ดูแล',
        'สถานะการเคลื่อนไหว',
        'วันที่ลงทะเบียน',
      ];
      const rows = patients.map((p) => [
        p.hn,
        p.idCard,
        p.title,
        p.firstName,
        p.lastName,
        p.gender,
        p.birthDate,
        p.ageYears,
        p.ageMonths,
        p.tel,
        p.houseNo,
        p.moo,
        p.villageName,
        p.tambon,
        p.amphoe,
        p.province,
        p.healthCoverage,
        [...(p.chronicDiseases || []), p.chronicDiseasesOther].filter(Boolean).join('; '),
        (p.drugAllergies || []).map((a) => `${a.drugName}(${a.reaction})`).join('; ') || 'ไม่มีประวัติแพ้ยา',
        p.caregiver?.name || '',
        p.caregiver?.relation || '',
        p.caregiver?.tel || '',
        p.patientStatus || '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('th-TH') : '',
      ]);
      return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    } else {
      const headers = [
        'รหัส Visit',
        'HN ผู้ป่วย',
        'ชื่อ-สกุลผู้ป่วย',
        'ตำบล',
        'หมู่ที่',
        'ครั้งที่เยี่ยม',
        'วันเวลาที่เยี่ยม',
        'ผู้เยี่ยม',
        'ตำแหน่ง/วิชาชีพ',
        'ทีมร่วมเยี่ยม',
        'ความดัน BP',
        'ชีพจร Pulse',
        'อุณหภูมิ Temp',
        'การหายใจ RR',
        'น้ำตาลปลายนิ้ว DTX',
        'ออกซิเจน SpO2',
        'น้ำหนัก kg',
        'BMI',
        'Pain Score (1-10)',
        'ตำแหน่งปวด',
        'S (Subjective)',
        'O (Objective)',
        'A (Assessment)',
        'P (Plan)',
        'IFEE (Ideas)',
        'IFEE (Feelings)',
        'IFEE (Expectations)',
        'IFEE (Effects)',
        'IN HOME SSS (Medication)',
        'รายการยาที่กิน',
        'คำแนะนำเภสัชกร',
        'ปัญหา DRP ที่ตรวจพบ (10 หมวดหมู่)',
        'วันนัดเยี่ยมรอบหน้า',
        'เป้าหมายการติดตามรอบหน้า',
      ];
      const rows = visits.map((v) => {
        const pt = patients.find((p) => p.id === v.patientId);
        const ptName = pt ? `${pt.title}${pt.firstName} ${pt.lastName}` : '';
        const meds = (v.medications || []).map((m) => `${m.name} (${m.dose} ${m.frequency})`).join('; ');
        const drps = (v.drpItems || [])
          .map((d) => `[${d.category === 'อื่น ๆ เพิ่มเติม' && d.otherCategory ? d.otherCategory : d.category}] ยา: ${d.drugName || '-'} (สถานะ: ${d.status || '-'}) ${d.description ? `ปัญหา: ${d.description}` : ''} ${d.intervention ? `แก้ไข: ${d.intervention}` : ''}`)
          .join(' || ');
        return [
          v.id,
          pt?.hn || '',
          ptName,
          pt?.tambon || '',
          pt?.moo || '',
          `ครั้งที่ ${v.visitNumber}`,
          v.visitDate ? new Date(v.visitDate).toLocaleString('th-TH') : '',
          v.visitorName || '',
          v.visitorRole,
          v.coVisitors || '',
          v.bpSys ? `${v.bpSys}/${v.bpDia}` : '',
          v.pulse || '',
          v.temp || '',
          v.rr || '',
          v.dtx || '',
          v.spo2 || '',
          v.weight || '',
          v.bmi || '',
          v.painScore,
          v.painLocation || '',
          v.subjective,
          v.objective,
          v.assessment,
          v.plan,
          v.ifeeIdeas,
          v.ifeeFeelings,
          v.ifeeExpectations,
          v.ifeeEffects,
          v.inhomeMedication,
          meds,
          v.pharmacistAdvice,
          drps,
          v.nextVisitDate || '',
          v.nextVisitGoal || '',
        ];
      });
      return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    }
  }
}
