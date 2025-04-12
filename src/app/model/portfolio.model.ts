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
    const calc = Object.entries(allocations).reduce((acc, [key, allocation]) => {
        if (! quotes[key]) return acc;
        const quotePrice = quotes[key].quote.value;
        const marketValue = quotePrice * allocation.quantity;
        const averagePrice = Math.trunc(100 * allocation.initialValue / allocation.quantity) / 100;

        acc.allocations[key] = {
            ...allocation,
            marketValue,
            averagePrice,
            quote: quotes[key].quote,
            percAllocation: 0,
            profit: allocation.quantity * (quotePrice - averagePrice),
            performance: (marketValue - allocation.initialValue) / allocation.initialValue
        };

        acc.total.initialValue += acc.allocations[key].initialValue;
        acc.total.marketValue += acc.allocations[key].marketValue;
        acc.total.percPlanned += acc.allocations[key].percPlanned;
        acc.total.percAllocation += acc.allocations[key].percAllocation || 0;
        acc.total.profit += acc.allocations[key].profit || 0;
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
