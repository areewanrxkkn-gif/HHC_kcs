import React, { useState, useEffect } from 'react';
import { Patient, DrugAllergy, PatientMobilityStatus } from '../types';
import {
  KHAO_CHAISON_TAMBONS,
  COMMON_CHRONIC_DISEASES,
  AMPHOE_KHAO_CHAISON,
  PROVINCE_PHATTHALUNG,
} from '../data/khaoChaisonLocations';
import {
  X,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  Plus,
  Trash2,
  Save,
  ShieldAlert,
  GitFork,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

export const COMMON_HEALTH_COVERAGES = [
  'บัตรทอง (UC)',
  'ข้าราชการ/เบิกได้',
  'ประกันสังคม',
  'องค์กรปกครองส่วนท้องถิ่น (อปท.)',
  'รัฐวิสาหกิจ',
  'ชำระเงินเอง',
  'สิทธิคนพิการ (ท.74)',
  'สิทธิครูโรงเรียนเอกชน',
  'สิทธิแรงงานต่างด้าว',
  'อื่น ๆ (ระบุเอง)',
];

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialPatient?: Patient | null;
  defaultTambon?: string;
  defaultMoo?: number | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPatient,
  defaultTambon,
  defaultMoo,
}) => {
  const [title, setTitle] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hn, setHn] = useState('');
  const [idCard, setIdCard] = useState('');
  const [gender, setGender] = useState<'ชาย' | 'หญิง'>('ชาย');
  const [birthDate, setBirthDate] = useState('1960-01-01');
  const [ageYears, setAgeYears] = useState(66);
  const [ageMonths, setAgeMonths] = useState(0);
  const [tel, setTel] = useState('');
  const [healthCoverageSelect, setHealthCoverageSelect] = useState('บัตรทอง (UC)');
  const [customHealthCoverage, setCustomHealthCoverage] = useState('');
  const [familyTreePhoto, setFamilyTreePhoto] = useState<string | undefined>(undefined);
  const [familyTreeNotes, setFamilyTreeNotes] = useState<string>('');

  // Address
  const [tambon, setTambon] = useState(defaultTambon || 'เขาชัยสน');
  const [moo, setMoo] = useState<number>(defaultMoo || 1);
  const [villageName, setVillageName] = useState('');
  const [houseNo, setHouseNo] = useState('');

  // Clinical & Caregiver
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [chronicDiseasesOther, setChronicDiseasesOther] = useState('');
  const [drugAllergies, setDrugAllergies] = useState<DrugAllergy[]>([]);
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRelation, setCaregiverRelation] = useState('');
  const [caregiverTel, setCaregiverTel] = useState('');
  const [caregiverAvailability, setCaregiverAvailability] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyTel, setEmergencyTel] = useState('');
  const [patientStatus, setPatientStatus] = useState<PatientMobilityStatus>('ติดสังคม (เดินได้ปกติ)');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate age whenever birthDate changes
  useEffect(() => {
    if (!birthDate) return;
    const birth = new Date(birthDate);
    const now = new Date();
    if (isNaN(birth.getTime())) return;

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months = (months + 12) % 12;
    }
    setAgeYears(Math.max(0, years));
    setAgeMonths(Math.max(0, months));
  }, [birthDate]);

  // Update villageName when tambon or moo changes
  useEffect(() => {
    const currentT = KHAO_CHAISON_TAMBONS.find((t) => t.name === tambon);
    if (currentT) {
      const v = currentT.villages.find((vl) => vl.moo === moo);
      if (v) {
        setVillageName(v.name);
      } else if (currentT.villages[0]) {
        setMoo(currentT.villages[0].moo);
        setVillageName(currentT.villages[0].name);
      }
    }
  }, [tambon, moo]);

  // Populate form if editing
  useEffect(() => {
    if (initialPatient) {
      setTitle(initialPatient.title || 'นาย');
      setFirstName(initialPatient.firstName || '');
      setLastName(initialPatient.lastName || '');
      setHn(initialPatient.hn || '');
      setIdCard(initialPatient.idCard || '');
      setGender(initialPatient.gender || 'ชาย');
      setBirthDate(initialPatient.birthDate || '1960-01-01');
      setTel(initialPatient.tel || '');
      const cov = initialPatient.healthCoverage || 'บัตรทอง (UC)';
      if (COMMON_HEALTH_COVERAGES.includes(cov) && cov !== 'อื่น ๆ (ระบุเอง)') {
        setHealthCoverageSelect(cov);
        setCustomHealthCoverage('');
      } else {
        setHealthCoverageSelect('อื่น ๆ (ระบุเอง)');
        setCustomHealthCoverage(cov);
      }
      setFamilyTreePhoto(initialPatient.familyTreePhoto);
      setFamilyTreeNotes(initialPatient.familyTreeNotes || '');
      setTambon(initialPatient.tambon || defaultTambon || 'เขาชัยสน');
      setMoo(initialPatient.moo || 1);
      setVillageName(initialPatient.villageName || '');
      setHouseNo(initialPatient.houseNo || '');
      setChronicDiseases(initialPatient.chronicDiseases || []);
      setChronicDiseasesOther(initialPatient.chronicDiseasesOther || '');
      setDrugAllergies(initialPatient.drugAllergies || []);
      setCaregiverName(initialPatient.caregiver?.name || '');
      setCaregiverRelation(initialPatient.caregiver?.relation || '');
      setCaregiverTel(initialPatient.caregiver?.tel || '');
      setCaregiverAvailability(initialPatient.caregiver?.availability || '');
      setEmergencyName(initialPatient.emergencyContact?.name || '');
      setEmergencyRelation(initialPatient.emergencyContact?.relation || '');
      setEmergencyTel(initialPatient.emergencyContact?.tel || '');
      setPatientStatus(initialPatient.patientStatus || 'ติดสังคม (เดินได้ปกติ)');
      setNotes(initialPatient.notes || '');
    } else {
      // Reset for new registration
      setTitle('นาย');
      setFirstName('');
      setLastName('');
      setHn(`680${Math.floor(1000 + Math.random() * 9000)}`);
      setIdCard('393040' + Math.floor(1000000 + Math.random() * 9000000));
      setGender('ชาย');
      setBirthDate('1956-05-15');
      setTel('');
      setHealthCoverageSelect('บัตรทอง (UC)');
      setCustomHealthCoverage('');
      setFamilyTreePhoto(undefined);
      setFamilyTreeNotes('');
      const initTambon = defaultTambon || 'เขาชัยสน';
      setTambon(initTambon);
      const initMoo = defaultMoo || 1;
      setMoo(initMoo);
      setHouseNo('');
      setChronicDiseases(['ความดันโลหิตสูง (HT)']);
      setChronicDiseasesOther('');
      setDrugAllergies([]);
      setCaregiverName('');
      setCaregiverRelation('');
      setCaregiverTel('');
      setCaregiverAvailability('');
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyTel('');
      setPatientStatus('ติดสังคม (เดินได้ปกติ)');
      setNotes('');
    }
  }, [initialPatient, defaultTambon, defaultMoo, isOpen]);

  if (!isOpen) return null;

  const currentTambonObj = KHAO_CHAISON_TAMBONS.find((t) => t.name === tambon);

  const handleToggleDisease = (disease: string) => {
    if (chronicDiseases.includes(disease)) {
      setChronicDiseases(chronicDiseases.filter((d) => d !== disease));
    } else {
      setChronicDiseases([...chronicDiseases, disease]);
    }
  };

  const handleAddAllergy = () => {
    setDrugAllergies([...drugAllergies, { drugName: '', reaction: '' }]);
  };

  const handleUpdateAllergy = (index: number, field: 'drugName' | 'reaction', val: string) => {
    const updated = [...drugAllergies];
    updated[index][field] = val;
    setDrugAllergies(updated);
  };

  const handleRemoveAllergy = (index: number) => {
    setDrugAllergies(drugAllergies.filter((_, i) => i !== index));
  };

  const handleFamilyTreeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      if (!rawUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFamilyTreePhoto(compressed);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('กรุณาระบุชื่อและนามสกุลผู้ป่วย');
      return;
    }
    if (!houseNo.trim()) {
      setError('กรุณาระบุบ้านเลขที่');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const finalHealthCoverage =
        healthCoverageSelect === 'อื่น ๆ (ระบุเอง)'
          ? (customHealthCoverage.trim() || 'อื่น ๆ')
          : healthCoverageSelect;

      await onSave({
        hn: hn.trim() || `680${Math.floor(1000 + Math.random() * 9000)}`,
        idCard: idCard.trim(),
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate,
        ageYears,
        ageMonths,
        tel: tel.trim(),
        houseNo: houseNo.trim(),
        moo,
        villageName,
        tambon,
        amphoe: AMPHOE_KHAO_CHAISON,
        province: PROVINCE_PHATTHALUNG,
        healthCoverage: finalHealthCoverage,
        chronicDiseases,
        chronicDiseasesOther: chronicDiseasesOther.trim(),
        drugAllergies: drugAllergies.filter((a) => a.drugName.trim()),
        caregiver: {
          name: caregiverName.trim(),
          relation: caregiverRelation.trim(),
          tel: caregiverTel.trim(),
          availability: caregiverAvailability.trim(),
        },
        emergencyContact: {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          tel: emergencyTel.trim(),
        },
        patientStatus,
        notes: notes.trim(),
        familyTreePhoto: familyTreePhoto || undefined,
        familyTreeNotes: familyTreeNotes.trim() || undefined,
        familyTreeUpdatedAt: familyTreePhoto ? (initialPatient?.familyTreeUpdatedAt || new Date().toISOString()) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-emerald-100 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">
                {initialPatient ? 'แก้ไขข้อมูลส่วนตัวผู้ป่วย' : 'ลงทะเบียนผู้ป่วยใหม่ (ตอนลงชุมชน)'}
              </h2>
              <p className="text-xs text-emerald-200">
                ข้อมูลส่วนบุคคลแยกชัดเจนจากบันทึกการเยี่ยมบ้าน • อ.เขาชัยสน จ.พัทลุง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/60 hover:bg-emerald-800 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal Demographic */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. ข้อมูลส่วนบุคคลและสิทธิการรักษา</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="ด.ช.">ด.ช.</option>
                  <option value="ด.ญ.">ด.ญ.</option>
                  <option value="คุณ">คุณ</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="เช่น สมศรี"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="เช่น คงแก้ว"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลข HN</label>
                <input
                  type="text"
                  value={hn}
                  onChange={(e) => setHn(e.target.value)}
                  placeholder="เช่น 6200142"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  maxLength={13}
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="3930400..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="ชาย"
                      checked={gender === 'ชาย'}
                      onChange={() => setGender('ชาย')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>ชาย</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="หญิง"
                      checked={gender === 'หญิง'}
                      onChange={() => setGender('หญิง')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>หญิง</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">สิทธิการรักษา</label>
                  {healthCoverageSelect !== 'อื่น ๆ (ระบุเอง)' && (
                    <button
                      type="button"
                      onClick={() => {
                        setHealthCoverageSelect('อื่น ๆ (ระบุเอง)');
                        setCustomHealthCoverage('');
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                    >
                      + กรอกสิทธิเอง
                    </button>
                  )}
                </div>
                <select
                  value={healthCoverageSelect}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHealthCoverageSelect(val);
                    if (val !== 'อื่น ๆ (ระบุเอง)') {
                      setCustomHealthCoverage('');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {COMMON_HEALTH_COVERAGES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Custom text entry when 'อื่น ๆ (ระบุเอง)' is selected */}
                {healthCoverageSelect === 'อื่น ๆ (ระบุเอง)' && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      required
                      value={customHealthCoverage}
                      onChange={(e) => setCustomHealthCoverage(e.target.value)}
                      placeholder="พิมพ์ระบุสิทธิการรักษา เช่น สิทธิคนพิการ ท.74..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-amber-50/70 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-500">เลือกด่วน:</span>
                      {['สิทธิคนพิการ ท.74', 'สิทธิผู้สูงอายุ', 'สิทธิทหารผ่านศึก', 'ประกันสุขภาพเอกชน', 'สิทธิครูเอกชน'].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCustomHealthCoverage(preset)}
                            className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer"
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Birth date & Auto age calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  วันเดือนปีเกิด (ค.ศ. / YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  อายุ (คำนวณอัตโนมัติ)
                </label>
                <div className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 flex items-center justify-between">
                  <span>{ageYears} ปี {ageMonths > 0 ? `${ageMonths} เดือน` : ''}</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Auto
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address in Khao Chaison */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-200 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>2. ที่อยู่ปัจจุบันในอำเภอเขาชัยสน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำบลในอำเภอเขาชัยสน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tambon}
                  onChange={(e) => setTambon(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {KHAO_CHAISON_TAMBONS.map((t) => (
                    <option key={t.name} value={t.name}>
                      ตำบล{t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมู่ที่ & ชื่อหมู่บ้าน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={moo}
                  onChange={(e) => setMoo(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {currentTambonObj?.villages.map((v) => (
                    <option key={v.moo} value={v.moo}>
                      หมู่ {v.moo} {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บ้านเลขที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="เช่น 45/2"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ผู้ป่วย
                </label>
                <input
                  type="tel"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="เช่น 081-456-7890"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะการเคลื่อนไหวของผู้ป่วย <span className="text-rose-500">*</span>
                </label>
                <select
                  value={patientStatus}
                  onChange={(e) => setPatientStatus(e.target.value as PatientMobilityStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ติดสังคม (เดินได้ปกติ)">ติดสังคม (เดินได้ปกติ)</option>
                  <option value="ติดบ้าน (เคลื่อนไหวลำบาก)">ติดบ้าน (เคลื่อนไหวลำบาก)</option>
                  <option value="ติดเตียง (ช่วยเหลือตัวเองไม่ได้)">ติดเตียง (ช่วยเหลือตัวเองไม่ได้)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Chronic Diseases & Drug Allergies (Key for Pharmacists) */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-200 pb-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>3. โรคประจำตัว และประวัติแพ้ยา (ข้อมูลเภสัชกรรม)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                โรคประจำตัว (เลือกได้หลายโรค)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_CHRONIC_DISEASES.map((disease) => {
                  const checked = chronicDiseases.includes(disease);
                  return (
                    <button
                      key={disease}
                      type="button"
                      onClick={() => handleToggleDisease(disease)}
                      className={`px-3 py-2 rounded-xl text-xs text-left font-medium transition-all border flex items-center gap-2 ${
                        checked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                        checked ? 'bg-white text-emerald-700 font-bold border-white' : 'border-slate-300'
                      }`}>
                        {checked ? '✓' : ''}
                      </span>
                      <span className="truncate">{disease}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5">
                <input
                  type="text"
                  value={chronicDiseasesOther}
                  onChange={(e) => setChronicDiseasesOther(e.target.value)}
                  placeholder="โรคประจำตัวอื่น ๆ เพิ่มเติม (ระบุถ้ามี เช่น โรคมะเร็ง, พาร์กินสัน...)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Drug Allergies */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  ประวัติแพ้ยา (สำคัญมากสำหรับการจัดยา)
                </label>
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มรายการแพ้ยา
                </button>
              </div>

              {drugAllergies.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  ไม่มีประวัติแพ้ยา (หากมีให้กดปุ่ม "เพิ่มรายการแพ้ยา" ด้านบน)
                </p>
              ) : (
                <div className="space-y-2">
                  {drugAllergies.map((allergy, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-rose-50/70 p-2 rounded-xl border border-rose-200">
                      <input
                        type="text"
                        value={allergy.drugName}
                        onChange={(e) => handleUpdateAllergy(idx, 'drugName', e.target.value)}
                        placeholder="ชื่อยาที่แพ้ เช่น Penicillin, Bactrim"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-rose-900"
                      />
                      <input
                        type="text"
                        value={allergy.reaction}
                        onChange={(e) => handleUpdateAllergy(idx, 'reaction', e.target.value)}
                        placeholder="อาการที่แพ้ เช่น ผื่นลมพิษ, แน่นหน้าอก, บวม"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(idx)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Caregiver & Emergency Contact */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>4. ข้อมูลผู้ดูแลหลัก (Caregiver) และผู้ติดต่อฉุกเฉิน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-สกุลผู้ดูแลหลัก</label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="เช่น นางสาวสุดารัตน์ คงแก้ว"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ความสัมพันธ์</label>
                <input
                  type="text"
                  value={caregiverRelation}
                  onChange={(e) => setCaregiverRelation(e.target.value)}
                  placeholder="เช่น บุตรสาว, คู่สมรส"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรผู้ดูแล</label>
                <input
                  type="tel"
                  value={caregiverTel}
                  onChange={(e) => setCaregiverTel(e.target.value)}
                  placeholder="เช่น 089-765-4321"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ความพร้อม / รูปแบบการดูแลของผู้ดูแล
              </label>
              <input
                type="text"
                value={caregiverAvailability}
                onChange={(e) => setCaregiverAvailability(e.target.value)}
                placeholder="เช่น ดูแลตลอด 24 ชม., ดูแลเฉพาะเช้า-เย็นเพราะทำงานประจำ, อยู่คนเดียวตายาย"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้ติดต่อฉุกเฉิน</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="เช่น นายสมพร คงแก้ว"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ความสัมพันธ์</label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="เช่น บุตรชาย"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรฉุกเฉิน</label>
                <input
                  type="tel"
                  value={emergencyTel}
                  onChange={(e) => setEmergencyTel(e.target.value)}
                  placeholder="เช่น 086-111-2233"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุทั่วไป / สภาพบ้านเบื้องต้น</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น บ้านไม้ยกพื้น มีทางลาดด้านข้าง อยู่ใกล้ศาลาหมู่บ้าน..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 5: PCU Tools & ผังเครือญาติ (Optional) */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <GitFork className="w-4 h-4 text-emerald-600" />
                <span>5. ผังเครือญาติและเครื่องมือ (PCU Tools) - ไม่บังคับ</span>
              </div>
              <a
                href="https://sites.google.com/view/rxlabel/family-tree"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-fit"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                <span>เปิดระบบ PCU Tools (Google Sites)</span>
              </a>
            </div>

            <p className="text-xs text-slate-500">
              สามารถเข้าไปทำผังครอบครัวได้ที่เว็บไซต์ PCU Tools <span className="text-emerald-700 font-medium">https://sites.google.com/view/rxlabel/family-tree</span> แล้วบันทึกรูปมาอัปโหลดใส่ในช่องด้านล่างนี้
            </p>

            {/* Photo preview or upload button */}
            {familyTreePhoto ? (
              <div className="space-y-2">
                <div className="p-2 bg-white rounded-xl border border-slate-200 max-h-64 overflow-auto flex items-center justify-center">
                  <img
                    src={familyTreePhoto}
                    alt="PCU Tools preview"
                    className="max-h-56 max-w-full rounded-lg object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium">✓ แนบไฟล์รูปภาพ PCU Tools แล้ว</span>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer">
                      เปลี่ยนรูป
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFamilyTreeFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFamilyTreePhoto(undefined)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer"
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-white transition-colors">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">อัปโหลดรูปภาพ PCU Tools / ผังเครือญาติ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">รองรับไฟล์ JPG, PNG หรือภาพจับหน้าจอ</p>
                <label className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>เลือกรูปภาพ PCU Tools</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFamilyTreeFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บันทึกเพิ่มเติมเกี่ยวกับประวัติครอบครัว / โรคทางพันธุกรรม (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={familyTreeNotes}
                onChange={(e) => setFamilyTreeNotes(e.target.value)}
                placeholder="เช่น ประวัติเบาหวาน ความดัน หรือมะเร็งในสายตระกูล..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-102 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : initialPatient ? 'บันทึกการแก้ไข' : 'บันทึกและลงทะเบียน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
