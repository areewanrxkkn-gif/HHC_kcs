import React, { useState, useEffect, useRef } from 'react';
import { User, Patient, VisitRecord, UserRole } from '../types';
import {
  HeartPulse,
  MapPin,
  Stethoscope,
  Pill,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Wifi,
  BarChart3,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Delete,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Mail,
  UserPlus,
  ShieldAlert,
  RefreshCw,
  GitFork,
  ExternalLink,
} from 'lucide-react';

interface AppLandingScreenProps {
  currentUser: User | null;
  allUsers: User[];
  patients: Patient[];
  visits: VisitRecord[];
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onLogout: () => void;
  onEnterApp: () => void;
  onQuickRegister: () => void;
  onOpenSheets: () => void;
  onOpenStats: () => void;
  onSelectUser: (user: User | null) => void;
  onAddUser: (userData: {
    name: string;
    email: string;
    role: UserRole;
    roleTitle?: string;
    organization?: string;
  }) => Promise<User>;
  onDeleteUser: (userId: string) => Promise<void>;
  onClearAllUsers?: () => Promise<void>;
  onOpenAuthModal: () => void;
}

export const AppLandingScreen: React.FC<AppLandingScreenProps> = ({
  currentUser,
  allUsers,
  patients,
  visits,
  isUnlocked,
  onUnlockSuccess,
  onLogout,
  onEnterApp,
  onQuickRegister,
  onOpenSheets,
  onOpenStats,
  onSelectUser,
  onAddUser,
  onDeleteUser,
  onClearAllUsers,
  onOpenAuthModal,
}) => {
  // Passcode state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const accountsSectionRef = useRef<HTMLDivElement>(null);
  const [requireNotice, setRequireNotice] = useState<string>('');

  // Create user form state (accessible after unlock)
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [formEmail, setFormEmail] = useState('afanee04@gmail.com');
  const [formPassword, setFormPassword] = useState('••••••••');
  const [formName, setFormName] = useState('ภก. อาฟานี มูลทรัพย์');
  const [formRole, setFormRole] = useState<UserRole>('pharmacist');
  const [formOrg, setFormOrg] = useState('กลุ่มงานเภสัชกรรม โรงพยาบาลเขาชัยสน');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete user confirmation state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-focus hidden input on mount for physical keyboard support
  useEffect(() => {
    if (!isUnlocked && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [isUnlocked]);

  // Handle PIN verification
  const handleVerifyPin = (inputPin: string) => {
    if (inputPin.length !== 4) return;

    setIsVerifying(true);
    setPinError(false);
    setPinErrorMessage('');

    // Verification check (Code 1234, hidden from UI display)
    setTimeout(() => {
      if (inputPin === '1234') {
        setIsSuccess(true);
        setIsVerifying(false);
        setTimeout(() => {
          onUnlockSuccess();
          setPin('');
          setIsSuccess(false);
        }, 350);
      } else {
        setIsVerifying(false);
        setPinError(true);
        setPinErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาระบุรหัสผ่านใหม่อีกครั้ง');
        setPin('');
        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = '';
          hiddenInputRef.current.focus();
        }
      }
    }, 200);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4 || isVerifying || isSuccess) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setPinError(false);
    setPinErrorMessage('');
    if (nextPin.length === 4) {
      handleVerifyPin(nextPin);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setPinError(false);
      setPinErrorMessage('');
    }
  };

  const handleClear = () => {
    setPin('');
    setPinError(false);
    setPinErrorMessage('');
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
      hiddenInputRef.current.focus();
    }
  };

  const handleKeyDownHiddenInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      handleDelete();
    }
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(val);
    setPinError(false);
    setPinErrorMessage('');
    if (val.length === 4) {
      handleVerifyPin(val);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      setFormError('กรุณาระบุอีเมล Gmail');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      const newUser = await onAddUser({
        name: formName.trim() || formEmail.split('@')[0],
        email: formEmail.trim(),
        role: formRole,
        organization: formOrg.trim(),
      });
      onSelectUser(newUser);
      setShowAddUserForm(false);
    } catch (err: any) {
      setFormError(err.message || 'บันทึกโปรไฟล์ไม่สำเร็จ');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick stats
  const activePatientsCount = patients.length;
  const totalVisitsCount = visits.length;
  const bedriddenCount = patients.filter((p) => p.patientStatus.includes('ติดเตียง')).length;
  const upcomingVisitsCount = visits.filter((v) => v.nextVisitDate).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white flex flex-col justify-between selection:bg-emerald-400 selection:text-emerald-950 font-['Sarabun'] relative overflow-x-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-5 w-[400px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top App Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-2 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-emerald-950 ring-2 ring-white/20 shrink-0">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-emerald-300 tracking-wide flex items-center gap-1.5 truncate">
              <span className="truncate">เครือข่ายบริการสุขภาพ อำเภอเขาชัยสน</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            </div>
            <h1 className="text-sm sm:text-base font-bold font-['Prompt'] text-white truncate">
              Khao Chaison Health Visit
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-xs text-emerald-200 shrink-0">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>คลาวด์ซิงค์เรียลไทม์</span>
          </div>

          <button
            onClick={onOpenStats}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/40 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
            title="ดูสถิติอำเภอ"
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">สถิติชุมชน</span>
          </button>

          {isUnlocked && (
            <button
              onClick={onLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/60 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              title="ออกจากระบบและล็อกความปลอดภัย"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center flex-1 justify-center">
        {/* App Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm font-medium mb-3 shadow-inner backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>ระบบเยี่ยมบ้านและบริบาลเภสัชกรรมชุมชน</span>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-2xl space-y-1.5 mb-5">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-['Prompt'] text-white tracking-tight leading-tight">
            ลงพื้นที่ดูแลสุขภาพผู้ป่วย <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              อำเภอเขาชัยสน จังหวัดพัทลุง
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed max-w-xl mx-auto">
            เชื่อมโยงข้อมูลผู้ป่วยรายตำบลและหมู่บ้าน บันทึก SOAP, IFEE, IN HOME SSS, Pain Score,
            ทบทวนรายการยา (DRPs) และซิงค์ Google Sheets
          </p>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: LOCKED PASSCODE SCREEN (ต้องเข้ารหัสก่อนเลือกบัญชี) */}
        {/* ========================================================= */}
        {!isUnlocked ? (
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/20 shadow-2xl space-y-5 text-center relative animate-fadeIn">
            {/* Lock Icon Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-400 text-emerald-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-white/20">
                <Lock className="w-7 h-7 stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold font-['Prompt'] text-white">
                ระบุรหัสผ่านเข้าใช้งาน (Security Passcode)
              </h3>
              <p className="text-xs text-emerald-200/90 max-w-xs leading-relaxed">
                กรุณาระบุรหัสผ่าน 4 หลัก เพื่อเข้าสู่ระบบและเลือกบัญชีผู้ใช้งาน
              </p>
            </div>

            {/* Hidden Input for Physical Keyboard */}
            <input
              ref={hiddenInputRef}
              type="password"
              maxLength={4}
              value={pin}
              onChange={handleHiddenInputChange}
              onKeyDown={handleKeyDownHiddenInput}
              className="opacity-0 absolute -top-10 left-0 w-1 h-1 pointer-events-none"
              autoComplete="off"
              inputMode="numeric"
            />

            {/* Masked PIN Indicator Dots */}
            <div
              onClick={() => hiddenInputRef.current?.focus()}
              className={`flex justify-center items-center gap-4 py-2 cursor-pointer ${
                pinError ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 flex items-center justify-center ${
                      isSuccess
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                        : pinError
                        ? 'bg-rose-500 scale-95 shadow-md shadow-rose-500/40'
                        : isFilled
                        ? 'bg-emerald-300 scale-105 shadow-md shadow-emerald-400/40 ring-2 ring-emerald-200/50'
                        : 'bg-white/20 border border-white/30'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message if incorrect */}
            {pinErrorMessage && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-300 bg-rose-950/70 border border-rose-800/70 rounded-xl px-3 py-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{pinErrorMessage}</span>
              </div>
            )}

            {/* On-screen Numeric Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  disabled={isVerifying || isSuccess}
                  className="h-12 rounded-2xl bg-white/10 hover:bg-white/25 active:scale-95 text-white font-bold text-lg font-mono flex items-center justify-center border border-white/10 transition-all cursor-pointer shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isVerifying || isSuccess}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/20 active:scale-95 text-emerald-200 font-semibold text-xs flex items-center justify-center border border-white/10 transition-all cursor-pointer"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isVerifying || isSuccess}
                className="h-12 rounded-2xl bg-white/10 hover:bg-white/25 active:scale-95 text-white font-bold text-lg font-mono flex items-center justify-center border border-white/10 transition-all cursor-pointer shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isVerifying || isSuccess}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/20 active:scale-95 text-rose-200 flex items-center justify-center border border-white/10 transition-all cursor-pointer"
                title="ลบตัวเลข"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleVerifyPin(pin)}
              disabled={pin.length !== 4 || isVerifying || isSuccess}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                pin.length === 4
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-emerald-200/50 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <span>กำลังตรวจสอบ...</span>
              ) : isSuccess ? (
                <span className="flex items-center gap-1.5 text-emerald-950 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-900" /> ปลดล็อกสำเร็จ
                </span>
              ) : (
                <span>ยืนยันรหัสเพื่อเลือกบัญชี</span>
              )}
            </button>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEP 2: UNLOCKED VIEW -> ACCOUNT SELECTION & GMAIL SIGN-IN & WORKSPACE   */
          /* ========================================================================= */
          <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
            {/* Unlocked Banner with Logout */}
            <div className="bg-emerald-800/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-500/30 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-emerald-300 font-semibold">
                    ระบบปลดล็อกความปลอดภัยแล้ว
                  </div>
                  <div className="text-sm font-bold text-white font-['Prompt']">
                    เลือกบัญชีผู้ใช้งาน หรือ เข้าสู่ระบบด้วย Gmail
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ออกจากระบบและล็อกความปลอดภัยใหม่"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>

            {/* If no users exist, or if user toggled "+ เพิ่มบัญชีใหม่" */}
            {allUsers.length === 0 || showAddUserForm ? (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/20 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-400 text-emerald-950 flex items-center justify-center font-bold shadow-md">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-['Prompt'] text-white">
                        {allUsers.length === 0
                          ? 'ลงทะเบียนบัญชีผู้ใช้งานใหม่'
                          : 'เพิ่มบัญชีผู้ใช้งานใหม่ด้วย Gmail'}
                      </h3>
                      <p className="text-xs text-emerald-200/80">
                        {allUsers.length === 0
                          ? 'ลบโปรไฟล์เดิมหมดแล้ว กรุณาลงทะเบียนโปรไฟล์แรกเพื่อเริ่มใช้งาน'
                          : 'สามารถเพิ่มบัญชีบุคลากรท่านอื่นร่วมใช้งานในระบบ'}
                      </p>
                    </div>
                  </div>

                  {allUsers.length > 0 && (
                    <button
                      onClick={() => setShowAddUserForm(false)}
                      className="text-xs text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>

                {formError && (
                  <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-200 mb-1">
                        อีเมล Gmail ผู้ใช้งาน
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="afanee04@gmail.com"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-black/30 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-200 mb-1">
                        รหัสผ่าน (Password)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-black/30 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-200 mb-1">
                        ชื่อ-นามสกุล และคำนำหน้า
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ภก. อาฟานี มูลทรัพย์"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-black/30 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-white/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-200 mb-1">
                        บทบาท / สิทธิ์การเข้าถึง (Role)
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-900 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      >
                        <option value="pharmacist">🌿 เภสัชกร (Pharmacist) - สิทธิ์เต็มด้านยาและเยี่ยมบ้าน</option>
                        <option value="doctor">🩺 นายแพทย์ / แพทย์เวชปฏิบัติ (Doctor)</option>
                        <option value="nurse">💉 พยาบาลวิชาชีพ (Nurse)</option>
                        <option value="public_health">🏥 นักวิชาการสาธารณสุข</option>
                        <option value="vhv">🤝 อสม. ประจำหมู่บ้าน (VHV)</option>
                        <option value="admin">🛡️ ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-200 mb-1">
                      หน่วยงาน / กลุ่มงาน
                    </label>
                    <input
                      type="text"
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      placeholder="กลุ่มงานเภสัชกรรม โรงพยาบาลเขาชัยสน"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-black/30 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder:text-white/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกโปรไฟล์และเข้าใช้งานระบบ'}
                  </button>
                </form>
              </div>
            ) : null}

            {/* Notice if user attempts to access before choosing an account */}
            {requireNotice && (
              <div className="bg-amber-500/20 border-2 border-amber-400/80 rounded-2xl p-4 text-amber-100 flex items-start gap-3 shadow-xl backdrop-blur-md animate-pulse">
                <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-amber-200 font-['Prompt']">
                    ⚠️ ต้องเลือกบัญชีผู้ใช้งานก่อน
                  </h4>
                  <p className="text-xs text-amber-100 mt-0.5">
                    {requireNotice}
                  </p>
                </div>
                <button
                  onClick={() => setRequireNotice('')}
                  className="text-amber-300 hover:text-white text-xs px-2 py-1 rounded-lg bg-black/20"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* List of Registered Accounts (เมื่อมีบัญชีในระบบ) */}
            {allUsers.length > 0 && !showAddUserForm && (
              <div
                ref={accountsSectionRef}
                className={`bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 transition-all ${
                  !currentUser
                    ? 'border-emerald-400/60 ring-4 ring-emerald-500/20 shadow-emerald-950/40'
                    : 'border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold font-['Prompt'] text-white">
                        {currentUser
                          ? `บัญชีผู้ใช้งานในระบบ (${allUsers.length} บัญชี)`
                          : `ขั้นตอนที่ 2: เลือกบัญชีผู้ใช้งาน (${allUsers.length} บัญชี)`}
                      </h3>
                      <p className="text-[11px] text-emerald-200/80">
                        {currentUser
                          ? 'สามารถคลิกเพื่อสลับเปลี่ยนบัญชีผู้ใช้งานได้ตลอดเวลา'
                          : '👉 กรุณาคลิกเลือกบัญชีของคุณก่อน เพื่อปลดล็อกการเข้าดูข้อมูลและเพิ่มคนไข้'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setShowAddUserForm(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มบัญชีใหม่</span>
                    </button>

                    {onClearAllUsers && (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-2 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/50 text-xs transition-colors cursor-pointer"
                        title="ลบโปรไฟล์ทั้งหมด"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-800/90 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                            : 'bg-white/5 hover:bg-white/15 border-white/10'
                        }`}
                      >
                        <div
                          onClick={() => {
                            onSelectUser(u);
                            setRequireNotice('');
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
                              isSelected
                                ? 'bg-gradient-to-tr from-emerald-300 to-teal-200 text-emerald-950 ring-2 ring-white/50'
                                : 'bg-emerald-700 text-white'
                            }`}
                          >
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelected && (
                                <span className="bg-emerald-400 text-emerald-950 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  ใช้งานอยู่
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-emerald-200/80 truncate font-mono">
                              {u.email}
                            </div>
                            <div className="text-[10px] text-emerald-300/90 truncate mt-0.5">
                              {u.role === 'pharmacist'
                                ? '🌿 เภสัชกร (Pharmacist)'
                                : u.roleTitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              onSelectUser(u);
                              setRequireNotice('');
                            }}
                            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-400 text-emerald-950 shadow-md ring-1 ring-white/50'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm'
                            }`}
                          >
                            {isSelected ? 'เลือกแล้ว ✓' : '👉 เลือกบัญชีนี้'}
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer"
                            title="ลบโปรไฟล์นี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If no user is selected yet, show clear prompt */}
            {!currentUser && (
              <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border-2 border-dashed border-amber-400/40 shadow-xl space-y-3 text-center animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  <span>ต้องเลือกบัญชีเข้าใช้ก่อน</span>
                </div>
                <h4 className="text-sm font-bold text-white font-['Prompt']">
                  ยังไม่ได้เลือกบัญชีผู้ปฏิบัติงาน
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  กรุณากดปุ่ม <b className="text-emerald-300">"👉 เลือกบัญชีนี้"</b> จากรายชื่อด้านบน หรือลงทะเบียนบัญชีใหม่ เพื่อระบุตัวตนก่อน จึงจะสามารถเพิ่มรายละเอียดคนไข้ใหม่หรือเข้าดูข้อมูลคนไข้ได้
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-lg mx-auto">
                  <button
                    onClick={() => {
                      setRequireNotice('กรุณาเลือกบัญชีเข้าใช้ก่อน จึงจะสามารถเข้าดูข้อมูลคนไข้ได้');
                      accountsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-white/10 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>เข้าดูข้อมูลคนไข้ (ต้องเลือกบัญชีก่อน)</span>
                  </button>

                  <button
                    onClick={() => {
                      setRequireNotice('กรุณาเลือกบัญชีเข้าใช้ก่อน ถึงจะเลือกเพิ่มข้อมูลคนไข้ได้');
                      accountsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-white/10 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>เพิ่มคนไข้ใหม่ (ต้องเลือกบัญชีก่อน)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active User Summary & Two Primary Action Buttons (เมื่อเลือกบัญชีแล้ว) */}
            {currentUser && (
              <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border-2 border-emerald-400 shadow-2xl space-y-4 ring-4 ring-emerald-500/20 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 text-emerald-950 font-extrabold text-lg flex items-center justify-center shadow-lg ring-2 ring-white/50 flex-shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>เลือกบัญชีเข้าใช้งานเรียบร้อยแล้ว:</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white font-['Prompt']">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-emerald-200/90">
                        {currentUser.role === 'pharmacist'
                          ? '🌿 เภสัชกรชำนาญการ (สิทธิ์บริบาลเภสัชกรรมชุมชนเต็มรูปแบบ)'
                          : currentUser.roleTitle || currentUser.role}
                      </div>
                      <div className="text-[11px] text-emerald-300/80 mt-0.5">
                        {currentUser.organization}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectUser(null);
                      setRequireNotice('');
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="สลับไปเลือกบัญชีอื่น"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>สลับ/เปลี่ยนบัญชี</span>
                  </button>
                </div>

                {/* 2 Primary Unlocked Actions: View Data vs Add New Patient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={onEnterApp}
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-emerald-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>🟢 เข้าดูข้อมูลคนไข้และเยี่ยมบ้าน</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                  </button>

                  <button
                    onClick={onQuickRegister}
                    className="w-full py-4 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base border border-emerald-400/50 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5 text-emerald-300 stroke-[2.5]" />
                    <span>➕ เพิ่มรายละเอียดคนไข้ใหม่</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  if (!currentUser) {
                    setRequireNotice('กรุณาเลือกบัญชีเข้าใช้ก่อน จึงจะสามารถเพิ่มรายละเอียดคนไข้ใหม่ได้');
                    accountsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    return;
                  }
                  onQuickRegister();
                }}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between group cursor-pointer shadow-md ${
                  currentUser
                    ? 'bg-white/10 hover:bg-white/20 border-white/15'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  {!currentUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <Lock className="w-3 h-3" />
                      ต้องเลือกบัญชีก่อน
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-['Prompt'] flex items-center gap-1.5">
                    <span>ลงทะเบียนผู้ป่วยใหม่</span>
                  </h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">
                    {currentUser
                      ? 'กรอกชื่อ-สกุล วันเกิด คำนวณอายุอัตโนมัติ ระบุหมู่บ้าน'
                      : 'กรุณาเลือกบัญชีเข้าใช้งานก่อน เพื่อระบุผู้ลงข้อมูล'}
                  </p>
                </div>
              </button>

              {/* PCU Tools External Tool Card */}
              <a
                href="https://sites.google.com/view/rxlabel/family-tree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-teal-900/40 hover:bg-teal-900/60 border border-teal-400/30 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform">
                    <GitFork className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <ExternalLink className="w-3 h-3" />
                    Google Sites
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-['Prompt'] flex items-center gap-1.5">
                    <span>PCU Tools</span>
                  </h4>
                  <p className="text-[11px] text-teal-200/80 mt-0.5">
                    ระบบสร้างผังครอบครัว 3 รุ่น บันทึกรูปมาใส่ในประวัติผู้ป่วย
                  </p>
                </div>
              </a>

              <button
                onClick={onOpenStats}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-300 mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-['Prompt']">
                    สถิติชุมชน อ.เขาชัยสน
                  </h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">
                    ผู้ป่วย {activePatientsCount} คน | เยี่ยมแล้ว {totalVisitsCount} ครั้ง
                  </p>
                </div>
              </button>

              <button
                onClick={onOpenSheets}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/30 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-['Prompt']">
                    Google Sheets Sync
                  </h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">
                    เชื่อมโยง Webhook ซิงค์ข้อมูล Realtime
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Confirm Delete Single User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-slate-800 space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 font-['Prompt']">
                ยืนยันการลบบัญชีผู้ใช้งาน?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการลบบัญชี <b className="text-rose-700">{userToDelete.name}</b> ({userToDelete.email}) ออกจากระบบหรือไม่?
              </p>
              <p className="text-[11px] text-slate-400">
                การลบบัญชีนี้จะถูกนำออกจากฐานข้อมูลคลาวด์และไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await onDeleteUser(userToDelete.id);
                    setUserToDelete(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-700/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Clear All Users */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-slate-800 space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 font-['Prompt']">
                ยืนยันการลบทุกบัญชีในระบบ?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการลบบัญชีผู้ใช้งานทั้งหมดจำนวน <b className="text-rose-700">{allUsers.length} บัญชี</b> ออกจากระบบคลาวด์ใช่หรือไม่?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (onClearAllUsers) {
                    try {
                      setIsDeleting(true);
                      await onClearAllUsers();
                      setShowClearConfirm(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-700/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบทั้งหมด'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 text-center text-emerald-300/60 text-xs border-t border-white/5">
        <p>
          ระบบเชื่อมโยงข้อมูลเยี่ยมบ้านและบริบาลเภสัชกรรมชุมชน อำเภอเขาชัยสน จังหวัดพัทลุง
        </p>
      </footer>
    </div>
  );
};
