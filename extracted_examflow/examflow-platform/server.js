require("dotenv").config();
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
});

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  store: new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, "public")));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const q = (text, params=[]) => pool.query(text, params);
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Please log in." });
  next();
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: "Please log in." });
    if (req.session.user.role !== role) return res.status(403).json({ error: "Access denied." });
    next();
  };
}
const adminOnly = [requireAuth, requireRole("admin")];
const studentOnly = [requireAuth, requireRole("student")];

async function initialize() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisAdminPassword123!";
  const name = process.env.ADMIN_NAME || "Platform Administrator";
  const found = await q("SELECT id FROM users WHERE email=$1", [email]);
  if (!found.rowCount) {
    const hash = await bcrypt.hash(password, 12);
    await q("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')", [name,email,hash]);
    console.log(`Initial admin created: ${email}`);
  }
}

app.post("/api/auth/login", loginLimiter, asyncRoute(async (req,res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const result = await q("SELECT * FROM users WHERE email=$1 AND is_active=true", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Could not start session." });
    req.session.user = safeUser(user);
    req.session.save(saveErr => {
      if (saveErr) return res.status(500).json({ error: "Could not save session." });
      res.json({ user: req.session.user });
    });
  });
}));
app.post("/api/auth/logout", requireAuth, (req,res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});
app.get("/api/auth/me", (req,res) => res.json({ user: req.session.user || null }));

// Admin: overview and student management
app.get("/api/admin/overview", ...adminOnly, asyncRoute(async (req,res) => {
  const [students,subjects,exams,attempts] = await Promise.all([
    q("SELECT COUNT(*)::int AS count FROM users WHERE role='student'"),
    q("SELECT COUNT(*)::int AS count FROM subjects"),
    q("SELECT COUNT(*)::int AS count FROM exams"),
    q("SELECT COUNT(*)::int AS count FROM attempts")
  ]);
  res.json({ students:students.rows[0].count, subjects:subjects.rows[0].count, exams:exams.rows[0].count, attempts:attempts.rows[0].count });
}));
app.get("/api/admin/students", ...adminOnly, asyncRoute(async (req,res) => {
  const r = await q("SELECT id,name,email,is_active,created_at FROM users WHERE role='student' ORDER BY created_at DESC");
  res.json(r.rows);
}));
app.post("/api/admin/students", ...adminOnly, asyncRoute(async (req,res) => {
  const name=String(req.body.name||"").trim(), email=String(req.body.email||"").trim().toLowerCase(), password=String(req.body.password||"");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<10) return res.status(400).json({error:"Enter a name, valid email and password of at least 10 characters."});
  const hash=await bcrypt.hash(password,12);
  try {
    const r=await q("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'student') RETURNING id,name,email,is_active,created_at",[name,email,hash]);
    res.status(201).json(r.rows[0]);
  } catch(e) { if(e.code==="23505") return res.status(409).json({error:"That email is already registered."}); throw e; }
}));
app.patch("/api/admin/students/:id/status", ...adminOnly, asyncRoute(async(req,res)=>{
  const active=Boolean(req.body.active);
  const r=await q("UPDATE users SET is_active=$1 WHERE id=$2 AND role='student' RETURNING id,is_active",[active,req.params.id]);
  if(!r.rowCount) return res.status(404).json({error:"Student not found."});
  res.json(r.rows[0]);
}));

// Subjects
app.get("/api/subjects", requireAuth, asyncRoute(async(req,res)=>{
  const r=await q("SELECT s.*, (SELECT COUNT(*)::int FROM exams e WHERE e.subject_id=s.id) AS exam_count FROM subjects s ORDER BY name");
  res.json(r.rows);
}));
app.post("/api/admin/subjects", ...adminOnly, asyncRoute(async(req,res)=>{
  const name=String(req.body.name||"").trim(), description=String(req.body.description||"").trim();
  if(!name) return res.status(400).json({error:"Subject name is required."});
  try {
    const r=await q("INSERT INTO subjects(name,description) VALUES($1,$2) RETURNING *",[name,description]);
    res.status(201).json(r.rows[0]);
  } catch(e){if(e.code==="23505") return res.status(409).json({error:"This subject already exists."}); throw e;}
}));
app.delete("/api/admin/subjects/:id", ...adminOnly, asyncRoute(async(req,res)=>{
  try {
    const r=await q("DELETE FROM subjects WHERE id=$1 RETURNING id",[req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:"Subject not found."});
    res.json({ok:true});
  } catch(e){if(e.code==="23503") return res.status(409).json({error:"This subject is used by an examination and cannot be deleted."}); throw e;}
}));

// Exams and question authoring
app.get("/api/admin/exams", ...adminOnly, asyncRoute(async(req,res)=>{
  const r=await q(`SELECT e.*,s.name AS subject_name,
    (SELECT COUNT(*)::int FROM exam_questions q WHERE q.exam_id=e.id) AS question_count
    FROM exams e JOIN subjects s ON s.id=e.subject_id ORDER BY e.starts_at DESC`);
  res.json(r.rows);
}));
app.post("/api/admin/exams", ...adminOnly, asyncRoute(async(req,res)=>{
  const subjectId=Number(req.body.subject_id), title=String(req.body.title||"").trim();
  const instructions=String(req.body.instructions||"").trim(), startsAt=new Date(req.body.starts_at);
  if(!subjectId || !title || Number.isNaN(startsAt.getTime())) return res.status(400).json({error:"Subject, title and a valid scheduled start time are required."});
  if(startsAt.getTime() <= Date.now()) return res.status(400).json({error:"Choose a future examination start time."});
  const sr=await q("SELECT id FROM subjects WHERE id=$1",[subjectId]);
  if(!sr.rowCount) return res.status(400).json({error:"Selected subject does not exist."});
  const r=await q(`INSERT INTO exams(subject_id,title,instructions,starts_at,duration_minutes,status,created_by)
    VALUES($1,$2,$3,$4,180,'draft',$5) RETURNING *`,[subjectId,title,instructions,startsAt,req.session.user.id]);
  res.status(201).json(r.rows[0]);
}));
app.patch("/api/admin/exams/:id/status", ...adminOnly, asyncRoute(async(req,res)=>{
  const status=String(req.body.status||"");
  if(!["draft","published","closed"].includes(status)) return res.status(400).json({error:"Invalid examination status."});
  if(status==="published") {
    const count=await q("SELECT COUNT(*)::int AS n FROM exam_questions WHERE exam_id=$1",[req.params.id]);
    if(count.rows[0].n===0) return res.status(400).json({error:"Add at least one question before publishing."});
  }
  const r=await q("UPDATE exams SET status=$1 WHERE id=$2 RETURNING *",[status,req.params.id]);
  if(!r.rowCount) return res.status(404).json({error:"Examination not found."});
  res.json(r.rows[0]);
}));
app.get("/api/admin/exams/:id/questions", ...adminOnly, asyncRoute(async(req,res)=>{
  const r=await q("SELECT id,exam_id,question_text,question_type,marks,options,correct_option,sort_order FROM exam_questions WHERE exam_id=$1 ORDER BY sort_order,id",[req.params.id]);
  res.json(r.rows);
}));
app.post("/api/admin/exams/:id/questions", ...adminOnly, asyncRoute(async(req,res)=>{
  const text=String(req.body.question_text||"").trim(), type=String(req.body.question_type||""), marks=Number(req.body.marks);
  if(!text || !["mcq","descriptive"].includes(type) || !Number.isFinite(marks) || marks<=0) return res.status(400).json({error:"Enter question text, type and positive marks."});
  let options=null, correct=null;
  if(type==="mcq") {
    options=Array.isArray(req.body.options)?req.body.options.map(x=>String(x).trim()):[];
    correct=Number(req.body.correct_option);
    if(options.length<2 || options.some(x=>!x) || !Number.isInteger(correct) || correct<0 || correct>=options.length) return res.status(400).json({error:"MCQ needs at least two options and a valid correct answer."});
  }
  const order=await q("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM exam_questions WHERE exam_id=$1",[req.params.id]);
  const r=await q(`INSERT INTO exam_questions(exam_id,question_text,question_type,marks,options,correct_option,sort_order)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,exam_id,question_text,question_type,marks,options,correct_option,sort_order`,
    [req.params.id,text,type,marks,options,correct,order.rows[0].n]);
  await q("UPDATE exams SET total_marks=(SELECT COALESCE(SUM(marks),0) FROM exam_questions WHERE exam_id=$1) WHERE id=$1",[req.params.id]);
  res.status(201).json(r.rows[0]);
}));
app.delete("/api/admin/questions/:id", ...adminOnly, asyncRoute(async(req,res)=>{
  const r=await q("DELETE FROM exam_questions WHERE id=$1 RETURNING exam_id",[req.params.id]);
  if(!r.rowCount) return res.status(404).json({error:"Question not found."});
  await q("UPDATE exams SET total_marks=(SELECT COALESCE(SUM(marks),0) FROM exam_questions WHERE exam_id=$1) WHERE id=$1",[r.rows[0].exam_id]);
  res.json({ok:true});
}));
app.post("/api/admin/exams/:id/assign", ...adminOnly, asyncRoute(async(req,res)=>{
  const ids=Array.isArray(req.body.student_ids)?[...new Set(req.body.student_ids.map(Number).filter(Number.isInteger))]:[];
  if(!ids.length) return res.status(400).json({error:"Select at least one student."});
  const exam=await q("SELECT id FROM exams WHERE id=$1",[req.params.id]);
  if(!exam.rowCount) return res.status(404).json({error:"Examination not found."});
  for(const id of ids) await q("INSERT INTO exam_assignments(exam_id,student_id) SELECT $1,id FROM users WHERE id=$2 AND role='student' ON CONFLICT DO NOTHING",[req.params.id,id]);
  res.json({ok:true,assigned:ids.length});
}));

// Student exam listing, start, fetch, save and submit
app.get("/api/student/exams", ...studentOnly, asyncRoute(async(req,res)=>{
  await submitExpiredAttempts(req.session.user.id);
  const r=await q(`SELECT e.id,e.title,e.instructions,e.starts_at,e.duration_minutes,e.total_marks,e.status,s.name AS subject_name,
    a.id AS attempt_id,a.status AS attempt_status,a.ends_at,a.submitted_at,a.result_released
    FROM exams e JOIN subjects s ON s.id=e.subject_id
    LEFT JOIN exam_assignments x ON x.exam_id=e.id AND x.student_id=$1
    LEFT JOIN attempts a ON a.exam_id=e.id AND a.student_id=$1
    WHERE e.status='published' AND (x.student_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM exam_assignments z WHERE z.exam_id=e.id))
    ORDER BY e.starts_at DESC`,[req.session.user.id]);
  res.json(r.rows);
}));
app.post("/api/student/exams/:id/start", ...studentOnly, asyncRoute(async(req,res)=>{
  const examR=await q(`SELECT e.*, EXISTS(SELECT 1 FROM exam_assignments x WHERE x.exam_id=e.id) AS has_assignments,
    EXISTS(SELECT 1 FROM exam_assignments x WHERE x.exam_id=e.id AND x.student_id=$2) AS assigned
    FROM exams e WHERE e.id=$1 AND e.status='published'`,[req.params.id,req.session.user.id]);
  if(!examR.rowCount) return res.status(404).json({error:"Published examination not found."});
  const exam=examR.rows[0], now=new Date(), start=new Date(exam.starts_at), end=new Date(start.getTime()+180*60000);
  if(exam.has_assignments && !exam.assigned) return res.status(403).json({error:"You are not assigned to this examination."});
  if(now<start) return res.status(403).json({error:"The examination has not started yet."});
  if(now>=end) return res.status(403).json({error:"The examination time has ended."});
  let attempt=await q("SELECT * FROM attempts WHERE exam_id=$1 AND student_id=$2",[exam.id,req.session.user.id]);
  if(!attempt.rowCount) {
    attempt=await q(`INSERT INTO attempts(exam_id,student_id,started_at,ends_at)
      VALUES($1,$2,$3,$4) ON CONFLICT(exam_id,student_id) DO UPDATE SET exam_id=EXCLUDED.exam_id RETURNING *`,
      [exam.id,req.session.user.id,now,end]);
  }
  if(attempt.rows[0].status!=="in_progress") return res.status(409).json({error:"This examination has already been submitted."});
  res.json({attempt:attempt.rows[0]});
}));
app.get("/api/student/attempts/:id", ...studentOnly, asyncRoute(async(req,res)=>{
  const ar=await q(`SELECT a.*,e.title,e.instructions,e.total_marks,s.name AS subject_name
    FROM attempts a JOIN exams e ON e.id=a.exam_id JOIN subjects s ON s.id=e.subject_id
    WHERE a.id=$1 AND a.student_id=$2`,[req.params.id,req.session.user.id]);
  if(!ar.rowCount) return res.status(404).json({error:"Attempt not found."});
  const a=ar.rows[0];
  if(a.status==="in_progress" && Date.now()>=new Date(a.ends_at).getTime()) await submitAttempt(a.id,req.session.user.id);
  const qr=await q(`SELECT q.id,q.question_text,q.question_type,q.marks,q.options,ans.answer_text,ans.selected_option
    FROM exam_questions q LEFT JOIN answers ans ON ans.question_id=q.id AND ans.attempt_id=$1
    WHERE q.exam_id=$2 ORDER BY q.sort_order,q.id`,[a.id,a.exam_id]);
  const fresh=await q("SELECT status,ends_at FROM attempts WHERE id=$1",[a.id]);
  res.json({attempt:{...a,status:fresh.rows[0].status,ends_at:fresh.rows[0].ends_at},questions:qr.rows});
}));
app.put("/api/student/attempts/:id/answers/:questionId", ...studentOnly, asyncRoute(async(req,res)=>{
  const ar=await q(`SELECT a.id,a.exam_id,a.ends_at,a.status,q.id AS question_id,q.question_type
    FROM attempts a JOIN exam_questions q ON q.exam_id=a.exam_id
    WHERE a.id=$1 AND a.student_id=$2 AND q.id=$3`,[req.params.id,req.session.user.id,req.params.questionId]);
  if(!ar.rowCount) return res.status(404).json({error:"Attempt or question not found."});
  const a=ar.rows[0];
  if(a.status!=="in_progress" || Date.now()>=new Date(a.ends_at).getTime()) {
    await submitAttempt(a.id,req.session.user.id);
    return res.status(409).json({error:"The examination has ended. Answers are locked."});
  }
  let answerText=null, selected=null;
  if(a.question_type==="mcq") {
    selected=Number(req.body.selected_option);
    if(!Number.isInteger(selected)) return res.status(400).json({error:"Choose a valid option."});
    const opt=await q("SELECT options FROM exam_questions WHERE id=$1",[a.question_id]);
    if(selected<0 || selected>=opt.rows[0].options.length) return res.status(400).json({error:"Invalid option."});
  } else {
    answerText=String(req.body.answer_text||"").slice(0,12000);
  }
  await q(`INSERT INTO answers(attempt_id,question_id,answer_text,selected_option,updated_at)
    VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(attempt_id,question_id)
    DO UPDATE SET answer_text=EXCLUDED.answer_text,selected_option=EXCLUDED.selected_option,updated_at=NOW()`,
    [a.id,a.question_id,answerText,selected]);
  res.json({ok:true,saved_at:new Date().toISOString()});
}));
async function submitAttempt(attemptId, studentId) {
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const a=await client.query("SELECT * FROM attempts WHERE id=$1 AND student_id=$2 FOR UPDATE",[attemptId,studentId]);
    if(!a.rowCount || a.rows[0].status!=="in_progress"){await client.query("COMMIT");return;}
    const marks=await client.query(`SELECT COALESCE(SUM(CASE WHEN q.question_type='mcq' AND ans.selected_option=q.correct_option THEN q.marks ELSE 0 END),0) AS mcq
      FROM exam_questions q LEFT JOIN answers ans ON ans.question_id=q.id AND ans.attempt_id=$1 WHERE q.exam_id=$2`,[attemptId,a.rows[0].exam_id]);
    const mcq=Number(marks.rows[0].mcq||0);
    await client.query(`UPDATE attempts SET submitted_at=NOW(),status='submitted',mcq_marks=$1,total_marks=$1 WHERE id=$2`,[mcq,attemptId]);
    await client.query("COMMIT");
  } catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
}
async function submitExpiredAttempts(studentId=null) {
  const sql = studentId
    ? "SELECT id,student_id FROM attempts WHERE status='in_progress' AND ends_at<=NOW() AND student_id=$1"
    : "SELECT id,student_id FROM attempts WHERE status='in_progress' AND ends_at<=NOW()";
  const expired = await q(sql, studentId ? [studentId] : []);
  for (const row of expired.rows) await submitAttempt(row.id, row.student_id);
}

app.post("/api/student/attempts/:id/submit", ...studentOnly, asyncRoute(async(req,res)=>{
  const check=await q("SELECT id FROM attempts WHERE id=$1 AND student_id=$2",[req.params.id,req.session.user.id]);
  if(!check.rowCount) return res.status(404).json({error:"Attempt not found."});
  await submitAttempt(req.params.id,req.session.user.id);
  res.json({ok:true,message:"Your examination has been submitted."});
}));
app.get("/api/student/results", ...studentOnly, asyncRoute(async(req,res)=>{
  const r=await q(`SELECT a.id,a.status,a.mcq_marks,a.descriptive_marks,a.total_marks,a.submitted_at,
    e.title,e.total_marks AS maximum_marks,s.name AS subject_name
    FROM attempts a JOIN exams e ON e.id=a.exam_id JOIN subjects s ON s.id=e.subject_id
    WHERE a.student_id=$1 AND a.result_released=true ORDER BY a.submitted_at DESC`,[req.session.user.id]);
  res.json(r.rows);
}));

// Admin evaluation and result release
app.get("/api/admin/attempts", ...adminOnly, asyncRoute(async(req,res)=>{
  await submitExpiredAttempts();
  const r=await q(`SELECT a.id,a.status,a.mcq_marks,a.descriptive_marks,a.total_marks,a.result_released,a.submitted_at,
    u.name AS student_name,u.email,e.title AS exam_title,e.total_marks AS maximum_marks
    FROM attempts a JOIN users u ON u.id=a.student_id JOIN exams e ON e.id=a.exam_id
    ORDER BY a.submitted_at DESC NULLS LAST`);
  res.json(r.rows);
}));
app.get("/api/admin/attempts/:id", ...adminOnly, asyncRoute(async(req,res)=>{
  const a=await q(`SELECT a.*,u.name AS student_name,e.title AS exam_title,e.total_marks AS maximum_marks
    FROM attempts a JOIN users u ON u.id=a.student_id JOIN exams e ON e.id=a.exam_id WHERE a.id=$1`,[req.params.id]);
  if(!a.rowCount) return res.status(404).json({error:"Attempt not found."});
  const answers=await q(`SELECT q.id AS question_id,q.question_text,q.question_type,q.marks,q.options,q.correct_option,
    ans.answer_text,ans.selected_option,ans.awarded_marks
    FROM exam_questions q LEFT JOIN answers ans ON ans.question_id=q.id AND ans.attempt_id=$1
    WHERE q.exam_id=$2 ORDER BY q.sort_order,q.id`,[req.params.id,a.rows[0].exam_id]);
  res.json({attempt:a.rows[0],answers:answers.rows});
}));
app.put("/api/admin/attempts/:id/answers/:questionId/grade", ...adminOnly, asyncRoute(async(req,res)=>{
  const marks=Number(req.body.awarded_marks);
  const r=await q(`SELECT q.marks,q.question_type,ans.id AS answer_id,a.status
    FROM attempts a JOIN exam_questions q ON q.exam_id=a.exam_id
    LEFT JOIN answers ans ON ans.attempt_id=a.id AND ans.question_id=q.id
    WHERE a.id=$1 AND q.id=$2`,[req.params.id,req.params.questionId]);
  if(!r.rowCount || !r.rows[0].answer_id) return res.status(404).json({error:"Submitted answer not found."});
  if(r.rows[0].question_type!=="descriptive") return res.status(400).json({error:"Only descriptive answers require manual grading."});
  if(r.rows[0].status==="in_progress") return res.status(409).json({error:"Cannot grade an active examination."});
  if(!Number.isFinite(marks)||marks<0||marks>Number(r.rows[0].marks)) return res.status(400).json({error:`Marks must be between 0 and ${r.rows[0].marks}.`});
  await q("UPDATE answers SET awarded_marks=$1 WHERE id=$2",[marks,r.rows[0].answer_id]);
  const totals=await q(`SELECT COALESCE(SUM(CASE WHEN q.question_type='descriptive' THEN COALESCE(ans.awarded_marks,0) ELSE 0 END),0) AS descriptive
    FROM exam_questions q LEFT JOIN answers ans ON ans.question_id=q.id AND ans.attempt_id=$1
    WHERE q.exam_id=(SELECT exam_id FROM attempts WHERE id=$1)`,[req.params.id]);
  await q("UPDATE attempts SET descriptive_marks=$1,total_marks=mcq_marks+$1 WHERE id=$2",[totals.rows[0].descriptive,req.params.id]);
  res.json({ok:true,descriptive_marks:totals.rows[0].descriptive});
}));
app.post("/api/admin/attempts/:id/release", ...adminOnly, asyncRoute(async(req,res)=>{
  const a=await q("SELECT status FROM attempts WHERE id=$1",[req.params.id]);
  if(!a.rowCount) return res.status(404).json({error:"Attempt not found."});
  if(a.rows[0].status==="in_progress") return res.status(409).json({error:"Cannot release results for an active examination."});
  await q("UPDATE attempts SET result_released=true,status='evaluated' WHERE id=$1",[req.params.id]);
  res.json({ok:true});
}));

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,req,res,next)=>{
  console.error(err);
  if(res.headersSent) return next(err);
  res.status(500).json({error:"An unexpected server error occurred."});
});

initialize().then(()=>{
  setInterval(() => submitExpiredAttempts().catch(err => console.error("Expiry processing failed:", err)), 30_000);
  app.listen(PORT,()=>console.log(`ExamFlow running at http://localhost:${PORT}`));
}).catch(err=>{console.error("Startup failed:",err);process.exit(1);});
