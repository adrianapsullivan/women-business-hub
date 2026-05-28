import { jsPDF } from "jspdf";

const DNA_ARCHETYPES: Record<string, { archetype: string; description: string }> = {
  "Strategic Builder": {
    archetype: "The Builder",
    description: "You are wired to construct empires from the ground up — systems, structures, and scalable engines.",
  },
  "Action Taker": {
    archetype: "The Builder",
    description: "You are wired to construct empires from the ground up — momentum, execution, and relentless forward motion.",
  },
  "Legacy Builder": {
    archetype: "The Builder",
    description: "You are wired to construct empires from the ground up — built to last, built to outlive you.",
  },
  "Visionary Leader": {
    archetype: "The Creator",
    description: "You are wired to create what doesn't exist yet — ideas, movements, and transformational experiences.",
  },
  "Knowledge Authority": {
    archetype: "The Creator",
    description: "You are wired to create what doesn't exist yet — turning expertise into authority and impact.",
  },
  "Freedom Strategist": {
    archetype: "The Creator",
    description: "You are wired to create what doesn't exist yet — building on your own terms, by design.",
  },
  "Community Builder": {
    archetype: "The Connector",
    description: "You are wired to bring people together — belonging, transformation, and collective power.",
  },
  "Influence Creator": {
    archetype: "The Connector",
    description: "You are wired to bring people together — influence, relationships, and amplified reach.",
  },
};

export interface BlueprintData {
  dnaType: string;
  transformation: {
    whoToHelp: string;
    specificResult: string;
    whyMatters: string;
    whyYou: string;
  };
}

const GOLD = "#D4AF37";
const DARK = "#1a1a1a";
const MID = "#555555";
const LIGHT = "#888888";
const RULE = "#e0d5c0";

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function generateBlueprintPDF(data: BlueprintData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;

  // ── Background ────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 297, "F");

  // ── Top gold bar ──────────────────────────────────────────
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 0, W, 6, "F");

  // ── Header ────────────────────────────────────────────────
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(LIGHT);
  doc.text("WOMEN BUSINESS EMPIRES", margin, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(GOLD);
  doc.text("YOUR EMPIRE BLUEPRINT", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(LIGHT);
  doc.text("A personalised foundation document — keep this close.", margin, y);
  y += 8;

  // Horizontal rule
  doc.setDrawColor(RULE);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Section 1: DNA Identity ───────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(GOLD);
  doc.text("YOUR ENTREPRENEUR DNA", margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(DARK);
  doc.text(data.dnaType, margin, y);
  y += 10;

  // ── Section 2: Empire Archetype ───────────────────────────
  const archetypeInfo = DNA_ARCHETYPES[data.dnaType];
  if (archetypeInfo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(GOLD);
    doc.text("YOUR EMPIRE ARCHETYPE", margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(DARK);
    doc.text(archetypeInfo.archetype, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MID);
    y = addWrappedText(doc, archetypeInfo.description, margin, y, contentW, 5);
    y += 8;
  }

  // Horizontal rule
  doc.setDrawColor(RULE);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Section 3: Transformation Answers ─────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.text("YOUR FOUNDATION ANSWERS", margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(LIGHT);
  doc.text("These are your WHY — return to them whenever you feel stuck.", margin, y);
  y += 10;

  const questions = [
    { label: "WHO DO YOU WANT TO HELP?", value: data.transformation.whoToHelp },
    { label: "WHAT SPECIFIC RESULT WILL YOU CREATE FOR THEM?", value: data.transformation.specificResult },
    { label: "WHY DOES THIS MATTER TO YOU?", value: data.transformation.whyMatters },
    { label: "WHY ARE YOU UNIQUELY POSITIONED TO DO THIS?", value: data.transformation.whyYou },
  ];

  for (const q of questions) {
    // Light gold background box
    const boxStartY = y - 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(GOLD);
    doc.text(q.label, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(DARK);
    const beforeY = y;
    y = addWrappedText(doc, q.value || "—", margin, y, contentW, 5.5);

    // Draw left accent bar
    const boxH = y - boxStartY + 2;
    doc.setFillColor(212, 175, 55);
    doc.rect(margin - 4, boxStartY, 1.5, boxH, "F");

    y += 8;
  }

  // Horizontal rule
  doc.setDrawColor(RULE);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Section 4: Closing message ────────────────────────────
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(DARK);
  const closing = "Return to this whenever you feel stuck, lose momentum, or need to reconnect with your WHY. This is your north star.";
  y = addWrappedText(doc, closing, margin, y, contentW, 6);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(LIGHT);
  doc.text("womenbusinessempires.com", margin, y);

  // ── Bottom gold bar ───────────────────────────────────────
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 291, W, 6, "F");

  // ── Save ──────────────────────────────────────────────────
  const safeName = data.dnaType.toLowerCase().replace(/\s+/g, "-");
  doc.save(`wbe-empire-blueprint-${safeName}.pdf`);
}
