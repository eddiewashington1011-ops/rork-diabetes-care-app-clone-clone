import { createTRPCRouter } from "./create-context";
import { engagementRouter } from "./routes/engagement";
import { exampleRouter } from "./routes/example";
import { syncRouter } from "./routes/sync";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  sync: syncRouter,
  engagement: engagementRouter,
});

export type AppRouter = typeof appRouter;
