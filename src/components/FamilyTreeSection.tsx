import React, { useState, useRef, useEffect } from 'react';
import { Patient } from '../types';
import {
  GitFork,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Clipboard,
  Calendar,
  Save,
  RotateCw,
} from 'lucide-react';

interface FamilyTreeSectionProps {
  patient: Patient;
  onUpdatePatientFamilyTree: (
    familyTreePhoto: string | undefined,
    familyTreeNotes: string | undefined
  ) => Promise<void>;
}

const EXTERNAL_FAMILY_TREE_URL = 'https://sites.google.com/view/rxlabel/family-tree';

export const FamilyTreeSection: React.FC<FamilyTreeSectionProps> = ({
  patient,
  onUpdatePatientFamilyTree,
}) => {
  const [photo, setPhoto] = useState<string | undefined>(patient.familyTreePhoto);
  const [notes, setNotes] = useState<string>(patient.familyTreeNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Viewer state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Keep state synced if patient changes
  useEffect(() => {
    setPhoto(patient.familyTreePhoto);
    setNotes(patient.familyTreeNotes || '');
    setZoomLevel(1);
  }, [patient.id, patient.familyTreePhoto, patient.familyTreeNotes]);

  // Support direct clipboard paste (Ctrl + V / Cmd + V) of screenshots!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process and compress image to fit cleanly in Firestore and stay crisp
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSaveError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        // High quality max resolution for readable family tree text and symbols
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
          // Fill white background for clean transparency handling
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhoto(compressed);
          setSaveSuccess(false);
          setSaveError(null);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onUpdatePatientFamilyTree(photo, notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'บันทึกข้อมูลผังครอบครัวไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setShowDeletePhotoConfirm(true);
  };

  const confirmRemovePhoto = () => {
    setPhoto(undefined);
    setSaveSuccess(false);
    setShowDeletePhotoConfirm(false);
  };

  const handleDownload = () => {
    if (!photo) return;
    const a = document.createElement('a');
    a.href = photo;
    a.download = `FamilyTree_${patient.hn}_${patient.firstName}_${patient.lastName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header and External Link Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/70 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-100">
              <GitFork className="w-3.5 h-3.5 text-emerald-300" />
              <span>ผังเครือญาติและเครื่องมือ (PCU Tools)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Prompt'] text-white">
              ผังครอบครัว (PCU Tools): {patient.title}{patient.firstName} {patient.lastName} (HN: {patient.hn})
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-light">
              จัดทำแผนผังเครือญาติ 3 รุ่น เพื่อวิเคราะห์ประวัติโรคเรื้อรังที่ถ่ายทอดทางพันธุกรรม ปัจจัยด้านสุขภาพ
              และความสัมพันธ์ของสมาชิกในครอบครัว
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            {/* Direct Link to Google Sites Family Tree Tool */}
            <a
              href={EXTERNAL_FAMILY_TREE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-900" />
              <span>เปิดระบบ PCU Tools (Google Sites)</span>
            </a>
          </div>
        </div>

        {/* 3 Step Instruction Guide */}
        <div className="mt-5 pt-4 border-t border-emerald-700/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-semibold text-emerald-100">เปิดเว็บไซต์ PCU Tools</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                คลิกปุ่มสีเหลืองด้านบนเพื่อเข้าสู่เว็บสร้างผัง PCU Tools (Google Sites)
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-semibold text-emerald-100">สร้างผัง & บันทึกรูป</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                ลากสร้างผังเครือญาติ แล้วกดปุ่มบันทึกรูป หรือกด PrintScreen / Snipping Tool
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-semibold text-emerald-100">นำรูปมาใส่ในระบบนี้</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                อัปโหลดไฟล์รูป หรือกด <kbd className="bg-emerald-800 px-1 rounded text-[10px]">Ctrl+V</kbd> เพื่อวางรูปทันที
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: PCU Tools Image Canvas & Controls (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Prompt']">
                  รูปภาพผังเครือญาติ (PCU Tools Diagram)
                </h3>
              </div>

              {photo && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="ย่อขนาด"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-600 px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="ขยายขนาด"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="รีเซ็ตขนาด 100%"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                    title="ดูเต็มจอ"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg border border-teal-200"
                    title="ดาวน์โหลดรูป"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemovePhoto}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 ml-1"
                    title="ลบรูปภาพ PCU Tools"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Display or Dropzone */}
            {photo ? (
              <div className="space-y-3">
                <div
                  className="w-full bg-slate-950/5 rounded-2xl border border-slate-200 overflow-auto max-h-[520px] p-2 flex items-center justify-center relative select-none"
                  style={{ minHeight: '340px' }}
                >
                  <img
                    src={photo}
                    alt={`PCU Tools diagram of ${patient.firstName} ${patient.lastName}`}
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="rounded-xl shadow-xs transition-transform duration-150 max-w-full h-auto cursor-zoom-in"
                    onClick={() => setIsFullscreen(true)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      มีไฟล์รูปภาพ PCU Tools แล้ว
                    </span>
                    {patient.familyTreeUpdatedAt && (
                      <span className="text-slate-400">
                        • ปรับปรุงล่าสุด: {new Date(patient.familyTreeUpdatedAt).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูปภาพใหม่</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full min-h-[340px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                  <Upload className="w-8 h-8 stroke-[1.8]" />
                </div>
                <h4 className="text-base font-bold text-slate-800 font-['Prompt']">
                  คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  รองรับไฟล์รูปภาพ JPG, PNG, WebP หรือสามารถกด <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-mono text-slate-700 font-bold shadow-2xs">Ctrl + V</kbd> เพื่อวางรูปภาพจากการจับหน้าจอได้โดยตรง
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์รูปภาพจากเครื่อง</span>
                  </button>

                  <a
                    href={EXTERNAL_FAMILY_TREE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-all shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ไปยัง Google Sites (PCU Tools)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Family Clinical Notes & Save Actions (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>บันทึกประวัติสุขภาพครอบครัว & พันธุกรรม</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ประวัติโรคทางพันธุกรรม & ข้อมูลสมาชิกในครอบครัว
              </label>
              <textarea
                rows={9}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น:
- บิดา: เสียชีวิตจากโรคหลอดเลือดสมอง (Stroke) เมื่ออายุ 65 ปี
- มารดา: มีโรคเบาหวานและความดันโลหิตสูง ปัจจุบันอายุ 82 ปี อาศัยอยู่ด้วยกัน
- พี่น้อง 3 คน: พี่ชายคนโตเป็น DM type 2, ผู้ป่วยเป็นคนกลาง, น้องสาวสุขภาพปกติ
- บุตร 2 คน: บุตรสาวคนโตเป็นผู้ดูแลหลัก ทำงานใกล้บ้าน
- ข้อสังเกต: มีประวัติเบาหวานและความดันโลหิตสูงสายตรง ควรเฝ้าระวังพฤติกรรมการบริโภคในครอบครัว"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>

            {/* Status alerts */}
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>บันทึกข้อมูล PCU Tools เรียบร้อยแล้ว</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Action Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-101 active:scale-99 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูล PCU Tools (Save)'}</span>
            </button>

            <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 space-y-1">
              <p>💡 <b>เคล็ดลับการใช้งาน:</b></p>
              <p>1. หากเปิดเว็บไซต์ Google Sites บนคอมพิวเตอร์ สามารถใช้ปุ่ม Print Screen หรือ Snipping Tool แคปภาพจาก PCU Tools / ผังครอบครัว แล้วคลิกที่หน้านี้กด <b>Ctrl + V</b> เพื่อวางรูปได้ทันที</p>
              <p>2. รูปภาพ PCU Tools จะถูกซิงก์ขึ้น Firebase Firestore ทันที เจ้าหน้าที่ทุกคนในทีมสามารถเปิดดูจากมือถือหรือแท็บเล็ตได้ตรงกัน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {isFullscreen && photo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-4 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm sm:text-base font-['Prompt']">
                ผังครอบครัว (PCU Tools): {patient.title}{patient.firstName} {patient.lastName} (HN: {patient.hn})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดรูป</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img
              src={photo}
              alt="PCU Tools fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Delete Photo In-app Confirm Modal */}
      {showDeletePhotoConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-slate-800 space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 font-['Prompt']">
                ยืนยันการลบรูปภาพ?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการลบรูปภาพผังเครือญาติ / PCU Tools ของ <b className="text-slate-900">{patient.firstName} {patient.lastName}</b> ใช่หรือไม่?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeletePhotoConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmRemovePhoto}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-700/20 transition-all cursor-pointer"
              >
                ยืนยันลบรูป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
