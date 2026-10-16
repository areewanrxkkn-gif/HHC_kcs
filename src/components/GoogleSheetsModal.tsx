import React, { useState, useMemo, useEffect } from 'react';
import { Patient, VisitRecord, GoogleSheetsConfig } from '../types';
import { ApiService } from '../services/api';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Code,
  Table,
  Check,
  Filter,
  User,
  Calendar,
  RotateCcw,
  Link2,
  Save,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  visits: VisitRecord[];
  sheetsConfig: GoogleSheetsConfig;
  onSaveConfig: (config: Partial<GoogleSheetsConfig>) => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  patients = [],
  visits = [],
  sheetsConfig,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'webhook' | 'script'>('preview');
  const [previewTab, setPreviewTab] = useState<'patients' | 'visits'>('patients');
  const [webhookUrl, setWebhookUrl] = useState(sheetsConfig?.webhookUrl || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(sheetsConfig?.spreadsheetUrl || '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSavedNotice, setUrlSavedNotice] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Filter States: Who (Patient by Name or HN) and Date Range
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');

  // Keep state updated when sheetsConfig prop changes
  useEffect(() => {
    if (sheetsConfig) {
      if (sheetsConfig.webhookUrl) setWebhookUrl(sheetsConfig.webhookUrl);
      if (sheetsConfig.spreadsheetUrl) setSpreadsheetUrl(sheetsConfig.spreadsheetUrl);
    }
  }, [sheetsConfig]);

  // Safe collections
  const safePatients = useMemo(() => (Array.isArray(patients) ? patients : []), [patients]);
  const safeVisits = useMemo(() => (Array.isArray(visits) ? visits : []), [visits]);

  // Normalized search query
  const trimmedSearch = patientSearchQuery.trim().toLowerCase();

  // Matched Patients based on Name or HN search query
  const matchedPatients = useMemo(() => {
    if (!trimmedSearch) return safePatients;
    return safePatients.filter((p) => {
      const hn = (p.hn || '').toLowerCase();
      const fn = (p.firstName || '').toLowerCase();
      const ln = (p.lastName || '').toLowerCase();
      const full = `${p.title || ''}${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const idCard = (p.idCard || '').toLowerCase();
      return (
        hn.includes(trimmedSearch) ||
        fn.includes(trimmedSearch) ||
        ln.includes(trimmedSearch) ||
        full.includes(trimmedSearch) ||
        idCard.includes(trimmedSearch)
      );
    });
  }, [safePatients, trimmedSearch]);

  const matchedPatientIds = useMemo(() => {
    return new Set(matchedPatients.map((p) => p.id));
  }, [matchedPatients]);

  // Preset quick handlers
  const handleApplyDatePreset = (preset: 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'last3Months' | 'thisYear') => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'all') {
      setExportStartDate('');
      setExportEndDate('');
    } else if (preset === 'today') {
      const todayStr = toYmd(today);
      setExportStartDate(todayStr);
      setExportEndDate(todayStr);
    } else if (preset === '7days') {
      const todayStr = toYmd(today);
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      setExportStartDate(todayStr);
      setExportEndDate(toYmd(next7));
    } else if (preset === '30days') {
      const todayStr = toYmd(today);
      const next30 = new Date(today);
      next30.setDate(next30.getDate() + 30);
      setExportStartDate(todayStr);
      setExportEndDate(toYmd(next30));
    } else if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setExportStartDate(toYmd(start));
      setExportEndDate(toYmd(end));
    } else if (preset === 'last3Months') {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      setExportStartDate(toYmd(start));
      setExportEndDate(toYmd(today));
    } else if (preset === 'thisYear') {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      setExportStartDate(toYmd(start));
      setExportEndDate(toYmd(end));
    }
  };

  // Filtered Visits based on patient search and date range
  const filteredVisits = useMemo(() => {
    return safeVisits.filter((v) => {
      if (trimmedSearch && !matchedPatientIds.has(v.patientId)) return false;
      const vDate = v.visitDate ? v.visitDate.slice(0, 10) : '';
      if (exportStartDate && vDate && vDate < exportStartDate) return false;
      if (exportEndDate && vDate && vDate > exportEndDate) return false;
      return true;
    });
  }, [safeVisits, trimmedSearch, matchedPatientIds, exportStartDate, exportEndDate]);

  // Filtered Patients based on patient search and date range
  const filteredPatients = useMemo(() => {
    if (exportStartDate || exportEndDate) {
      const patientIdsWithVisits = new Set(filteredVisits.map((v) => v.patientId));
      return matchedPatients.filter((p) => {
        const pDate = p.createdAt ? p.createdAt.slice(0, 10) : '';
        const inCreatedRange = (!exportStartDate || pDate >= exportStartDate) && (!exportEndDate || pDate <= exportEndDate);
        return inCreatedRange || patientIdsWithVisits.has(p.id);
      });
    }
    return matchedPatients;
  }, [matchedPatients, exportStartDate, exportEndDate, filteredVisits]);

  // Copy Tab-separated data to clipboard
  const handleCopyTsv = (type: 'patients' | 'visits') => {
    try {
      const tsv = ApiService.formatTsvForGoogleSheets(type, filteredPatients, filteredVisits);
      navigator.clipboard.writeText(tsv);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy TSV:', err);
    }
  };

  // Save Spreadsheet URL
  const handleSaveSpreadsheetUrl = async () => {
    setSavingUrl(true);
    try {
      await onSaveConfig({ spreadsheetUrl, webhookUrl });
      setUrlSavedNotice(true);
      setTimeout(() => setUrlSavedNotice(false), 3000);
    } catch (err) {
      console.error('Error saving spreadsheet URL:', err);
    } finally {
      setSavingUrl(false);
    }
  };

  // Client-side CSV Download with UTF-8 BOM
  const handleDownloadCsvClient = (type: 'patients' | 'visits') => {
    try {
      const BOM = '\uFEFF';
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let filename = '';

      if (type === 'patients') {
        const suffix = trimmedSearch ? `search_${trimmedSearch.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}` : 'all';
        filename = `KhaoChaison_Patients_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = [
          'ID', 'HN', 'เลขบัตรประชาชน', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'เพศ',
          'วันเกิด', 'อายุ(ปี)', 'เบอร์โทร', 'บ้านเลขที่', 'หมู่ที่', 'ชื่อหมู่บ้าน',
          'ตำบล', 'อำเภอ', 'จังหวัด', 'สิทธิการรักษา', 'โรคประจำตัว', 'ประวัติแพ้ยา',
          'ชื่อผู้ดูแล', 'เบอร์โทรผู้ดูแล', 'สถานะการเคลื่อนไหว', 'วันที่ลงทะเบียน'
        ];
        rows = filteredPatients.map((p) => [
          p.id || '',
          p.hn || '',
          p.idCard || '',
          p.title || '',
          p.firstName || '',
          p.lastName || '',
          p.gender || '',
          p.birthDate || '',
          p.ageYears || 0,
          p.tel || '',
          p.houseNo || '',
          p.moo || 0,
          p.villageName || '',
          p.tambon || '',
          p.amphoe || '',
          p.province || '',
          p.healthCoverage || '',
          [...(p.chronicDiseases || []), p.chronicDiseasesOther].filter(Boolean).join('; '),
          (p.drugAllergies || []).map((a) => `${a.drugName}(${a.reaction})`).join('; ') || 'ไม่มีประวัติแพ้ยา',
          p.caregiver?.name || '',
          p.caregiver?.tel || '',
          p.patientStatus || '',
          p.createdAt || ''
        ]);
      } else {
        const suffix = trimmedSearch ? `search_${trimmedSearch.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}` : 'all';
        filename = `KhaoChaison_Visits_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = [
          'Visit ID', 'Patient ID', 'ชื่อ-นามสกุลผู้ป่วย', 'ครั้งที่เยี่ยม', 'วันเวลาที่เยี่ยม',
          'ผู้เยี่ยม', 'วิชาชีพ', 'ทีมร่วมเยี่ยม', 'BP บน/ล่าง', 'Pulse', 'Temp', 'RR',
          'DTX (mg/dL)', 'SpO2 (%)', 'น้ำหนัก (kg)', 'BMI', 'Pain Score (1-10)', 'ตำแหน่งปวด',
          'S (Subjective)', 'O (Objective)', 'A (Assessment)', 'P (Plan)',
          'IFEE (Ideas)', 'IFEE (Feelings)', 'IFEE (Expectations)', 'IFEE (Effects)',
          'IN HOME SSS (Medication)', 'รายการยาที่ประเมิน', 'คำแนะนำทางเภสัชกรรม',
          'ปัญหา DRP ที่ตรวจพบ (10 หมวดหมู่)',
          'วันนัดเยี่ยมรอบหน้า', 'เป้าหมายการติดตามรอบหน้า'
        ];
        rows = filteredVisits.map((v) => {
          const patient = safePatients.find((p) => p.id === v.patientId);
          const patientName = patient ? `${patient.title}${patient.firstName} ${patient.lastName}` : v.patientId;
          const medsStr = (v.medications || [])
            .map((m) => `${m?.name || 'ยา'} [${m?.dose || ''} ${m?.frequency || ''}] - ${m?.adherence || ''}`)
            .join(' | ');
          const drpStr = (v.drpItems || [])
            .map((d) => `[${d.category === 'อื่น ๆ เพิ่มเติม' && d.otherCategory ? d.otherCategory : d.category}] ยา: ${d.drugName || '-'} (สถานะ: ${d.status || '-'}) ${d.description ? `ปัญหา: ${d.description}` : ''} ${d.intervention ? `แก้ไข: ${d.intervention}` : ''}`)
            .join(' || ');

          return [
            v.id || '',
            v.patientId || '',
            patientName,
            `Visit ${v.visitNumber || 1}`,
            v.visitDate || '',
            v.visitorName || '',
            v.visitorRole || '',
            v.coVisitors || '',
            v.bpSys ? `${v.bpSys}/${v.bpDia || ''}` : '',
            v.pulse || '',
            v.temp || '',
            v.rr || '',
            v.dtx || '',
            v.spo2 || '',
            v.weight || '',
            v.bmi || '',
            v.painScore !== undefined ? v.painScore : '',
            v.painLocation || '',
            v.subjective || '',
            v.objective || '',
            v.assessment || '',
            v.plan || '',
            v.ifeeIdeas || '',
            v.ifeeFeelings || '',
            v.ifeeExpectations || '',
            v.ifeeEffects || '',
            v.inhomeMedication || '',
            medsStr,
            v.pharmacistAdvice || '',
            drpStr,
            v.nextVisitDate || '',
            v.nextVisitGoal || ''
          ];
        });
      }

      const csvContent =
        BOM +
        [
          headers.map((h) => `"${h}"`).join(','),
          ...rows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
        ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading CSV:', err);
    }
  };

  // Trigger Google Sheet Webhook Sync
  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      await onSaveConfig({ webhookUrl, spreadsheetUrl });
      const res = await ApiService.triggerSheetsSync(webhookUrl, filteredPatients, filteredVisits);
      setSyncResult({
        success: res.success,
        message: res.message || 'ส่งข้อมูลไปยัง Google Sheets เรียบร้อยแล้ว',
      });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  const isFilterActive = Boolean(trimmedSearch) || Boolean(exportStartDate) || Boolean(exportEndDate);

  const sampleAppsScriptCode = `// --- Google Apps Script for Khao Chaison Community Visits ---
// 1. ใน Google Sheet ให้ไปที่เมนู Extensions > Apps Script
// 2. ลบโค้ดเดิมแล้ววางโค้ดนี้ลงไป
// 3. กด Deploy > New Deployment > เลือก Web App
// 4. Who has access: "Anyone"
// 5. คัดลอก Web App URL มาใส่ในระบบเยี่ยมบ้าน

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ชีตทะเบียนผู้ป่วย
    var ptSheet = ss.getSheetByName("ทะเบียนผู้ป่วย_เขาชัยสน");
    if (!ptSheet) {
      ptSheet = ss.insertSheet("ทะเบียนผู้ป่วย_เขาชัยสน");
      ptSheet.appendRow(["HN", "เลขบัตรประชาชน", "ชื่อ-สกุล", "เพศ", "วันเกิด", "อายุ", "ตำบล", "หมู่ที่", "ชื่อหมู่บ้าน", "โรคประจำตัว", "ประวัติแพ้ยา", "ผู้ดูแล", "เบอร์โทร", "สถานะ"]);
    }
    if (data.patients && data.patients.length > 0) {
      var lastRow = ptSheet.getLastRow();
      if (lastRow > 1) ptSheet.getRange(2, 1, lastRow - 1, 14).clearContent();
      
      var ptRows = data.patients.map(function(p) {
        return [
          p.hn, p.idCard, p.title + p.firstName + " " + p.lastName,
          p.gender, p.birthDate, p.ageYears + " ปี",
          p.tambon, p.moo, p.villageName,
          (p.chronicDiseases || []).join(", "),
          (p.drugAllergies && p.drugAllergies.length > 0) ? p.drugAllergies.map(function(a){return a.drugName;}).join(", ") : "ไม่มี",
          p.caregiver ? p.caregiver.name : "",
          p.tel, p.patientStatus
        ];
      });
      ptSheet.getRange(2, 1, ptRows.length, 14).setValues(ptRows);
    }

    // 2. ชีตบันทึกการเยี่ยมบ้าน
    var vSheet = ss.getSheetByName("บันทึกการเยี่ยมบ้าน_Visits");
    if (!vSheet) {
      vSheet = ss.insertSheet("บันทึกการเยี่ยมบ้าน_Visits");
      vSheet.appendRow(["Visit ID", "ผู้ป่วย", "ครั้งที่", "วันเวลาที่เยี่ยม", "ผู้เยี่ยม", "BP", "Pulse", "DTX", "Pain", "Subjective", "Objective", "Assessment", "Plan", "คำแนะนำเภสัชกร", "นัดครั้งถัดไป"]);
    }
    if (data.visits && data.visits.length > 0) {
      var lastVRow = vSheet.getLastRow();
      if (lastVRow > 1) vSheet.getRange(2, 1, lastVRow - 1, 15).clearContent();

      var vRows = data.visits.map(function(v) {
        return [
          v.id, v.patientId, "ครั้งที่ " + v.visitNumber, v.visitDate,
          v.visitorName, (v.bpSys ? v.bpSys + "/" + v.bpDia : ""),
          v.pulse || "", v.dtx || "", (v.painScore !== undefined ? v.painScore + "/10" : ""),
          v.subjective, v.objective, v.assessment, v.plan,
          v.pharmacistAdvice || "", v.nextVisitDate || ""
        ];
      });
      vSheet.getRange(2, 1, vRows.length, 15).setValues(vRows);
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-['Sarabun']">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-emerald-100 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Prompt']">
                  Google Sheets Integration & Export Hub
                </h2>
                <span className="bg-emerald-600 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-mono">
                  Cloud Link
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                เชื่อมโยง ซิงค์ และส่งออกข้อมูลผู้ป่วยและการเยี่ยมบ้าน อ.เขาชัยสน สู่ Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Open Google Sheets Button */}
            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-500/60 shadow-xs transition-colors"
                title="เปิดสเปรดชีต Google Sheet ในแท็บใหม่"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>เปิด Google Sheet ของคุณ</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>
            ) : (
              <a
                href="https://sheet.new"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 rounded-xl text-xs font-medium border border-emerald-500/40 shadow-xs transition-colors"
                title="เปิด Google Sheets ใหม่ (sheet.new)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                <span>สร้าง Sheet ใหม่</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Link Banner */}
        <div className="bg-emerald-900/90 text-emerald-100 px-6 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60">
          <div className="flex items-center gap-2 flex-1">
            <Link2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span className="font-semibold text-white whitespace-nowrap">ลิงก์ Google Sheet:</span>
            <input
              type="url"
              placeholder="วาง URL สเปรดชีต Google Sheets ที่นี่ (https://docs.google.com/spreadsheets/d/...)"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="bg-emerald-950/60 border border-emerald-600/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-emerald-300/50 w-full max-w-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              disabled={savingUrl}
              onClick={handleSaveSpreadsheetUrl}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              <span>{savingUrl ? 'กำลังบันทึก...' : 'บันทึกลิงก์'}</span>
            </button>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
              >
                <span>เปิดชีต</span>
                <ExternalLink className="w-3 h-3 text-emerald-700" />
              </a>
            )}

            {urlSavedNotice && (
              <span className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> บันทึกแล้ว!
              </span>
            )}
          </div>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>ดูตารางตัวอย่าง & ส่งออก</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webhook')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'webhook'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ซิงค์อัตโนมัติ (Apps Script Webhook)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>โค้ดสคริปต์ Google Apps Script</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadCsvClient('patients')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all hover:scale-102 shadow-2xs cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV ทะเบียนผู้ป่วยตามตัวกรองที่เลือก"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>โหลด CSV ผู้ป่วย ({filteredPatients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadCsvClient('visits')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all hover:scale-102 shadow-2xs cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV บันทึกการเยี่ยมตามตัวกรองที่เลือก"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>โหลด CSV Visits ({filteredVisits.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Universal Filter Bar: Select Patient & Select Date Range */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">
                  ตัวกรองข้อมูลสำหรับส่งออก (Export Filters):
                </span>
                {isFilterActive && (
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    กำลังใช้งานตัวกรอง
                  </span>
                )}
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientSearchQuery('');
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              {/* 1. ค้นหา / กรองตามชื่อ หรือ HN ผู้ป่วย */}
              <div className="md:col-span-5 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> กรองผู้ป่วย (กรอกชื่อ หรือ HN):
                  </span>
                  {trimmedSearch && (
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      พบ {matchedPatients.length} ราย
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อ นามสกุล หรือเลข HN (เช่น 6200142, พร้อม)..."
                    list="patient-search-datalist"
                    className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {patientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPatientSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="ล้างข้อความค้นหา"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="patient-search-datalist">
                    {safePatients.map((p, idx) => (
                      <option
                        key={`datalist-p-${p.id || 'idx'}-${idx}`}
                        value={p.hn}
                      >
                        {p.title}{p.firstName} {p.lastName} (ต.{p.tambon})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Search result indicator / Quick suggestions */}
                {trimmedSearch ? (
                  matchedPatients.length === 0 ? (
                    <p className="text-[11px] text-rose-600 font-medium">
                      ⚠️ ไม่พบผู้ป่วยที่มีชื่อ หรือ HN ตรงกับ &ldquo;{patientSearchQuery}&rdquo;
                    </p>
                  ) : matchedPatients.length === 1 ? (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 truncate">
                      <span>✓ กรองเฉพาะ:</span>
                      <span>
                        {matchedPatients[0].title}{matchedPatients[0].firstName} {matchedPatients[0].lastName} (HN: {matchedPatients[0].hn} - ต.{matchedPatients[0].tambon})
                      </span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-500">ตรงกับ:</span>
                      {matchedPatients.slice(0, 3).map((p, idx) => (
                        <button
                          key={`match-chip-${p.id || 'idx'}-${idx}`}
                          type="button"
                          onClick={() => setPatientSearchQuery(p.hn)}
                          className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full text-[10px] font-medium transition-colors cursor-pointer"
                          title={`คลิกเลือก HN ${p.hn}`}
                        >
                          {p.firstName} (HN {p.hn})
                        </button>
                      ))}
                      {matchedPatients.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{matchedPatients.length - 3} ราย</span>
                      )}
                    </div>
                  )
                ) : (
                  <p className="text-[10px] text-slate-400">
                    พิมพ์ชื่อผู้ป่วย หรือ HN เพื่อกรอง (เว้นว่าง = รวมทุกคน {safePatients.length} ราย)
                  </p>
                )}
              </div>

              {/* 2. เลือกช่วงวันที่ (Date Range) */}
              <div className="md:col-span-7 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> เลือกช่วงวันที่ (วันเยี่ยม / บันทึก):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">เลือกวันเริ่มต้นและสิ้นสุด</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    title="จากวันที่"
                  />
                  <span className="text-slate-400 text-xs">ถึง</span>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    title="ถึงวันที่"
                  />
                </div>
                {/* Quick Date Presets */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">ช่วงลัด:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      !exportStartDate && !exportEndDate
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ทุกช่วงเวลา
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('today')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('7days')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    7 วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('30days')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    30 วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('thisMonth')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    เดือนนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('last3Months')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    3 เดือนย้อนหลัง
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset('thisYear')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    ปีนี้
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: Preview & Copy to Clipboard */}
          {activeTab === 'preview' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900">เลือกมุมมองชีต:</span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('patients')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        previewTab === 'patients'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      ทะเบียนผู้ป่วย ({filteredPatients.length} ราย)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('visits')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        previewTab === 'visits'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      บันทึกการเยี่ยมบ้าน ({filteredVisits.length} Visits)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyTsv(previewTab)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    {copiedType === previewTab ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>คัดลอกลง Clipboard สำเร็จ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>คัดลอกข้อมูลไปวางใน Google Sheets (Ctrl+V)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SpreadSheet-like Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 flex items-center justify-between border-b border-slate-200">
                  <span>ตัวอย่างข้อมูล Google Sheet: {previewTab === 'patients' ? 'ทะเบียนผู้ป่วย_เขาชัยสน' : 'บันทึกการเยี่ยมบ้าน_Visits'}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    พบ {previewTab === 'patients' ? filteredPatients.length : filteredVisits.length} รายการ (ตามตัวกรอง)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  {previewTab === 'patients' ? (
                    filteredPatients.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        ไม่พบข้อมูลผู้ป่วยที่ตรงกับเงื่อนไขตัวกรอง
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-emerald-800 text-white sticky top-0">
                          <tr>
                            <th className="p-2.5 border-r border-emerald-700">HN</th>
                            <th className="p-2.5 border-r border-emerald-700">ชื่อ - สกุล</th>
                            <th className="p-2.5 border-r border-emerald-700">อายุ</th>
                            <th className="p-2.5 border-r border-emerald-700">ที่อยู่ (เขาชัยสน)</th>
                            <th className="p-2.5 border-r border-emerald-700">สิทธิ</th>
                            <th className="p-2.5 border-r border-emerald-700">โรคประจำตัว</th>
                            <th className="p-2.5 border-r border-emerald-700">ประวัติแพ้ยา</th>
                            <th className="p-2.5">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredPatients.map((p, idx) => (
                            <tr key={`patient-row-${p.id || 'idx'}-${idx}`} className="hover:bg-slate-50 font-mono text-[11px]">
                              <td className="p-2.5 font-bold text-emerald-800">{p.hn}</td>
                              <td className="p-2.5 font-sans font-semibold text-slate-800">{p.title}{p.firstName} {p.lastName}</td>
                              <td className="p-2.5 font-sans">{p.ageYears} ปี</td>
                              <td className="p-2.5 font-sans">ม.{p.moo} {p.villageName} ต.{p.tambon}</td>
                              <td className="p-2.5 font-sans">{p.healthCoverage}</td>
                              <td className="p-2.5 font-sans">{(p.chronicDiseases || []).join(', ')}</td>
                              <td className="p-2.5 font-sans text-rose-700 font-semibold">
                                {(p.drugAllergies || []).map((a) => a.drugName).join(', ') || 'ไม่มี'}
                              </td>
                              <td className="p-2.5 font-sans">{p.patientStatus ? p.patientStatus.split(' ')[0] : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    filteredVisits.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        ไม่พบบันทึกการเยี่ยมที่ตรงกับเงื่อนไขตัวกรอง
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-emerald-800 text-white sticky top-0">
                          <tr>
                            <th className="p-2.5 border-r border-emerald-700">Visit</th>
                            <th className="p-2.5 border-r border-emerald-700">ผู้ป่วย</th>
                            <th className="p-2.5 border-r border-emerald-700">วันเวลา</th>
                            <th className="p-2.5 border-r border-emerald-700">ผู้เยี่ยม</th>
                            <th className="p-2.5 border-r border-emerald-700">BP / Pulse</th>
                            <th className="p-2.5 border-r border-emerald-700">DTX</th>
                            <th className="p-2.5 border-r border-emerald-700">Pain</th>
                            <th className="p-2.5 border-r border-emerald-700">DRP ที่ตรวจพบ (10 หมวด)</th>
                            <th className="p-2.5 border-r border-emerald-700">Assessment</th>
                            <th className="p-2.5">นัดครั้งต่อไป</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredVisits.map((v, idx) => {
                            const pt = safePatients.find((p) => p.id === v.patientId);
                            return (
                              <tr key={`visit-row-${v.id || 'idx'}-${idx}`} className="hover:bg-slate-50 text-[11px]">
                                <td className="p-2.5 font-bold text-emerald-800 font-mono">V{v.visitNumber || 1}</td>
                                <td className="p-2.5 font-semibold text-slate-800">
                                  {pt ? `${pt.title}${pt.firstName} ${pt.lastName}` : v.patientId}
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono">
                                  {v.visitDate ? new Date(v.visitDate).toLocaleDateString('th-TH') : '-'}
                                </td>
                                <td className="p-2.5">{v.visitorName || '-'}</td>
                                <td className="p-2.5 font-bold font-mono">{v.bpSys ? `${v.bpSys}/${v.bpDia || ''}` : '-'}</td>
                                <td className="p-2.5 font-mono text-emerald-700">{v.dtx || '-'}</td>
                                <td className="p-2.5">{v.painScore !== undefined ? `${v.painScore}/10` : '-'}</td>
                                <td className="p-2.5 max-w-xs">
                                  {v.drpItems && v.drpItems.length > 0 ? (
                                    <div className="space-y-0.5">
                                      {v.drpItems.map((d, di) => (
                                        <div key={di} className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                                          <b>{d.category.split(' ')[0]}:</b> {d.drugName ? `${d.drugName} ` : ''}({d.status || 'ติดตาม'})
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">ไม่พบ DRP</span>
                                  )}
                                </td>
                                <td className="p-2.5 max-w-xs truncate">{v.assessment || '-'}</td>
                                <td className="p-2.5 font-medium text-emerald-800">{v.nextVisitDate || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Webhook Sync */}
          {activeTab === 'webhook' && (
            <div className="space-y-4 animate-fadeIn max-w-2xl mx-auto">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-700" />
                  เชื่อมต่อ Google Apps Script Webhook
                </h3>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  นำ Web App URL ที่ได้จากการ Deploy Google Apps Script ใน Google Sheets มาวางที่นี่
                  ระบบจะทำการส่งข้อมูลผู้ป่วยและ Visit ทั้งหมดไปอัปเดตบนชีตของคุณแบบเรียลไทม์
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {syncResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncResult.success
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{syncResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleTriggerSync}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'กำลังซิงค์ข้อมูล...' : 'บันทึก & ซิงค์ไป Google Sheet เดี๋ยวนี้'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Apps Script Code */}
          {activeTab === 'script' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">โค้ด Google Apps Script สำเร็จรูป</h3>
                  <p className="text-xs text-slate-500">
                    คัดลอกโค้ดนี้ไปวางใน Google Sheet ของคุณ (Extensions &gt; Apps Script) แล้วกด Deploy เป็น Web App
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sampleAppsScriptCode);
                    setCopiedType('script');
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedType === 'script' ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {sampleAppsScriptCode}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span>ข้อมูลพร้อมใช้งานร่วมกับ Google Sheets ทุกบัญชี</span>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-0.5"
              >
                <span>เปิดสเปรดชีตของคุณ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 font-medium cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
