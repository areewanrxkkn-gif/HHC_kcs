import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  X,
  ShieldCheck,
  Check,
  AlertCircle,
  Users,
  Lock,
  Pill,
  HeartPulse,
  Trash2,
} from 'lucide-react';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers: User[];
  onUpdateRole: (userId: string, role: UserRole, roleTitle: string) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onUpdateRole,
  onDeleteUser,
}) => {
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('pharmacist');
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const roleDefinitions: Record<
    UserRole,
    { title: string; desc: string; permissions: string[] }
  > = {
    pharmacist: {
      title: 'เภสัชกร (Pharmacist)',
      desc: 'ผู้เชี่ยวชาญด้านยาและบริบาลเภสัชกรรมชุมชน สามารถจัดการทะเบียนผู้ป่วย ตรวจสอบยา DRP ประเมิน SOAP/IFEE/IN HOME SSS ซิงค์ Google Sheets',
      permissions: [
        'ดูและค้นหาข้อมูลผู้ป่วยทุกตำบลในเขาชัยสน',
        'ลงทะเบียนและแก้ไขข้อมูลผู้ป่วยส่วนบุคคล',
        'บันทึกและแก้ไขการเยี่ยมบ้านทุก Visit',
        'ประเมินปัญหาจากการใช้ยา (DRPs) และความร่วมมือการทานยา (Adherence)',
        'บันทึกคำแนะนำทางเภสัชกรรม (Pharmacist Counseling)',
        'อัปโหลดรูปภาพยา สภาพบ้าน และแผล',
        'ส่งออกและซิงค์ข้อมูลกับ Google Sheets',
      ],
    },
    doctor: {
      title: 'แพทย์เวชศาสตร์ครอบครัว (Doctor)',
      desc: 'ตรวจวินิจฉัยโรค ประเมิน SOAP สั่งการรักษา วางแผนการดูแลระยะยาว',
      permissions: [
        'ดูและค้นหาข้อมูลผู้ป่วยทุกตำบล',
        'ลงทะเบียนและแก้ไขข้อมูลผู้ป่วย',
        'บันทึกผลการตรวจร่างกายและวางแผนการรักษา (SOAP)',
        'ส่งต่อผู้ป่วยไปยังโรงพยาบาลเขาชัยสน',
        'ส่งออกและซิงค์ข้อมูลกับ Google Sheets',
      ],
    },
    nurse: {
      title: 'พยาบาลวิชาชีพ (Nurse)',
      desc: 'ประเมินสัญญาณชีพ ทำหัตถการดูแลแผล ดูแลสายสวนปัสสาวะ ให้สุขศึกษา',
      permissions: [
        'ดูข้อมูลผู้ป่วยในพื้นที่รับผิดชอบ',
        'บันทึกสัญญาณชีพและการตรวจร่างกาย',
        'บันทึกการทำหัตถการและการพยาบาล',
        'แนบรูปภาพแผลกดทับและร่างกาย',
      ],
    },
    public_health: {
      title: 'นักวิชาการสาธารณสุข (Public Health Officer)',
      desc: 'คัดกรองสุขภาพ สำรวจสุขาภิบาลบ้านและสิ่งแวดล้อม ชุมชน',
      permissions: [
        'ดูข้อมูลผู้ป่วยในตำบล',
        'บันทึกข้อมูลพื้นฐาน สภาพแวดล้อม และสิทธิการรักษา',
        'ประเมินความปลอดภัยในบ้าน (IN HOME SSS)',
      ],
    },
    vhv: {
      title: 'อสม. ประจำหมู่บ้าน (VHV)',
      desc: 'แกนนำสุขภาพชุมชน เยี่ยมติดตามอาการเบื้องต้น แจ้งเตือนทีมสหวิชาชีพ',
      permissions: [
        'ดูข้อมูลผู้ป่วยในหมู่บ้านตนเอง',
        'ตรวจวัดความดันและน้ำตาลเบื้องต้น',
        'แจ้งเหตุฉุกเฉินและนัดหมายทีมเยี่ยมบ้าน',
      ],
    },
    admin: {
      title: 'ผู้ดูแลระบบ (Admin)',
      desc: 'จัดการผู้ใช้งาน สิทธิ์การเข้าถึง และการเชื่อมโยงระบบคลาวด์',
      permissions: [
        'เข้าถึงและจัดการข้อมูลทั้งหมดในระบบ',
        'กำหนดระดับสิทธิ์ให้แก่ผู้ใช้งานทุกคน',
        'จัดการตั้งค่า Google Sheets Webhook',
      ],
    },
  };

  const handleSaveRole = async (userId: string) => {
    try {
      setSaving(true);
      const roleTitle = roleDefinitions[newRole].title;
      await onUpdateRole(userId, newRole, roleTitle);
      setSelectedUserToEdit(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">
                ระดับสิทธิ์การเข้าถึงข้อมูล (Role-Based Access Control)
              </h2>
              <p className="text-xs text-emerald-200">
                กำหนดและตรวจสอบสิทธิ์ของทีมสหวิชาชีพในการดูแลผู้ป่วยอำเภอเขาชัยสน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* User List & Role Assignment */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>รายชื่อบุคลากรและระดับสิทธิ์ในระบบ ({allUsers.length} ท่าน)</span>
            </h3>

            <div className="space-y-2">
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{u.name}</span>
                        {currentUser && u.id === currentUser.id && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-medium">
                            คุณ (บัญชีปัจจุบัน)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{u.email} • {u.organization}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedUserToEdit === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as UserRole)}
                          className="px-2 py-1 text-xs border border-emerald-400 rounded-lg bg-emerald-50 text-emerald-900 font-medium"
                        >
                          <option value="pharmacist">เภสัชกร</option>
                          <option value="doctor">แพทย์</option>
                          <option value="nurse">พยาบาล</option>
                          <option value="public_health">นักวิชาการสาธารณสุข</option>
                          <option value="vhv">อสม.</option>
                          <option value="admin">ผู้ดูแลระบบ</option>
                        </select>
                        <button
                          onClick={() => handleSaveRole(u.id)}
                          disabled={saving}
                          className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg font-semibold"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setSelectedUserToEdit(null)}
                          className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role === 'pharmacist'
                            ? '🌿 เภสัชกร'
                            : u.role === 'doctor'
                            ? '🩺 แพทย์'
                            : u.role === 'nurse'
                            ? '💉 พยาบาล'
                            : u.role === 'vhv'
                            ? '🤝 อสม.'
                            : u.roleTitle}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedUserToEdit(u.id);
                            setNewRole(u.role);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-2 py-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          เปลี่ยนสิทธิ์
                        </button>
                        {onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบบัญชีผู้ใช้งานนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix of Role Permissions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              รายละเอียดสิทธิ์ของแต่ละวิชาชีพ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(roleDefinitions) as UserRole[]).map((rKey) => {
                const r = roleDefinitions[rKey];
                const isCurrentRole = currentUser?.role === rKey;
                return (
                  <div
                    key={rKey}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrentRole
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                      {isCurrentRole && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                          สิทธิ์ของคุณตอนนี้
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">{r.desc}</p>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {r.permissions.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            เข้าใจแล้ว & ปิด
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Delete User */}
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
