import { AssetQuoteRecord, PortfolioAllocationRecord, PortfolioAllocation, SummarizedDataType } from "./source.model";

export const INITIAL_TOTAL: Required<SummarizedDataType> = {
    initialValue: 0,
    marketValue: 0,
    percPlanned: 0,
    percAllocation: 0,
    profit: 0,
    performance: 0
};
