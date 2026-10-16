export type UserRole = 'pharmacist' | 'doctor' | 'nurse' | 'public_health' | 'vhv' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  avatar?: string;
}

export interface Village {
  moo: number;
  name: string;
}

export interface TambonData {
  name: string;
  villages: Village[];
}

export interface CaregiverInfo {
  name: string;
  relation: string;
  tel: string;
  availability: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  tel: string;
}

export interface DrugAllergy {
  drugName: string;
  reaction: string;
}

export type PatientMobilityStatus = 'ติดสังคม (เดินได้ปกติ)' | 'ติดบ้าน (เคลื่อนไหวลำบาก)' | 'ติดเตียง (ช่วยเหลือตัวเองไม่ได้)';

export interface Patient {
  id: string;
  hn: string;
  idCard: string;
  title: string;
  firstName: string;
  lastName: string;
  gender: 'ชาย' | 'หญิง';
  birthDate: string; // YYYY-MM-DD
  ageYears: number;
  ageMonths: number;
  tel: string;
  houseNo: string;
  moo: number;
  villageName: string;
  tambon: string;
  amphoe: string;
  province: string;
  healthCoverage: string;
  chronicDiseases: string[];
  chronicDiseasesOther?: string;
  drugAllergies: DrugAllergy[];
  caregiver: CaregiverInfo;
  emergencyContact: EmergencyContact;
  patientStatus: PatientMobilityStatus;
  notes?: string;
  familyTreePhoto?: string;
  familyTreeNotes?: string;
  familyTreeUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const DRP_CATEGORIES = [
  'Need for additional therapy ไม่ได้รับยาที่ควรใช้ในการรักษาโรค (Untreated indications)',
  'Improper drug selection การเลือกยาไม่เหมาะสม',
  'Dosage too low ใช้ยาในการรักษาขนาดต่ำเกินไป (Sub-therapeutic dosage)',
  'Dosage too high การใช้ยาในการรักษาขนาดสูงเกิน (Over-dosage)',
  'Adverse drug reactions การเกิดอาการข้างเคียง',
  'Drug interactions การเกิดอันตรกิริยา',
  'Unnecessary drug therapy การใช้ยาไม่ตรงข้อบ่งใช้ (Invalid indications)',
  'Non-compliance or non-adherence การใช้ยาไม่ตรงตามแพทย์สั่ง',
  'Dispensing error ความคลาดเคลื่อนในการจ่ายยา',
  'อื่น ๆ เพิ่มเติม',
] as const;

export interface DRPCategoryDetail {
  id: number;
  category: string;
  enTitle: string;
  thTitle: string;
  subTitle?: string;
  shortDesc: string;
}

export const DRP_CATEGORY_DETAILS: DRPCategoryDetail[] = [
  {
    id: 1,
    category: 'Need for additional therapy ไม่ได้รับยาที่ควรใช้ในการรักษาโรค (Untreated indications)',
    enTitle: 'Need for additional therapy',
    thTitle: 'ไม่ได้รับยาที่ควรใช้ในการรักษาโรค',
    subTitle: '(Untreated indications)',
    shortDesc: 'ผู้ป่วยมีข้อบ่งใช้ของโรคแต่ยังไม่ได้รับยา หรือต้องการยาเพิ่มเพื่อควบคุมโรค',
  },
  {
    id: 2,
    category: 'Improper drug selection การเลือกยาไม่เหมาะสม',
    enTitle: 'Improper drug selection',
    thTitle: 'การเลือกยาไม่เหมาะสม',
    subTitle: 'ยากลุ่มนี้ไม่เหมาะกับผู้ป่วย/มีข้อห้ามใช้',
    shortDesc: 'ยาไม่ตรงกับภาวะผู้ป่วย มีข้อห้ามใช้ หรือมียาอื่นที่ปลอดภัย/ได้ผลดีกว่า',
  },
  {
    id: 3,
    category: 'Dosage too low ใช้ยาในการรักษาขนาดต่ำเกินไป (Sub-therapeutic dosage)',
    enTitle: 'Dosage too low',
    thTitle: 'ใช้ยาในการรักษาขนาดต่ำเกินไป',
    subTitle: '(Sub-therapeutic dosage)',
    shortDesc: 'ขนาดยา ความถี่ หรือระยะเวลาต่ำเกินไปจนไม่ได้ผลการรักษาตามเป้าหมาย',
  },
  {
    id: 4,
    category: 'Dosage too high การใช้ยาในการรักษาขนาดสูงเกิน (Over-dosage)',
    enTitle: 'Dosage too high',
    thTitle: 'การใช้ยาในการรักษาขนาดสูงเกิน',
    subTitle: '(Over-dosage)',
    shortDesc: 'ขนาดยาหรือความถี่สูงเกินไป เสี่ยงต่อความเป็นพิษหรือผลข้างเคียงรุนแรง',
  },
  {
    id: 5,
    category: 'Adverse drug reactions การเกิดอาการข้างเคียง',
    enTitle: 'Adverse drug reactions',
    thTitle: 'การเกิดอาหาร/อาการข้างเคียง',
    subTitle: '(Adverse drug reactions / อาการไม่พึงประสงค์)',
    shortDesc: 'เกิดอาการไม่พึงประสงค์ แพ้ยา หรืออาการข้างเคียงจากการใช้ยา',
  },
  {
    id: 6,
    category: 'Drug interactions การเกิดอันตรกิริยา',
    enTitle: 'Drug interactions',
    thTitle: 'การเกิดอันตรกิริยา',
    subTitle: 'ยาตีกัน / ยาทำปฏิกิริยากับยา อาหาร หรือสมุนไพร',
    shortDesc: 'ยาทำปฏิกิริยากันเอง หรือกับอาหาร/สมุนไพร/อาหารเสริม ส่งผลต่อระดับยาหรือพิษ',
  },
  {
    id: 7,
    category: 'Unnecessary drug therapy การใช้ยาไม่ตรงข้อบ่งใช้ (Invalid indications)',
    enTitle: 'Unnecessary drug therapy',
    thTitle: 'การใช้ยาไม่ตรงข้อบ่งใช้',
    subTitle: '(Invalid / Duplicate indications)',
    shortDesc: 'ใช้ยาซ้ำซ้อน ไม่ตรงกับโรคที่ผู้ป่วยเป็น หรือใช้ยาที่ไม่จำเป็นต้องใช้',
  },
  {
    id: 8,
    category: 'Non-compliance or non-adherence การใช้ยาไม่ตรงตามแพทย์สั่ง',
    enTitle: 'Non-compliance or non-adherence',
    thTitle: 'การใช้ยาไม่ตรงตามแพทย์สั่ง',
    subTitle: 'ลืมกิน / หยุดยาเอง / กินผิดวิธี / ยาเหลือค้าง',
    shortDesc: 'ผู้ป่วยไม่กินยาตามคำแนะนำ ลืมทานบ่อย หยุดยาเอง กินผิดวิธี หรือเก็บยาไม่ถูกต้อง',
  },
  {
    id: 9,
    category: 'Dispensing error ความคลาดเคลื่อนในการจ่ายยา',
    enTitle: 'Dispensing error',
    thTitle: 'ความคลาดเคลื่อนในการจ่ายยา',
    subTitle: 'จ่ายผิดชนิด / ผิดขนาด / ฉลากยาผิดวิธี',
    shortDesc: 'เกิดข้อผิดพลาดจากการจัดจ่ายยา ฉลากยาไม่ตรงกับวิธีทานจริง หรือยาปนเปื้อน',
  },
  {
    id: 10,
    category: 'อื่น ๆ เพิ่มเติม',
    enTitle: 'Other issues',
    thTitle: 'อื่น ๆ เพิ่มเติม',
    subTitle: 'ระบุปัญหาเฉพาะเพิ่มเติมด้วยตนเอง',
    shortDesc: 'ปัญหาอื่น ๆ เช่น การเก็บรักษายาไม่เหมาะสม อุปกรณ์พ่นยา ฉลากยาเลือนราง',
  },
];

export type DRPType = (typeof DRP_CATEGORIES)[number];

export interface DRPItem {
  id: string;
  category: DRPType | string;
  otherCategory?: string; // หากกด 'อื่น ๆ เพิ่มเติม' จะมีช่องให้กรอกเองได้
  drugName: string; // เลือกชื่อยาจากที่เคยกรอกบันทึกรายการยาไว้ หรือระบุเอง
  description?: string; // รายละเอียดปัญหา / สิ่งที่ตรวจพบ
  intervention?: string; // แผนการแก้ไข / คำแนะนำทางเภสัชกรรม
  status?: 'อยู่ระหว่างติดตาม' | 'แก้ไขปัญหาแล้ว' | 'ส่งต่อแพทย์/รพ.' | 'ไม่พบปัญหา';
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  indication: string;
  adherence: 'กินตรงเวลาสม่ำเสมอ' | 'ลืมกินบ่อย' | 'หยุดยาเอง' | 'กินผิดขนาด' | 'ยาเหลือเกินกำหนด';
  drpNotes?: string;
}

export interface VisitPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  category: 'ตู้ยา/ซองยา' | 'สภาพบ้าน/สิ่งแวดล้อม' | 'ร่างกาย/แผล' | 'การให้คำปรึกษา' | 'อื่น ๆ';
  uploadedAt: string;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  visitNumber: number;
  visitDate: string; // YYYY-MM-DDTHH:mm
  visitorName: string;
  visitorRole: string;
  coVisitors?: string;

  // Objective / Vitals
  bpSys?: number;
  bpDia?: number;
  pulse?: number;
  temp?: number;
  rr?: number;
  dtx?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;

  // Pain Score 1-10
  painScore: number;
  painLocation?: string;

  // SOAP
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;

  // IFEE
  ifeeIdeas: string;
  ifeeFeelings: string;
  ifeeExpectations: string;
  ifeeEffects: string;

  // IN HOME SSS
  inhomeImmobility: string;
  inhomeNutrition: string;
  inhomeHousing: string;
  inhomeOtherPeople: string;
  inhomeMedication: string;
  inhomeExamination: string;
  inhomeSafety: string;
  inhomeSpiritual: string;
  inhomeServices: string;

  // Medications & Pharmacist review
  medications: MedicationItem[];
  pharmacistAdvice: string;

  // DRP Assessment (Drug-Related Problems)
  drpItems?: DRPItem[];

  // Photos
  photos: VisitPhoto[];

  // Next Visit Appointment
  nextVisitDate?: string;
  nextVisitTime?: string;
  nextVisitGoal?: string;

  createdAt: string;
  updatedAt: string;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  sheetNamePatients: string;
  sheetNameVisits: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
}
