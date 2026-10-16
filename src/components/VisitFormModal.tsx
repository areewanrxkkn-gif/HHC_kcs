import React, { useState, useEffect, useMemo } from 'react';
import { Patient, VisitRecord, User, MedicationItem, VisitPhoto, DRPItem, DRP_CATEGORIES, DRP_CATEGORY_DETAILS } from '../types';
import { COMMON_MEDICATIONS_NCD } from '../data/khaoChaisonLocations';
import {
  X,
  Stethoscope,
  Calendar,
  Clock,
  User as UserIcon,
  Heart,
  Activity,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Plus,
  Trash2,
  Copy,
  Camera,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  HelpCircle,
  Eye,
  History,
  Pill,
  ShieldAlert,
  CheckSquare,
} from 'lucide-react';

interface VisitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  patient: Patient;
  currentUser: User | null;
  previousVisits: VisitRecord[];
  initialVisit?: VisitRecord | null;
}

export const VisitFormModal: React.FC<VisitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patient,
  currentUser,
  previousVisits,
  initialVisit,
}) => {
  // Sort previous visits to get latest
  const sortedPrevVisits = [...previousVisits].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );
  const latestVisit = sortedPrevVisits[0] || null;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'soap' | 'pain' | 'ifee' | 'inhome' | 'meds' | 'drp' | 'photos' | 'next'>('soap');
  const [showPrevPanel, setShowPrevPanel] = useState(true);

  // Visit Metadata
  const [visitNumber, setVisitNumber] = useState(
    initialVisit ? initialVisit.visitNumber : previousVisits.length + 1
  );
  const [visitDate, setVisitDate] = useState(
    initialVisit ? initialVisit.visitDate : new Date().toISOString().slice(0, 16)
  );
  const [visitorName, setVisitorName] = useState(
    initialVisit ? initialVisit.visitorName : (currentUser?.name || '')
  );
  const [visitorRole, setVisitorRole] = useState(
    initialVisit ? initialVisit.visitorRole : (currentUser?.roleTitle || 'บุคลากรสาธารณสุข')
  );
  const [coVisitors, setCoVisitors] = useState(
    initialVisit?.coVisitors || 'พยาบาลวิชาชีพ รพ.สต., อสม. ประจำหมู่บ้าน'
  );

  // Objective / Vitals
  const [bpSys, setBpSys] = useState<string>(initialVisit?.bpSys ? String(initialVisit.bpSys) : '');
  const [bpDia, setBpDia] = useState<string>(initialVisit?.bpDia ? String(initialVisit.bpDia) : '');
  const [pulse, setPulse] = useState<string>(initialVisit?.pulse ? String(initialVisit.pulse) : '');
  const [temp, setTemp] = useState<string>(initialVisit?.temp ? String(initialVisit.temp) : '36.5');
  const [rr, setRr] = useState<string>(initialVisit?.rr ? String(initialVisit.rr) : '18');
  const [dtx, setDtx] = useState<string>(initialVisit?.dtx ? String(initialVisit.dtx) : '');
  const [spo2, setSpo2] = useState<string>(initialVisit?.spo2 ? String(initialVisit.spo2) : '98');
  const [weight, setWeight] = useState<string>(initialVisit?.weight ? String(initialVisit.weight) : '');
  const [height, setHeight] = useState<string>(initialVisit?.height ? String(initialVisit.height) : '');
  const [bmi, setBmi] = useState<number | undefined>(initialVisit?.bmi);

  // Auto calculate BMI
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const hM = h / 100;
      const calculated = parseFloat((w / (hM * hM)).toFixed(1));
      setBmi(calculated);
    }
  }, [weight, height]);

  // Pain Score 0-10
  const [painScore, setPainScore] = useState<number>(initialVisit ? initialVisit.painScore : 0);
  const [painLocation, setPainLocation] = useState<string>(initialVisit?.painLocation || '');

  // SOAP
  const [subjective, setSubjective] = useState<string>(initialVisit?.subjective || '');
  const [objective, setObjective] = useState<string>(initialVisit?.objective || '');
  const [assessment, setAssessment] = useState<string>(initialVisit?.assessment || '');
  const [plan, setPlan] = useState<string>(initialVisit?.plan || '');

  // IFEE
  const [ifeeIdeas, setIfeeIdeas] = useState<string>(initialVisit?.ifeeIdeas || '');
  const [ifeeFeelings, setIfeeFeelings] = useState<string>(initialVisit?.ifeeFeelings || '');
  const [ifeeExpectations, setIfeeExpectations] = useState<string>(initialVisit?.ifeeExpectations || '');
  const [ifeeEffects, setIfeeEffects] = useState<string>(initialVisit?.ifeeEffects || '');

  // IN HOME SSS
  const [inhomeImmobility, setInhomeImmobility] = useState<string>(initialVisit?.inhomeImmobility || '');
  const [inhomeNutrition, setInhomeNutrition] = useState<string>(initialVisit?.inhomeNutrition || '');
  const [inhomeHousing, setInhomeHousing] = useState<string>(initialVisit?.inhomeHousing || '');
  const [inhomeOtherPeople, setInhomeOtherPeople] = useState<string>(initialVisit?.inhomeOtherPeople || '');
  const [inhomeMedication, setInhomeMedication] = useState<string>(initialVisit?.inhomeMedication || '');
  const [inhomeExamination, setInhomeExamination] = useState<string>(initialVisit?.inhomeExamination || '');
  const [inhomeSafety, setInhomeSafety] = useState<string>(initialVisit?.inhomeSafety || '');
  const [inhomeSpiritual, setInhomeSpiritual] = useState<string>(initialVisit?.inhomeSpiritual || '');
  const [inhomeServices, setInhomeServices] = useState<string>(initialVisit?.inhomeServices || '');

  // Medications
  const [medications, setMedications] = useState<MedicationItem[]>(
    initialVisit?.medications || []
  );
  const [pharmacistAdvice, setPharmacistAdvice] = useState<string>(
    initialVisit?.pharmacistAdvice || ''
  );

  // DRP Assessment (Drug-Related Problems - 10 Categories)
  const [drpItems, setDrpItems] = useState<DRPItem[]>(
    initialVisit?.drpItems || []
  );
  const [noDrpFound, setNoDrpFound] = useState<boolean>(
    initialVisit?.drpItems !== undefined && initialVisit.drpItems.length === 0
  );

  // Extract all known drug names for the DRP selector (categorized for easy selection)
  const currentVisitDrugNames = useMemo(() => {
    return medications.map((m) => m.name.trim()).filter(Boolean);
  }, [medications]);

  const previousVisitsDrugNames = useMemo(() => {
    const list: string[] = [];
    previousVisits.forEach((v) => {
      (v.medications || []).forEach((m) => {
        const n = m.name?.trim();
        if (n && !list.includes(n) && !currentVisitDrugNames.includes(n)) {
          list.push(n);
        }
      });
    });
    return list;
  }, [previousVisits, currentVisitDrugNames]);

  const drugAllergiesNames = useMemo(() => {
    return (patient.drugAllergies || []).map((a) => a.drugName?.trim()).filter(Boolean);
  }, [patient.drugAllergies]);

  const allRecordedDrugNames = useMemo(() => {
    const list = [...currentVisitDrugNames];
    previousVisitsDrugNames.forEach((n) => {
      if (!list.includes(n)) list.push(n);
    });
    drugAllergiesNames.forEach((n) => {
      if (!list.includes(n)) list.push(n);
    });
    return list;
  }, [currentVisitDrugNames, previousVisitsDrugNames, drugAllergiesNames]);

  const availableDrugNames = useMemo(() => {
    const list = [...allRecordedDrugNames];
    COMMON_MEDICATIONS_NCD.forEach((cm) => {
      if (!list.includes(cm.name)) list.push(cm.name);
    });
    return list;
  }, [allRecordedDrugNames]);

  // Photos
  const [photos, setPhotos] = useState<VisitPhoto[]>(initialVisit?.photos || []);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<VisitPhoto['category']>('ตู้ยา/ซองยา');

  // Next Visit
  const [nextVisitDate, setNextVisitDate] = useState<string>(initialVisit?.nextVisitDate || '');
  const [nextVisitTime, setNextVisitTime] = useState<string>(initialVisit?.nextVisitTime || '09:30');
  const [nextVisitGoal, setNextVisitGoal] = useState<string>(initialVisit?.nextVisitGoal || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no medications currently, copy from previous visit automatically on first open
  useEffect(() => {
    if (!initialVisit && medications.length === 0 && latestVisit && latestVisit.medications?.length > 0) {
      setMedications(latestVisit.medications.map((m) => ({ ...m, id: 'med-' + Math.random().toString(36).substr(2, 9) })));
    }
  }, [initialVisit, latestVisit]);

  if (!isOpen) return null;

  // Add Empty Medication
  const handleAddMedication = () => {
    const newMed: MedicationItem = {
      id: 'med-' + Date.now(),
      name: '',
      dose: '1 tab',
      frequency: 'วันละ 1 ครั้ง หลังอาหารเช้า',
      indication: '',
      adherence: 'กินตรงเวลาสม่ำเสมอ',
      drpNotes: '',
    };
    setMedications([...medications, newMed]);
  };

  // Quick add from common NCD
  const handleAddCommonMed = (common: (typeof COMMON_MEDICATIONS_NCD)[0]) => {
    const newMed: MedicationItem = {
      id: 'med-' + Date.now(),
      name: common.name,
      dose: common.dose,
      frequency: common.freq,
      indication: common.indication,
      adherence: 'กินตรงเวลาสม่ำเสมอ',
      drpNotes: '',
    };
    setMedications([...medications, newMed]);
  };

  const handleUpdateMed = (index: number, field: keyof MedicationItem, val: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // DRP Management Handlers
  const handleAddDrp = (presetDrugName?: string, presetCategory?: string) => {
    setNoDrpFound(false);
    const defaultDrug = presetDrugName || currentVisitDrugNames[0] || allRecordedDrugNames[0] || '';
    const newDrp: DRPItem = {
      id: 'drp-' + Date.now() + Math.random().toString(36).substr(2, 4),
      category: presetCategory || DRP_CATEGORIES[0],
      otherCategory: '',
      drugName: defaultDrug,
      description: '',
      intervention: '',
      status: 'อยู่ระหว่างติดตาม',
    };
    setDrpItems((prev) => [...prev, newDrp]);
  };

  const handleQuickAddDrpFromMed = (medName: string) => {
    handleAddDrp(medName);
    setActiveTab('drp');
  };

  const handleUpdateDrp = (index: number, field: keyof DRPItem, val: any) => {
    setDrpItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveDrp = (index: number) => {
    setDrpItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetNoDrp = () => {
    setDrpItems([]);
    setNoDrpFound(true);
  };

  // Copy all from latest visit
  const handleCopyFromLatestVisit = () => {
    if (!latestVisit) return;
    if (latestVisit.medications) {
      setMedications(latestVisit.medications.map((m) => ({ ...m, id: 'med-' + Math.random().toString(36).substr(2, 9) })));
    }
    if (latestVisit.drpItems && latestVisit.drpItems.length > 0) {
      // Copy DRPs that are still pending
      const pendingDrps = latestVisit.drpItems
        .filter((d) => d.status !== 'แก้ไขปัญหาแล้ว')
        .map((d) => ({
          ...d,
          id: 'drp-' + Math.random().toString(36).substr(2, 9),
        }));
      if (pendingDrps.length > 0) {
        setDrpItems(pendingDrps);
        setNoDrpFound(false);
      }
    }
    if (latestVisit.ifeeIdeas) setIfeeIdeas(latestVisit.ifeeIdeas);
    if (latestVisit.ifeeFeelings) setIfeeFeelings(latestVisit.ifeeFeelings);
    if (latestVisit.ifeeExpectations) setIfeeExpectations(latestVisit.ifeeExpectations);
    if (latestVisit.ifeeEffects) setIfeeEffects(latestVisit.ifeeEffects);
    if (latestVisit.inhomeHousing) setInhomeHousing(latestVisit.inhomeHousing);
    if (latestVisit.inhomeNutrition) setInhomeNutrition(latestVisit.inhomeNutrition);
  };

  // Photo upload with automatic client-side resizing for fast cloud sync
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (!rawUrl) return;

        // Compress image using canvas
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
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
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
            const newPhoto: VisitPhoto = {
              id: 'photo-' + Date.now() + Math.random().toString(36).substr(2, 4),
              dataUrl: compressedUrl,
              caption: photoCaption.trim() || file.name,
              category: photoCategory,
              uploadedAt: new Date().toISOString(),
            };
            setPhotos((prev) => [...prev, newPhoto]);
            setPhotoCaption('');
          }
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      await onSave({
        patientId: patient.id,
        visitNumber,
        visitDate,
        visitorName: visitorName.trim() || currentUser?.name || 'ผู้เยี่ยมบ้าน',
        visitorRole: visitorRole.trim() || currentUser?.roleTitle || 'บุคลากรสาธารณสุข',
        coVisitors: coVisitors.trim(),
        bpSys: bpSys ? parseInt(bpSys) : undefined,
        bpDia: bpDia ? parseInt(bpDia) : undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        temp: temp ? parseFloat(temp) : undefined,
        rr: rr ? parseInt(rr) : undefined,
        dtx: dtx ? parseInt(dtx) : undefined,
        spo2: spo2 ? parseInt(spo2) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        bmi,
        painScore,
        painLocation: painLocation.trim(),
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim(),
        ifeeIdeas: ifeeIdeas.trim(),
        ifeeFeelings: ifeeFeelings.trim(),
        ifeeExpectations: ifeeExpectations.trim(),
        ifeeEffects: ifeeEffects.trim(),
        inhomeImmobility: inhomeImmobility.trim(),
        inhomeNutrition: inhomeNutrition.trim(),
        inhomeHousing: inhomeHousing.trim(),
        inhomeOtherPeople: inhomeOtherPeople.trim(),
        inhomeMedication: inhomeMedication.trim(),
        inhomeExamination: inhomeExamination.trim(),
        inhomeSafety: inhomeSafety.trim(),
        inhomeSpiritual: inhomeSpiritual.trim(),
        inhomeServices: inhomeServices.trim(),
        medications,
        pharmacistAdvice: pharmacistAdvice.trim(),
        drpItems: noDrpFound ? [] : drpItems,
        photos,
        nextVisitDate: nextVisitDate || undefined,
        nextVisitTime: nextVisitTime || undefined,
        nextVisitGoal: nextVisitGoal.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'บันทึกการเยี่ยมไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Pain face helper
  const getPainIcon = (score: number) => {
    if (score === 0) return <Smile className="w-6 h-6 text-emerald-500" />;
    if (score <= 3) return <Smile className="w-6 h-6 text-teal-500" />;
    if (score <= 6) return <Meh className="w-6 h-6 text-amber-500" />;
    return <Frown className="w-6 h-6 text-rose-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-['Prompt']">
                  {initialVisit ? `แก้ไขการเยี่ยมครั้งที่ ${visitNumber}` : `บันทึกการเยี่ยมบ้าน ครั้งที่ ${visitNumber} (Visit ${visitNumber})`}
                </h2>
                <span className="bg-emerald-600/90 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-medium">
                  {patient.title}{patient.firstName} {patient.lastName} (HN: {patient.hn})
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                ม.{patient.moo} {patient.villageName} ต.{patient.tambon} อ.เขาชัยสน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latestVisit && (
              <button
                type="button"
                onClick={() => setShowPrevPanel(!showPrevPanel)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  showPrevPanel
                    ? 'bg-emerald-700 text-emerald-100 border-emerald-500'
                    : 'bg-emerald-900/50 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{showPrevPanel ? 'ซ่อนข้อมูลรอบก่อน' : 'เทียบข้อมูลรอบก่อนหน้า'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Drug Allergy Alert Bar (Crucial for clinical safety) */}
        {patient.drugAllergies && patient.drugAllergies.length > 0 && (
          <div className="bg-rose-500 text-white text-xs px-5 py-1.5 flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
              <b>คำเตือนทางเภสัชกรรม: ผู้ป่วยมีประวัติแพ้ยา</b>
              {patient.drugAllergies.map((a) => `${a.drugName} (${a.reaction})`).join(', ')}
            </span>
            <span className="text-[11px] opacity-90 hidden sm:inline">โปรดหลีกเลี่ยงการสั่งใช้กลุ่มยาดังกล่าว</span>
          </div>
        )}

        {/* Main Body with Split View (Previous Visit on left/toggle, New Visit on right) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Collapsible Left Panel: Previous Visit Summary */}
          {latestVisit && showPrevPanel && (
            <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto max-h-56 md:max-h-none flex-shrink-0 text-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลรอบก่อน (ครั้งที่ {latestVisit.visitNumber})</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFromLatestVisit}
                  title="คัดลอกรายการยาและข้อมูลทั่วไปจากรอบก่อนหน้า"
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> คัดลอกยา
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400">วันที่เยี่ยมรอบก่อน</div>
                  <div className="font-semibold text-slate-700">
                    {new Date(latestVisit.visitDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">ผู้เยี่ยม: {latestVisit.visitorName}</div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-emerald-800 mb-1">สัญญาณชีพรอบก่อน</div>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-700">
                    <div>BP: <b>{latestVisit.bpSys ? `${latestVisit.bpSys}/${latestVisit.bpDia}` : '-'}</b></div>
                    <div>Pulse: <b>{latestVisit.pulse || '-'} bpm</b></div>
                    <div>DTX: <b>{latestVisit.dtx || '-'} mg%</b></div>
                    <div>Pain: <b>{latestVisit.painScore}/10</b></div>
                  </div>
                </div>

                {latestVisit.assessment && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1">การประเมิน (Assessment) รอบก่อน</div>
                    <p className="text-slate-600 whitespace-pre-line line-clamp-4">{latestVisit.assessment}</p>
                  </div>
                )}

                {latestVisit.medications && latestVisit.medications.length > 0 && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1">รายการยารอบก่อน ({latestVisit.medications.length} ตัว)</div>
                    <ul className="space-y-1 text-slate-600">
                      {latestVisit.medications.map((m, i) => (
                        <li key={i} className="flex items-start justify-between gap-1 border-b border-slate-100 pb-0.5">
                          <span className="font-medium text-slate-800 truncate">{m.name}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded flex-shrink-0">{m.adherence.split(' ')[0]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestVisit.nextVisitGoal && (
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-[11px] font-semibold text-amber-900 mb-1">เป้าหมายที่ตั้งไว้รอบที่แล้ว</div>
                    <p className="text-amber-800">{latestVisit.nextVisitGoal}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Area: Active Visit Form with Navigation Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Metadata Bar (Date, Visitor, Co-visitors) */}
            <div className="bg-emerald-50/70 p-3 sm:px-5 border-b border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> วันและเวลาที่เยี่ยม
                </label>
                <input
                  type="datetime-local"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" /> ผู้บันทึก / เภสัชกรผู้เยี่ยม
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="ชื่อผู้เยี่ยม"
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  ทีมร่วมเยี่ยม (พยาบาล/อสม.)
                </label>
                <input
                  type="text"
                  value={coVisitors}
                  onChange={(e) => setCoVisitors(e.target.value)}
                  placeholder="เช่น พว. รพ.สต.เขาชัยสน, อสม. สมใจ"
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'soap', label: '1. สัญญาณชีพ & SOAP', icon: Activity },
                { id: 'pain', label: '2. Pain Score (1-10)', icon: Smile },
                { id: 'ifee', label: '3. IFEE Model', icon: Heart },
                { id: 'inhome', label: '4. IN HOME SSS', icon: Stethoscope },
                { id: 'meds', label: `5. รายการยา (${medications.length})`, icon: Pill },
                {
                  id: 'drp',
                  label:
                    noDrpFound && drpItems.length === 0
                      ? '6. การประเมิน DRP (✓ ไม่พบปัญหา)'
                      : `6. การประเมิน DRP (${drpItems.length})`,
                  icon: AlertTriangle,
                  isWarning: drpItems.length > 0,
                },
                { id: 'photos', label: `7. รูปภาพ (${photos.length})`, icon: Camera },
                { id: 'next', label: '8. นัดเยี่ยมรอบหน้า', icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? tab.id === 'drp'
                          ? 'border-amber-600 text-amber-800 bg-amber-50/50'
                          : 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                        : tab.id === 'drp' && drpItems.length > 0
                        ? 'border-transparent text-amber-800 bg-amber-50/30 hover:bg-amber-50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${tab.id === 'drp' ? 'text-amber-600' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB 1: Vitals & SOAP */}
              {activeTab === 'soap' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Objective Vitals Grid */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        สัญญาณชีพและการตรวจวัด (Vital Signs & Measurements)
                      </span>
                      <span className="text-[11px] text-slate-400">กรอกค่าที่ตรวจวัดได้ในการลงพื้นที่</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          BP บน (Sys)
                        </label>
                        <input
                          type="number"
                          value={bpSys}
                          onChange={(e) => setBpSys(e.target.value)}
                          placeholder="120"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          BP ล่าง (Dia)
                        </label>
                        <input
                          type="number"
                          value={bpDia}
                          onChange={(e) => setBpDia(e.target.value)}
                          placeholder="80"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ชีพจร (bpm)
                        </label>
                        <input
                          type="number"
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value)}
                          placeholder="72"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          DTX (mg/dL)
                        </label>
                        <input
                          type="number"
                          value={dtx}
                          onChange={(e) => setDtx(e.target.value)}
                          placeholder="เช่น 140"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          SpO2 (%)
                        </label>
                        <input
                          type="number"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          placeholder="98"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          อุณหภูมิ (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                          placeholder="36.5"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          อัตราการหายใจ RR (ครั้ง/นาที)
                        </label>
                        <input
                          type="number"
                          value={rr}
                          onChange={(e) => setRr(e.target.value)}
                          placeholder="18"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          น้ำหนัก (กก.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="เช่น 58.5"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ส่วนสูง (ซม.)
                        </label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="เช่น 155"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          BMI (คำนวณอัตโนมัติ)
                        </label>
                        <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 flex items-center justify-between">
                          <span>{bmi ? bmi : '-'}</span>
                          <span className="text-[10px] text-emerald-700">
                            {bmi
                              ? bmi < 18.5
                                ? 'ผอม'
                                : bmi <= 22.9
                                ? 'สมส่วน'
                                : bmi <= 24.9
                                ? 'ท้วม'
                                : 'อ้วน'
                              : 'กก./ม.²'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SOAP Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">S</span>
                        Subjective (อาการสำคัญที่ผู้ป่วย/ผู้ดูแลบอกเล่า)
                      </label>
                      <textarea
                        rows={3}
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        placeholder="เช่น ผู้ป่วยบอกว่าช่วงนี้มีอาการเวียนหัวตอนเช้า ทานยาตรงเวลาแต่ยาเบาหวานหมดก่อนกำหนด..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[11px] flex items-center justify-center font-bold">O</span>
                        Objective (สิ่งที่ทีมตรวจพบ / สภาพจริง / ยาที่พบในบ้าน)
                      </label>
                      <textarea
                        rows={3}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="เช่น ตรวจนับยาพบ Metformin เหลือค้าง 30 เม็ด ตรวจพบยาแก้ปวดชุดจากร้านชำ 2 ซอง ขาทั้งสองข้างไม่บวม..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-700 text-white text-[11px] flex items-center justify-center font-bold">A</span>
                        Assessment (การประเมินทางคลินิก & ปัญหาเรื่องยา DRP)
                      </label>
                      <textarea
                        rows={3}
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        placeholder="เช่น 1. Uncontrolled HT จาก Non-compliance\n2. DRP: Drug misuse ใช้ยาชุดสเตียรอยด์เสี่ยงต่อ GI bleeding..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-900 text-white text-[11px] flex items-center justify-center font-bold">P</span>
                        Plan (แผนการดูแล การปรับเปลี่ยนยา และคำปรึกษา)
                      </label>
                      <textarea
                        rows={3}
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        placeholder="เช่น 1. ให้ความรู้เรื่องอันตรายของยาชุด และเก็บทำลาย\n2. จัดตลับยา 7 วัน ให้ญาติกำกับ\n3. นัดติดตาม DTX และ BP อีก 1 เดือน..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* DRP Assessment Integration Widget in Clinical SOAP */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 rounded-2xl border border-amber-200 space-y-2 mt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            DRP
                          </div>
                          <div>
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-['Prompt']">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              การประเมินปัญหาที่เกี่ยวเนื่องกับยา (DRP Assessment) ในการเยี่ยมครั้งนี้
                            </span>
                            <span className="text-[11px] text-amber-900/80">
                              {drpItems.length > 0 ? (
                                <span className="font-semibold text-amber-800">
                                  บันทึกแล้ว {drpItems.length} ปัญหา DRP
                                </span>
                              ) : noDrpFound ? (
                                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 inline" /> ตรวจไม่พบปัญหา DRP ในครั้งนี้ (No DRPs)
                                </span>
                              ) : (
                                'ประเมิน 10 หมวดหมู่ปัญหาด้านยา หรือระบุไม่พบปัญหา DRP'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              handleAddDrp();
                              setActiveTab('drp');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่ม DRP ({drpItems.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSetNoDrp}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              noDrpFound && drpItems.length === 0
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ไม่พบปัญหา DRP</span>
                          </button>
                        </div>
                      </div>

                      {drpItems.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-200/60">
                          <span className="text-[10px] text-amber-900 font-bold">ปัญหาที่ตรวจพบ:</span>
                          {drpItems.map((d, dIdx) => (
                            <span
                              key={`soap-drp-chip-${dIdx}`}
                              className="text-[10px] font-semibold bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md"
                            >
                              #{dIdx + 1} {d.drugName ? `${d.drugName}: ` : ''}{d.category === 'อื่น ๆ เพิ่มเติม' && d.otherCategory ? d.otherCategory : d.category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Pain Score 1-10 */}
              {activeTab === 'pain' && (
                <div className="space-y-5 animate-fadeIn p-2">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {getPainIcon(painScore)}
                      <h3 className="text-base font-bold text-slate-800">
                        แบบประเมินระดับความเจ็บปวด (Pain Score: 0 - 10)
                      </h3>
                    </div>

                    <div className="max-w-md mx-auto">
                      <div className="text-3xl font-extrabold text-emerald-800 mb-2">
                        {painScore} / 10
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mb-4">
                        {painScore === 0 && 'ระดับ 0: ไม่ปวดเลย (No Pain)'}
                        {painScore >= 1 && painScore <= 3 && `ระดับ ${painScore}: ปวดเล็กน้อย ทนได้ (Mild Pain)`}
                        {painScore >= 4 && painScore <= 6 && `ระดับ ${painScore}: ปวดปานกลาง รบกวนชีวิตประจำวัน (Moderate Pain)`}
                        {painScore >= 7 && painScore <= 9 && `ระดับ ${painScore}: ปวดรุนแรงมาก ทำงานไม่ได้ (Severe Pain)`}
                        {painScore === 10 && 'ระดับ 10: ปวดรุนแรงที่สุดในชีวิต ทนไม่ไหว (Worst Pain)'}
                      </p>

                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={painScore}
                        onChange={(e) => setPainScore(parseInt(e.target.value))}
                        className="w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-lg cursor-pointer accent-emerald-700"
                      />

                      <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
                        <span>0 (ไม่ปวด)</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                        <span>10 (ปวดที่สุด)</span>
                      </div>
                    </div>

                    {/* Quick Button Selector */}
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPainScore(num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            painScore === num
                              ? 'bg-emerald-600 text-white shadow-md scale-110'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ตำแหน่งที่ปวด และลักษณะอาการปวด
                    </label>
                    <input
                      type="text"
                      value={painLocation}
                      onChange={(e) => setPainLocation(e.target.value)}
                      placeholder="เช่น ปวดตื้อๆ บริเวณข้อเข่าทั้ง 2 ข้างเวลาเดินลงน้ำหนัก, ปวดบั้นเอวซ้ายร้าวลงขา..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: IFEE Model */}
              {activeTab === 'ifee' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    💡 <b>IFEE Framework:</b> การประเมินมุมมองของผู้ป่วยและครอบครัวอย่างเข้าใจรอบด้านตามหลักเวชศาสตร์ครอบครัว
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        I - Ideas (ความคิดของผู้ป่วยเกี่ยวกับความเจ็บป่วย)
                      </label>
                      <textarea
                        rows={3}
                        value={ifeeIdeas}
                        onChange={(e) => setIfeeIdeas(e.target.value)}
                        placeholder="ผู้ป่วยคิดว่าเกิดจากอะไร เช่น คิดว่าปวดขาเพราะเลือดลมไม่เดิน หรือคิดว่าโรคเบาหวานรักษาไม่หาย..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        F - Feelings (ความรู้สึก ความกลัว หรือความกังวล)
                      </label>
                      <textarea
                        rows={3}
                        value={ifeeFeelings}
                        onChange={(e) => setIfeeFeelings(e.target.value)}
                        placeholder="ความรู้สึกภายใน เช่น กลัวเป็นอัมพฤกษ์อัมพาต กลัวตาบอด กลัวเป็นภาระลูกหลาน กังวลเรื่องค่าใช้จ่าย..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        E - Expectations (ความคาดหวังต่อการรักษาและทีมเยี่ยมบ้าน)
                      </label>
                      <textarea
                        rows={3}
                        value={ifeeExpectations}
                        onChange={(e) => setIfeeExpectations(e.target.value)}
                        placeholder="สิ่งที่ผู้ป่วยหรือผู้ดูแลต้องการให้ช่วยเหลือ เช่น อยากให้จัดยาให้เข้าใจง่าย อยากเดินไปวัดได้..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        E - Effects (ผลกระทบต่อการดำเนินชีวิต ครอบครัว และหน้าที่การงาน)
                      </label>
                      <textarea
                        rows={3}
                        value={ifeeEffects}
                        onChange={(e) => setIfeeEffects(e.target.value)}
                        placeholder="กระทบอย่างไร เช่น ไม่สามารถออกไปกรีดยางได้ ต้องให้ลูกสาวหยุดงานมาดูแล เดินเข้าห้องน้ำลำบาก..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: IN HOME SSS */}
              {activeTab === 'inhome' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs text-teal-900">
                    🏡 <b>IN HOME SSS:</b> เครื่องมือมาตรฐานในการประเมินและดูแลผู้ป่วยที่บ้านโดยสหวิชาชีพ
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        I - Immobility (การเคลื่อนไหว)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeImmobility}
                        onChange={(e) => setInhomeImmobility(e.target.value)}
                        placeholder="เช่น เดินได้เอง, ใช้ไม้เท้า 4 ขา, ติดบ้าน, ติดเตียง..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        N - Nutrition (โภชนาการ)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeNutrition}
                        onChange={(e) => setInhomeNutrition(e.target.value)}
                        placeholder="เช่น เคี้ยวกลืนปกติ, อาหารรสเค็มจัด, อาหารปั่นผสมทางสายยาง..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        H - Housing (สภาพบ้าน/แวดล้อม)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeHousing}
                        onChange={(e) => setInhomeHousing(e.target.value)}
                        placeholder="เช่น แสงสว่างพอเหมาะ, ห้องน้ำนั่งราบ, มีราวจับ..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        O - Other people (ผู้ดูแล/ครอบครัว)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeOtherPeople}
                        onChange={(e) => setInhomeOtherPeople(e.target.value)}
                        placeholder="เช่น บุตรสาวดูแลดี, ผู้ดูแลมีภาวะเหนื่อยล้า (Caregiver burden)..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-emerald-800 mb-1">
                        M - Medication (การจัดการยา)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeMedication}
                        onChange={(e) => setInhomeMedication(e.target.value)}
                        placeholder="เช่น จัดยาใส่ตลับ 7 วัน, มียาสมุนไพร/ยาต้ม, ยาเหลือค้าง..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        E - Examination (ตรวจร่างกายเฉพาะ)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeExamination}
                        onChange={(e) => setInhomeExamination(e.target.value)}
                        placeholder="เช่น ตรวจแผลกดทับ Stage 0, ตรวจเท้าเบาหวาน Monofilament ปกติ..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        S - Safety (ความปลอดภัยในบ้าน)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeSafety}
                        onChange={(e) => setInhomeSafety(e.target.value)}
                        placeholder="เช่น พื้นห้องน้ำลื่น, มีธรณีประตูสูง, เตียงมีราวกั้น..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        S - Spiritual (จิตใจ/ความเชื่อ)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeSpiritual}
                        onChange={(e) => setInhomeSpiritual(e.target.value)}
                        placeholder="เช่น ไหว้พระสวดมนต์ทุกค่ำ, ไปวัดวันพระ, กำลังใจดี..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        S - Services (บริการ/สิทธิการรักษา)
                      </label>
                      <textarea
                        rows={2}
                        value={inhomeServices}
                        onChange={(e) => setInhomeServices(e.target.value)}
                        placeholder="เช่น รับยาต่อเนื่องที่ รพ.สต., อสม. ส่งยาถึงบ้าน..."
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Medications & Pharmacist Review (Critical requirement!) */}
              {activeTab === 'meds' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Top Bar for Meds */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        รายการยาและการประเมินปัญหาการใช้ยา (Drug Review & DRPs)
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        ตรวจสอบความร่วมมือในการรับประทานยา (Adherence) และปัญหาจากการใช้ยา
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มยา
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Buttons for Pharmacist */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      ⚡ เพิ่มด่วนจากยาสามัญ NCD ยอดนิยม:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                      {COMMON_MEDICATIONS_NCD.map((cm, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddCommonMed(cm)}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>{cm.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medications List Table */}
                  {medications.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">ยังไม่มีรายการยาใน Visit นี้</p>
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        + คลิกเพื่อเพิ่มรายการยา
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medications.map((med, idx) => (
                        <div
                          key={med.id || idx}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) => handleUpdateMed(idx, 'name', e.target.value)}
                                placeholder="ชื่อยา เช่น Amlodipine 5 mg"
                                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white"
                              />
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) => handleUpdateMed(idx, 'dose', e.target.value)}
                                placeholder="ขนาดยา เช่น 1 tab"
                                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                              />
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) => handleUpdateMed(idx, 'frequency', e.target.value)}
                                placeholder="วิธีใช้ เช่น วันละ 1 ครั้ง หลังอาหารเช้า"
                                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMed(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                ข้อบ่งใช้ (Indication)
                              </label>
                              <input
                                type="text"
                                value={med.indication}
                                onChange={(e) => handleUpdateMed(idx, 'indication', e.target.value)}
                                placeholder="เช่น ลดความดันโลหิต"
                                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                ความร่วมมือการรับประทานยา (Adherence)
                              </label>
                              <select
                                value={med.adherence}
                                onChange={(e) => handleUpdateMed(idx, 'adherence', e.target.value as any)}
                                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                              >
                                <option value="กินตรงเวลาสม่ำเสมอ">กินตรงเวลาสม่ำเสมอ (Good)</option>
                                <option value="ลืมกินบ่อย">ลืมกินบ่อย (Forgetful)</option>
                                <option value="หยุดยาเอง">หยุดยาเอง (Self-discontinued)</option>
                                <option value="กินผิดขนาด">กินผิดขนาด (Wrong dose)</option>
                                <option value="ยาเหลือเกินกำหนด">ยาเหลือเกินกำหนด (Leftover excess)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                บันทึกปัญหาการใช้ยา (DRP Notes)
                              </label>
                              <input
                                type="text"
                                value={med.drpNotes || ''}
                                onChange={(e) => handleUpdateMed(idx, 'drpNotes', e.target.value)}
                                placeholder="เช่น ยาเหลือ 40 เม็ด, เม็ดใหญ่กลืนลำบาก..."
                                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleQuickAddDrpFromMed(med.name || 'ยานี้')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                              title="เปิดไปที่หัวข้อประเมิน DRP สำหรับยานี้"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>+ ประเมิน DRP สำหรับยานี้ (10 หมวดหมู่)</span>
                            </button>
                            <span className="text-[10px] text-slate-400">
                              {med.name ? `ยา: ${med.name}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pharmacist Clinical Advice */}
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                    <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-emerald-700" />
                      คำแนะนำเฉพาะทางเภสัชกรรม (Pharmacist Counseling & Plan)
                    </label>
                    <textarea
                      rows={3}
                      value={pharmacistAdvice}
                      onChange={(e) => setPharmacistAdvice(e.target.value)}
                      placeholder="เช่น จัดตลับยา 7 วัน ให้ลูกสาวช่วยตรวจเช็คทุกค่ำ เน้นย้ำห้ามซื้อยาชุดสเตียรอยด์และยาลูกกลอนเด็ดขาด แนะนำวิธีเก็บรักษายาไม่ให้โดนแสงแดด..."
                      className="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick Jump Banner to DRP Tab */}
                  <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-950 block">
                          หัวข้อการประเมินปัญหาที่เกี่ยวเนื่องกับยา (DRP Assessment)
                        </span>
                        <span className="text-[11px] text-amber-800">
                          {drpItems.length > 0
                            ? `บันทึกแล้ว ${drpItems.length} ปัญหาใน Visit นี้`
                            : noDrpFound
                            ? 'ระบุว่าไม่พบปัญหาด้านยา (No DRPs)'
                            : 'ประเมิน 10 หมวดหมู่ปัญหาด้านยา พร้อมเลือกตัวยาที่เกี่ยวข้อง'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('drp')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>ไปยังแท็บ DRP ({drpItems.length}) →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: DRP Assessment (10 Categories - User Requirement) */}
              {activeTab === 'drp' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Banner */}
                  <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2 font-['Prompt']">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          การประเมินปัญหาที่เกี่ยวเนื่องกับยา (Drug-Related Problems: DRPs)
                        </h4>
                        <p className="text-xs text-amber-900/80 mt-0.5">
                          ประเมินและคัดกรอง 10 หมวดหมู่ปัญหาด้านยา พร้อมเลือกตัวยาที่เกี่ยวข้องเพื่อวางแผนดูแลรักษา
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAddDrp()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>เพิ่มปัญหา DRP</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSetNoDrp}
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            noDrpFound && drpItems.length === 0
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ไม่พบปัญหา DRP</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* If No DRP marked */}
                  {noDrpFound && drpItems.length === 0 && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>บันทึกสถานะ: ในการเยี่ยมครั้งนี้ตรวจไม่พบปัญหาที่เกี่ยวเนื่องกับยา (No DRPs Detected)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddDrp()}
                        className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        + เปลี่ยนเป็นมีปัญหา DRP
                      </button>
                    </div>
                  )}

                  {/* Empty state: Quick Start with 10 Categories */}
                  {drpItems.length === 0 && !noDrpFound && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-amber-300 space-y-4">
                      <div className="text-center space-y-1.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h5 className="font-bold text-sm text-slate-800">
                          ยังไม่มีการบันทึก DRP ในการเยี่ยมครั้งนี้
                        </h5>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto">
                          กดเลือกหมวดหมู่ปัญหาด้านยา 10 รายการด้านล่างเพื่อเริ่มบันทึกทันที หรือระบุว่าไม่พบปัญหา DRP
                        </p>
                      </div>

                      {/* 10 Quick Select Category Cards */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>กดเลือกหมวดหมู่ DRP เพื่อเริ่มประเมิน:</span>
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                            คลิก 1 ครั้งเพื่อสร้างรายการ
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {DRP_CATEGORY_DETAILS.map((catDetail) => (
                            <button
                              key={`empty-drp-cat-${catDetail.id}`}
                              type="button"
                              onClick={() => handleAddDrp(undefined, catDetail.category)}
                              className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50/70 hover:border-amber-400 transition-all cursor-pointer flex items-start gap-2.5 shadow-2xs group"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-500 group-hover:text-white text-slate-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 transition-colors">
                                {catDetail.id}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs text-slate-800 group-hover:text-amber-950 flex items-center justify-between">
                                  <span>{catDetail.id}. {catDetail.thTitle}</span>
                                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                                </div>
                                <div className="text-[10px] text-slate-400 group-hover:text-amber-800/80 leading-tight">
                                  {catDetail.enTitle}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleAddDrp()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ เพิ่มปัญหา DRP ทั่วไป</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSetNoDrp}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>ไม่พบปัญหา DRP ในครั้งนี้ (No DRPs)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DRP Items List */}
                  {drpItems.length > 0 && (
                    <div className="space-y-4">
                      {drpItems.map((item, idx) => (
                        <div
                          key={item.id || `drp-${idx}`}
                          className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-3 relative transition-all"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-800 text-xs font-['Prompt']">
                                ปัญหา DRP ที่ {idx + 1}
                              </span>
                              {item.drugName && (
                                <span className="bg-amber-100 text-amber-900 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                                  {item.drugName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Badge Selector */}
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-400 hidden sm:inline">สถานะ:</span>
                                <select
                                  value={item.status || 'อยู่ระหว่างติดตาม'}
                                  onChange={(e) => handleUpdateDrp(idx, 'status', e.target.value)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border focus:outline-none cursor-pointer ${
                                    item.status === 'แก้ไขปัญหาแล้ว'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : item.status === 'ส่งต่อแพทย์/รพ.'
                                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value="อยู่ระหว่างติดตาม">อยู่ระหว่างติดตาม (Pending)</option>
                                  <option value="แก้ไขปัญหาแล้ว">แก้ไขปัญหาแล้ว (Resolved)</option>
                                  <option value="ส่งต่อแพทย์/รพ.">ส่งต่อแพทย์/รพ. (Referred)</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveDrp(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบรายการ DRP นี้"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Field 1: Drug Selection from recorded medications */}
                          <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                <span>1. เลือกชื่อยาที่พบปัญหา (เลือกจากยาที่บันทึกไว้ หรือพิมพ์ใหม่):</span>
                              </label>
                              <span className="text-[10px] text-slate-400">เลือกหรือพิมพ์ระบุ</span>
                            </div>

                            {/* Quick clickable chips for current visit meds */}
                            {currentVisitDrugNames.length > 0 && (
                              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 space-y-1">
                                <span className="text-[10px] font-bold text-emerald-900 block">
                                  📋 ยาที่บันทึกไว้ใน Visit นี้ (คลิกเพื่อเลือกทันที):
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {currentVisitDrugNames.map((dName, dIdx) => (
                                    <button
                                      key={`curr-med-${idx}-${dIdx}`}
                                      type="button"
                                      onClick={() => handleUpdateDrp(idx, 'drugName', dName)}
                                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                        item.drugName === dName
                                          ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400'
                                          : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      }`}
                                    >
                                      <Pill className="w-3 h-3" />
                                      <span>{dName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick clickable chips for previous visits meds */}
                            {previousVisitsDrugNames.length > 0 && (
                              <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200 space-y-1">
                                <span className="text-[10px] font-semibold text-slate-600 block">
                                  🕒 ยาจากการเยี่ยมครั้งก่อนๆ:
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {previousVisitsDrugNames.map((pName, pIdx) => (
                                    <button
                                      key={`prev-med-${idx}-${pIdx}`}
                                      type="button"
                                      onClick={() => handleUpdateDrp(idx, 'drugName', pName)}
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                        item.drugName === pName
                                          ? 'bg-slate-800 text-white shadow-xs'
                                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                                      }`}
                                    >
                                      <span>{pName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dropdown with options + input field */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div>
                                <select
                                  value={
                                    allRecordedDrugNames.includes(item.drugName)
                                      ? item.drugName
                                      : item.drugName
                                      ? 'CUSTOM'
                                      : ''
                                  }
                                  onChange={(e) => {
                                    if (e.target.value === 'CUSTOM') {
                                      handleUpdateDrp(idx, 'drugName', '');
                                    } else {
                                      handleUpdateDrp(idx, 'drugName', e.target.value);
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                >
                                  <option value="">-- เลือกยาจากรายการที่บันทึกไว้ --</option>
                                  {currentVisitDrugNames.length > 0 && (
                                    <optgroup label="📋 ยาในการเยี่ยมครั้งนี้">
                                      {currentVisitDrugNames.map((dName, dIdx) => (
                                        <option key={`opt-curr-${idx}-${dIdx}`} value={dName}>
                                          {dName}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {previousVisitsDrugNames.length > 0 && (
                                    <optgroup label="🕒 ยาจากการเยี่ยมครั้งก่อนๆ">
                                      {previousVisitsDrugNames.map((pName, pIdx) => (
                                        <option key={`opt-prev-${idx}-${pIdx}`} value={pName}>
                                          {pName}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {drugAllergiesNames.length > 0 && (
                                    <optgroup label="⚠️ ประวัติยาที่แพ้">
                                      {drugAllergiesNames.map((aName, aIdx) => (
                                        <option key={`opt-alg-${idx}-${aIdx}`} value={aName}>
                                          {aName} (ประวัติแพ้ยา)
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  <optgroup label="💊 ยาโรคเรื้อรังที่ใช้บ่อย (NCD)">
                                    {COMMON_MEDICATIONS_NCD.slice(0, 8).map((cm, cIdx) => (
                                      <option key={`opt-ncd-${idx}-${cIdx}`} value={cm.name}>
                                        {cm.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <option value="ไม่ระบุยาเฉพาะเจาะจง">ไม่ระบุยาเฉพาะเจาะจง / การใช้ยารวม</option>
                                  <option value="CUSTOM">✏️ พิมพ์ระบุชื่อยาอื่น ๆ ด้วยตนเอง...</option>
                                </select>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={item.drugName}
                                  onChange={(e) => handleUpdateDrp(idx, 'drugName', e.target.value)}
                                  placeholder="ชื่อยา เช่น Metformin 500 mg, ยาสมุนไพร..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Field 2: DRP Category Selection (10 Interactive Categories) */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>2. กดเลือกหมวดหมู่ปัญหา DRP (มีให้เลือก 10 หมวดหมู่):</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                                  กดเลือกรายการด้านล่าง
                                </span>
                                <select
                                  value={item.category}
                                  onChange={(e) => handleUpdateDrp(idx, 'category', e.target.value)}
                                  className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 cursor-pointer sm:hidden"
                                >
                                  {DRP_CATEGORIES.map((cat, catIdx) => (
                                    <option key={`drp-cat-m-${catIdx}`} value={cat}>
                                      {catIdx + 1}. {cat}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* 10 Interactive Category Buttons / Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {DRP_CATEGORY_DETAILS.map((catDetail) => {
                                const isSelected = item.category === catDetail.category;
                                return (
                                  <button
                                    key={`drp-cat-card-${idx}-${catDetail.id}`}
                                    type="button"
                                    onClick={() => handleUpdateDrp(idx, 'category', catDetail.category)}
                                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                                      isSelected
                                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-xs'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                                        isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {catDetail.id}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-xs flex items-center justify-between gap-1">
                                        <span className={isSelected ? 'text-amber-950 font-extrabold' : 'text-slate-800 font-semibold'}>
                                          {catDetail.id}. {catDetail.thTitle}
                                        </span>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                                        {catDetail.enTitle} {catDetail.subTitle ? <span className="text-slate-400">({catDetail.subTitle})</span> : null}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* หากกด อื่น ๆ เพิ่มเติม จะขึ้นช่องให้กรอกเองได้ */}
                            {(item.category === 'อื่น ๆ เพิ่มเติม' || item.category === DRP_CATEGORIES[9]) && (
                              <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-1.5 animate-fadeIn">
                                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                  <span>10. ระบุปัญหา DRP อื่น ๆ เพิ่มเติม (โปรดกรอกรายละเอียด):</span>
                                </label>
                                <input
                                  type="text"
                                  autoFocus
                                  value={item.otherCategory || ''}
                                  onChange={(e) => handleUpdateDrp(idx, 'otherCategory', e.target.value)}
                                  placeholder="พิมพ์ระบุปัญหาด้านยาอื่น ๆ เช่น การเก็บรักษายาไม่ถูกต้อง, ปัญหาการอ่านฉลากยา, ยาหมดอายุ, ปัญหาอุปกรณ์พ่นยา..."
                                  className="w-full px-3 py-2 text-xs bg-white border border-amber-400 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            )}
                          </div>

                          {/* Field 3 & 4: Description & Intervention */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                3. รายละเอียดปัญหา / สิ่งที่ตรวจพบ (Description & Findings):
                              </label>
                              <textarea
                                rows={3}
                                value={item.description || ''}
                                onChange={(e) => handleUpdateDrp(idx, 'description', e.target.value)}
                                placeholder="เช่น ผู้ป่วยมีอาการบวมหลังเท้า 2 ข้างหลังทาน Amlodipine ได้ 3 สัปดาห์, ลืมกินยาช่วงเช้าบ่อยเนื่องจากออกจากบ้านเร็ว..."
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                4. การแก้ไข / แผนการดูแลทางเภสัชกรรม (Intervention & Plan):
                              </label>
                              <textarea
                                rows={3}
                                value={item.intervention || ''}
                                onChange={(e) => handleUpdateDrp(idx, 'intervention', e.target.value)}
                                placeholder="เช่น แนะนำยกขาสูงเวลานอน และประสานงานแพทย์ รพ.สต. เพื่อพิจารณาปรับเปลี่ยนยา, จัดตลับยา 7 วัน ให้ลูกสาวช่วยเตือน..."
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add more button at bottom */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddDrp()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-amber-700" />
                          <span>+ เพิ่มปัญหา DRP อีกข้อ</span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                          รวมบันทึก {drpItems.length} ปัญหา DRP ในการเยี่ยมครั้งนี้
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: Photos */}
              {activeTab === 'photos' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        เพิ่มรูปภาพประกอบการเยี่ยมบ้านรอบนี้
                      </span>
                      <span className="text-[11px] text-slate-400">รูปยา, สภาพบ้าน, แผล, การให้คำปรึกษา</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">หมวดหมู่รูปภาพ</label>
                        <select
                          value={photoCategory}
                          onChange={(e) => setPhotoCategory(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="ตู้ยา/ซองยา">ตู้ยา / ซองยา / ตลับยา</option>
                          <option value="สภาพบ้าน/สิ่งแวดล้อม">สภาพบ้าน / บันได / ห้องน้ำ</option>
                          <option value="ร่างกาย/แผล">สภาพร่างกาย / แผลกดทับ</option>
                          <option value="การให้คำปรึกษา">ภาพขณะให้คำปรึกษา</option>
                          <option value="อื่น ๆ">อื่น ๆ</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำบรรยายรูปภาพ</label>
                        <input
                          type="text"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          placeholder="เช่น ตลับยา 7 วันที่เภสัชกรจัดให้ใหม่, บันไดทางขึ้นบ้านไม่มีราวจับ"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* File input button */}
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                        <Camera className="w-4 h-4" />
                        <span>เลือกรูปภาพจากเครื่อง / ถ่ายภาพ</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  {photos.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">ยังไม่มีรูปภาพที่แนบใน Visit นี้</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white group shadow-xs"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption}
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-2 text-xs">
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                              {photo.category}
                            </span>
                            <p className="text-[11px] text-slate-700 font-medium truncate mt-1">
                              {photo.caption}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: Next Visit Appointment */}
              {activeTab === 'next' && (
                <div className="space-y-4 animate-fadeIn p-2">
                  <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm border-b border-emerald-200 pb-2">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>วันเวลาการมาเยี่ยมรอบหน้า (Next Follow-up Visit)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          วันที่นัดเยี่ยมรอบถัดไป
                        </label>
                        <input
                          type="date"
                          value={nextVisitDate}
                          onChange={(e) => setNextVisitDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          เวลานัดหมายโดยประมาณ
                        </label>
                        <input
                          type="time"
                          value={nextVisitTime}
                          onChange={(e) => setNextVisitTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เป้าหมาย / สิ่งที่ต้องติดตามในการเยี่ยมรอบถัดไป
                      </label>
                      <textarea
                        rows={3}
                        value={nextVisitGoal}
                        onChange={(e) => setNextVisitGoal(e.target.value)}
                        placeholder="เช่น ตรวจระดับน้ำตาล DTX ซ้ำ, ประเมินความดันหลังปรับ Amlodipine, ตรวจนับยาในตลับ 7 วัน, ตรวจสอบสภาพแผลกดทับ..."
                        className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Bottom Save Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Visit {visitNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      drpItems.length > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : noDrpFound
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>
                      DRP:{' '}
                      {drpItems.length > 0
                        ? `พบ ${drpItems.length} ปัญหา`
                        : noDrpFound
                        ? 'ตรวจไม่พบปัญหา (ปกติ)'
                        : 'ยังไม่ได้ระบุ'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
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
                    <span>{saving ? 'กำลังบันทึก...' : `บันทึกการเยี่ยม Visit ${visitNumber}`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
