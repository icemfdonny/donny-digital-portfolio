import { elektrikar } from "./elektrikar";
import { instalater } from "./instalater";
import { maliar } from "./maliar";
import { obkladac } from "./obkladac";
import { stolar } from "./stolar";
import type { Trade, TradeId } from "./types";

export const TRADES: Record<TradeId, Trade> = { elektrikar, instalater, stolar, obkladac, maliar };
export const TRADE_LIST: Trade[] = [elektrikar, instalater, stolar, obkladac, maliar];
export const DEFAULT_TRADE: TradeId = "elektrikar";

export const isTradeId = (value: unknown): value is TradeId => typeof value === "string" && value in TRADES;

export type * from "./types";
