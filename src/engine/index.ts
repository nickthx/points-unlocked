// Public barrel for the sealed valuation & ranking engine — the single import
// surface for Phase 4's results UI and the v2 advisor (which calls
// rankRedemptions as a tool: plain data in, plain data out).
//
// Name-collision hazard: src/engine/transfers.ts and src/data/transfers.ts
// share a filename (engine FUNCTIONS vs seed ARRAYS). Consumers importing
// from both barrels must alias one side — never re-export data values here.
export * from "./types";
export * from "./transfers";
export * from "./paths";
export * from "./valuation";
export * from "./ranking";
