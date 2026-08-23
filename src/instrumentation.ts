// Runs once when the Next server boots: fail fast on invalid env (PLAN 0.2).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getConfig } = await import("@/lib/config");
    getConfig();
  }
}
