export type ClientId = string;

export type RecordWithUpdatedAt<T> = {
  value: T;
  updatedAtMs: number;
};

const memoryDb = globalThis as unknown as {
  __diacareEngagementDb?: {
    glucose: Map<ClientId, RecordWithUpdatedAt<unknown>>;
    reminders: Map<ClientId, RecordWithUpdatedAt<unknown>>;
    checkins: Map<ClientId, RecordWithUpdatedAt<unknown>>;
  };
};

function ensureDb() {
  if (!memoryDb.__diacareEngagementDb) {
    memoryDb.__diacareEngagementDb = {
      glucose: new Map<ClientId, RecordWithUpdatedAt<unknown>>(),
      reminders: new Map<ClientId, RecordWithUpdatedAt<unknown>>(),
      checkins: new Map<ClientId, RecordWithUpdatedAt<unknown>>(),
    };
  }

  return memoryDb.__diacareEngagementDb;
}

export function getGlucoseDb<T>() {
  return ensureDb().glucose as Map<ClientId, RecordWithUpdatedAt<T>>;
}

export function getRemindersDb<T>() {
  return ensureDb().reminders as Map<ClientId, RecordWithUpdatedAt<T>>;
}

export function getCheckinsDb<T>() {
  return ensureDb().checkins as Map<ClientId, RecordWithUpdatedAt<T>>;
}

export function shouldAccept(incomingUpdatedAtMs: number, existingUpdatedAtMs: number | null): boolean {
  if (!Number.isFinite(incomingUpdatedAtMs) || incomingUpdatedAtMs < 0) return false;
  if (existingUpdatedAtMs === null) return true;
  return incomingUpdatedAtMs >= existingUpdatedAtMs;
}
