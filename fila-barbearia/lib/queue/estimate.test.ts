import { describe, expect, it } from "vitest";
import {
  computeHistoricalAverageMinutes,
  estimateWaitMinutes,
  formatWaitEstimate,
} from "./estimate";

describe("estimateWaitMinutes", () => {
  it("retorna 0 quando não há ninguém na frente", () => {
    expect(estimateWaitMinutes(0, 30)).toBe(0);
  });

  it("multiplica pessoas na frente pelo tempo médio", () => {
    expect(estimateWaitMinutes(3, 25)).toBe(75);
  });

  it("nunca retorna valor negativo", () => {
    expect(estimateWaitMinutes(-2, 30)).toBe(0);
  });
});

describe("formatWaitEstimate", () => {
  it("avisa que é o próximo quando a espera é zero", () => {
    expect(formatWaitEstimate(0)).toBe("Você é o próximo!");
  });

  it("formata apenas minutos quando < 1h", () => {
    expect(formatWaitEstimate(35)).toBe("aproximadamente 35 min");
  });

  it("formata horas exatas", () => {
    expect(formatWaitEstimate(120)).toBe("aproximadamente 2h");
  });

  it("formata horas com minutos (ex: 1h15)", () => {
    expect(formatWaitEstimate(75)).toBe("aproximadamente 1h15");
  });
});

describe("computeHistoricalAverageMinutes", () => {
  it("usa o valor padrão quando não há histórico suficiente", () => {
    expect(computeHistoricalAverageMinutes([], 30)).toBe(30);
  });

  it("calcula a média real a partir de called_at/completed_at", () => {
    const entries = [
      { called_at: "2026-01-01T10:00:00Z", completed_at: "2026-01-01T10:20:00Z" },
      { called_at: "2026-01-01T11:00:00Z", completed_at: "2026-01-01T11:40:00Z" },
    ];
    expect(computeHistoricalAverageMinutes(entries, 30)).toBe(30);
  });

  it("descarta entradas sem called_at ou completed_at", () => {
    const entries = [
      { called_at: null, completed_at: "2026-01-01T10:20:00Z" },
      { called_at: "2026-01-01T11:00:00Z", completed_at: "2026-01-01T11:30:00Z" },
    ];
    expect(computeHistoricalAverageMinutes(entries, 30)).toBe(30);
  });
});
