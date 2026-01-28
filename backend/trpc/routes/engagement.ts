import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";
import { getCheckinsDb, getGlucoseDb, getRemindersDb, shouldAccept } from "./engagement-store";

const ClientIdSchema = z
  .string()
  .min(6)
  .max(120)
  .regex(/^[a-zA-Z0-9_\-:.]+$/);

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

const EngagementStateSchema = z.object({
  entries: z.array(GlucoseEntrySchema),
  reminders: z.array(ReminderSchema),
  checkinsByDate: CheckinsByDateSchema,
});

type EngagementState = z.infer<typeof EngagementStateSchema>;

type Domain = "glucose" | "reminders" | "checkins";

function clampState(state: EngagementState): EngagementState {
  return {
    entries: state.entries.slice(0, 800),
    reminders: state.reminders.slice(0, 80),
    checkinsByDate: Object.fromEntries(Object.entries(state.checkinsByDate).slice(0, 800)),
  };
}

function domainUpdatedAtMs(input: {
  glucose?: number | null;
  reminders?: number | null;
  checkins?: number | null;
}): number {
  return Math.max(input.glucose ?? 0, input.reminders ?? 0, input.checkins ?? 0, 0);
}

export const engagementRouter = createTRPCRouter({
  ping: publicProcedure.query(() => {
    const nowIso = new Date().toISOString();
    console.log("[api.engagement.ping]", { nowIso });
    return { ok: true, nowIso };
  }),

  stats: publicProcedure.input(z.object({ clientId: ClientIdSchema })).query(({ input }) => {
    const glucoseDb = getGlucoseDb<EngagementState["entries"]>();
    const remindersDb = getRemindersDb<EngagementState["reminders"]>();
    const checkinsDb = getCheckinsDb<EngagementState["checkinsByDate"]>();

    const glucoseRec = glucoseDb.get(input.clientId) ?? null;
    const remindersRec = remindersDb.get(input.clientId) ?? null;
    const checkinsRec = checkinsDb.get(input.clientId) ?? null;

    const payload = {
      clientId: input.clientId,
      updatedAtMs: domainUpdatedAtMs({
        glucose: glucoseRec?.updatedAtMs ?? 0,
        reminders: remindersRec?.updatedAtMs ?? 0,
        checkins: checkinsRec?.updatedAtMs ?? 0,
      }),
      glucoseUpdatedAtMs: glucoseRec?.updatedAtMs ?? 0,
      remindersUpdatedAtMs: remindersRec?.updatedAtMs ?? 0,
      checkinsUpdatedAtMs: checkinsRec?.updatedAtMs ?? 0,
      entries: (glucoseRec?.value ?? []).length,
      reminders: (remindersRec?.value ?? []).length,
      checkinsDates: Object.keys(checkinsRec?.value ?? {}).length,
      dbSize: {
        glucose: glucoseDb.size,
        reminders: remindersDb.size,
        checkins: checkinsDb.size,
      },
    };

    console.log("[api.engagement.stats]", payload);
    return payload;
  }),

  pullAll: publicProcedure.input(z.object({ clientId: ClientIdSchema })).query(({ input }) => {
    const glucoseDb = getGlucoseDb<EngagementState["entries"]>();
    const remindersDb = getRemindersDb<EngagementState["reminders"]>();
    const checkinsDb = getCheckinsDb<EngagementState["checkinsByDate"]>();

    const glucoseRec = glucoseDb.get(input.clientId) ?? null;
    const remindersRec = remindersDb.get(input.clientId) ?? null;
    const checkinsRec = checkinsDb.get(input.clientId) ?? null;

    const state: EngagementState = {
      entries: glucoseRec?.value ?? [],
      reminders: remindersRec?.value ?? [],
      checkinsByDate: checkinsRec?.value ?? {},
    };

    const updatedAtMs = domainUpdatedAtMs({
      glucose: glucoseRec?.updatedAtMs ?? 0,
      reminders: remindersRec?.updatedAtMs ?? 0,
      checkins: checkinsRec?.updatedAtMs ?? 0,
    });

    console.log("[api.engagement.pullAll]", {
      clientId: input.clientId,
      updatedAtMs,
      entries: state.entries.length,
      reminders: state.reminders.length,
      checkinsDates: Object.keys(state.checkinsByDate).length,
    });

    return {
      state,
      updatedAtMs,
      domainUpdatedAtMs: {
        glucose: glucoseRec?.updatedAtMs ?? 0,
        reminders: remindersRec?.updatedAtMs ?? 0,
        checkins: checkinsRec?.updatedAtMs ?? 0,
      },
    };
  }),

  pushAll: publicProcedure
    .input(
      z.object({
        clientId: ClientIdSchema,
        updatedAtMs: z.number().int().nonnegative(),
        state: EngagementStateSchema,
      }),
    )
    .mutation(({ input }) => {
      const glucoseDb = getGlucoseDb<EngagementState["entries"]>();
      const remindersDb = getRemindersDb<EngagementState["reminders"]>();
      const checkinsDb = getCheckinsDb<EngagementState["checkinsByDate"]>();

      const existing = {
        glucose: glucoseDb.get(input.clientId)?.updatedAtMs ?? null,
        reminders: remindersDb.get(input.clientId)?.updatedAtMs ?? null,
        checkins: checkinsDb.get(input.clientId)?.updatedAtMs ?? null,
      };

      const existingMax = domainUpdatedAtMs(existing);
      const accepted = shouldAccept(input.updatedAtMs, existingMax);

      const next = clampState(input.state);

      console.log("[api.engagement.pushAll]", {
        clientId: input.clientId,
        incomingUpdatedAtMs: input.updatedAtMs,
        existingUpdatedAtMs: existingMax,
        accepted,
        entries: next.entries.length,
        reminders: next.reminders.length,
        checkinsDates: Object.keys(next.checkinsByDate).length,
      });

      if (accepted) {
        glucoseDb.set(input.clientId, { value: next.entries, updatedAtMs: input.updatedAtMs });
        remindersDb.set(input.clientId, { value: next.reminders, updatedAtMs: input.updatedAtMs });
        checkinsDb.set(input.clientId, { value: next.checkinsByDate, updatedAtMs: input.updatedAtMs });
      }

      const max = domainUpdatedAtMs({
        glucose: glucoseDb.get(input.clientId)?.updatedAtMs ?? 0,
        reminders: remindersDb.get(input.clientId)?.updatedAtMs ?? 0,
        checkins: checkinsDb.get(input.clientId)?.updatedAtMs ?? 0,
      });

      return {
        accepted,
        updatedAtMs: max,
      };
    }),

  pullDomain: publicProcedure
    .input(z.object({ clientId: ClientIdSchema, domain: z.enum(["glucose", "reminders", "checkins"]) }))
    .query(({ input }) => {
      const { clientId, domain } = input;

      if (domain === "glucose") {
        const db = getGlucoseDb<EngagementState["entries"]>();
        const rec = db.get(clientId) ?? null;
        console.log("[api.engagement.pullDomain]", { clientId, domain, updatedAtMs: rec?.updatedAtMs ?? 0 });
        return { domain, value: rec?.value ?? [], updatedAtMs: rec?.updatedAtMs ?? 0 };
      }

      if (domain === "reminders") {
        const db = getRemindersDb<EngagementState["reminders"]>();
        const rec = db.get(clientId) ?? null;
        console.log("[api.engagement.pullDomain]", { clientId, domain, updatedAtMs: rec?.updatedAtMs ?? 0 });
        return { domain, value: rec?.value ?? [], updatedAtMs: rec?.updatedAtMs ?? 0 };
      }

      const db = getCheckinsDb<EngagementState["checkinsByDate"]>();
      const rec = db.get(clientId) ?? null;
      console.log("[api.engagement.pullDomain]", { clientId, domain, updatedAtMs: rec?.updatedAtMs ?? 0 });
      return { domain, value: rec?.value ?? {}, updatedAtMs: rec?.updatedAtMs ?? 0 };
    }),

  pushDomain: publicProcedure
    .input(
      z.object({
        clientId: ClientIdSchema,
        domain: z.enum(["glucose", "reminders", "checkins"]),
        updatedAtMs: z.number().int().nonnegative(),
        value: z.union([z.array(GlucoseEntrySchema), z.array(ReminderSchema), CheckinsByDateSchema]),
      }),
    )
    .mutation(({ input }) => {
      const { clientId, domain, updatedAtMs, value } = input;

      const setDomain = (d: Domain, nextValue: unknown) => {
        if (d === "glucose") {
          const db = getGlucoseDb<EngagementState["entries"]>();
          const existing = db.get(clientId)?.updatedAtMs ?? null;
          const accepted = shouldAccept(updatedAtMs, existing);
          if (accepted) db.set(clientId, { value: nextValue as EngagementState["entries"], updatedAtMs });
          return { accepted, updatedAtMs: db.get(clientId)?.updatedAtMs ?? 0 };
        }

        if (d === "reminders") {
          const db = getRemindersDb<EngagementState["reminders"]>();
          const existing = db.get(clientId)?.updatedAtMs ?? null;
          const accepted = shouldAccept(updatedAtMs, existing);
          if (accepted) db.set(clientId, { value: nextValue as EngagementState["reminders"], updatedAtMs });
          return { accepted, updatedAtMs: db.get(clientId)?.updatedAtMs ?? 0 };
        }

        const db = getCheckinsDb<EngagementState["checkinsByDate"]>();
        const existing = db.get(clientId)?.updatedAtMs ?? null;
        const accepted = shouldAccept(updatedAtMs, existing);
        if (accepted) db.set(clientId, { value: nextValue as EngagementState["checkinsByDate"], updatedAtMs });
        return { accepted, updatedAtMs: db.get(clientId)?.updatedAtMs ?? 0 };
      };

      console.log("[api.engagement.pushDomain]", {
        clientId,
        domain,
        updatedAtMs,
        valueType: Array.isArray(value) ? "array" : "object",
      });

      return setDomain(domain, value);
    }),
});
