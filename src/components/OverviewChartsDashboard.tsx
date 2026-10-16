import React, { useState, useMemo } from 'react';
import { Patient, VisitRecord } from '../types';
import { KHAO_CHAISON_TAMBONS } from '../data/khaoChaisonLocations';
import {
  BarChart3,
  BarChart2,
  PieChart,
  Users,
  ClipboardList,
  Calendar,
  Heart,
  Pill,
  Activity,
  MapPin,
  CheckCircle2,
  Filter,
  Clock,
  RotateCcw,
  TrendingUp,
  LayoutGrid,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Search,
} from 'lucide-react';

interface OverviewChartsDashboardProps {
  patients: Patient[];
  visits: VisitRecord[];
  onSelectPatient?: (patient: Patient) => void;
  onNewVisitClick?: (patient: Patient) => void;
  onRegisterNewClick?: () => void;
  onOpenSheetsClick?: () => void;
}

export const OverviewChartsDashboard: React.FC<OverviewChartsDashboardProps> = ({
  patients,
  visits,
  onSelectPatient,
  onNewVisitClick,
  onRegisterNewClick,
  onOpenSheetsClick,
}) => {
  // View mode: 'charts' (default) or 'table'
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  // Filter by tambon within the dashboard
  const [selectedTambonFilter, setSelectedTambonFilter] = useState<string>('all');

  // Interactive hover states for charts
  const [hoveredTambon, setHoveredTambon] = useState<string | null>(null);
  const [hoveredMobility, setHoveredMobility] = useState<string | null>(null);

  // Appointment date range filter state
  const [appointmentStartDate, setAppointmentStartDate] = useState<string>('');
  const [appointmentEndDate, setAppointmentEndDate] = useState<string>('');
  const [appointmentSearch, setAppointmentSearch] = useState<string>('');

  // Quick preset handler for appointments
  const handleApplyPreset = (preset: 'all' | 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'all') {
      setAppointmentStartDate('');
      setAppointmentEndDate('');
    } else if (preset === 'today') {
      const todayStr = toYmd(today);
      setAppointmentStartDate(todayStr);
      setAppointmentEndDate(todayStr);
    } else if (preset === '7days') {
      const todayStr = toYmd(today);
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      setAppointmentStartDate(todayStr);
      setAppointmentEndDate(toYmd(next7));
    } else if (preset === '30days') {
      const todayStr = toYmd(today);
      const next30 = new Date(today);
      next30.setDate(next30.getDate() + 30);
      setAppointmentStartDate(todayStr);
      setAppointmentEndDate(toYmd(next30));
    } else if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setAppointmentStartDate(toYmd(start));
      setAppointmentEndDate(toYmd(end));
    }
  };

  // Patients filtered by tambon if chosen
  const activePatients = useMemo(() => {
    if (selectedTambonFilter === 'all') return patients;
    return patients.filter((p) => p.tambon === selectedTambonFilter);
  }, [patients, selectedTambonFilter]);

  // Visits belonging to active patients
  const activeVisits = useMemo(() => {
    if (selectedTambonFilter === 'all') return visits;
    const activePatientIds = new Set(activePatients.map((p) => p.id));
    return visits.filter((v) => activePatientIds.has(v.patientId));
  }, [visits, activePatients, selectedTambonFilter]);

  // Stats by Tambon
  const tambonStats = useMemo(() => {
    return KHAO_CHAISON_TAMBONS.map((t) => {
      const pts = patients.filter((p) => p.tambon === t.name);
      const vsts = visits.filter((v) => {
        const pt = patients.find((p) => p.id === v.patientId);
        return pt?.tambon === t.name;
      });
      const bedCount = pts.filter((p) => p.patientStatus.includes('ติดเตียง')).length;
      return {
        name: t.name,
        patientCount: pts.length,
        visitCount: vsts.length,
        villagesCount: t.villages.length,
        bedCount,
        percent: patients.length > 0 ? Math.round((pts.length / patients.length) * 100) : 0,
      };
    });
  }, [patients, visits]);

  const maxTambonCount = useMemo(() => {
    return Math.max(...tambonStats.map((t) => t.patientCount), 1);
  }, [tambonStats]);

  // Stats by Mobility
  const mobilityCounts = useMemo(() => {
    const social = activePatients.filter((p) => p.patientStatus.includes('ติดสังคม')).length;
    const home = activePatients.filter((p) => p.patientStatus.includes('ติดบ้าน')).length;
    const bed = activePatients.filter((p) => p.patientStatus.includes('ติดเตียง')).length;
    const total = activePatients.length || 1;
    return {
      social,
      home,
      bed,
      socialPct: Math.round((social / total) * 100),
      homePct: Math.round((home / total) * 100),
      bedPct: Math.round((bed / total) * 100),
    };
  }, [activePatients]);

  // Top Chronic diseases
  const topDiseases = useMemo(() => {
    const diseaseMap: Record<string, number> = {};
    activePatients.forEach((p) => {
      p.chronicDiseases.forEach((d) => {
        const simplified = d.split('(')[0].trim();
        diseaseMap[simplified] = (diseaseMap[simplified] || 0) + 1;
      });
    });
    return Object.entries(diseaseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([disease, count]) => ({
        disease,
        count,
        percent: activePatients.length > 0 ? Math.round((count / activePatients.length) * 100) : 0,
      }));
  }, [activePatients]);

  const maxDiseaseCount = topDiseases.length > 0 ? topDiseases[0].count : 1;

  // Medication adherence rate
  const { adherencePercent, totalMedsChecked, goodAdherence } = useMemo(() => {
    let total = 0;
    let good = 0;
    activeVisits.forEach((v) => {
      (v.medications || []).forEach((m) => {
        total++;
        if (m.adherence === 'กินตรงเวลาสม่ำเสมอ') good++;
      });
    });
    const pct = total > 0 ? Math.round((good / total) * 100) : 85;
    return { adherencePercent: pct, totalMedsChecked: total, goodAdherence: good };
  }, [activeVisits]);

  // Monthly Activity Trends (Visits vs Upcoming Appointments)
  const monthlyTrends = useMemo(() => {
    const monthsMap: Record<string, { monthLabel: string; visitsCount: number; upcomingCount: number }> = {};
    const today = new Date();

    for (let i = -3; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('th-TH', { month: 'short' });
      monthsMap[key] = { monthLabel, visitsCount: 0, upcomingCount: 0 };
    }

    activeVisits.forEach((v) => {
      if (v.visitDate) {
        const key = v.visitDate.slice(0, 7);
        if (monthsMap[key]) {
          monthsMap[key].visitsCount++;
        }
      }
      if (v.nextVisitDate) {
        const key = v.nextVisitDate.slice(0, 7);
        if (monthsMap[key]) {
          monthsMap[key].upcomingCount++;
        }
      }
    });

    return Object.entries(monthsMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({ key, ...data }));
  }, [activeVisits]);

  const maxMonthlyCount = useMemo(() => {
    return Math.max(...monthlyTrends.map((m) => Math.max(m.visitsCount, m.upcomingCount)), 1);
  }, [monthlyTrends]);

  // All scheduled visits
  const allScheduledVisits = useMemo(() => {
    return visits
      .filter((v) => Boolean(v.nextVisitDate))
      .map((v) => {
        const pt = patients.find((p) => p.id === v.patientId);
        return {
          id: v.id,
          patientId: v.patientId,
          date: v.nextVisitDate!,
          time: v.nextVisitTime,
          goal: v.nextVisitGoal,
          patient: pt,
          patientName: pt ? `${pt.title}${pt.firstName} ${pt.lastName}` : 'ผู้ป่วย',
          hn: pt?.hn || '',
          tambon: pt?.tambon || '',
          moo: pt?.moo || 0,
          villageName: pt?.villageName || '',
          visitorName: v.visitorName,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [visits, patients]);

  // Filtered scheduled visits based on appointmentStartDate, appointmentEndDate, and appointmentSearch
  const filteredScheduledVisits = useMemo(() => {
    return allScheduledVisits.filter((item) => {
      if (selectedTambonFilter !== 'all' && item.tambon !== selectedTambonFilter) return false;
      const itemDate = item.date.slice(0, 10);
      if (appointmentStartDate && itemDate < appointmentStartDate) return false;
      if (appointmentEndDate && itemDate > appointmentEndDate) return false;
      if (appointmentSearch) {
        const q = appointmentSearch.toLowerCase();
        const matchName = item.patientName.toLowerCase().includes(q);
        const matchHn = item.hn.toLowerCase().includes(q);
        const matchTambon = item.tambon.toLowerCase().includes(q);
        const matchGoal = (item.goal || '').toLowerCase().includes(q);
        if (!matchName && !matchHn && !matchTambon && !matchGoal) return false;
      }
      return true;
    });
  }, [allScheduledVisits, selectedTambonFilter, appointmentStartDate, appointmentEndDate, appointmentSearch]);

  // Appointments grouped by Tambon for appointment chart
  const appointmentsByTambon = useMemo(() => {
    return KHAO_CHAISON_TAMBONS.map((t) => {
      const count = filteredScheduledVisits.filter((v) => v.tambon === t.name).length;
      return {
        tambon: t.name,
        count,
        percent: filteredScheduledVisits.length > 0 ? Math.round((count / filteredScheduledVisits.length) * 100) : 0,
      };
    });
  }, [filteredScheduledVisits]);

  const maxAppointmentTambonCount = useMemo(() => {
    return Math.max(...appointmentsByTambon.map((a) => a.count), 1);
  }, [appointmentsByTambon]);

  // Appointments grouped by urgency status
  const urgencyBreakdown = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let next7DaysCount = 0;
    let next30DaysCount = 0;
    let overdueCount = 0;

    filteredScheduledVisits.forEach((v) => {
      const d = new Date(v.date);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) overdueCount++;
      else if (diffDays === 0) todayCount++;
      else if (diffDays <= 7) next7DaysCount++;
      else if (diffDays <= 30) next30DaysCount++;
    });

    return { todayCount, next7DaysCount, next30DaysCount, overdueCount };
  }, [filteredScheduledVisits]);

  // Helper for relative days
  const getRelativeDayText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'วันนี้', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (diffDays === 1) return { text: 'พรุ่งนี้', color: 'bg-teal-100 text-teal-800 border-teal-300' };
    if (diffDays > 1 && diffDays <= 7) return { text: `อีก ${diffDays} วัน`, color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (diffDays > 7) return { text: `อีก ${diffDays} วัน`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { text: `เลยนัด ${Math.abs(diffDays)} วัน`, color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const isAppointmentFilterActive = Boolean(appointmentStartDate || appointmentEndDate || appointmentSearch);

  // Donut chart constants
  const donutRadius = 52;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~326.7
  const socialDash = (mobilityCounts.social / (activePatients.length || 1)) * donutCircumference;
  const homeDash = (mobilityCounts.home / (activePatients.length || 1)) * donutCircumference;
  const bedDash = (mobilityCounts.bed / (activePatients.length || 1)) * donutCircumference;

  // Radial Adherence Gauge constants
  const gaugeRadius = 45;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~282.7
  const adherenceDash = (adherencePercent / 100) * gaugeCircumference;

  return (
    <div className="space-y-6 animate-fadeIn font-['Sarabun']">
      {/* Top Overview Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-['Prompt'] text-slate-900">
              ภาพรวมสถิติและชาร์ตวิเคราะห์: อำเภอเขาชัยสน
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            กราฟวิเคราะห์ข้อมูลผู้ป่วย การกระจายตัวตามตำบล สถิติการเยี่ยม และแผนการนัดหมายรอบถัดไป
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tambon Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedTambonFilter}
              onChange={(e) => setSelectedTambonFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกตำบล (5 ตำบล)</option>
              {KHAO_CHAISON_TAMBONS.map((t) => (
                <option key={t.name} value={t.name}>
                  ต.{t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('charts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'charts'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>โหมดชาร์ต (Charts)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>ตารางสรุป (Table)</span>
            </button>
          </div>

          {onOpenSheetsClick && (
            <button
              type="button"
              onClick={onOpenSheetsClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Sheet</span>
            </button>
          )}

          {onRegisterNewClick && (
            <button
              type="button"
              onClick={onRegisterNewClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มผู้ป่วย</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Patients */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-emerald-600" /> ผู้ป่วยในทะเบียน
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">
            {activePatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            {selectedTambonFilter === 'all' ? 'ครอบคลุมทั้ง 5 ตำบล' : `เฉพาะ ต.${selectedTambonFilter}`}
          </span>
        </div>

        {/* KPI 2: Total Visits */}
        <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-2xl border border-teal-200 shadow-2xs">
          <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5 mb-1">
            <ClipboardList className="w-4 h-4 text-teal-600" /> บันทึกการเยี่ยมสะสม
          </span>
          <div className="text-2xl sm:text-3xl font-black text-teal-950">
            {activeVisits.length} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </div>
          <span className="text-[11px] text-teal-700 mt-1 block">
            ทีมสหวิชาชีพลงพื้นที่จริง
          </span>
        </div>

        {/* KPI 3: Adherence Rate */}
        <div className="bg-gradient-to-br from-cyan-50 to-white p-4 rounded-2xl border border-cyan-200 shadow-2xs">
          <span className="text-xs font-semibold text-cyan-800 flex items-center gap-1.5 mb-1">
            <Pill className="w-4 h-4 text-cyan-600" /> ทานยาถูกต้องสม่ำเสมอ
          </span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-950">
            {adherencePercent}%
          </div>
          <span className="text-[11px] text-cyan-700 mt-1 block">
            ประเมิน {totalMedsChecked} รายการยา
          </span>
        </div>

        {/* KPI 4: Upcoming Appointments (Filterable) */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-200 shadow-2xs relative overflow-hidden">
          <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" /> การนัดหมายรอบถัดไป
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-950">
            {filteredScheduledVisits.length} <span className="text-xs font-normal text-slate-500">นัด</span>
          </div>
          <span className="text-[10px] text-amber-700 mt-1 truncate block font-medium">
            {isAppointmentFilterActive ? (
              <>
                ช่วง {appointmentStartDate ? new Date(appointmentStartDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : 'เริ่มต้น'} ถึง{' '}
                {appointmentEndDate ? new Date(appointmentEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : 'ไม่จำกัด'}
              </>
            ) : (
              `ทั้งหมด (${allScheduledVisits.length} นัดในระบบ)`
            )}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VISUAL CHARTS DASHBOARD (การแสดงเป็นชาร์ตแบบสมบูรณ์)               */}
      {/* ========================================================================= */}
      {viewMode === 'charts' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION A: Primary Distribution Charts (Tambon Bar Chart & Mobility Donut Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CHART 1: Interactive Tambon Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    ชาร์ตแท่ง: สถิติผู้ป่วยแยกตาม 5 ตำบลใน อ.เขาชัยสน
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เปรียบเทียบสัดส่วนผู้ป่วยและการลงพื้นที่ในแต่ละตำบล
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  สูงสุด {maxTambonCount} ราย
                </span>
              </div>

              {/* SVG Bar Chart */}
              <div className="py-2">
                <svg viewBox="0 0 350 170" className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="chartBarEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="chartBarHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#047857" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="25" x2="330" y2="25" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="80" x2="330" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="135" x2="330" y2="135" stroke="#e2e8f0" strokeWidth="1.5" />

                  {/* Columns */}
                  {tambonStats.map((t, idx) => {
                    const colWidth = 42;
                    const gap = 20;
                    const startX = 30 + idx * (colWidth + gap);
                    const maxHeight = 100;
                    const barHeight = Math.max((t.patientCount / maxTambonCount) * maxHeight, 6);
                    const barY = 135 - barHeight;
                    const isHovered = hoveredTambon === t.name;

                    return (
                      <g
                        key={t.name}
                        onMouseEnter={() => setHoveredTambon(t.name)}
                        onMouseLeave={() => setHoveredTambon(null)}
                        onClick={() => setSelectedTambonFilter(selectedTambonFilter === t.name ? 'all' : t.name)}
                        className="cursor-pointer transition-all duration-200"
                      >
                        {/* Bar Column */}
                        <rect
                          x={startX}
                          y={barY}
                          width={colWidth}
                          height={barHeight}
                          rx="6"
                          fill={isHovered || selectedTambonFilter === t.name ? 'url(#chartBarHover)' : 'url(#chartBarEmerald)'}
                          className="transition-all duration-200"
                        />

                        {/* Top Value Label */}
                        <text
                          x={startX + colWidth / 2}
                          y={barY - 6}
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-slate-800"
                        >
                          {t.patientCount}
                        </text>

                        {/* Bottom Label (Tambon Name) */}
                        <text
                          x={startX + colWidth / 2}
                          y="152"
                          textAnchor="middle"
                          className={`text-[10px] font-medium ${isHovered || selectedTambonFilter === t.name ? 'fill-emerald-800 font-bold' : 'fill-slate-600'}`}
                        >
                          {t.name}
                        </text>

                        {/* Village Count Badge below name */}
                        <text
                          x={startX + colWidth / 2}
                          y="164"
                          textAnchor="middle"
                          className="text-[9px] fill-slate-400"
                        >
                          {t.villagesCount} ม.
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Tambon Summary Chips */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1 text-[11px]">
                {tambonStats.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setSelectedTambonFilter(selectedTambonFilter === t.name ? 'all' : t.name)}
                    onMouseEnter={() => setHoveredTambon(t.name)}
                    onMouseLeave={() => setHoveredTambon(null)}
                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedTambonFilter === t.name || hoveredTambon === t.name
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ต.{t.name}: <strong>{t.patientCount}</strong> ({t.percent}%)
                  </button>
                ))}
              </div>
            </div>

            {/* CHART 2: Donut Chart for Mobility Status (ADL) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-teal-600" />
                    ชาร์ตโดนัท: จำแนกตามสถานะการเคลื่อนไหว (ADL)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    การคัดกรองความสามารถในการดูแลตัวเองของผู้ป่วย
                  </p>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  รวม {activePatients.length} ราย
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-2">
                {/* SVG Donut */}
                <div className="sm:col-span-6 flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                      {/* Background Track */}
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="18"
                      />

                      {/* 1. ติดสังคม (Emerald) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="18"
                        strokeDasharray={`${socialDash} ${donutCircumference}`}
                        strokeDashoffset="0"
                        className="transition-all duration-300 hover:opacity-80"
                        onMouseEnter={() => setHoveredMobility('social')}
                        onMouseLeave={() => setHoveredMobility(null)}
                      />

                      {/* 2. ติดบ้าน (Amber) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="18"
                        strokeDasharray={`${homeDash} ${donutCircumference}`}
                        strokeDashoffset={-socialDash}
                        className="transition-all duration-300 hover:opacity-80"
                        onMouseEnter={() => setHoveredMobility('home')}
                        onMouseLeave={() => setHoveredMobility(null)}
                      />

                      {/* 3. ติดเตียง (Rose) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#f43f5e"
                        strokeWidth="18"
                        strokeDasharray={`${bedDash} ${donutCircumference}`}
                        strokeDashoffset={-(socialDash + homeDash)}
                        className="transition-all duration-300 hover:opacity-80"
                        onMouseEnter={() => setHoveredMobility('bed')}
                        onMouseLeave={() => setHoveredMobility(null)}
                      />
                    </svg>

                    {/* Center Metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {activePatients.length}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        ผู้ป่วยทั้งหมด
                      </span>
                    </div>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="sm:col-span-6 space-y-2 text-xs">
                  {/* Social */}
                  <div
                    onMouseEnter={() => setHoveredMobility('social')}
                    onMouseLeave={() => setHoveredMobility(null)}
                    className={`p-2 rounded-xl border transition-all ${
                      hoveredMobility === 'social'
                        ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>ติดสังคม (เดินได้ปกติ)</span>
                      </div>
                      <span className="font-bold text-emerald-800">{mobilityCounts.social} คน</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 pl-4">
                      สัดส่วน {mobilityCounts.socialPct}%
                    </div>
                  </div>

                  {/* Home */}
                  <div
                    onMouseEnter={() => setHoveredMobility('home')}
                    onMouseLeave={() => setHoveredMobility(null)}
                    className={`p-2 rounded-xl border transition-all ${
                      hoveredMobility === 'home'
                        ? 'bg-amber-50 border-amber-300 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>ติดบ้าน (เคลื่อนไหวลำบาก)</span>
                      </div>
                      <span className="font-bold text-amber-800">{mobilityCounts.home} คน</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 pl-4">
                      สัดส่วน {mobilityCounts.homePct}%
                    </div>
                  </div>

                  {/* Bed */}
                  <div
                    onMouseEnter={() => setHoveredMobility('bed')}
                    onMouseLeave={() => setHoveredMobility(null)}
                    className={`p-2 rounded-xl border transition-all ${
                      hoveredMobility === 'bed'
                        ? 'bg-rose-50 border-rose-300 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>ติดเตียง (ต้องดูแลใกล้ชิด)</span>
                      </div>
                      <span className="font-bold text-rose-800">{mobilityCounts.bed} คน</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 pl-4">
                      สัดส่วน {mobilityCounts.bedPct}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: Clinical Charts (Chronic Diseases Ranking & Medication Adherence) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* CHART 3: Horizontal Ranking Bars for Chronic Diseases (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" />
                      ชาร์ตแท่งแนวนอน: โรคเรื้อรังที่พบบ่อย 5 อันดับแรก (NCDs)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      สถิติโรคประจำตัวของผู้ป่วยในเขต อ.เขาชัยสน
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    ความถี่สูงสุด {maxDiseaseCount} ราย
                  </span>
                </div>

                <div className="space-y-3">
                  {topDiseases.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">ยังไม่มีข้อมูลโรคเรื้อรัง</div>
                  ) : (
                    topDiseases.map((item, idx) => {
                      const barWidthPercent = Math.max((item.count / maxDiseaseCount) * 100, 10);
                      return (
                        <div key={item.disease} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span>{item.disease}</span>
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800">
                              {item.count} คน ({item.percent}%)
                            </span>
                          </div>

                          {/* Bar Track & Fill */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${barWidthPercent}%` }}
                              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* CHART 4: Medication Adherence Gauge & Clinical DRPs (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-cyan-600" />
                      ชาร์ตเกจวัด: อัตราความร่วมมือการใช้ยา (Adherence)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ดัชนีชี้วัดบริบาลเภสัชกรรม (Drug Therapy Review)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle
                        cx="60"
                        cy="60"
                        r={gaugeRadius}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={gaugeRadius}
                        fill="transparent"
                        stroke="#0891b2"
                        strokeWidth="12"
                        strokeDasharray={`${adherenceDash} ${gaugeCircumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-cyan-950 leading-none">
                        {adherencePercent}%
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-700 mt-0.5">
                        ความสม่ำเสมอ
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 w-full space-y-1.5 text-xs">
                    <div className="bg-cyan-50/70 p-2 rounded-xl border border-cyan-200 flex items-center justify-between">
                      <span className="text-cyan-900 font-medium">ทานตรงเวลาสม่ำเสมอ:</span>
                      <span className="font-bold text-cyan-900">{goodAdherence} / {totalMedsChecked} รายการ</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">พบปัญหา DRPs / ปรับยาเอง:</span>
                      <span className="font-bold text-rose-700">{totalMedsChecked - goodAdherence} รายการ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: UPCOMING APPOINTMENTS CHART & INTERACTIVE DATE FILTER */}
          {/* (ตรงภาพรวมสถิติที่เป็นจำนวนที่นัดหมายรอบถัดไป แสดงเป็นชาร์ตและเลือกวันได้) */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  ชาร์ตการนัดหมายรอบถัดไป & ตัวกรองช่วงวันที่ (Appointments Overview Chart)
                </h3>
                <p className="text-xs text-slate-500">
                  เลือกดูช่วงวันนัดหมาย วิเคราะห์การกระจายตัวตามตำบล และวางแผนลงพื้นที่ชุมชน
                </p>
              </div>

              {/* Urgency badges */}
              <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-semibold">
                  วันนี้: {urgencyBreakdown.todayCount}
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-semibold">
                  7 วันนี้: {urgencyBreakdown.next7DaysCount}
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-semibold">
                  30 วันนี้: {urgencyBreakdown.next30DaysCount}
                </span>
                {urgencyBreakdown.overdueCount > 0 && (
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> เลยกำหนด: {urgencyBreakdown.overdueCount}
                  </span>
                )}
              </div>
            </div>

            {/* Date Range Selection Controls */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-600" /> กำหนดช่วงวันที่ที่ต้องการดูข้อมูลนัดหมาย:
                </span>
                {isAppointmentFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyPreset('all');
                      setAppointmentSearch('');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">จากวันที่ (Start Date)</label>
                  <input
                    type="date"
                    value={appointmentStartDate}
                    onChange={(e) => setAppointmentStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ถึงวันที่ (End Date)</label>
                  <input
                    type="date"
                    value={appointmentEndDate}
                    onChange={(e) => setAppointmentEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ค้นหาชื่อคนไข้ / เป้าหมาย</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อ, HN หรือเป้าหมาย..."
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center flex-wrap gap-1.5 pt-1.5 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">ปุ่มลัด:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    !appointmentStartDate && !appointmentEndDate
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  ทั้งหมด ({allScheduledVisits.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('today')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('7days')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  7 วันข้างหน้า
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('30days')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  30 วันข้างหน้า
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('thisMonth')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  เดือนนี้
                </button>
              </div>
            </div>

            {/* VISUAL CHART 5: Appointments by Tambon SVG Bar Chart */}
            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  ชาร์ตแสดงการกระจายตัวของนัดหมายตามตำบล (Appointments by Tambon)
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  รวม {filteredScheduledVisits.length} รายการนัดหมาย
                </span>
              </div>

              {/* SVG Bar Chart for Appointments */}
              <div className="py-1">
                <svg viewBox="0 0 350 140" className="w-full h-36 overflow-visible">
                  <defs>
                    <linearGradient id="barGradientAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>

                  <line x1="20" y1="20" x2="330" y2="20" stroke="#fde68a" strokeDasharray="3 3" />
                  <line x1="20" y1="65" x2="330" y2="65" stroke="#fde68a" strokeDasharray="3 3" />
                  <line x1="20" y1="110" x2="330" y2="110" stroke="#fcd34d" strokeWidth="1.5" />

                  {appointmentsByTambon.map((item, idx) => {
                    const colWidth = 42;
                    const gap = 20;
                    const startX = 30 + idx * (colWidth + gap);
                    const maxHeight = 80;
                    const barHeight = Math.max((item.count / maxAppointmentTambonCount) * maxHeight, item.count > 0 ? 6 : 2);
                    const barY = 110 - barHeight;

                    return (
                      <g key={item.tambon} className="transition-all duration-200">
                        <rect
                          x={startX}
                          y={barY}
                          width={colWidth}
                          height={barHeight}
                          rx="4"
                          fill="url(#barGradientAmber)"
                        />
                        <text
                          x={startX + colWidth / 2}
                          y={barY - 5}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-amber-900"
                        >
                          {item.count}
                        </text>
                        <text
                          x={startX + colWidth / 2}
                          y="126"
                          textAnchor="middle"
                          className="text-[10px] font-medium fill-slate-700"
                        >
                          ต.{item.tambon}
                        </text>
                        <text
                          x={startX + colWidth / 2}
                          y="138"
                          textAnchor="middle"
                          className="text-[9px] fill-amber-700"
                        >
                          {item.percent}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* List of Scheduled Appointments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  รายชื่อผู้ป่วยที่มีนัดหมาย ({filteredScheduledVisits.length} รายการ)
                </span>
                <span className="text-[11px] text-slate-500">
                  คลิกที่คนไข้เพื่อดูประวัติ หรือบันทึกการเยี่ยมใหม่
                </span>
              </div>

              {filteredScheduledVisits.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600 font-semibold">ไม่พบนัดหมายในช่วงวันที่หรือตัวกรองที่เลือก</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ลองปรับเปลี่ยนช่วงวัน หรือกดปุ่ม "ทั้งหมด"
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {filteredScheduledVisits.map((item, idx) => {
                    const rel = getRelativeDayText(item.date);
                    return (
                      <div
                        key={`sched-${item.id || 'visit'}-${idx}`}
                        className="bg-white p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{item.patientName}</span>
                              {item.hn && (
                                <span className="font-mono text-[10px] text-slate-400">HN:{item.hn}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              ม.{item.moo} {item.villageName} ต.{item.tambon}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rel.color}`}>
                              {rel.text}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono mt-0.5">
                              {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                              {item.time ? ` • ${item.time}` : ''}
                            </span>
                          </div>
                        </div>

                        {item.goal && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-900">
                            <span className="font-semibold text-amber-950">เป้าหมาย: </span>
                            <span>{item.goal}</span>
                          </div>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400">
                            {item.visitorName ? `ผู้นัด: ${item.visitorName}` : 'ทีมสหวิชาชีพ'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {onSelectPatient && item.patient && (
                              <button
                                type="button"
                                onClick={() => onSelectPatient(item.patient!)}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>ดูประวัติ</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {onNewVisitClick && item.patient && (
                              <button
                                type="button"
                                onClick={() => onNewVisitClick(item.patient!)}
                                className="px-2 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                บันทึกเยี่ยม
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION D: 6-MONTH ACTIVITY TREND DUAL BAR CHART */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ชาร์ตแท่งเปรียบเทียบ: แนวโน้มการเยี่ยมบ้าน & แผนการนัดหมายรายเดือน (6 Months Trend)
                </h3>
                <p className="text-[11px] text-slate-500">
                  แสดงปริมาณงานของทีมสหวิชาชีพและการติดตามผู้ป่วยต่อเนื่องตลอด 6 เดือน
                </p>
              </div>

              {/* Dual Bar Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>เยี่ยมบ้านแล้ว (Visits)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>นัดหมายรอบถัดไป</span>
                </div>
              </div>
            </div>

            {/* SVG Trend Bars */}
            <div className="py-2">
              <svg viewBox="0 0 420 160" className="w-full h-44 overflow-visible">
                {/* Gridlines */}
                <line x1="20" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="20" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="20" y1="130" x2="400" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />

                {monthlyTrends.map((m, idx) => {
                  const groupWidth = 44;
                  const colWidth = 16;
                  const gap = 20;
                  const groupX = 35 + idx * (groupWidth + gap);
                  const maxHeight = 95;

                  const visitBarH = Math.max((m.visitsCount / maxMonthlyCount) * maxHeight, m.visitsCount > 0 ? 6 : 2);
                  const visitY = 130 - visitBarH;

                  const upcomingBarH = Math.max((m.upcomingCount / maxMonthlyCount) * maxHeight, m.upcomingCount > 0 ? 6 : 2);
                  const upcomingY = 130 - upcomingBarH;

                  return (
                    <g key={m.key} className="transition-all duration-200">
                      {/* Visit Bar (Emerald) */}
                      <rect
                        x={groupX}
                        y={visitY}
                        width={colWidth}
                        height={visitBarH}
                        rx="3"
                        fill="#059669"
                      />
                      {m.visitsCount > 0 && (
                        <text
                          x={groupX + colWidth / 2}
                          y={visitY - 4}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-emerald-800"
                        >
                          {m.visitsCount}
                        </text>
                      )}

                      {/* Upcoming Bar (Amber) */}
                      <rect
                        x={groupX + colWidth + 4}
                        y={upcomingY}
                        width={colWidth}
                        height={upcomingBarH}
                        rx="3"
                        fill="#f59e0b"
                      />
                      {m.upcomingCount > 0 && (
                        <text
                          x={groupX + colWidth + 4 + colWidth / 2}
                          y={upcomingY - 4}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-amber-800"
                        >
                          {m.upcomingCount}
                        </text>
                      )}

                      {/* Month Label */}
                      <text
                        x={groupX + colWidth + 2}
                        y="148"
                        textAnchor="middle"
                        className="text-[11px] font-semibold fill-slate-700"
                      >
                        {m.monthLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: DETAILED TABLE SUMMARY (โหมดตารางสรุปข้อมูล)                       */
        /* ========================================================================= */
        <div className="space-y-6 animate-fadeIn">
          {/* Breakdown by Tambon & Mobility Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Tambon Table */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                จำนวนผู้ป่วยแยกตามตำบลในอำเภอเขาชัยสน
              </h3>
              <div className="space-y-2">
                {tambonStats.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800">ต. {t.name}</span>
                      <span className="text-[10px] text-slate-400 block">{t.villagesCount} หมู่บ้าน • ติดเตียง {t.bedCount} คน</span>
                    </div>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {t.patientCount} คน ({t.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Mobility Status Table */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                จำแนกตามสถานะการเคลื่อนไหวของผู้ป่วย (ADL)
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-slate-700">ผู้ป่วยติดสังคม (เดินได้ปกติ)</span>
                  </div>
                  <span className="font-bold text-slate-900">{mobilityCounts.social} คน ({mobilityCounts.socialPct}%)</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="font-medium text-slate-700">ผู้ป่วยติดบ้าน (เคลื่อนไหวลำบาก)</span>
                  </div>
                  <span className="font-bold text-slate-900">{mobilityCounts.home} คน ({mobilityCounts.homePct}%)</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="font-medium text-slate-700">ผู้ป่วยติดเตียง (ช่วยเหลือตัวเองไม่ได้)</span>
                  </div>
                  <span className="font-bold text-slate-900">{mobilityCounts.bed} คน ({mobilityCounts.bedPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Diseases & Upcoming Visits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Diseases */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-600" />
                โรคเรื้อรังที่พบบ่อย (NCDs in Khao Chaison)
              </h3>
              <div className="space-y-2 text-xs">
                {topDiseases.map((item, i) => (
                  <div key={item.disease} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">{i + 1}. {item.disease}</span>
                    <span className="font-bold text-emerald-700">{item.count} คน ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Visits Table */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                สรุปการนัดหมายรอบถัดไป ({filteredScheduledVisits.length} รายการ)
              </h3>
              <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
                {filteredScheduledVisits.slice(0, 10).map((v, idx) => (
                  <div key={`sched-summary-${v.id || 'visit'}-${idx}`} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{v.patientName}</div>
                      <div className="text-[10px] text-slate-500">ม.{v.moo} ต.{v.tambon}</div>
                    </div>
                    <span className="font-mono text-emerald-800 font-semibold">
                      {new Date(v.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
