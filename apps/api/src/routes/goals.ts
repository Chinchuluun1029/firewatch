import { Hono } from "hono";

/**
 * FIRE goal routes — CRUD for FIRE goals and milestones.
 * Stub routes for scaffolding. Real implementation in Milestone 1.
 */
export const goalsRoute = new Hono()
  .get("/", (c) => {
    return c.json({ goals: [], message: "Goals listing — coming soon" });
  })
  .post("/", (c) => {
    return c.json({ message: "Create goal — coming soon" }, 201);
  });
