import React from 'react';
import { User } from '../types';
import {
  HeartPulse,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Wifi,
  Sparkles,
  MapPin,
  Home,
  LogOut,
  GitFork,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenSheetsModal: () => void;
  onOpenRoleModal: () => void;
  onOpenAuthModal: () => void;
  onOpenStatsModal: () => void;
  onHomeClick: () => void;
  onBackToLanding?: () => void;
  onLogout?: () => void;
  patientCount: number;
  visitCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenSheetsModal,
  onOpenRoleModal,
  onOpenAuthModal,
  onOpenStatsModal,
  onHomeClick,
  onBackToLanding,
  onLogout,
  patientCount,
  visitCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-700/60 w-full max-w-full overflow-hidden">
      {/* Top micro-bar */}
      <div className="bg-emerald-950/40 text-emerald-200 text-xs px-3 sm:px-4 py-1 flex items-center justify-between border-b border-emerald-700/30 gap-2 w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <span className="flex items-center gap-1 font-medium truncate text-[11px] sm:text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">เครือข่ายบริการสุขภาพ อ.เขาชัยสน จ.พัทลุง</span>
          </span>
          <span className="hidden xl:inline-block text-emerald-400/60">•</span>
          <span className="hidden xl:inline-flex items-center gap-1 text-emerald-300 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-300" /> ลงพื้นที่ดูแลสุขภาพชุมชน
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] text-emerald-100 shrink-0">
            <Wifi className="w-3 h-3 text-emerald-300 animate-pulse shrink-0" />
            <span className="hidden sm:inline">คลาวด์ซิงค์เรียลไทม์</span>
          </span>
          <span className="text-[10px] sm:text-[11px] text-emerald-300/80 hidden md:inline shrink-0">
            ผู้ป่วย: {patientCount} | เยี่ยม: {visitCount} ครั้ง
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 w-full overflow-hidden">
        {/* Brand */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none min-w-0 shrink"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 sm:p-2 shadow-inner flex items-center justify-center text-white ring-2 ring-emerald-300/30 group-hover:scale-105 transition-transform shrink-0">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white font-['Prompt'] truncate">
                Khao Chaison Health
              </h1>
              <span className="hidden sm:inline bg-emerald-600/80 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-medium border border-emerald-400/40 shrink-0">
                รพ.เขาชัยสน
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-200/80 font-light truncate hidden lg:block">
              ระบบเชื่อมโยงข้อมูลเยี่ยมบ้านชุมชน สำหรับเภสัชกรและสหวิชาชีพ
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
          {/* Back to Portal / Landing */}
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-100 transition-colors border border-emerald-700/60 shadow-xs cursor-pointer shrink-0"
              title="กลับหน้าหลักของแอป (App Landing)"
            >
              <Home className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="hidden xl:inline">หน้าแรกแอป</span>
            </button>
          )}

          {/* Stats Button */}
          <button
            onClick={onOpenStatsModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-700/70 hover:bg-emerald-600 text-white transition-colors border border-emerald-600/50 shadow-sm cursor-pointer shrink-0"
            title="ดูสถิติภาพรวมการเยี่ยมบ้าน"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
            <span className="hidden xl:inline">ภาพรวมสถิติ</span>
          </button>

          {/* PCU Tools Quick Access Link */}
          <a
            href="https://sites.google.com/view/rxlabel/family-tree"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-700/80 hover:bg-teal-600 text-white transition-colors border border-teal-500/50 shadow-sm cursor-pointer shrink-0"
            title="เปิดระบบสร้างผังครอบครัว (PCU Tools บน Google Sites)"
          >
            <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 shrink-0" />
            <span className="hidden 2xl:inline">PCU Tools</span>
            <ExternalLink className="w-3 h-3 text-teal-300 hidden xl:inline shrink-0" />
          </a>

          {/* Google Sheets Link & Sync */}
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors border border-emerald-400/60 shadow-sm cursor-pointer shrink-0"
            title="เชื่อมโยงและซิงค์ข้อมูลกับ Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
            <span className="hidden lg:inline">Google Sheets</span>
            <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0">
              Sync
            </span>
          </button>

          {/* User & Role Badge */}
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1 border-l border-emerald-700/70 ml-0.5 shrink-0">
            {currentUser && (
              <button
                onClick={onOpenRoleModal}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs rounded-lg bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 transition-colors cursor-pointer shrink-0"
                title="ตรวจสอบระดับสิทธิ์การเข้าถึงข้อมูล"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white truncate max-w-[65px] sm:max-w-[90px] text-[11px]">
                  {currentUser.role === 'pharmacist'
                    ? 'เภสัชกร'
                    : currentUser.role === 'doctor'
                    ? 'แพทย์'
                    : currentUser.role === 'nurse'
                    ? 'พยาบาล'
                    : currentUser.role === 'vhv'
                    ? 'อสม.'
                    : currentUser.roleTitle}
                </span>
              </button>
            )}

            {/* Profile / Switch User */}
            {currentUser ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 p-1 sm:px-2 py-1 text-xs rounded-lg bg-emerald-950/60 hover:bg-emerald-950 text-white border border-emerald-700/60 transition-colors cursor-pointer shrink-0"
                title={`เข้าสู่ระบบโดย: ${currentUser.name} (${currentUser.email}) - คลิกเพื่อสลับบัญชี`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-emerald-100 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-400 shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <span className="text-[11px] font-semibold truncate max-w-[70px] sm:max-w-[100px] hidden md:inline">
                  {currentUser.name}
                </span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-300 hidden lg:block shrink-0" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition-colors cursor-pointer shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">เลือกบัญชี</span>
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 transition-colors border border-rose-700/60 shadow-xs cursor-pointer shrink-0"
                title="ออกจากระบบและล็อกแอปพลิเคชัน"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span className="hidden xl:inline">ออกจากระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
