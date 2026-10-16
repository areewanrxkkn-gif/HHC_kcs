import React, { useState } from 'react';
import { Patient, VisitRecord } from '../types';
import { FamilyTreeSection } from './FamilyTreeSection';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  Activity,
  Plus,
  Edit,
  Trash2,
  Phone,
  Clock,
  Pill,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  TrendingDown,
  TrendingUp,
  GitFork,
} from 'lucide-react';

interface PatientDetailViewProps {
  patient: Patient;
  visits: VisitRecord[];
  onBack: () => void;
  onNewVisit: () => void;
  onEditPatient: () => void;
  onDeletePatient?: (patient: Patient) => void;
  onEditVisit: (visit: VisitRecord) => void;
  onDeleteVisit: (visitId: string) => void;
  onUpdatePatientFamilyTree?: (
    familyTreePhoto: string | undefined,
    familyTreeNotes: string | undefined
  ) => Promise<void>;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patient,
  visits,
  onBack,
  onNewVisit,
  onEditPatient,
  onDeletePatient,
  onEditVisit,
  onDeleteVisit,
  onUpdatePatientFamilyTree,
}) => {
  const [activeTab, setActiveTab] = useState<'visits' | 'family-tree'>('visits');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(
    visits.length > 0 ? visits[0].id : null
  );
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  const toggleVisitExpand = (id: string) => {
    setExpandedVisitId(expandedVisitId === id ? null : id);
  };

  const getPainFace = (score: number) => {
    if (score === 0) return <Smile className="w-4 h-4 text-emerald-500" />;
    if (score <= 3) return <Smile className="w-4 h-4 text-teal-500" />;
    if (score <= 6) return <Meh className="w-4 h-4 text-amber-500" />;
    return <Frown className="w-4 h-4 text-rose-500" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้ารายชื่อผู้ป่วย</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'family-tree' ? 'visits' : 'family-tree')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeTab === 'family-tree'
                ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-teal-600" />
            <span>PCU Tools</span>
            {patient.familyTreePhoto && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={onEditPatient}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>แก้ไขข้อมูล</span>
          </button>

          {onDeletePatient && (
            <button
              type="button"
              onClick={() => onDeletePatient(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 rounded-xl border border-rose-200 transition-colors"
              title="ลบข้อมูลผู้ป่วยและประวัติการเยี่ยมทั้งหมดของคนนี้"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>ลบข้อมูลคนนี้</span>
            </button>
          )}

          <button
            onClick={onNewVisit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-700/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึก Visit ใหม่ (Visit {visits.length + 1})</span>
          </button>
        </div>
      </div>

      {/* Patient Profile Card Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-emerald-50 flex-shrink-0">
              {patient.firstName.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Prompt']">
                  {patient.title}{patient.firstName} {patient.lastName}
                </h1>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                  HN: {patient.hn}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  เลขบัตร: {patient.idCard}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 mt-1.5">
                <span>เพศ{patient.gender}</span>
                <span>•</span>
                <span className="font-semibold text-slate-800">
                  อายุ {patient.ageYears} ปี {patient.ageMonths > 0 ? `${patient.ageMonths} เดือน` : ''}
                </span>
                <span>•</span>
                <span>เกิด: {patient.birthDate}</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  {patient.healthCoverage}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-800">
                  สถานะ: {patient.patientStatus}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  บ้านเลขที่ {patient.houseNo} ม.{patient.moo} {patient.villageName} ต.{patient.tambon} อ.เขาชัยสน จ.พัทลุง
                </span>
                {patient.tel && (
                  <span className="ml-2 flex items-center gap-1 text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400" /> {patient.tel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drug Allergy Banner (Crucial alert) */}
        {patient.drugAllergies && patient.drugAllergies.length > 0 ? (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                ประวัติแพ้ยา: {patient.drugAllergies.map((a) => `${a.drugName} (อาการ: ${a.reaction})`).join(' | ')}
              </span>
            </div>
            <span className="text-[11px] bg-rose-200/80 px-2 py-0.5 rounded font-mono">
              ALLERGY ALERT
            </span>
          </div>
        ) : (
          <div className="mt-3 text-xs text-slate-400 px-1">
            ✓ ไม่มีประวัติแพ้ยา
          </div>
        )}

        {/* Chronic Diseases and Caregiver details */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-emerald-600" /> โรคประจำตัว:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {patient.chronicDiseases.map((d, i) => (
                <span
                  key={i}
                  className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium border border-slate-200"
                >
                  {d}
                </span>
              ))}
              {patient.chronicDiseasesOther && (
                <span className="bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg font-medium border border-teal-200">
                  {patient.chronicDiseasesOther}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" /> ข้อมูลผู้ดูแลและผู้ติดต่อ:
            </span>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
              <div>
                ผู้ดูแลหลัก: <b className="text-slate-800">{patient.caregiver?.name || 'ไม่มีข้อมูล'}</b> ({patient.caregiver?.relation || '-'})
                {patient.caregiver?.tel && <span className="ml-1 text-slate-500">โทร: {patient.caregiver.tel}</span>}
              </div>
              {patient.caregiver?.availability && (
                <div className="text-[11px] text-slate-500">
                  ลักษณะการดูแล: {patient.caregiver.availability}
                </div>
              )}
              {patient.emergencyContact?.name && (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  ติดต่อฉุกเฉิน: {patient.emergencyContact.name} ({patient.emergencyContact.relation}) โทร: {patient.emergencyContact.tel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Visits vs PCU Tools */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('visits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'visits'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>ประวัติการเยี่ยมบ้าน (Visit History)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === 'visits'
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {visits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('family-tree')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'family-tree'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>ผังครอบครัว / PCU Tools</span>
          {patient.familyTreePhoto ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              มีรูปผังแล้ว
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-300">
              ยังไม่มีรูปผัง
            </span>
          )}
        </button>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === 'family-tree' ? (
        <FamilyTreeSection
          patient={patient}
          onUpdatePatientFamilyTree={async (photo, notes) => {
            if (onUpdatePatientFamilyTree) {
              await onUpdatePatientFamilyTree(photo, notes);
            }
          }}
        />
      ) : (
        <>
          {/* Visits History Timeline Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Prompt'] flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>ประวัติการเยี่ยมบ้าน (Visit History: {visits.length} ครั้ง)</span>
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลการลงชุมชนแต่ละครั้งแยกจากข้อมูลส่วนตัว สามารถเปรียบเทียบความก้าวหน้าและการจัดการยา
              </p>
            </div>

            <button
              onClick={onNewVisit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึก Visit ใหม่</span>
            </button>
          </div>

      {/* Visits List */}
      {visits.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700 font-['Prompt']">
            ยังไม่เคยมีบันทึกการเยี่ยมบ้านสำหรับผู้ป่วยรายนี้
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            เริ่มต้นบันทึกครั้งแรกเพื่อเก็บสัญญาณชีพ, SOAP, IFEE, IN HOME SSS และตรวจสอบรายการยา
          </p>
          <button
            onClick={onNewVisit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกการเยี่ยมครั้งที่ 1 (Visit 1)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit, index) => {
            const isExpanded = expandedVisitId === visit.id;
            return (
              <div
                key={visit.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* Summary Strip (Click to toggle) */}
                <div
                  onClick={() => toggleVisitExpand(visit.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                      V{visit.visitNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt']">
                          การเยี่ยมครั้งที่ {visit.visitNumber}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {new Date(visit.visitDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ผู้เยี่ยม: <span className="font-semibold text-slate-700">{visit.visitorName}</span> ({visit.visitorRole})
                        {visit.coVisitors && ` • ร่วมกับ: ${visit.coVisitors}`}
                      </p>
                    </div>
                  </div>

                  {/* Vitals Highlights */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {visit.bpSys && (
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg font-bold border border-emerald-200">
                        BP: {visit.bpSys}/{visit.bpDia}
                      </span>
                    )}
                    {visit.dtx && (
                      <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg font-bold border border-teal-200">
                        DTX: {visit.dtx} mg%
                      </span>
                    )}
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-slate-200">
                      {getPainFace(visit.painScore)}
                      <span>Pain {visit.painScore}/10</span>
                    </span>
                    {visit.photos && visit.photos.length > 0 && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                        <span>{visit.photos.length} รูป</span>
                      </span>
                    )}
                    <div className="text-slate-400 pl-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 space-y-5 animate-fadeIn">
                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-2 pb-3 border-b border-slate-100">
                      <button
                        onClick={() => onEditVisit(visit)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> แก้ไขบันทึกนี้
                      </button>
                      <button
                        onClick={() => setVisitToDelete(visit.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ลบ
                      </button>
                    </div>

                    {/* Full Vitals Box */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        สัญญาณชีพและการตรวจร่างกาย (Vital Signs)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">BP (mmHg)</span>
                          <span className="font-bold text-slate-800">{visit.bpSys ? `${visit.bpSys}/${visit.bpDia}` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">ชีพจร Pulse</span>
                          <span className="font-bold text-slate-800">{visit.pulse ? `${visit.pulse} bpm` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">DTX (mg/dL)</span>
                          <span className="font-bold text-emerald-700">{visit.dtx ? `${visit.dtx}` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">อุณหภูมิ Temp</span>
                          <span className="font-bold text-slate-800">{visit.temp ? `${visit.temp} °C` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">หายใจ RR</span>
                          <span className="font-bold text-slate-800">{visit.rr ? `${visit.rr}/นาที` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">SpO2</span>
                          <span className="font-bold text-slate-800">{visit.spo2 ? `${visit.spo2} %` : '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">BMI</span>
                          <span className="font-bold text-slate-800">{visit.bmi ? `${visit.bmi}` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* SOAP Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1 text-emerald-800">
                          S - Subjective (อาการที่บอกเล่า):
                        </span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {visit.subjective || 'ไม่ได้บันทึก'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1 text-teal-800">
                          O - Objective (สิ่งที่ตรวจพบ/ยาในบ้าน):
                        </span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {visit.objective || 'ไม่ได้บันทึก'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1 text-cyan-800">
                          A - Assessment (การประเมิน & DRP):
                        </span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {visit.assessment || 'ไม่ได้บันทึก'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1 text-emerald-900">
                          P - Plan (แผนการดูแล):
                        </span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {visit.plan || 'ไม่ได้บันทึก'}
                        </p>
                      </div>
                    </div>

                    {/* IFEE Framework */}
                    {(visit.ifeeIdeas || visit.ifeeFeelings || visit.ifeeExpectations || visit.ifeeEffects) && (
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-900 block mb-2">
                          💡 IFEE Framework (มุมมองของผู้ป่วย):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                          {visit.ifeeIdeas && <div><b>Ideas:</b> {visit.ifeeIdeas}</div>}
                          {visit.ifeeFeelings && <div><b>Feelings:</b> {visit.ifeeFeelings}</div>}
                          {visit.ifeeExpectations && <div><b>Expectations:</b> {visit.ifeeExpectations}</div>}
                          {visit.ifeeEffects && <div><b>Effects:</b> {visit.ifeeEffects}</div>}
                        </div>
                      </div>
                    )}

                    {/* Medications List */}
                    {visit.medications && visit.medications.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-emerald-900 block mb-2 flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          รายการยาและการประเมินการใช้ยา (Medication Review):
                        </span>
                        <div className="space-y-2">
                          {visit.medications.map((m, mi) => (
                            <div
                              key={mi}
                              className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{m.name}</span>
                                <span className="text-slate-500 ml-2">[{m.dose} {m.frequency}]</span>
                                {m.indication && <span className="text-emerald-700 ml-2 font-medium">({m.indication})</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  m.adherence === 'กินตรงเวลาสม่ำเสมอ'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {m.adherence}
                                </span>
                                {m.drpNotes && (
                                  <span className="text-[11px] text-slate-600 italic">
                                    ปัญหา: {m.drpNotes}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {visit.pharmacistAdvice && (
                          <div className="mt-3 p-2.5 bg-emerald-100/60 rounded-xl text-emerald-900 border border-emerald-300">
                            <b>คำแนะนำเภสัชกร:</b> {visit.pharmacistAdvice}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRP Assessment (Drug-Related Problems) */}
                    {visit.drpItems && visit.drpItems.length > 0 ? (
                      <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 flex items-center gap-1.5 font-['Prompt']">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ปัญหาที่เกี่ยวเนื่องกับยา (DRPs) ที่ตรวจพบ ({visit.drpItems.length} ปัญหา):
                          </span>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full border border-amber-300">
                            DRP Assessment
                          </span>
                        </div>

                        <div className="space-y-2">
                          {visit.drpItems.map((drp, di) => (
                            <div
                              key={drp.id || di}
                              className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-amber-800 text-[11px] bg-amber-100 px-1.5 py-0.5 rounded">
                                    #{di + 1}
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    {drp.category === 'อื่น ๆ เพิ่มเติม' && drp.otherCategory
                                      ? `อื่น ๆ: ${drp.otherCategory}`
                                      : drp.category}
                                  </span>
                                  {drp.drugName && (
                                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      ยา: {drp.drugName}
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    drp.status === 'แก้ไขปัญหาแล้ว'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : drp.status === 'ส่งต่อแพทย์/รพ.'
                                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {drp.status || 'อยู่ระหว่างติดตาม'}
                                </span>
                              </div>

                              {drp.description && (
                                <p className="text-slate-700 text-[11px] pl-2 border-l-2 border-amber-400">
                                  <b>ปัญหาที่พบ:</b> {drp.description}
                                </p>
                              )}

                              {drp.intervention && (
                                <p className="text-emerald-900 text-[11px] pl-2 border-l-2 border-emerald-500 bg-emerald-50/50 p-1.5 rounded-r">
                                  <b>แผนการแก้ไข:</b> {drp.intervention}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-950 font-medium">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><b>การประเมิน DRP (10 หมวดหมู่):</b> ตรวจไม่พบปัญหาที่เกี่ยวเนื่องกับยาในการเยี่ยมครั้งนี้ (No DRPs)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          DRP ปกติ
                        </span>
                      </div>
                    )}

                    {/* Photos */}
                    {visit.photos && visit.photos.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                          รูปภาพประกอบการเยี่ยมบ้าน ({visit.photos.length} รูป):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {visit.photos.map((p) => (
                            <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                              <img src={p.dataUrl} alt={p.caption} className="w-full h-32 object-cover" />
                              <div className="p-2">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">
                                  {p.category}
                                </span>
                                <p className="text-[11px] text-slate-700 truncate mt-1">{p.caption}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Visit Appointment */}
                    {visit.nextVisitDate && (
                      <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                        <div>
                          <span className="font-bold">นัดเยี่ยมรอบถัดไป: </span>
                          <span>{new Date(visit.nextVisitDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                          {visit.nextVisitTime && <span> เวลา {visit.nextVisitTime} น.</span>}
                          {visit.nextVisitGoal && (
                            <p className="mt-1 text-amber-800 font-medium">
                              เป้าหมาย: {visit.nextVisitGoal}
                            </p>
                          )}
                        </div>
                        <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Modal Confirm Delete Visit */}
      {visitToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-slate-800 space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 font-['Prompt']">
                ยืนยันการลบบันทึกการเยี่ยม?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการลบบันทึกการเยี่ยมบ้านนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVisitToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = visitToDelete;
                  setVisitToDelete(null);
                  onDeleteVisit(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-700/20 transition-all cursor-pointer"
              >
                ยืนยันลบบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
