import React, { useState, useEffect, useMemo } from 'react';
import { Patient, VisitRecord, User, GoogleSheetsConfig, UserRole } from './types';
import { ApiService, DEFAULT_PHARMACIST_USER } from './services/api';
import { Navbar } from './components/Navbar';
import { LocationHierarchyPicker } from './components/LocationHierarchyPicker';
import { PatientList } from './components/PatientList';
import { PatientDetailView } from './components/PatientDetailView';
import { PatientFormModal } from './components/PatientFormModal';
import { VisitFormModal } from './components/VisitFormModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AuthModal } from './components/AuthModal';
import { RolePermissionModal } from './components/RolePermissionModal';
import { StatisticsModal } from './components/StatisticsModal';
import { AppLandingScreen } from './components/AppLandingScreen';
import { OverviewChartsDashboard } from './components/OverviewChartsDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  HeartPulse,
  Users,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

export default function App() {
  // App state
  const [currentUser, setCurrentUser] = useState<User | null>(() => ApiService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({
    webhookUrl: '',
    autoSync: false,
    sheetNamePatients: 'ทะเบียนผู้ป่วย_เขาชัยสน',
    sheetNameVisits: 'บันทึกการเยี่ยมบ้าน_Visits',
  });

  // Filter & Hierarchy State
  const [selectedTambon, setSelectedTambon] = useState<string>('');
  const [selectedMoo, setSelectedMoo] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // View state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('khao_chaison_unlocked') === 'true';
  });
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [mainTab, setMainTab] = useState<'patients' | 'overview'>('patients');

  // Enforce access control: workspace requires both security unlock and account selection
  useEffect(() => {
    if (currentView === 'workspace') {
      if (!isUnlocked) {
        setCurrentView('landing');
      } else if (!currentUser) {
        setCurrentView('landing');
      }
    }
  }, [currentView, isUnlocked, currentUser]);

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('khao_chaison_unlocked', 'true');
    showNotification('ยืนยันรหัสความปลอดภัยสำเร็จ กรุณาเลือกบัญชีผู้ใช้งาน');
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('khao_chaison_unlocked');
    setCurrentUser(null);
    ApiService.setCurrentUser(null);
    setCurrentView('landing');
    setSelectedPatient(null);
    setIsAuthModalOpen(false);
    showNotification('ออกจากระบบและล็อกความปลอดภัยเรียบร้อยแล้ว', 'info');
  };

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitTargetPatient, setVisitTargetPatient] = useState<Patient | null>(null);
  const [editingVisit, setEditingVisit] = useState<VisitRecord | null>(null);

  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Patient delete confirmation state
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial load & Polling for multi-device sync
  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [pts, vsts, cfg, usrs] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getVisits(),
        ApiService.getSheetsConfig(),
        ApiService.getAllUsers(),
      ]);
      setPatients(pts);
      setVisits(vsts);
      setSheetsConfig(cfg);
      setAllUsers(usrs);

      // If a patient is selected, keep reference fresh
      if (selectedPatient) {
        const fresh = pts.find((p) => p.id === selectedPatient.id);
        if (fresh) setSelectedPatient(fresh);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Multi-device real-time Cloud Sync from Firebase Firestore
    const unsubPatients = ApiService.subscribeToPatients((pts) => {
      setPatients(pts);
      if (selectedPatient) {
        const fresh = pts.find((p) => p.id === selectedPatient.id);
        if (fresh) setSelectedPatient(fresh);
      }
    });

    const unsubVisits = ApiService.subscribeToVisits((vsts) => {
      setVisits(vsts);
    });

    const unsubUsers = ApiService.subscribeToUsers((usrs) => {
      setAllUsers(usrs);
      setCurrentUser((curr) => {
        if (curr && !usrs.some((u) => u.id === curr.id)) {
          const next = usrs.length > 0 ? usrs[0] : null;
          ApiService.setCurrentUser(next);
          return next;
        }
        return curr;
      });
    });

    return () => {
      unsubPatients();
      unsubVisits();
      unsubUsers();
    };
  }, [selectedPatient?.id]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedTambon && p.tambon !== selectedTambon) return false;
      if (selectedMoo !== null && p.moo !== selectedMoo) return false;
      if (selectedStatus && !p.patientStatus.includes(selectedStatus)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = `${p.title}${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
        const matchHn = (p.hn || '').toLowerCase().includes(q);
        const matchIdCard = (p.idCard || '').toLowerCase().includes(q);
        const matchVillage = (p.villageName || '').toLowerCase().includes(q);
        const matchDisease = p.chronicDiseases.some((d) => d.toLowerCase().includes(q));
        if (!matchName && !matchHn && !matchIdCard && !matchVillage && !matchDisease) {
          return false;
        }
      }
      return true;
    });
  }, [patients, selectedTambon, selectedMoo, selectedStatus, searchQuery]);

  // Handle Save Patient
  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPatient) {
        const updated = await ApiService.updatePatient(editingPatient.id, patientData);
        setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        if (selectedPatient?.id === updated.id) {
          setSelectedPatient(updated);
        }
        showNotification(`อัปเดตข้อมูลคุณ${updated.firstName} เรียบร้อยแล้ว`);
      } else {
        const created = await ApiService.createPatient(patientData);
        setPatients((prev) => [created, ...prev]);
        showNotification(`ลงทะเบียนคุณ${created.firstName} เข้าสู่ระบบสำเร็จ`);
      }
      setEditingPatient(null);
    } catch (err: any) {
      showNotification(err.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
      throw err;
    }
  };

  // Handle Save Visit
  const handleSaveVisit = async (visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingVisit) {
        const updated = await ApiService.updateVisit(editingVisit.id, visitData);
        setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        showNotification(`แก้ไขบันทึก Visit ${updated.visitNumber} เรียบร้อย`);
      } else {
        const created = await ApiService.createVisit(visitData);
        setVisits((prev) => [created, ...prev]);
        showNotification(`บันทึกการเยี่ยมบ้าน Visit ${created.visitNumber} สำเร็จ`);
      }
      setEditingVisit(null);
      setVisitTargetPatient(null);
    } catch (err: any) {
      showNotification(err.message || 'บันทึกการเยี่ยมไม่สำเร็จ', 'error');
      throw err;
    }
  };

  // Handle Delete Visit
  const handleDeleteVisit = async (visitId: string) => {
    try {
      await ApiService.deleteVisit(visitId);
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      showNotification('ลบบันทึกการเยี่ยมเรียบร้อยแล้ว', 'info');
    } catch (err) {
      showNotification('ลบบันทึกไม่สำเร็จ', 'error');
    }
  };

  // Handle Delete Patient permanently
  const handleDeletePatient = async (patient: Patient) => {
    try {
      setIsDeletingPatient(true);
      await ApiService.deletePatient(patient.id);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setVisits((prev) => prev.filter((v) => v.patientId !== patient.id));
      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }
      setPatientToDelete(null);
      showNotification(`ลบข้อมูลคุณ${patient.firstName} และประวัติการเยี่ยมทั้งหมดเรียบร้อยแล้ว`, 'info');
    } catch (err: any) {
      showNotification(err.message || 'ลบข้อมูลผู้ป่วยไม่สำเร็จ', 'error');
    } finally {
      setIsDeletingPatient(false);
    }
  };

  // Handle Login
  const handleLogin = async (email: string, password?: string, role?: UserRole, name?: string) => {
    try {
      const user = await ApiService.login(email, password, role, name);
      setCurrentUser(user);
      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== user.id);
        return [...filtered, user];
      });
      showNotification(`เข้าสู่ระบบสำเร็จในฐานะ: ${user.name}`);
      loadData(true);
    } catch (err: any) {
      showNotification('เข้าสู่ระบบไม่สำเร็จ', 'error');
    }
  };

  // Add User Profile
  const handleAddUser = async (userData: {
    name: string;
    email: string;
    role: UserRole;
    roleTitle?: string;
    organization?: string;
  }) => {
    try {
      const user = await ApiService.createUser(userData);
      setAllUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== user.id);
        return [...filtered, user];
      });
      setCurrentUser(user);
      showNotification(`สร้างโปรไฟล์และเข้าสู่ระบบ: ${user.name}`);
      return user;
    } catch (err: any) {
      showNotification('สร้างโปรไฟล์ไม่สำเร็จ', 'error');
      throw err;
    }
  };

  // Delete User Profile
  const handleDeleteUser = async (userId: string) => {
    try {
      await ApiService.deleteUser(userId);
      const remaining = allUsers.filter((u) => u.id !== userId);
      setAllUsers(remaining);
      if (currentUser?.id === userId) {
        if (remaining.length > 0) {
          setCurrentUser(remaining[0]);
          ApiService.setCurrentUser(remaining[0]);
        } else {
          setCurrentUser(null);
          ApiService.setCurrentUser(null);
        }
      }
      showNotification('ลบโปรไฟล์ผู้ใช้งานเรียบร้อยแล้ว', 'info');
    } catch (err) {
      showNotification('ลบโปรไฟล์ไม่สำเร็จ', 'error');
    }
  };

  // Clear All Users (Wipe all profiles as requested)
  const handleClearAllUsers = async () => {
    try {
      await ApiService.clearAllUsers();
      setAllUsers([]);
      setCurrentUser(null);
      ApiService.setCurrentUser(null);
      showNotification('ลบโปรไฟล์ทั้งหมดเรียบร้อยแล้ว', 'info');
    } catch (err) {
      showNotification('เกิดข้อผิดพลาดในการลบโปรไฟล์', 'error');
    }
  };

  // Handle Update Role
  const handleUpdateRole = async (userId: string, role: UserRole, roleTitle: string) => {
    try {
      const updated = await ApiService.updateUserRole(userId, role, roleTitle);
      setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (currentUser?.id === updated.id) {
        setCurrentUser(updated);
      }
      showNotification(`เปลี่ยนสิทธิ์ของ ${updated.name} เป็น ${roleTitle} เรียบร้อยแล้ว`);
    } catch (err) {
      showNotification('เปลี่ยนสิทธิ์ไม่สำเร็จ', 'error');
    }
  };

  // Open New Visit for patient
  const handleOpenNewVisit = (patient: Patient) => {
    setVisitTargetPatient(patient);
    setEditingVisit(null);
    setIsVisitModalOpen(true);
  };

  // Open Edit Visit
  const handleOpenEditVisit = (visit: VisitRecord) => {
    const pt = patients.find((p) => p.id === visit.patientId);
    if (pt) {
      setVisitTargetPatient(pt);
      setEditingVisit(visit);
      setIsVisitModalOpen(true);
    }
  };

  // Filter patient visits for modal
  const targetPatientVisits = useMemo(() => {
    if (!visitTargetPatient) return [];
    return visits.filter((v) => v.patientId === visitTargetPatient.id);
  }, [visits, visitTargetPatient]);

  // Open add new patient with account verification
  const handleOpenAddPatient = () => {
    if (!currentUser) {
      showNotification('กรุณาเลือกบัญชีเข้าใช้ก่อน จึงจะสามารถเพิ่มรายละเอียดคนไข้ใหม่ได้', 'error');
      setCurrentView('landing');
      return;
    }
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Sarabun'] antialiased w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-slideUp border ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : notification.type === 'info'
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-emerald-700 text-white border-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {currentView === 'landing' ? (
        <AppLandingScreen
          currentUser={currentUser}
          allUsers={allUsers}
          patients={patients}
          visits={visits}
          isUnlocked={isUnlocked}
          onUnlockSuccess={handleUnlockSuccess}
          onLogout={handleLogout}
          onEnterApp={() => {
            if (!currentUser) {
              showNotification('กรุณาเลือกบัญชีเข้าใช้ก่อน จึงจะสามารถเข้าดูข้อมูลคนไข้ได้', 'error');
              return;
            }
            if (isUnlocked) {
              setCurrentView('workspace');
            }
          }}
          onQuickRegister={() => {
            if (!currentUser) {
              showNotification('กรุณาเลือกบัญชีเข้าใช้ก่อน จึงจะสามารถเพิ่มรายละเอียดคนไข้ใหม่ได้', 'error');
              return;
            }
            if (isUnlocked) {
              setEditingPatient(null);
              setIsPatientModalOpen(true);
              setCurrentView('workspace');
            }
          }}
          onOpenSheets={() => setIsSheetsModalOpen(true)}
          onOpenStats={() => setIsStatsModalOpen(true)}
          onSelectUser={(u) => {
            setCurrentUser(u);
            ApiService.setCurrentUser(u);
            if (u) {
              showNotification(`เข้าสู่ระบบในฐานะ: ${u.name}`);
            } else {
              showNotification('กรุณาเลือกบัญชีเข้าใช้งาน', 'info');
            }
          }}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onClearAllUsers={handleClearAllUsers}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <>
          {/* Main Top Navbar */}
          <Navbar
            currentUser={currentUser}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenStatsModal={() => setIsStatsModalOpen(true)}
            onHomeClick={() => setSelectedPatient(null)}
            onBackToLanding={() => setCurrentView('landing')}
            onLogout={handleLogout}
            patientCount={patients.length}
            visitCount={visits.length}
          />

          {/* Main App Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 overflow-x-hidden">
            {loading ? (
              <div className="text-center py-24 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลและเชื่อมโยงเซิร์ฟเวอร์คลาวด์...</p>
              </div>
            ) : selectedPatient ? (
              /* Detailed Patient View + Timeline of Visits */
              <PatientDetailView
                patient={selectedPatient}
                visits={visits.filter((v) => v.patientId === selectedPatient.id)}
                onBack={() => setSelectedPatient(null)}
                onNewVisit={() => handleOpenNewVisit(selectedPatient)}
                onEditPatient={() => {
                  setEditingPatient(selectedPatient);
                  setIsPatientModalOpen(true);
                }}
                onDeletePatient={(p) => setPatientToDelete(p)}
                onEditVisit={handleOpenEditVisit}
                onDeleteVisit={handleDeleteVisit}
                onUpdatePatientFamilyTree={async (familyTreePhoto, familyTreeNotes) => {
                  if (!selectedPatient) return;
                  try {
                    const updated = await ApiService.updatePatient(selectedPatient.id, {
                      familyTreePhoto: familyTreePhoto || undefined,
                      familyTreeNotes: familyTreeNotes || undefined,
                      familyTreeUpdatedAt: familyTreePhoto ? new Date().toISOString() : undefined,
                    });
                    setSelectedPatient(updated);
                    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    showNotification('บันทึกรูปและประวัติผังครอบครัวสำเร็จแล้ว');
                  } catch (err: any) {
                    showNotification(err.message || 'บันทึกผังครอบครัวไม่สำเร็จ', 'error');
                    throw err;
                  }
                }}
              />
            ) : (
              /* Main Location Picker & Patient Directory */
              <div>
                {/* Quick Hero Banner for Khao Chaison */}
                <div className="mb-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-5 sm:p-7 shadow-sm border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full max-w-full overflow-hidden">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>อำเภอเขาชัยสน จังหวัดพัทลุง</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold font-['Prompt'] tracking-tight">
                      ระบบเยี่ยมบ้านชุมชนและบริบาลเภสัชกรรม
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                      เชื่อมโยงข้อมูลผู้ป่วยรายหมู่บ้าน บันทึก SOAP, IFEE, IN HOME SSS, ทบทวนรายการยา (DRPs) และประเมิน Pain Score
                      พร้อมซิงค์เรียลไทม์ข้ามทุกอุปกรณ์และ Google Sheets
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setIsSheetsModalOpen(true)}
                      className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors border border-emerald-400/40"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>ส่งออก Google Sheet</span>
                    </button>
                    <button
                      onClick={handleOpenAddPatient}
                      className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-102 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>ลงทะเบียนผู้ป่วยใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Main Navigation Segmented Control: Patients Directory vs Visual Charts Overview */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2.5">
                  <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/70 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMainTab('patients')}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mainTab === 'patients'
                          ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>รายชื่อและค้นหาผู้ป่วย ({filteredPatients.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainTab('overview')}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mainTab === 'overview'
                          ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>ภาพรวมสถิติและชาร์ต (Overview Charts)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {mainTab === 'patients' ? (
                      <button
                        type="button"
                        onClick={() => setMainTab('overview')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>เปิดชาร์ตภาพรวมสถิติ</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMainTab('patients')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        <span>กลับหน้ารายชื่อผู้ป่วย</span>
                      </button>
                    )}
                  </div>
                </div>

                {mainTab === 'overview' ? (
                  <OverviewChartsDashboard
                    patients={patients}
                    visits={visits}
                    onSelectPatient={(p) => setSelectedPatient(p)}
                    onNewVisitClick={handleOpenNewVisit}
                    onRegisterNewClick={handleOpenAddPatient}
                    onOpenSheetsClick={() => setIsSheetsModalOpen(true)}
                  />
                ) : (
                  <>
                    {/* Hierarchical Location Filter */}
                    <LocationHierarchyPicker
                      selectedTambon={selectedTambon}
                      selectedMoo={selectedMoo}
                      searchQuery={searchQuery}
                      selectedStatus={selectedStatus}
                      onSelectTambon={setSelectedTambon}
                      onSelectMoo={setSelectedMoo}
                      onSearchChange={setSearchQuery}
                      onStatusChange={setSelectedStatus}
                      onRegisterNewClick={handleOpenAddPatient}
                      totalFilteredCount={filteredPatients.length}
                    />

                    {/* Patients List Grid */}
                    <PatientList
                      patients={filteredPatients}
                      visits={visits}
                      onSelectPatient={(p) => setSelectedPatient(p)}
                      onNewVisitClick={handleOpenNewVisit}
                      onEditPatientClick={(p) => {
                        setEditingPatient(p);
                        setIsPatientModalOpen(true);
                      }}
                      onDeletePatientClick={(p) => setPatientToDelete(p)}
                      onRegisterNewClick={() => {
                        setEditingPatient(null);
                        setIsPatientModalOpen(true);
                      }}
                      selectedTambon={selectedTambon}
                      selectedMoo={selectedMoo}
                    />
                  </>
                )}
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  Khao Chaison Health Visit System • เครือข่ายบริการสุขภาพ อำเภอเขาชัยสน จังหวัดพัทลุง
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                ระบบจัดเก็บข้อมูลการเยี่ยมบ้านและบริบาลเภสัชกรรมชุมชน • พัฒนาเพื่อทีมสหวิชาชีพและชุมชน
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Modals */}
      {/* 1. Patient Registration / Edit Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        initialPatient={editingPatient}
        defaultTambon={selectedTambon}
        defaultMoo={selectedMoo}
      />

      {/* 2. Visit Record Form Modal */}
      {visitTargetPatient && (
        <VisitFormModal
          isOpen={isVisitModalOpen}
          onClose={() => {
            setIsVisitModalOpen(false);
            setVisitTargetPatient(null);
            setEditingVisit(null);
          }}
          onSave={handleSaveVisit}
          patient={visitTargetPatient}
          currentUser={currentUser}
          previousVisits={targetPatientVisits}
          initialVisit={editingVisit}
        />
      )}

      {/* 3. Google Sheets Modal */}
      <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการเปิดระบบ Google Sheets Hub">
        <GoogleSheetsModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          patients={patients || []}
          visits={visits || []}
          sheetsConfig={sheetsConfig}
          onSaveConfig={async (cfg) => {
            const updated = await ApiService.saveSheetsConfig(cfg);
            setSheetsConfig(updated);
          }}
        />
      </ErrorBoundary>

      {/* 4. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onLogin={handleLogin}
        onSelectUser={(u) => {
          setCurrentUser(u);
          ApiService.setCurrentUser(u);
          showNotification(`สลับเป็นบัญชี: ${u.name}`);
        }}
        onDeleteUser={handleDeleteUser}
        onLogout={handleLogout}
      />

      {/* 5. Role Permissions Modal */}
      <RolePermissionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onUpdateRole={handleUpdateRole}
        onDeleteUser={handleDeleteUser}
      />

      {/* 6. Statistics Modal */}
      <StatisticsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        patients={patients}
        visits={visits}
        onSelectPatient={(p) => setSelectedPatient(p)}
        onNewVisitClick={handleOpenNewVisit}
        onRegisterNewClick={handleOpenAddPatient}
        onOpenSheetsClick={() => setIsSheetsModalOpen(true)}
      />

      {/* 7. Delete Patient Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Prompt']">
                  ยืนยันการลบข้อมูลผู้ป่วยถาวร
                </h3>
                <p className="text-xs text-rose-600 font-medium">
                  ลบประวัติการรักษาและข้อมูลผู้ป่วยรายนี้ทั้งหมด
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {patientToDelete.title}{patientToDelete.firstName} {patientToDelete.lastName}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  HN: {patientToDelete.hn}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                เลขประจำตัวประชาชน: <span className="font-mono font-semibold text-slate-800">{patientToDelete.idCard}</span>
              </p>
              <p className="text-xs text-slate-600">
                ที่อยู่: ม.{patientToDelete.moo} {patientToDelete.villageName} ต.{patientToDelete.tambon}
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">บันทึกการเยี่ยมบ้าน (Visits):</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {visits.filter((v) => v.patientId === patientToDelete.id).length} ครั้ง
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 mb-5 leading-relaxed">
              ⚠️ <strong>คำเตือน:</strong> ข้อมูลเวชระเบียนการเยี่ยมบ้านทั้งหมด และภาพผังครอบครัว (PCU Tools) ของผู้ป่วยรายนี้จะถูกลบออกจากฐานข้อมูลคลาวด์อย่างถาวร ไม่สามารถกู้คืนได้
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingPatient}
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeletingPatient}
                onClick={() => handleDeletePatient(patientToDelete)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingPatient ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ยืนยันลบข้อมูลผู้ป่วยนี้เลย</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
