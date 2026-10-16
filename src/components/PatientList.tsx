import React from 'react';
import { Patient, VisitRecord } from '../types';
import {
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  ChevronRight,
  ClipboardList,
  Phone,
  UserPlus,
  Stethoscope,
  Clock,
  GitFork,
  Trash2,
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  visits: VisitRecord[];
  onSelectPatient: (patient: Patient) => void;
  onNewVisitClick: (patient: Patient) => void;
  onEditPatientClick: (patient: Patient) => void;
  onDeletePatientClick?: (patient: Patient) => void;
  onRegisterNewClick: () => void;
  selectedTambon: string;
  selectedMoo: number | null;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  visits,
  onSelectPatient,
  onNewVisitClick,
  onEditPatientClick,
  onDeletePatientClick,
  onRegisterNewClick,
  selectedTambon,
  selectedMoo,
}) => {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1 font-['Prompt']">
          ยังไม่พบข้อมูลผู้ป่วยในพื้นที่นี้
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          {selectedTambon
            ? `ใน ต. ${selectedTambon} ${selectedMoo ? `หมู่ ${selectedMoo}` : ''} ยังไม่มีข้อมูลผู้ป่วยที่บันทึกไว้`
            : 'ยังไม่มีข้อมูลผู้ป่วยที่ตรงกับเงื่อนไขการค้นหา'}
        </p>
        <button
          onClick={onRegisterNewClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-700/20 transition-all hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          <span>ลงทะเบียนผู้ป่วยรายใหม่</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => {
        const patientVisits = visits.filter((v) => v.patientId === patient.id);
        const latestVisit = patientVisits.length > 0
          ? [...patientVisits].sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0]
          : null;

        // Mobility badge color
        const mobilityBadge =
          patient.patientStatus === 'ติดเตียง (ช่วยเหลือตัวเองไม่ได้)'
            ? 'bg-rose-100 text-rose-800 border-rose-300'
            : patient.patientStatus === 'ติดบ้าน (เคลื่อนไหวลำบาก)'
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300';

        return (
          <div
            key={patient.id}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Header info */}
            <div className="p-4 sm:p-5">
              {/* Top row: HN & Status */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    HN: {patient.hn}
                  </span>
                  {patient.familyTreePhoto && (
                    <span
                      title="มีข้อมูลผังครอบครัว (PCU Tools) แล้ว"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded"
                    >
                      <GitFork className="w-3 h-3 text-teal-600" />
                      PCU Tools
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    ID: {patient.idCard.slice(0, 1)}...{patient.idCard.slice(-4)}
                  </span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${mobilityBadge}`}>
                  {patient.patientStatus.split(' ')[0]}
                </span>
              </div>

              {/* Patient Name & Age */}
              <div
                onClick={() => onSelectPatient(patient)}
                className="cursor-pointer group-hover:text-emerald-700 transition-colors"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {patient.title}{patient.firstName} {patient.lastName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>เพศ{patient.gender}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">
                    อายุ {patient.ageYears} ปี {patient.ageMonths > 0 ? `${patient.ageMonths} ด.` : ''}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{patient.healthCoverage}</span>
                </p>
              </div>

              {/* Location */}
              <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  บ้านเลขที่ {patient.houseNo} ม.{patient.moo} {patient.villageName} ต.{patient.tambon} อ.เขาชัยสน
                </span>
              </div>

              {/* Allergies warning */}
              {patient.drugAllergies && patient.drugAllergies.length > 0 ? (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                  <span className="truncate">
                    <b>แพ้ยา:</b> {patient.drugAllergies.map((a) => a.drugName).join(', ')}
                  </span>
                </div>
              ) : (
                <div className="mt-2.5 text-[11px] text-slate-400 px-1">
                  ไม่พบประวัติแพ้ยา
                </div>
              )}

              {/* Chronic Diseases */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {patient.chronicDiseases.slice(0, 3).map((disease, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    {disease.replace(/\(.*\)/, '').trim()}
                  </span>
                ))}
                {patient.chronicDiseases.length > 3 && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                    +{patient.chronicDiseases.length - 3}
                  </span>
                )}
                {patient.chronicDiseasesOther && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md">
                    {patient.chronicDiseasesOther}
                  </span>
                )}
              </div>

              {/* Caregiver */}
              {patient.caregiver?.name && (
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    ผู้ดูแล: <b className="text-slate-700">{patient.caregiver.name}</b> ({patient.caregiver.relation})
                  </span>
                </div>
              )}

              {/* Visit Tracker */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เยี่ยมแล้ว {patientVisits.length} ครั้ง</span>
                </div>
                {latestVisit ? (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ล่าสุด: {new Date(latestVisit.visitDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                    ยังไม่เคยเยี่ยม
                  </span>
                )}
              </div>

              {/* Next visit alert if present */}
              {latestVisit?.nextVisitDate && (
                <div className="mt-2 text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    นัดครั้งถัดไป:
                  </span>
                  <span className="font-semibold">
                    {new Date(latestVisit.nextVisitDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectPatient(patient)}
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <span>ดูประวัติผู้ป่วย</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditPatientClick(patient)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
                  title="แก้ไขข้อมูลส่วนตัว"
                >
                  แก้ไข
                </button>

                {onDeletePatientClick && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePatientClick(patient);
                    }}
                    className="p-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 transition-colors"
                    title="ลบข้อมูลผู้ป่วยและประวัติของคนนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNewVisitClick(patient)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:scale-102"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>บันทึก Visit</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
