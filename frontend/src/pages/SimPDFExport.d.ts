import type { RefObject } from "react";
import type { SharedSimulationDetail } from "../api";

export function downloadSimulationPDF(
  sim: SharedSimulationDetail,
  chartRef: RefObject<HTMLDivElement | null>
): Promise<void>;

export function generateSimulationPDFBlob(
  sim: SharedSimulationDetail,
  chartRef: RefObject<HTMLDivElement | null>
): Promise<Blob>;
