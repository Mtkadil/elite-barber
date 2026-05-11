import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Calendar Helper (Service Account Version)
  const getCalendarClient = () => {
    const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!credsJson) {
      console.warn("GOOGLE_SERVICE_ACCOUNT_JSON is not set in environment.");
      return null;
    }

    try {
      const credentials = JSON.parse(credsJson);
      
      // Use the modern GoogleAuth helper which manages token refreshes and scopes automatically
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      
      return google.calendar({ version: "v3", auth });
    } catch (err) {
      console.error("Failed to initialize Google Calendar client:", err);
      return null;
    }
  };

  // API Routes
  app.get("/api/calendar/busy", async (req, res) => {
    try {
      const { calendarId, timeMin, timeMax } = req.query;
      if (!calendarId) return res.status(400).json({ error: "Missing calendarId" });

      const calendar = getCalendarClient();
      if (!calendar) {
        return res.json({ busySlots: [], warning: "Calendar not configured" });
      }

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin as string,
          timeMax: timeMax as string,
          items: [{ id: calendarId as string }],
        },
      });

      const busySlots = response.data.calendars?.[calendarId as string]?.busy || [];
      res.json({ busySlots });
    } catch (error) {
      console.error("Calendar Busy Error:", error);
      res.status(500).json({ error: "Failed to fetch calendar status" });
    }
  });

  app.post("/api/calendar/event", async (req, res) => {
    try {
      const { calendarId, summary, description, start, end } = req.body;
      if (!calendarId) return res.status(400).json({ error: "Missing calendarId" });

      const calendar = getCalendarClient();
      if (!calendar) {
        return res.status(501).json({ error: "Calendar not configured" });
      }

      const response = await calendar.events.insert({
        calendarId: calendarId as string,
        requestBody: {
          summary,
          description,
          start: { dateTime: start },
          end: { dateTime: end },
        },
      });

      res.json({ event: response.data });
    } catch (error) {
      console.error("Calendar Event Error:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });

  // Use __dirname to avoid unused variable error
  const distPath = path.join(__dirname, "dist");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
