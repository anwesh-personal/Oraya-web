// ============================================================================
// agent-runtime — shared web chatbot runtime (plan 029, Phase 1b / F1).
// ============================================================================
// The single authoritative library for prompt composition, inference dispatch
// (BYOK → managed → sovereign gateway), web RAG v2, memory, and AGL-001 lineage.
// Consumed by the embed chat routes (blocking + streaming) and, later, by the
// omnichannel adapters and the proactive worker.
// ============================================================================

export * from "./types";
export * from "./compose-prompt";
export * from "./inference";
export * from "./providers";
export * from "./gateway";
export * from "./embeddings";
export * from "./rag";
export * from "./memory";
export * from "./lineage";
export { governanceLeafForInference, verifyGovernanceLeaf, hashContent, computeGovernanceHash } from "./agl-hash";
export type { GovernanceLeaf } from "./agl-hash";
