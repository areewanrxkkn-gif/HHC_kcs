import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  X,
  Mail,
  Lock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  LogOut,
  Trash2,
  UserPlus,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers?: User[];
  onLogin: (email: string, password?: string, role?: UserRole, name?: string) => Promise<void>;
  onSelectUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => Promise<void>;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers = [],
  onLogin,
  onSelectUser,
  onDeleteUser,
  onLogout,
}) => {
  const [email, setEmail] = useState(currentUser?.email || 'afanee04@gmail.com');
  const [name, setName] = useState(currentUser?.name || 'ภก. อาฟานี มูลทรัพย์');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'pharmacist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('กรุณากรอก Gmail');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onLogin(email.trim(), password, role, name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegistered = (user: User) => {
    if (onSelectUser) {
      onSelectUser(user);
      onClose();
    } else {
      onLogin(user.email, 'password', user.role, user.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">
                เข้าสู่ระบบด้วย Gmail & รหัสผ่าน
              </h2>
              <p className="text-xs text-emerald-200">
                ระบบลงพื้นที่เยี่ยมบ้าน อำเภอเขาชัยสน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current logged in status banner */}
        {currentUser && (
          <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              สถานะปัจจุบัน:{' '}
              <b className="text-emerald-800 font-bold">{currentUser.name}</b>
            </span>
            <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-semibold text-[11px]">
              {currentUser.role === 'pharmacist' ? '🌿 เภสัชกร (Pharmacist)' : currentUser.roleTitle}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gmail หรืออีเมลผู้ใช้งาน
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="afanee04@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ-นามสกุล / ตำแหน่ง
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ภก. อาฟานี มูลทรัพย์"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกบทบาท / ระดับสิทธิ์ (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium text-slate-800"
            >
              <option value="pharmacist">🌿 เภสัชกร (Pharmacist) - สิทธิ์เต็ม: จัดการยา DRP / SOAP / เยี่ยมบ้าน</option>
              <option value="doctor">🩺 นายแพทย์ / แพทย์เวชปฏิบัติ (Doctor) - วินิจฉัยและสั่งการรักษา</option>
              <option value="nurse">💉 พยาบาลวิชาชีพ (Nurse) - ตรวจร่างกายและหัตถการ</option>
              <option value="public_health">🏥 นักวิชาการสาธารณสุข รพ.สต. - สำรวจและคัดกรอง</option>
              <option value="vhv">🤝 อสม. ประจำหมู่บ้าน (VHV) - เยี่ยมติดตามเบื้องต้น</option>
              <option value="admin">🛡️ ผู้ดูแลระบบ (Admin) - จัดการสิทธิ์และพื้นที่</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="ออกจากระบบและล็อกแอป"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>

          {/* Registered Profiles Switcher */}
          {allUsers.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                👥 บัญชีผู้ใช้งานที่บันทึกไว้ในระบบ ({allUsers.length} บัญชี):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {allUsers.map((u) => {
                  const isSelected = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-2 rounded-xl border text-xs transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectRegistered(u)}
                        className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold flex-shrink-0">
                          {u.name ? u.name.charAt(0) : 'U'}
                        </div>
                        <div className="truncate">
                          <div className="truncate font-medium">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.roleTitle}</div>
                        </div>
                      </div>

                      {onDeleteUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(u);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบโปรไฟล์นี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* In-app Modal Confirm Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
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
                  if (onDeleteUser) {
                    try {
                      setIsDeleting(true);
                      await onDeleteUser(userToDelete.id);
                      setUserToDelete(null);
                    } catch (e: any) {
                      setError(e.message || 'ลบบัญชีไม่สำเร็จ');
                    } finally {
                      setIsDeleting(false);
                    }
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
    </div>
  );
};
