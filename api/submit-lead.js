// /api/submit-lead.js — Vercel Serverless Function (CommonJS)
// CommonJS is required — no "export default", no "import" statements.
// Vercel Node.js runtime uses CommonJS by default for .js files.

const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";
const BREVO_LIST_ID = 3; // "Consultation Leads"
const OPTION_SETS = {
  TATTOO_SIZE: ["Extra small (under 2 in)", "Small (2–4 in)", "Medium (4–6 in)", "Large (6–10 in)", "Extra large / sleeve / back piece"],
  TATTOO_AGE: ["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"],
  TATTOO_LOCATION: ["Arm / forearm", "Hand / fingers", "Chest", "Back / shoulder", "Leg / thigh", "Foot / ankle", "Neck", "Face / brows / lips", "Other"],
  SKIN_TONE: ["Type I — very fair, always burns", "Type II — fair, burns easily", "Type III — medium, sometimes burns", "Type IV — olive, rarely burns", "Type V — brown, very rarely burns", "Type VI — deep brown, never burns", "Not sure"],
  REMOVAL_GOAL: ["Full removal", "Fading for cover-up", "Not sure"],
  PREFERRED_CONTACT: ["Text", "Call", "Email"],
  TATTOO_COLORS: ["Black/Gray", "Red", "Orange/Yellow", "Green", "Blue", "Purple/Pink", "White/Skin-tone"],
};

function text(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length <= maxLength ? normalized : "";
}

function option(value, options) {
  const normalized = text(value, 120);
  return options.includes(normalized) ? normalized : "";
}

function phoneNumber(value) {
  const digits = text(value, 32).replace(/\D/g, "");
  const tenDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(tenDigits) ? `+1${tenDigits}` : "";
}

function colors(value) {
  const selected = text(value, 160).split(",").map(color => color.trim()).filter(Boolean);
  return selected.every(color => OPTION_SETS.TATTOO_COLORS.includes(color)) ? selected.join(", ") : "";
}

module.exports = async function handler(req, res) {

  // ── CORS ──────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Environment check ──────────────────────────────────────────────────
  if (!process.env.BREVO_API_KEY) {
    console.error("[submit-lead] BREVO_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error — API key missing." });
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== "object") throw new Error("Empty body");
  } catch (e) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  // ── Validate required fields ───────────────────────────────────────────
  const email = (body.email || "").trim().toLowerCase();
  const firstName = (body.firstName || "").trim();
  const lastName = (body.lastName || "").trim();
  const phone = (body.phone || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!firstName) {
    return res.status(400).json({ error: "First name is required." });
  }

  // ── Build Brevo attributes (exact attribute IDs — do not rename) ───────
  const attributes = {};

  // Standard Brevo fields
  if (firstName)              attributes.FIRSTNAME          = firstName;
  if (lastName)               attributes.LASTNAME           = lastName;
  if (phone)                  attributes.SMS                = phone;
  if (phone)                  attributes.PHONE              = phone;

  // Custom tattoo fields
  if (body.CITY)              attributes.CITY               = body.CITY;
  if (body.TATTOO_SIZE)       attributes.TATTOO_SIZE        = body.TATTOO_SIZE;
  if (body.TATTOO_AGE)        attributes.TATTOO_AGE         = body.TATTOO_AGE;
  if (body.TATTOO_LOCATION)   attributes.TATTOO_LOCATION    = body.TATTOO_LOCATION;
  if (body.SKIN_TONE)         attributes.SKIN_TONE          = body.SKIN_TONE;
  if (body.TATTOO_COLORS)     attributes.TATTOO_COLORS      = body.TATTOO_COLORS;
  if (body.REMOVAL_GOAL)      attributes.REMOVAL_GOAL       = body.REMOVAL_GOAL;
  if (body.PREFERRED_CONTACT) attributes.PREFERRED_CONTACT  = body.PREFERRED_CONTACT;

  // Media
  if (body.PHOTO_URL)         attributes.PHOTO_URL          = body.PHOTO_URL;
  if (body.IMAGE_URL)         attributes.IMAGE_URL          = body.IMAGE_URL;

  // Consent & CRM
  attributes.SMS_OPT_IN        = body.SMS_OPT_IN || "No";
  attributes.CONSENT_TIMESTAMP = body.CONSENT_TIMESTAMP || new Date().toISOString();
  attributes.LEAD_SOURCE       = body.LEAD_SOURCE || "Landing Page";
  attributes.BOOKING_STATUS    = body.BOOKING_STATUS || "Lead";

  // ── Brevo upsert payload ───────────────────────────────────────────────
  // updateEnabled:true = upsert (create OR update — prevents duplicates)
  // listIds = adds to "Consultation Leads" list → triggers your automations
  const brevoPayload = {
    email,
    attributes,
    listIds: [BREVO_LIST_ID],
    updateEnabled: true,
  };

  // ── Call Brevo API ─────────────────────────────────────────────────────
  try {
    const brevoRes = await fetch(BREVO_CONTACTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(brevoPayload),
    });

    // 201 = new contact, 204 = updated existing — both are success
    if (brevoRes.status === 201 || brevoRes.status === 204) {
      console.log("[submit-lead] OK — contact upserted:", email);
      return res.status(200).json({ success: true });
    }

    // Parse Brevo error
    let errBody = { message: "Unknown Brevo error" };
    try { errBody = await brevoRes.json(); } catch (_) {}

    // Brevo returns 400 + code "duplicate_parameter" when contact is
    // already in the list with identical data — treat as success
    if (brevoRes.status === 400 && errBody.code === "duplicate_parameter") {
      console.log("[submit-lead] Contact already up to date:", email);
      return res.status(200).json({ success: true });
    }

    console.error("[submit-lead] Brevo error", brevoRes.status, errBody);
    return res.status(502).json({ error: errBody.message || "Brevo error." });

  } catch (err) {
    console.error("[submit-lead] Network error:", err.message);
    return res.status(502).json({ error: "Network error — please try again." });
  }
};
