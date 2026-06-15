import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini client lazily to prevent crash on startup if API key is missing
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables. Please check Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API Route for generating compliance summaries using gemini-3.5-flash
  app.post("/api/gemini/weekly-summary", async (req, res) => {
    try {
      const { companyName, logs } = req.body;

      if (!companyName) {
        return res.status(400).json({ error: "companyName is required" });
      }

      if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: "logs must be an array of AuditTrailEntry" });
      }

      // Proactively prompt user if key is missing helper
      let ai;
      try {
        ai = getAi();
      } catch (err: any) {
        return res.status(503).json({
          error: "API_KEY_MISSING",
          message: err.message || "Please provide your GEMINI_API_KEY in the Secrets settings."
        });
      }

      // Calculate the 7 days window (using current system time)
      const referenceTime = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const sevenDaysAgoTime = referenceTime - sevenDaysMs;

      // Also calculate relative to the latest log in case of historic simulation context
      let latestLogTime = referenceTime;
      if (logs.length > 0) {
        const timestamps = logs.map(l => new Date(l.timestamp).getTime()).filter(t => !isNaN(t));
        if (timestamps.length > 0) {
          latestLogTime = Math.max(...timestamps);
        }
      }
      const sevenDaysAgoFromLatest = latestLogTime - sevenDaysMs;

      // Filter: logs within the last 7 days of either current clock, OR last 7 days of simulated history log
      const filteredLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        if (isNaN(logTime)) return false;
        
        const inCurrentTimeWindow = logTime >= sevenDaysAgoTime && logTime <= referenceTime;
        const inHistoricTimeWindow = logTime >= sevenDaysAgoFromLatest && logTime <= latestLogTime;

        return inCurrentTimeWindow || inHistoricTimeWindow;
      });

      // Sort logs oldest to newest for cron order
      const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Format logs list for context feeding
      const logsSummaryText = sortedLogs.length > 0
        ? sortedLogs.map(l => {
            const dateStr = l.timestamp.includes("T") ? l.timestamp.split("T")[0] : l.timestamp;
            return `[${dateStr}] Rule ID ${l.ruleId} ("${l.ruleName}") -> Action: ${l.action.toUpperCase()} by ${l.username} (${l.role})${l.notes ? ` with notes: "${l.notes}"` : ''}`;
          }).join("\n")
        : "No audit trail logs recorded during the last 7 days.";

      const prompt = `You are a premium, Swiss-style corporate compliance officer and legal analyst specializing in the Bangladesh Companies Act 1994, National Board of Revenue (NBR) tax framework, and general corporate audit controls.

Please generate a high-level corporate Compliance Executive Summary covering the last 7 days of audit logging activities for "${companyName}".

=== 7-DAY COMPLIANCE LOG DATABASE ===
${logsSummaryText}
=====================================

Configure your response to conform strictly to the following sections:
1. EXECUTIVE ASSESSMENT: Provide a premium, objective synthesis of compliance metrics this week (evaluate count of triggers vs. acknowledgments vs. resolutions).
2. REGISTERED VIOLATIONS KEY RISK LEVEL: Focus on which critical statutory rules were breached (such as outstanding returns, AGM delays, auditor misses, missing registry documents, advance income tax defaults, or impending strike-off notifications received). Explain their implications and potential registrar penalties under the Companies Act 1994.
3. REMEDIAL ACTIONS TAKEN: Highlight the positive resolutions, acknowledgments, or administrative overrides executed by active users and operators this week.
4. PRIORITY FILING CHECKLIST (30-DAY OUTLOOK): Give a highly specific, bulleted technical task checklist summarizing immediate actions required (e.g. filing form VIII within 30 days, submitting annual general meeting list form XII, submitting form XV share allotment, or lodging monthly VAT digital returns prior to the 15th of the month) to ensure this entity remains in premium legal standings.

Keep your response factual, corporate, and beautifully detailed in elegant markdown layout format. Avoid any marketing filler words or flowery self-praise. Deliver an exceptional analytical output.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const summaryText = response.text || "No summary text returned from the model.";

      return res.json({
        summary: summaryText,
        analyzedLogsCount: sortedLogs.length,
        logs: sortedLogs
      });

    } catch (error: any) {
      console.error("Express Weekly Outline Summary Error:", error);
      return res.status(500).json({
        error: "SERVER_GENAI_ERROR",
        message: error?.message || "An outstanding exception occurred during GenAI analysis."
      });
    }
  });

  // API Route for Companies Act chatbot using gemini-3.5-flash
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { company, history, message } = req.body;

      if (!company) {
        return res.status(400).json({ error: "company is required" });
      }

      let ai;
      try {
        ai = getAi();
      } catch (err: any) {
        return res.status(503).json({
          error: "API_KEY_MISSING",
          message: err.message || "Please provide your GEMINI_API_KEY in the Secrets settings."
        });
      }

      // Prepare system instruction with precise company audit details
      const booleanFlags = Object.entries(company)
        .filter(([key, val]) => typeof val === 'boolean' && val === true)
        .map(([key]) => key)
        .join(", ");

      const systemInstruction = `You are a premium, Swiss-style corporate compliance officer and legal AI assistant specializing in the Bangladesh Companies Act 1994, National Board of Revenue (NBR) tax codes, and Registrar of Joint Stock Companies (RJSC) filing protocols.

You are interacting with a user regarding the company: "${company.name}" (Reg No: ${company.regNumber || 'N/A'}).

Current corporate parameters for "${company.name}":
- Incorporation Date: ${company.incorporationDate || 'N/A'}
- Authorized Capital: BDT ${company.authorizedCapital?.toLocaleString() || 'N/A'}
- Paid-Up Capital: BDT ${company.paidUpCapital?.toLocaleString() || 'N/A'}
- Board Members / Directors: ${company.totalDirectors || 'N/A'}
- Shareholders / Members: ${company.totalMembers || 'N/A'}
- Board Meetings Held: ${company.totalBoardMeetings || 'N/A'}
- Foreign Shareholding: ${company.foreignShareholding ? 'Yes' : 'No'}
- Trade License Active: ${company.tradeLicenseActive ? 'Yes' : 'No'}
- VAT Registered: ${company.vatRegistered ? 'Yes' : 'No'}
- TIN Obtained: ${company.tinObtained ? 'Yes' : 'No'}
- Impending Strike-off / Default: ${company.strikeOffImminent ? 'YES (CRITICAL)' : 'No'}

Active Red/Yellow checklist flags for this company:
${booleanFlags ? booleanFlags : 'None (Ideal compliance baseline)'}

Guidelines for your response:
1. Reference specific sections of the Bangladesh Companies Act 1994 when answering (such as Section 81 for AGMs, Section 119 for Annual Returns, Section 210 for Auditors, or Section 87 for Charge creation).
2. Proactively connect the user's questions about company law back to "${company.name}"'s specific audit states/flags if they are relevant to the query.
3. Keep answers high-contrast, informative, legal, and clear. Avoid fluff. Use elegant markdown like lists or bold text.`;

      // Format history + prompt into Gemini's expected contents structure
      const contents: any[] = [];
      
      if (Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        });
      }

      // Add the final user message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction
        }
      });

      return res.json({
        response: response.text || "No response received."
      });

    } catch (error: any) {
      console.error("Express Chat Bot Error:", error);
      return res.status(500).json({
        error: "SERVER_GENAI_ERROR",
        message: error?.message || "An outstanding exception occurred during GenAI analysis."
      });
    }
  });

  // Vite integration
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
    console.log(`Compliance full-stack server running successfully on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
