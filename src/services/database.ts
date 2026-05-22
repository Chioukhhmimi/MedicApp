/**
 * SQLite persistence layer (expo-sqlite, async API — Expo SDK 54).
 *
 * MediTrack is offline-first: SQLite is the single source of truth. This
 * module owns the schema, migrations, and typed CRUD. Higher layers (stores,
 * services) never touch SQL directly.
 *
 * Design notes:
 *  - Booleans are stored as 0/1 INTEGER.
 *  - JSON-shaped columns (times, weekdays, pattern) are stored as TEXT.
 *  - `logs` rows are append-only — no UPDATE/DELETE is ever issued on them.
 */
import * as SQLite from 'expo-sqlite';
import {
  DEFAULT_SETTINGS,
  type LogEntry,
  type Medication,
  type MedicationSnoozeOverride,
  type Occurrence,
  type ScheduleRule,
  type Settings,
} from '@/lib/types';

const DB_NAME = 'meditrack.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens (once) and migrates the database. Safe to call repeatedly. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Creates tables and seeds the singleton settings row. Idempotent. */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      strength TEXT,
      doseQuantity REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      pillColor TEXT,
      icon TEXT,
      paused INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_rules (
      id TEXT PRIMARY KEY NOT NULL,
      medId TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      timezone TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      times TEXT NOT NULL,
      weekdays TEXT,
      intervalDays INTEGER,
      pattern TEXT
    );

    CREATE TABLE IF NOT EXISTS occurrences (
      id TEXT PRIMARY KEY NOT NULL,
      medId TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      ruleId TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notificationId TEXT,
      parentOccurrenceId TEXT,
      snoozeCount INTEGER NOT NULL DEFAULT 0,
      canceled INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_occ_time ON occurrences(scheduledTime);
    CREATE INDEX IF NOT EXISTS idx_occ_med ON occurrences(medId);

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY NOT NULL,
      occurrenceId TEXT NOT NULL,
      medId TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      userAction TEXT NOT NULL,
      actionTime TEXT NOT NULL,
      source TEXT NOT NULL,
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_log_med ON logs(medId);
    CREATE INDEX IF NOT EXISTS idx_log_time ON logs(scheduledTime);

    CREATE TABLE IF NOT EXISTS snooze_overrides (
      medId TEXT PRIMARY KEY NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      snoozeIntervalMin INTEGER,
      maxSnoozeRepeats INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await db.runAsync(
    `INSERT OR IGNORE INTO settings (id, data) VALUES (1, ?);`,
    JSON.stringify(DEFAULT_SETTINGS),
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('schemaVersion', ?);`,
    String(SCHEMA_VERSION),
  );
}

const bool = (v: number): boolean => v === 1;
const num = (v: boolean): number => (v ? 1 : 0);

/* ----------------------------- Medications ------------------------------ */

interface MedRow {
  id: string;
  name: string;
  strength: string | null;
  doseQuantity: number;
  unit: string;
  notes: string | null;
  startDate: string;
  endDate: string | null;
  pillColor: string | null;
  icon: string | null;
  paused: number;
  createdAt: string;
  updatedAt: string;
}

function rowToMed(r: MedRow): Medication {
  return {
    id: r.id,
    name: r.name,
    strength: r.strength ?? undefined,
    doseQuantity: r.doseQuantity,
    unit: r.unit,
    notes: r.notes ?? undefined,
    startDate: r.startDate,
    endDate: r.endDate ?? undefined,
    pillColor: r.pillColor ?? undefined,
    icon: r.icon ?? undefined,
    paused: bool(r.paused),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function listMedications(): Promise<Medication[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedRow>(
    'SELECT * FROM medications ORDER BY name COLLATE NOCASE;',
  );
  return rows.map(rowToMed);
}

export async function getMedication(id: string): Promise<Medication | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedRow>(
    'SELECT * FROM medications WHERE id = ?;',
    id,
  );
  return row ? rowToMed(row) : null;
}

export async function upsertMedication(m: Medication): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO medications
       (id,name,strength,doseQuantity,unit,notes,startDate,endDate,
        pillColor,icon,paused,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, strength=excluded.strength,
       doseQuantity=excluded.doseQuantity, unit=excluded.unit,
       notes=excluded.notes, startDate=excluded.startDate,
       endDate=excluded.endDate, pillColor=excluded.pillColor,
       icon=excluded.icon, paused=excluded.paused,
       updatedAt=excluded.updatedAt;`,
    m.id,
    m.name,
    m.strength ?? null,
    m.doseQuantity,
    m.unit,
    m.notes ?? null,
    m.startDate,
    m.endDate ?? null,
    m.pillColor ?? null,
    m.icon ?? null,
    num(m.paused),
    m.createdAt,
    m.updatedAt,
  );
}

/** Deletes a medication and (via ON DELETE CASCADE) its rules & occurrences.
 *  Logs are intentionally retained — history must outlive the medication. */
export async function deleteMedication(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medications WHERE id = ?;', id);
}

/* --------------------------- Schedule rules ----------------------------- */

interface RuleRow {
  id: string;
  medId: string;
  type: string;
  timezone: string;
  startDate: string;
  endDate: string | null;
  times: string;
  weekdays: string | null;
  intervalDays: number | null;
  pattern: string | null;
}

function rowToRule(r: RuleRow): ScheduleRule {
  return {
    id: r.id,
    medId: r.medId,
    type: r.type as ScheduleRule['type'],
    timezone: r.timezone,
    startDate: r.startDate,
    endDate: r.endDate ?? undefined,
    times: JSON.parse(r.times),
    weekdays: r.weekdays ? JSON.parse(r.weekdays) : undefined,
    intervalDays: r.intervalDays ?? undefined,
    pattern: r.pattern ? JSON.parse(r.pattern) : undefined,
  };
}

export async function getRulesForMed(medId: string): Promise<ScheduleRule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RuleRow>(
    'SELECT * FROM schedule_rules WHERE medId = ?;',
    medId,
  );
  return rows.map(rowToRule);
}

/** Replaces every rule for a medication (edits recreate rules wholesale). */
export async function replaceRules(
  medId: string,
  rules: ScheduleRule[],
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM schedule_rules WHERE medId = ?;', medId);
    for (const r of rules) {
      await db.runAsync(
        `INSERT INTO schedule_rules
           (id,medId,type,timezone,startDate,endDate,times,weekdays,
            intervalDays,pattern)
         VALUES (?,?,?,?,?,?,?,?,?,?);`,
        r.id,
        r.medId,
        r.type,
        r.timezone,
        r.startDate,
        r.endDate ?? null,
        JSON.stringify(r.times),
        r.weekdays ? JSON.stringify(r.weekdays) : null,
        r.intervalDays ?? null,
        r.pattern ? JSON.stringify(r.pattern) : null,
      );
    }
  });
}

/* ----------------------------- Occurrences ------------------------------ */

interface OccRow {
  id: string;
  medId: string;
  ruleId: string;
  scheduledTime: string;
  status: string;
  notificationId: string | null;
  parentOccurrenceId: string | null;
  snoozeCount: number;
  canceled: number;
  createdAt: string;
}

function rowToOcc(r: OccRow): Occurrence {
  return {
    id: r.id,
    medId: r.medId,
    ruleId: r.ruleId,
    scheduledTime: r.scheduledTime,
    status: r.status as Occurrence['status'],
    notificationId: r.notificationId ?? undefined,
    parentOccurrenceId: r.parentOccurrenceId ?? undefined,
    snoozeCount: r.snoozeCount,
    canceled: bool(r.canceled),
    createdAt: r.createdAt,
  };
}

export async function insertOccurrence(o: Occurrence): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO occurrences
       (id,medId,ruleId,scheduledTime,status,notificationId,
        parentOccurrenceId,snoozeCount,canceled,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?);`,
    o.id,
    o.medId,
    o.ruleId,
    o.scheduledTime,
    o.status,
    o.notificationId ?? null,
    o.parentOccurrenceId ?? null,
    o.snoozeCount,
    num(o.canceled),
    o.createdAt,
  );
}

export async function getOccurrence(id: string): Promise<Occurrence | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<OccRow>(
    'SELECT * FROM occurrences WHERE id = ?;',
    id,
  );
  return row ? rowToOcc(row) : null;
}

/** Occurrences in [fromIso, toIso], optionally filtered to one medication. */
export async function getOccurrencesBetween(
  fromIso: string,
  toIso: string,
  medId?: string,
): Promise<Occurrence[]> {
  const db = await getDb();
  const rows = medId
    ? await db.getAllAsync<OccRow>(
        `SELECT * FROM occurrences
         WHERE scheduledTime BETWEEN ? AND ? AND medId = ?
         ORDER BY scheduledTime;`,
        fromIso,
        toIso,
        medId,
      )
    : await db.getAllAsync<OccRow>(
        `SELECT * FROM occurrences
         WHERE scheduledTime BETWEEN ? AND ?
         ORDER BY scheduledTime;`,
        fromIso,
        toIso,
      );
  return rows.map(rowToOcc);
}

/** Latest scheduled occurrence for a rule — used to extend the horizon. */
export async function getLastOccurrenceTime(
  ruleId: string,
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ scheduledTime: string }>(
    'SELECT MAX(scheduledTime) as scheduledTime FROM occurrences WHERE ruleId = ?;',
    ruleId,
  );
  return row?.scheduledTime ?? null;
}

export async function updateOccurrenceStatus(
  id: string,
  status: Occurrence['status'],
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE occurrences SET status = ? WHERE id = ?;',
    status,
    id,
  );
}

export async function setOccurrenceNotificationId(
  id: string,
  notificationId: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE occurrences SET notificationId = ? WHERE id = ?;',
    notificationId,
    id,
  );
}

/** Cancels one occurrence, or a whole future series for a medication. */
export async function cancelOccurrences(
  medId: string,
  opts: { occurrenceId?: string; fromIso?: string },
): Promise<number> {
  const db = await getDb();
  if (opts.occurrenceId) {
    const res = await db.runAsync(
      'UPDATE occurrences SET canceled = 1 WHERE id = ?;',
      opts.occurrenceId,
    );
    return res.changes;
  }
  const res = await db.runAsync(
    `UPDATE occurrences SET canceled = 1
     WHERE medId = ? AND scheduledTime >= ? AND status = 'pending';`,
    medId,
    opts.fromIso ?? new Date().toISOString(),
  );
  return res.changes;
}

/* -------------------------------- Logs ---------------------------------- */

export async function appendLog(entry: LogEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO logs
       (id,occurrenceId,medId,scheduledTime,userAction,actionTime,source,note)
     VALUES (?,?,?,?,?,?,?,?);`,
    entry.id,
    entry.occurrenceId,
    entry.medId,
    entry.scheduledTime,
    entry.userAction,
    entry.actionTime,
    entry.source,
    entry.note ?? null,
  );
}

export async function getLogs(filter?: {
  medId?: string;
  fromIso?: string;
  toIso?: string;
}): Promise<LogEntry[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (filter?.medId) {
    where.push('medId = ?');
    args.push(filter.medId);
  }
  if (filter?.fromIso) {
    where.push('scheduledTime >= ?');
    args.push(filter.fromIso);
  }
  if (filter?.toIso) {
    where.push('scheduledTime <= ?');
    args.push(filter.toIso);
  }
  const sql =
    'SELECT * FROM logs' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY scheduledTime DESC;';
  return db.getAllAsync<LogEntry>(sql, ...args);
}

/* ------------------------------ Settings -------------------------------- */

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(
    'SELECT data FROM settings WHERE id = 1;',
  );
  return row
    ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.data) }
    : DEFAULT_SETTINGS;
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE settings SET data = ? WHERE id = 1;',
    JSON.stringify(s),
  );
}

/* ------------------------- Snooze overrides ----------------------------- */

export async function getSnoozeOverride(
  medId: string,
): Promise<MedicationSnoozeOverride | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    medId: string;
    snoozeIntervalMin: number | null;
    maxSnoozeRepeats: number | null;
  }>('SELECT * FROM snooze_overrides WHERE medId = ?;', medId);
  return row ?? null;
}

export async function setSnoozeOverride(
  o: MedicationSnoozeOverride,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO snooze_overrides
       (medId,snoozeIntervalMin,maxSnoozeRepeats) VALUES (?,?,?);`,
    o.medId,
    o.snoozeIntervalMin,
    o.maxSnoozeRepeats,
  );
}
