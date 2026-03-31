import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { SharedSimulationDetail } from "../api";

type ChartRef = {
  current: HTMLDivElement | null;
};

export async function downloadSimulationPDF(
  sim: SharedSimulationDetail,
  chartRef: ChartRef
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addText = (text: string, size = 10, bold = false) => {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, contentW);
    pdf.text(lines, margin, y);
    y += lines.length * (size * 0.4) + 2;
  };

  const addSectionTitle = (title: string) => {
    y += 3;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, contentW, 7, "F");
    addText(title, 11, true);
    y += 1;
  };

  const addKeyValue = (label: string, value: string | number | null | undefined, unit = "") => {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}: `, margin, y);
    const labelWidth = pdf.getTextWidth(`${label}: `);
    pdf.setFont("helvetica", "normal");
    const textValue = value == null ? "N/A" : String(value);
    pdf.text(`${textValue}${unit ? ` ${unit}` : ""}`, margin + labelWidth, y);
    y += 6;
  };

  const checkPageBreak = (neededHeight = 20) => {
    if (y + neededHeight > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const safeNumber = (value: unknown, digits: number) =>
    typeof value === "number" ? value.toFixed(digits) : "N/A";

  const therapeuticEval = sim.therapeutic_eval ?? {};
  const patientContext = sim.patient_context ?? {};
  const therapeuticWindow = sim.therapeutic_window ?? {};
  const adeScreening = sim.ade_screening ?? {};

  pdf.setFillColor(30, 64, 175);
  pdf.rect(0, 0, pageW, 22, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("PK Simulation Report", margin, 14);
  pdf.setTextColor(0, 0, 0);
  y = 30;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  pdf.text(`Simulation ID: ${sim.id ?? "-"}`, pageW - margin, y, { align: "right" });
  pdf.setTextColor(0, 0, 0);
  y += 8;

  addSectionTitle("Medication and Dosing");
  addKeyValue("Medication", sim.medication_name ?? null);
  addKeyValue("Dose", sim.dose_mg ?? null, "mg");
  addKeyValue("Dosing Interval", sim.interval_hr ?? null, "hr");
  addKeyValue("Simulation Duration", sim.duration_hr ?? null, "hr");

  checkPageBreak(40);
  addSectionTitle("Pharmacokinetic Metrics");
  addKeyValue("Cmax", safeNumber(sim.cmax_mg_l, 4), "mg/L");
  addKeyValue("Cmin", safeNumber(sim.cmin_mg_l, 4), "mg/L");
  addKeyValue("AUC", safeNumber(sim.auc_mg_h_l, 4), "mg*h/L");

  y += 2;
  const flagColor = sim.flag_too_high || sim.flag_too_low ? [200, 0, 0] : [0, 140, 0];
  pdf.setTextColor(flagColor[0], flagColor[1], flagColor[2]);
  addText(
    `Flags: ${sim.flag_too_high ? "Concentration TOO HIGH  " : ""}${sim.flag_too_low ? "Concentration TOO LOW" : ""}${!sim.flag_too_high && !sim.flag_too_low ? "None - within therapeutic range" : ""}`,
    10,
    true
  );
  pdf.setTextColor(0, 0, 0);

  checkPageBreak(30);
  addSectionTitle("Therapeutic Window");
  addKeyValue(
    "Lower Bound",
    safeNumber((therapeuticWindow as Record<string, unknown>).lower_mg_l, 4),
    "mg/L"
  );
  addKeyValue(
    "Upper Bound",
    safeNumber((therapeuticWindow as Record<string, unknown>).upper_mg_l, 4),
    "mg/L"
  );
  addKeyValue("Source", (therapeuticWindow as Record<string, unknown>).source as string | null);

  checkPageBreak(40);
  addSectionTitle("Therapeutic Evaluation");
  Object.entries(therapeuticEval as Record<string, unknown>).forEach(([k, v]) => {
    addKeyValue(k, typeof v === "number" ? v.toFixed(3) : String(v));
    checkPageBreak(8);
  });

  checkPageBreak(50);
  addSectionTitle("Patient Context");
  const patientFields: Array<[string, unknown, string]> = [
    ["Age", (patientContext as Record<string, unknown>).age, ""],
    ["Sex", (patientContext as Record<string, unknown>).sex, ""],
    ["Weight", (patientContext as Record<string, unknown>).weight_kg, "kg"],
    ["Height", (patientContext as Record<string, unknown>).height_cm, "cm"],
    ["Serum Creatinine", (patientContext as Record<string, unknown>).serum_creatinine_mg_dl, "mg/dL"],
    ["Creatinine Clearance", (patientContext as Record<string, unknown>).creatinine_clearance_ml_min, "mL/min"],
    ["CKD Stage", (patientContext as Record<string, unknown>).ckd_stage, ""],
    ["Pregnant", (patientContext as Record<string, unknown>).is_pregnant, ""],
    ["Liver Disease", (patientContext as Record<string, unknown>).liver_disease_status, ""],
    ["Albumin", (patientContext as Record<string, unknown>).albumin_g_dl, "g/dL"],
  ];
  patientFields.forEach(([label, val, unit]) => {
    checkPageBreak(8);
    addKeyValue(label, val == null ? null : String(val), unit);
  });

  const conditions = (patientContext as Record<string, unknown>).conditions;
  if (Array.isArray(conditions) && conditions.length > 0) {
    checkPageBreak(10);
    addKeyValue("Conditions", conditions.join(", "));
  }

  const currentMeds = (patientContext as Record<string, unknown>).current_medications;
  if (Array.isArray(currentMeds) && currentMeds.length > 0) {
    checkPageBreak(10);
    addKeyValue("Current Medications", currentMeds.join(", "));
  }

  checkPageBreak(30);
  addSectionTitle("ADE Screening");
  Object.entries(adeScreening as Record<string, unknown>).forEach(([k, v]) => {
    checkPageBreak(8);
    addKeyValue(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  });

  if (chartRef.current) {
    checkPageBreak(90);
    addSectionTitle("Concentration-Time Profile");
    y += 2;
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height / canvas.width) * contentW;
      checkPageBreak(imgH + 5);
      pdf.addImage(imgData, "PNG", margin, y, contentW, imgH);
      y += imgH + 5;
    } catch {
      addText("Chart could not be rendered", 9);
    }
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}  |  Confidential - For clinical use only`,
      pageW / 2,
      pdf.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  pdf.save(`simulation_${sim.id ?? "report"}.pdf`);
}
