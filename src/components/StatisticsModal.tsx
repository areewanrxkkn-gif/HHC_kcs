import React from 'react';
import { Patient, VisitRecord } from '../types';
import { X, BarChart3 } from 'lucide-react';
import { OverviewChartsDashboard } from './OverviewChartsDashboard';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  visits: VisitRecord[];
  onSelectPatient?: (patient: Patient) => void;
  onNewVisitClick?: (patient: Patient) => void;
  onRegisterNewClick?: () => void;
  onOpenSheetsClick?: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  patients,
  visits,
  onSelectPatient,
  onNewVisitClick,
  onRegisterNewClick,
  onOpenSheetsClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-['Sarabun']">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt']">
                ภาพรวมสถิติและชาร์ตวิเคราะห์: อำเภอเขาชัยสน
              </h2>
              <p className="text-xs text-emerald-200">
                ข้อมูลสรุปเชิงพื้นที่ กราฟแสดงสถิติประชากร การเคลื่อนไหว และแผนการนัดหมายรอบถัดไป
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่างภาพรวมสถิติ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <OverviewChartsDashboard
            patients={patients}
            visits={visits}
            onSelectPatient={(p) => {
              onClose();
              onSelectPatient?.(p);
            }}
            onNewVisitClick={(p) => {
              onClose();
              onNewVisitClick?.(p);
            }}
            onRegisterNewClick={() => {
              onClose();
              onRegisterNewClick?.();
            }}
            onOpenSheetsClick={() => {
              onClose();
              onOpenSheetsClick?.();
            }}
          />
        </div>
      </div>
    </div>
  );
};
