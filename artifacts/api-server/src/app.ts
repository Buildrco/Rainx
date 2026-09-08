import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getDb, sendPushToUser } from "./lib/pushNotify";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Payment confirmation push notifications ─────────────────────────────────
// Listen for payments.status → "confirmed" and push a notification to the user.
const db = getDb();
if (db) {
  db.channel("payment-confirmations")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "payments" },
      async (payload: any) => {
        const newRow = payload.new as { status?: string; user_id?: string; plan?: string };
        if (newRow.status !== "confirmed" || !newRow.user_id) return;
        const planLabel =
          newRow.plan === "weekly"  ? "Weekly"  :
          newRow.plan === "monthly" ? "Monthly" :
          newRow.plan === "yearly"  ? "Yearly"  : "Premium";
        try {
          await sendPushToUser(
            newRow.user_id,
            "Subscription Confirmed! 🎉",
            `Your ${planLabel} subscription is now active. Enjoy RainX Premium!`,
            { category: "money", url: "/" }
          );
        } catch {}
      }
    )
    .subscribe();

  db.channel("security-alert-emails")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "security_alerts" },
      async (payload: any) => {
        const alert = payload.new as {
          id?: string;
          user_id?: string;
          email?: string | null;
          title?: string;
          body?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          email_status?: string;
        };
        if (!alert.id || !alert.user_id || alert.email_status !== "pending") return;

        await sendPushToUser(
          alert.user_id,
          alert.title || "RainX security alert",
          alert.body || "A security event was recorded on your RainX account.",
          { category: "system", type: "security_alert", alertId: alert.id },
        ).catch(() => {});

        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey || !alert.email) {
          await db.from("security_alerts").update({ email_status: "not_configured" }).eq("id", alert.id);
          return;
        }

        const details = [
          alert.body,
          "",
          `IP address: ${alert.ip_address || "Unavailable"}`,
          `User agent: ${alert.user_agent || "Unavailable"}`,
          "If this was not you, change your password and review Active Sessions immediately.",
        ].filter(Boolean).join("\n");

        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "RainX Security <security@rainx.app>",
              to: [alert.email],
              subject: alert.title || "RainX security alert",
              text: details,
            }),
            signal: AbortSignal.timeout(15_000),
          });
          await db.from("security_alerts").update({
            email_status: response.ok ? "sent" : "failed",
          }).eq("id", alert.id);
        } catch {
          await db.from("security_alerts").update({ email_status: "failed" }).eq("id", alert.id);
        }
      },
    )
    .subscribe();
}

export default app;
