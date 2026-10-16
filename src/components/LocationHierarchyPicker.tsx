import React from 'react';
import { KHAO_CHAISON_TAMBONS } from '../data/khaoChaisonLocations';
import { MapPin, Home, Search, X, Users, UserPlus } from 'lucide-react';
import { PatientMobilityStatus } from '../types';

interface LocationHierarchyPickerProps {
  selectedTambon: string;
  selectedMoo: number | null;
  searchQuery: string;
  selectedStatus: string;
  onSelectTambon: (tambon: string) => void;
  onSelectMoo: (moo: number | null) => void;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onRegisterNewClick: () => void;
  totalFilteredCount: number;
}

export const LocationHierarchyPicker: React.FC<LocationHierarchyPickerProps> = ({
  selectedTambon,
  selectedMoo,
  searchQuery,
  selectedStatus,
  onSelectTambon,
  onSelectMoo,
  onSearchChange,
  onStatusChange,
  onRegisterNewClick,
  totalFilteredCount,
}) => {
  const currentTambonData = KHAO_CHAISON_TAMBONS.find((t) => t.name === selectedTambon);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-5 mb-6">
      {/* Title & Quick Add Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 font-['Prompt']">
              เลือกพื้นที่ลงชุมชน: อำเภอเขาชัยสน
            </h2>
            <p className="text-xs text-slate-500">
              เลือกตำบล และหมู่บ้านเพื่อค้นหาหรือลงทะเบียนผู้ป่วยในการเยี่ยมบ้าน
            </p>
          </div>
        </div>

        <button
          onClick={onRegisterNewClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>ลงทะเบียนผู้ป่วยใหม่</span>
        </button>
      </div>

      {/* Step 1: Select Tambon */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] inline-flex items-center justify-center font-bold">
              1
            </span>
            เลือกตำบลในอำเภอเขาชัยสน (5 ตำบล)
          </label>
          <span className="text-[11px] text-slate-400">
            {selectedTambon ? `ตำบลที่เลือก: ${selectedTambon}` : 'แสดงทุกตำบล'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => {
              onSelectTambon('');
              onSelectMoo(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
              selectedTambon === ''
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="text-[10px] opacity-75">อำเภอเขาชัยสน</div>
            <div className="font-semibold truncate">ทุกลำดับตำบล</div>
          </button>

          {KHAO_CHAISON_TAMBONS.map((t) => {
            const isSelected = selectedTambon === t.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  onSelectTambon(t.name);
                  onSelectMoo(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs text-left transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200 font-semibold'
                    : 'bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 text-slate-700 border-slate-200'
                }`}
              >
                <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {t.villages.length} หมู่บ้าน
                </div>
                <div className="font-semibold truncate">ต. {t.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Village / Moo */}
      {selectedTambon && currentTambonData && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] inline-flex items-center justify-center font-bold">
                2
              </span>
              เลือกหมู่บ้านใน ต. {selectedTambon} ({currentTambonData.villages.length} หมู่)
            </label>
            {selectedMoo && (
              <button
                type="button"
                onClick={() => onSelectMoo(null)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> แสดงทุกหมู่บ้านใน ต. {selectedTambon}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => onSelectMoo(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMoo === null
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              ทุกหมู่บ้านใน ต. {selectedTambon}
            </button>

            {currentTambonData.villages.map((v) => {
              const isSelected = selectedMoo === v.moo;
              return (
                <button
                  key={v.moo}
                  type="button"
                  onClick={() => onSelectMoo(v.moo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Home className={`w-3 h-3 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`} />
                  <span>ม.{v.moo} {v.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อผู้ป่วย, นามสกุล, เลข HN, เลขบัตรประชาชน หรือชื่อหมู่บ้าน..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobility Status Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap px-1">
            สถานะ:
          </span>
          {[
            { value: '', label: 'ทั้งหมด' },
            { value: 'ติดสังคม (เดินได้ปกติ)', label: 'ติดสังคม' },
            { value: 'ติดบ้าน (เคลื่อนไหวลำบาก)', label: 'ติดบ้าน' },
            { value: 'ติดเตียง (ช่วยเหลือตัวเองไม่ได้)', label: 'ติดเตียง' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => onStatusChange(item.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === item.value
                  ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Total Badge */}
        <div className="text-right text-xs text-slate-500 whitespace-nowrap flex items-center justify-end gap-1.5 px-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>พบ <b>{totalFilteredCount}</b> ราย</span>
        </div>
      </div>
    </div>
  );
};
