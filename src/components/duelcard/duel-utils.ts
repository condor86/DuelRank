// src/components/duel/duel-utils.ts
export function splitNameFallback(name?: string) {
    const s = (name ?? "").trim();
    if (!s) return { code: "", modelName: "" };
    const parts = s.split(/\s+/);
    return { code: parts.shift() ?? "", modelName: parts.join(" ") };
  }
  
  export function orgKey(text?: string) {
    const t = (text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!t) return "other";
    const checks: Array<[string, string[]]> = [
      ["zeon", ["zeon", "zion", "neozeon", "principalityofzeon"]],
      ["efsf", ["efsf","eff","earthfederation","earthfederationspaceforce","earthfederationforces"]],
      ["aeug", ["aeug","antiearthuniongroup"]],
      ["titans", ["titans"]],
      ["zaft", ["zaft"]],
    ];
    for (const [key, names] of checks) if (names.some(a => t.includes(a))) return key;
    return "other";
  }
  
  export function seriesKey(text?: string) {
    const raw = (text ?? "").toLowerCase();
    const t = raw.replace(/[^a-z0-9]+/g, "");
    if (!raw) return "default";
    if (raw.includes("逆襲のシャア")) return "cca";
    const checks: Array<[string, string[]]> = [
      ["seed", ["gundamseed","seeddestiny","seed","destiny"]],
      ["cca",  ["charscounterattack","cca"]],
    ];
    for (const [key, aliases] of checks) if (aliases.some(a => t.includes(a))) return key;
    return "default";
  }
  