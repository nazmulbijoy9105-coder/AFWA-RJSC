import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, onSnapshot, getDoc, setDoc, setLogLevel } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

// Set the Firestore log level to 'error' to prevent verbose internal gRPC idle connection/stream-cancelled warnings on the backend
setLogLevel('error');

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

  // Set of Rule IDs with RED severity to observe key compliance triggers
  const RED_RULE_IDS = new Set([
    'AGM-001', 'AGM-002', 'AGM-004', 'AGM-005',
    'INC-001', 'INC-003', 'INC-007', 'REG-002',
    'TAX-001', 'TAX-003', 'TAX-008', 'TAX-010',
    'AR-002', 'DIR-003', 'DIR-004', 'DIR-007',
    'ESC-001', 'AUD-002', 'AUD-005', 'TR-006',
    'ALT-001', 'ALT-002', 'BRD-003', 'SH-005'
  ]);

  function initCloudFunctionTrigger(firestoreDb: any) {
    console.log("[Firebase Cloud Function] Background trigger listener for 'RED' compliance rules started...");
    
    let isInitialLoad = true;
    
    onSnapshot(collection(firestoreDb, "auditTrails"), async (snapshot: any) => {
      // Skip processing documents during initial load to target new triggers specifically
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const data = change.doc.data();
          const ruleId = data.ruleId;
          const isTriggered = data.action === 'triggered';
          
          if (isTriggered && RED_RULE_IDS.has(ruleId)) {
            console.log(`[Firebase Cloud Function] ALERT: 'RED' severity rule ${ruleId} ("${data.ruleName}") triggered for company ${data.companyId}! Preparing notification summary...`);
            
            try {
              // 1. Retrieve the company to look up its legal name and director email
              const companyDocRef = doc(firestoreDb, "companies", data.companyId);
              const companyDoc = await getDoc(companyDocRef);
              
              if (companyDoc.exists()) {
                const companyData = companyDoc.data();
                const companyName = companyData.name;
                const directorEmail = companyData.directorEmail || `director@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
                
                console.log(`[Firebase Cloud Function] Recipient email for alert is: ${directorEmail}`);
                
                // 2. Draft a beautiful automated Swiss-style urgent statutory warning using Gemini-3.5-flash with a deep link
                const emailSubject = `🚨 IMMEDIATE ACTION REQUIRED: 'RED' Severity Compliance Default at ${companyName}`;
                let emailBody = "";
                
                const baseUrl = process.env.APP_URL || "https://ais-pre-cnig3iwv3lsd7cmhndklpd-473976782025.asia-southeast1.run.app";
                const auditLink = `${baseUrl}/?tab=trail&id=${data.id}&companyId=${data.companyId}`;

                try {
                  const ai = getAi();
                  const prompt = `You are an automated corporate compliance officer robot acting as a background Firebase Cloud Function for Bangladesh local company statutory checks.
                  
                  An urgent 'RED' severity compliance default has been triggered for the company: "${companyName}".
                  
                  Default Details:
                  - Rule Code: ${ruleId}
                  - Rule Name: ${data.ruleName}
                  - Trigger Time: ${data.timestamp}
                  - Initiated By: ${data.username} (${data.role})
                  - Compliance Comments: ${data.notes || "Emergency warnings issued."}
                  - Specific Audit Entry Deep-Link: [View Audit Entry](${auditLink})
                  
                  Please draft a highly authoritative, immediate-action, corporate compliance email addressed directly to the Company Director at "${directorEmail}".
                  Format:
                  1. CLEAR STATUTORY WARNING: State that a critical regulatory violation occurred under local Bangladesh corporate laws and that it must be cured immediately.
                  2. ASSOCIATED PENALTIES: Explain potential RJSC/NBR consequences (e.g. compounding fines, audit blocks, or public strike-off lists).
                  3. TASK REMEDIAL PLAN: Detail 3 precise procedural steps (such as board validation meetings, physical registry updates, and form filing uploads) required on the dashboard to clear the warning badge.
                  4. SPECIFIC AUDIT ENTRY LINK: You MUST explicitly include the provided Specific Audit Entry Deep-Link (${auditLink}) inside the email body so the director can click the link and immediately inspect the exact compliance issue.
                  
                  Respond in crisp, professional, clean markdown. Do not include flowery self-congratulations or standard preamble. Begin the email immediately.`;
                  
                  const aiResponse = await ai.models.generateContent({
                    model: "gemini-3.5-flash",
                    contents: prompt,
                  });
                  
                  emailBody = aiResponse.text || `Dear Director of ${companyName},\n\nA 'RED' severity compliance default has occurred regarding rule ${data.ruleName} (${ruleId}).\n\nPlease resolve this immediately to prevent statutory RJSC fines and legal penalties.\n\nLink to specific audit entry: ${auditLink}`;
                } catch (err) {
                  console.error("[Firebase Cloud Function] GenAI automated draft failed, using local reserve template:", err);
                  emailBody = `Dear Director of ${companyName},\n\nThis is an automated legal compliance warning sent by the system's background Firebase Cloud Function trigger.
                  
A 'RED' severity compliance default has been registered under local Bangladesh corporate statutes:
                  
Rule Code: ${ruleId}
Rule Title: ${data.ruleName}
Recorded On: ${data.timestamp}
Audit Link: ${auditLink}

PENALTIES & IMPLICATIONS:
Under the Companies Act 1994, default to file required lists (e.g., Form XII, Form XI, or certified audits) on time leaves directors vulnerable to fines, filing bans, and risk of administrative strike-offs.

REMEDIAL TASK WORKFLOW:
1. Click the specific audit link above or log into the local RJSC Compliance Admin Desk: ${auditLink}
2. Formulate and upload your certified documents synchronously.
3. Mark the violation as cleared or request a manager override status on your dashboard.

Sincerely,
Automated Compliance Officer
AFWA Vanguard Core.`;
                }
                
                // 3. Persist the email log in Firestore collection 'sentEmails'
                const emailLogId = "mail_" + Math.random().toString(36).substring(2, 9);
                const emailLogDoc = {
                  id: emailLogId,
                  companyId: data.companyId,
                  companyName: companyName,
                  directorEmail: directorEmail,
                  ruleId: ruleId,
                  ruleName: data.ruleName,
                  subject: emailSubject,
                  body: emailBody,
                  timestamp: new Date().toISOString()
                };
                
                await setDoc(doc(firestoreDb, "sentEmails", emailLogId), emailLogDoc);
                console.log(`[Firebase Cloud Function] Urgent compliance email successfully saved in sentEmails collection: ${emailLogId}. Sent email simulated to director address: ${directorEmail}`);
              }
            } catch (err) {
              console.error("[Firebase Cloud Function] Error processing RED trigger email notification:", err);
            }
          }
        }
      }
    }, (error: any) => {
      console.error("[Firebase Cloud Function] Error on active snapshot listener:", error);
    });
  }

  // Load Firebase config dynamically and start background trigger syncer
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const firebaseApp = initializeApp(firebaseConfig);
      const firestoreDb = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
      console.log(`[Firebase Cloud Function] Server-side Firebase App initialized dynamically.`);
      initCloudFunctionTrigger(firestoreDb);
    } else {
      console.warn("[Firebase Cloud Function] Warning: firebase-applet-config.json is absent. Background triggers remain inactive.");
    }
  } catch (firebaseInitErr) {
    console.error("[Firebase Cloud Function] Error initializing server-side Firebase trigger:", firebaseInitErr);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Compliance full-stack server running successfully on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
