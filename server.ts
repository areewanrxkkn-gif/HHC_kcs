import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_USERS, INITIAL_PATIENTS, INITIAL_VISITS } from './src/data/mockInitialData';
import { Patient, VisitRecord, User, GoogleSheetsConfig } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'community_health_db.json');

// In-memory state with persistence
interface DatabaseSchema {
  users: User[];
  patients: Patient[];
  visits: VisitRecord[];
  sheetsConfig: GoogleSheetsConfig;
}

let db: DatabaseSchema = {
  users: INITIAL_USERS,
  patients: INITIAL_PATIENTS,
  visits: INITIAL_VISITS,
  sheetsConfig: {
    webhookUrl: '',
    autoSync: false,
    sheetNamePatients: 'ทะเบียนผู้ป่วย_เขาชัยสน',
    sheetNameVisits: 'บันทึกการเยี่ยมบ้าน_Visits',
    lastSyncedAt: undefined,
  },
};

// Load or initialize DB
function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.patients)) {
        db = {
          users: parsed.users || INITIAL_USERS,
          patients: parsed.patients,
          visits: parsed.visits || [],
          sheetsConfig: parsed.sheetsConfig || db.sheetsConfig,
        };
        console.log(`[DB] Loaded ${db.patients.length} patients and ${db.visits.length} visits from persistent file.`);
        return;
      }
    }
  } catch (err) {
    console.error('[DB] Failed to read database file, initializing defaults:', err);
  }
  saveDatabase();
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving to file:', err);
  }
}

loadDatabase();

async function startServer() {
  const app = express();

  // Allow high-res visit photos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS and Cache control headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      patientCount: db.patients.length,
      visitCount: db.visits.length,
    });
  });

  // --- Auth & Users API ---
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(db.users);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { name, email, role, roleTitle, organization } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมล' });
    }
    const roleTitleMap: Record<string, string> = {
      pharmacist: 'เภสัชกรชำนาญการ',
      doctor: 'นายแพทย์เวชปฏิบัติ',
      nurse: 'พยาบาลวิชาชีพ',
      public_health: 'นักวิชาการสาธารณสุข',
      vhv: 'อาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.)',
      admin: 'ผู้ดูแลระบบ',
    };
    const assignedRole = role || 'pharmacist';
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: email.trim(),
      name: name && name.trim() ? name.trim() : email.split('@')[0],
      role: assignedRole,
      roleTitle: roleTitle || roleTitleMap[assignedRole] || 'บุคลากรสาธารณสุข',
      organization: organization || 'กลุ่มงานเภสัชกรรม โรงพยาบาลเขาชัยสน',
    };
    // Replace if already exists with same email, or add
    const existingIdx = db.users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingIdx !== -1) {
      db.users[existingIdx] = { ...db.users[existingIdx], ...newUser, id: db.users[existingIdx].id };
      saveDatabase();
      return res.json(db.users[existingIdx]);
    }
    db.users.push(newUser);
    saveDatabase();
    res.status(201).json(newUser);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.users = db.users.filter((u) => u.id !== id);
    saveDatabase();
    res.json({ success: true });
  });

  app.delete('/api/users', (req: Request, res: Response) => {
    db.users = [];
    saveDatabase();
    res.json({ success: true, message: 'ลบโปรไฟล์ทั้งหมดเรียบร้อยแล้ว' });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, role, name, organization } = req.body;
    let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    const roleTitleMap: Record<string, string> = {
      pharmacist: 'เภสัชกรชำนาญการ',
      doctor: 'นายแพทย์เวชปฏิบัติ',
      nurse: 'พยาบาลวิชาชีพ',
      public_health: 'นักวิชาการสาธารณสุข',
      vhv: 'อาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.)',
      admin: 'ผู้ดูแลระบบ',
    };
    const assignedRole = role || 'pharmacist';

    if (!user) {
      user = {
        id: 'user-' + Date.now(),
        email: email || 'pharmacist@kcs-hospital.go.th',
        name: name && name.trim() ? name.trim() : (email ? email.split('@')[0] : 'เภสัชกรผู้ดูแลระบบ'),
        role: assignedRole,
        roleTitle: roleTitleMap[assignedRole] || 'บุคลากรสาธารณสุข',
        organization: organization || 'กลุ่มงานเภสัชกรรม โรงพยาบาลเขาชัยสน',
      };
      db.users.push(user);
      saveDatabase();
    } else if (name || role) {
      if (name) user.name = name.trim();
      if (role) {
        user.role = assignedRole;
        user.roleTitle = roleTitleMap[assignedRole] || user.roleTitle;
      }
      if (organization) user.organization = organization;
      saveDatabase();
    }
    res.json({ success: true, user });
  });

  app.put('/api/users/:id/role', (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, roleTitle } = req.body;
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.role = role;
    if (roleTitle) user.roleTitle = roleTitle;
    saveDatabase();
    res.json(user);
  });

  // --- Patients API ---
  app.get('/api/patients', (req: Request, res: Response) => {
    const { tambon, moo, search } = req.query;
    let list = db.patients;

    if (tambon) {
      list = list.filter((p) => p.tambon === tambon);
    }
    if (moo) {
      list = list.filter((p) => p.moo === Number(moo));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.hn.includes(q) ||
          p.idCard.includes(q) ||
          p.villageName.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });

  app.get('/api/patients/:id', (req: Request, res: Response) => {
    const patient = db.patients.find((p) => p.id === req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  });

  app.post('/api/patients', (req: Request, res: Response) => {
    const patientData = req.body;
    const newPatient: Patient = {
      ...patientData,
      id: patientData.id || 'pt-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.patients.unshift(newPatient);
    saveDatabase();
    res.status(201).json(newPatient);
  });

  app.put('/api/patients/:id', (req: Request, res: Response) => {
    const idx = db.patients.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Patient not found' });
    db.patients[idx] = {
      ...db.patients[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    res.json(db.patients[idx]);
  });

  app.delete('/api/patients/:id', (req: Request, res: Response) => {
    db.patients = db.patients.filter((p) => p.id !== req.params.id);
    // Also remove associated visits
    db.visits = db.visits.filter((v) => v.patientId !== req.params.id);
    saveDatabase();
    res.json({ success: true });
  });

  // --- Visits API ---
  app.get('/api/visits', (req: Request, res: Response) => {
    const { patientId } = req.query;
    let list = db.visits;
    if (patientId) {
      list = list.filter((v) => v.patientId === patientId);
    }
    // Sort descending by visitDate
    list = [...list].sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
    res.json(list);
  });

  app.get('/api/visits/:id', (req: Request, res: Response) => {
    const visit = db.visits.find((v) => v.id === req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json(visit);
  });

  app.post('/api/visits', (req: Request, res: Response) => {
    const visitData = req.body;
    const patientVisits = db.visits.filter((v) => v.patientId === visitData.patientId);
    const visitNumber = visitData.visitNumber || patientVisits.length + 1;

    const newVisit: VisitRecord = {
      ...visitData,
      id: visitData.id || 'visit-' + Date.now(),
      visitNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.visits.unshift(newVisit);

    // Update patient's updatedAt
    const ptIdx = db.patients.findIndex((p) => p.id === visitData.patientId);
    if (ptIdx !== -1) {
      db.patients[ptIdx].updatedAt = new Date().toISOString();
    }

    saveDatabase();
    res.status(201).json(newVisit);
  });

  app.put('/api/visits/:id', (req: Request, res: Response) => {
    const idx = db.visits.findIndex((v) => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Visit not found' });
    db.visits[idx] = {
      ...db.visits[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    res.json(db.visits[idx]);
  });

  app.delete('/api/visits/:id', (req: Request, res: Response) => {
    db.visits = db.visits.filter((v) => v.id !== req.params.id);
    saveDatabase();
    res.json({ success: true });
  });

  // --- Google Sheets Sync & Config API ---
  app.get('/api/sheets/config', (req: Request, res: Response) => {
    res.json(db.sheetsConfig);
  });

  app.post('/api/sheets/config', (req: Request, res: Response) => {
    db.sheetsConfig = {
      ...db.sheetsConfig,
      ...req.body,
    };
    saveDatabase();
    res.json(db.sheetsConfig);
  });

  app.post('/api/sheets/sync', async (req: Request, res: Response) => {
    const { webhookUrl } = req.body || db.sheetsConfig;
    db.sheetsConfig.lastSyncedAt = new Date().toISOString();
    saveDatabase();

    if (!webhookUrl) {
      return res.json({
        success: true,
        message: 'ข้อมูลพร้อมสำหรับการนำเข้า Google Sheets (ผ่าน CSV / Copy-Paste หรือกรอก Webhook)',
        syncedCount: { patients: db.patients.length, visits: db.visits.length },
        lastSyncedAt: db.sheetsConfig.lastSyncedAt,
      });
    }

    try {
      // If user has provided a real Google Apps Script webhook
      const payload = {
        action: 'syncAll',
        timestamp: new Date().toISOString(),
        patients: db.patients,
        visits: db.visits,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.text();
      res.json({
        success: true,
        message: 'ส่งข้อมูลไปยัง Google Apps Script Webhook เรียบร้อยแล้ว',
        webhookResponse: result,
        syncedCount: { patients: db.patients.length, visits: db.visits.length },
        lastSyncedAt: db.sheetsConfig.lastSyncedAt,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Webhook: ' + err.message,
      });
    }
  });

  // Export CSV endpoint with UTF-8 BOM
  app.get('/api/sheets/export/csv', (req: Request, res: Response) => {
    const type = req.query.type as string;
    const patientId = req.query.patientId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const BOM = '\uFEFF';

    if (type === 'patients') {
      const headers = [
        'ID',
        'HN',
        'เลขบัตรประชาชน',
        'คำนำหน้า',
        'ชื่อ',
        'นามสกุล',
        'เพศ',
        'วันเกิด',
        'อายุ(ปี)',
        'เบอร์โทร',
        'บ้านเลขที่',
        'หมู่ที่',
        'ชื่อหมู่บ้าน',
        'ตำบล',
        'อำเภอ',
        'จังหวัด',
        'สิทธิการรักษา',
        'โรคประจำตัว',
        'ประวัติแพ้ยา',
        'ชื่อผู้ดูแล',
        'เบอร์โทรผู้ดูแล',
        'สถานะการเคลื่อนไหว',
        'วันที่ลงทะเบียน',
      ];

      let targetPatients = db.patients;
      if (patientId && patientId !== 'ALL') {
        targetPatients = targetPatients.filter((p) => p.id === patientId);
      }
      if (startDate) {
        targetPatients = targetPatients.filter((p) => {
          const dateStr = p.createdAt ? p.createdAt.slice(0, 10) : '';
          return !dateStr || dateStr >= startDate;
        });
      }
      if (endDate) {
        targetPatients = targetPatients.filter((p) => {
          const dateStr = p.createdAt ? p.createdAt.slice(0, 10) : '';
          return !dateStr || dateStr <= endDate;
        });
      }

      const rows = targetPatients.map((p) => [
        p.id,
        p.hn,
        p.idCard,
        p.title,
        p.firstName,
        p.lastName,
        p.gender,
        p.birthDate,
        p.ageYears,
        p.tel,
        p.houseNo,
        p.moo,
        p.villageName,
        p.tambon,
        p.amphoe,
        p.province,
        p.healthCoverage,
        [...(p.chronicDiseases || []), p.chronicDiseasesOther].filter(Boolean).join('; '),
        (p.drugAllergies || []).map((a) => `${a.drugName}(${a.reaction})`).join('; ') || 'ไม่มีประวัติแพ้ยา',
        p.caregiver?.name || '',
        p.caregiver?.tel || '',
        p.patientStatus || '',
        p.createdAt || '',
      ]);

      const csvContent =
        BOM +
        [
          headers.map((h) => `"${h}"`).join(','),
          ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
        ].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="KhaoChaison_Patients.csv"; filename*=UTF-8\'\'' + encodeURIComponent('KhaoChaison_Patients_ทะเบียนผู้ป่วย.csv')
      );
      return res.send(csvContent);
    }

    // Default visits export
    const headers = [
      'Visit ID',
      'Patient ID',
      'ชื่อ-นามสกุลผู้ป่วย',
      'ครั้งที่เยี่ยม',
      'วันเวลาที่เยี่ยม',
      'ผู้เยี่ยม',
      'วิชาชีพ',
      'ทีมร่วมเยี่ยม',
      'BP บน/ล่าง',
      'Pulse',
      'Temp',
      'RR',
      'DTX (mg/dL)',
      'SpO2 (%)',
      'น้ำหนัก (kg)',
      'BMI',
      'Pain Score (1-10)',
      'ตำแหน่งปวด',
      'S (Subjective)',
      'O (Objective)',
      'A (Assessment)',
      'P (Plan)',
      'IFEE (Ideas)',
      'IFEE (Feelings)',
      'IFEE (Expectations)',
      'IFEE (Effects)',
      'IN HOME SSS (Medication)',
      'รายการยาที่ประเมิน',
      'คำแนะนำทางเภสัชกรรม',
      'ปัญหา DRP ที่ตรวจพบ (10 หมวดหมู่)',
      'วันนัดเยี่ยมรอบหน้า',
      'เป้าหมายการติดตามรอบหน้า',
      'จำนวนรูปภาพที่แนบ',
    ];

    let targetVisits = db.visits;
    if (patientId && patientId !== 'ALL') {
      targetVisits = targetVisits.filter((v) => v.patientId === patientId);
    }
    if (startDate) {
      targetVisits = targetVisits.filter((v) => {
        const d = v.visitDate ? v.visitDate.slice(0, 10) : '';
        return !d || d >= startDate;
      });
    }
    if (endDate) {
      targetVisits = targetVisits.filter((v) => {
        const d = v.visitDate ? v.visitDate.slice(0, 10) : '';
        return !d || d <= endDate;
      });
    }

    const rows = targetVisits.map((v) => {
      const patient = db.patients.find((p) => p.id === v.patientId);
      const patientName = patient ? `${patient.title}${patient.firstName} ${patient.lastName}` : v.patientId;
      const medsStr = (v.medications || [])
        .map((m) => `${m.name} [${m.dose} ${m.frequency}] - ${m.adherence}`)
        .join(' | ');
      const drpStr = (v.drpItems || [])
        .map((d) => `[${d.category === 'อื่น ๆ เพิ่มเติม' && d.otherCategory ? d.otherCategory : d.category}] ยา: ${d.drugName || '-'} (${d.status || '-'}) ${d.description ? `ปัญหา: ${d.description}` : ''} ${d.intervention ? `แก้ไข: ${d.intervention}` : ''}`)
        .join(' || ');

      return [
        v.id,
        v.patientId,
        patientName,
        `Visit ${v.visitNumber}`,
        v.visitDate,
        v.visitorName,
        v.visitorRole,
        v.coVisitors || '',
        v.bpSys ? `${v.bpSys}/${v.bpDia}` : '',
        v.pulse || '',
        v.temp || '',
        v.rr || '',
        v.dtx || '',
        v.spo2 || '',
        v.weight || '',
        v.bmi || '',
        v.painScore,
        v.painLocation || '',
        v.subjective,
        v.objective,
        v.assessment,
        v.plan,
        v.ifeeIdeas,
        v.ifeeFeelings,
        v.ifeeExpectations,
        v.ifeeEffects,
        v.inhomeMedication,
        medsStr,
        v.pharmacistAdvice,
        drpStr,
        v.nextVisitDate || '',
        v.nextVisitGoal || '',
        v.photos ? v.photos.length : 0,
      ];
    });

    const csvContent =
      BOM +
      [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="KhaoChaison_Visits.csv"; filename*=UTF-8\'\'' + encodeURIComponent('KhaoChaison_Visits_บันทึกการเยี่ยมบ้าน.csv')
    );
    return res.send(csvContent);
  });

  // Mount Vite or static server
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Khao Chaison Health Visit server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});
