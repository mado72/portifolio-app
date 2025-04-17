import { AssetQuoteRecord, PortfolioAllocationRecord, PortfolioAllocationType, SummarizedDataType } from "./source.model";

const INITIAL_TOTAL: Required<SummarizedDataType> = {
    initialValue: 0,
    marketValue: 0,
    percPlanned: 0,
    percAllocation: 0,
    profit: 0,
    performance: 0
};

export function calcPosition(quotes: AssetQuoteRecord, allocations: PortfolioAllocationRecord) {
    const calc = Object.entries(allocations).reduce((acc, [ticker, allocation]) => {
        if (! quotes[ticker]) return acc;
        const quotePrice = quotes[ticker].quote.value;
        const marketValue = quotePrice * allocation.quantity;
        const averagePrice = Math.trunc(100 * allocation.initialValue / allocation.quantity) / 100;

        acc.allocations[ticker] = {
            ...allocation,
            marketValue,
            averagePrice,
            quote: quotes[ticker].quote,
            percAllocation: 0,
            profit: allocation.quantity * (quotePrice - averagePrice),
            performance: (marketValue - allocation.initialValue) / allocation.initialValue
        };

        acc.total.initialValue += acc.allocations[ticker].initialValue;
        acc.total.marketValue += acc.allocations[ticker].marketValue;
        acc.total.percPlanned += acc.allocations[ticker].percPlanned;
        acc.total.percAllocation += acc.allocations[ticker].percAllocation || 0;
        acc.total.profit += acc.allocations[ticker].profit || 0;
        acc.total.performance = acc.total.profit / acc.total.marketValue;

        return acc;
    }, {
        total: { ...INITIAL_TOTAL },
        allocations: {} as Record<string, Required<PortfolioAllocationType>>
    } );

    Object.values(calc.allocations).forEach(item => {
        item.percAllocation = item.marketValue as number / calc.total.marketValue;
        calc.total.percAllocation += item.percAllocation;
    });

    return calc;
}
