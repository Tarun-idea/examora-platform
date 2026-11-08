# ExamFlow — Online Examination System

A full-stack starter application with separate Admin and Student portals.

## Implemented

- Admin and student login with hashed passwords and server-side sessions.
- Admin can create subjects and examinations.
- Every examination is fixed at **180 minutes (3 hours)**.
- Admin can add MCQ and descriptive questions.
- Admin can register students and assign students to exams.
- Exams are published only after at least one question has been added.
- Students see scheduled exams and can enter only after the scheduled start time.
- The examination end time is calculated from the scheduled start time + 180 minutes.
- Student answers are saved to PostgreSQL as they work.
- MCQs are auto-marked; descriptive answers can be graded by the admin.
- Admin can release results; students see only released results.
- Server checks the examination end time and locks/submits expired attempts.

## Requirements

- Node.js 20 or newer
- PostgreSQL database (local PostgreSQL or managed PostgreSQL such as Supabase)

## Windows setup (PowerShell)

1. Extract the ZIP to `C:\ExamFlow`.
2. Open PowerShell in that folder:
   ```powershell
   cd C:\ExamFlow
   ```
3. Install packages:
   ```powershell
   npm install
   ```
4. Copy the environment template:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Open `.env` and set:
   - `DATABASE_URL` to your PostgreSQL connection string.
   - `PGSSL=true` if your database provider requires SSL.
   - `SESSION_SECRET` to a random secret of at least 32 characters.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` for your first admin login.
6. Start the application:
   ```powershell
   npm start
   ```
7. Open `http://localhost:3000`.

The application creates its tables and the initial admin account automatically at startup.

## First use

1. Sign in using the admin email and password from `.env`.
2. Open **Subjects** and create one or more subjects.
3. Open **Students** and register student accounts. Give each student their login details securely.
4. Open **Examinations** and create an exam with a future date and start time.
5. Select **Questions** and add MCQ and/or descriptive questions.
6. Publish the examination.
7. Students sign in and see exams assigned to them. If an exam has no explicit student assignments, it is visible to all active student accounts.
8. After submission, open **Results**, review descriptive answers, enter marks, and release results.

## Scheduling semantics

The examination is available from its scheduled start time until exactly 180 minutes after that time. All students share the same scheduled end time. A student who enters late has only the remaining scheduled time. This is intentional for a fixed-time examination.

## Important production checklist

This is a functional application foundation, not a completed security certification or a substitute for institutional exam policy review. Before using it for high-stakes examinations:

- Deploy behind HTTPS and set `NODE_ENV=production`.
- Use a managed PostgreSQL instance with backups and restricted network access.
- Set a unique, high-entropy `SESSION_SECRET`; never commit `.env`.
- Configure database connection SSL correctly for your provider.
- Add institution-approved identity verification and exam integrity controls if required.
- Add audit logs, operational monitoring, database backups, and tested recovery procedures.
- Review privacy, retention, accessibility, and applicable education/data-protection requirements.
- Load-test concurrent students and autosave traffic.
- Decide whether students may reconnect after network loss and document that policy.
- Test exam start/end boundaries, duplicate submissions, browser refresh, and server restarts.

## Current limitations / next development phase

- Descriptive grading is manual; no AI grading is enabled.
- The app does not include webcam proctoring, screen monitoring, or plagiarism detection.
- No bulk student import, email invitations, question randomization, negative marking, or downloadable result reports yet.
- The admin can publish and close exams; editing/deleting published exams should be restricted by an institution's policy before production use.
- This initial version uses a straightforward browser UI; institution branding and advanced reporting can be added next.
