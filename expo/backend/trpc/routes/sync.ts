import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const GlucoseContextSchema = z.enum(["fasting", "beforeMeal", "afterMeal", "bedtime", "other"]);

const GlucoseEntrySchema = z.object({
  id: z.string(),
  valueMgDl: z.number().int().positive(),
  context: GlucoseContextSchema,
  note: z.string(),
  createdAt: z.string(),
});

const ReminderTypeSchema = z.enum(["glucose", "meds", "hydrate", "walk", "custom"]);

const ReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ReminderTypeSchema,
  time: z.string(),
  enabled: z.boolean(),
  notificationId: z.string().nullable(),
  snoozedUntilIso: z.string().nullable(),
  snoozeNotificationId: z.string().nullable(),
});

const CheckinsSchema = z
  .object({
    logGlucose: z.boolean().optional(),
    move: z.boolean().optional(),
    hydrate: z.boolean().optional(),
    noSugaryDrink: z.boolean().optional(),
  })
  .strict();

const CheckinsByDateSchema = z.record(z.string(), CheckinsSchema);

const SyncStateSchema = z.object({
  entries: z.array(GlucoseEntrySchema),
  reminders: z.array(ReminderSchema),
  checkinsByDate: CheckinsByDateSchema,
});

type SyncState = z.infer<typeof SyncStateSchema>;

type SyncRecord = {
  state: SyncState;
  updatedAtMs: number;
};

const memoryDb = globalThis as unknown as {
  __diacareSyncDb?: Map<string, SyncRecord>;
};

function getDb(): Map<string, SyncRecord> {
  if (!memoryDb.__diacareSyncDb) {
    memoryDb.__diacareSyncDb = new Map<string, SyncRecord>();
  }
  return memoryDb.__diacareSyncDb;
}

const ClientIdSchema = z
  .string()
  .min(6)
  .max(120)
  .regex(/^[a-zA-Z0-9_\-:.]+$/);

function sanitizeState(state: SyncState): SyncState {
  return {
    entries: state.entries.slice(0, 800),
    reminders: state.reminders.slice(0, 80),
    checkinsByDate: Object.fromEntries(Object.entries(state.checkinsByDate).slice(0, 800)),
  };
}

export const syncRouter = createTRPCRouter({
  ping: publicProcedure.query(() => {
    const nowIso = new Date().toISOString();
    console.log("[api.sync.ping]", { nowIso });
    return { ok: true, nowIso };
  }),

  stats: publicProcedure.input(z.object({ clientId: ClientIdSchema })).query(({ input }) => {
    const db = getDb();
    const rec = db.get(input.clientId) ?? null;

    const state = rec?.state ?? { entries: [], reminders: [], checkinsByDate: {} };

    const payload = {
      hasRecord: Boolean(rec),
      updatedAtMs: rec?.updatedAtMs ?? 0,
      entries: state.entries.length,
      reminders: state.reminders.length,
      checkinsDates: Object.keys(state.checkinsByDate).length,
      dbSize: db.size,
    };

    console.log("[api.sync.stats]", { clientId: input.clientId, ...payload });

    return payload;
  }),

  reset: publicProcedure
    .input(z.object({ clientId: ClientIdSchema }))
    .mutation(({ input }) => {
      const db = getDb();
      const existed = db.delete(input.clientId);
      console.log("[api.sync.reset]", { clientId: input.clientId, existed, dbSize: db.size });
      return { ok: true, existed };
    }),

  pull: publicProcedure
    .input(z.object({ clientId: ClientIdSchema }))
    .query(({ input }) => {
      const db = getDb();
      const rec = db.get(input.clientId) ?? null;

      console.log("[api.sync.pull]", {
        clientId: input.clientId,
        hasRecord: Boolean(rec),
        updatedAtMs: rec?.updatedAtMs ?? null,
      });

      return {
        state: rec?.state ?? { entries: [], reminders: [], checkinsByDate: {} },
        updatedAtMs: rec?.updatedAtMs ?? 0,
      };
    }),

  push: publicProcedure
    .input(
      z.object({
        clientId: ClientIdSchema,
        state: SyncStateSchema,
        updatedAtMs: z.number().int().nonnegative(),
      }),
    )
    .mutation(({ input }) => {
      const db = getDb();
      const existing = db.get(input.clientId) ?? null;
      const shouldAccept = !existing || input.updatedAtMs >= existing.updatedAtMs;

      const nextState = sanitizeState(input.state);

      console.log("[api.sync.push]", {
        clientId: input.clientId,
        incomingUpdatedAtMs: input.updatedAtMs,
        existingUpdatedAtMs: existing?.updatedAtMs ?? null,
        accepted: shouldAccept,
        entries: nextState.entries.length,
        reminders: nextState.reminders.length,
        checkinsDates: Object.keys(nextState.checkinsByDate).length,
        dbSize: db.size,
      });

      if (shouldAccept) {
        db.set(input.clientId, { state: nextState, updatedAtMs: input.updatedAtMs });
      }

      const rec = db.get(input.clientId) ?? null;
      return {
        accepted: shouldAccept,
        updatedAtMs: rec?.updatedAtMs ?? 0,
      };
    }),
});
