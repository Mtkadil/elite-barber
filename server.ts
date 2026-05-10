
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory token store (In production, use Firestore to persist these)
const tokenStore: Record<string, any> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Construct dynamic redirect URI
    const redirectUri = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.APP_NAME}.run.app/api/auth/google/callback`
      : `http://localhost:3000/api/auth/google/callback`;

    if (!clientId || !clientSecret || clientId.includes('...')) {
      return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  };

  // API: Get OAuth Authorization URL
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = getOAuthClient();
    if (!oauth2Client) return res.status(500).json({ error: "OAuth not configured" });

    const scopes = ["https://www.googleapis.com/auth/calendar"];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // Required to get refresh_token
      scope: scopes,
      prompt: "consent" // Force to get refresh_token every time for this demo
    });

    res.json({ url });
  });

  // API: OAuth Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuthClient();
    if (!oauth2Client || !code) return res.status(400).send("Invalid request");

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens globally for this session
      // In a real app, you'd save this to a database linked to the user/barber
      tokenStore['default'] = tokens;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              <h2>Connessione completata!</h2>
              <p>Questa finestra si chiuderà automaticamente.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // API Routes for Calendar
  app.get("/api/calendar/busy", async (req, res) => {
    try {
      const { calendarId, timeMin, timeMax } = req.query;
      const oauth2Client = getOAuthClient();
      const tokens = tokenStore['default'];

      if (!oauth2Client || !tokens) {
        return res.json({ busySlots: [], warning: "Calendar not authorized" });
      }

      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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
      const oauth2Client = getOAuthClient();
      const tokens = tokenStore['default'];

      if (!oauth2Client || !tokens) {
        return res.status(401).json({ error: "Calendar not authorized" });
      }

      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
