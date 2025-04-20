import { AssetQuoteRecord, PortfolioAllocationRecord, PortfolioAllocationType, SummarizedDataType } from "./source.model";

const INITIAL_TOTAL: Required<SummarizedDataType> = {
    initialValue: 0,
    marketValue: 0,
    percPlanned: 0,
    percAllocation: 0,
    profit: 0,
    performance: 0
};
