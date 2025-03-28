import { Currency } from "./domain.model";
import { AssetQuoteRecord, PortfolioAllocationRecord, PortfolioAllocationSourceDataType, PortfolioAllocationType } from "./source.model";

const INITIAL_TOTAL: Required<PortfolioAllocationType> = {
    ticker: 'total',
    marketPlace: '',
    code: 'total',
    quantity: NaN,
    quote: { price: NaN, currency: Currency.BRL },
    averagePrice: NaN,
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
        const quotePrice = quotes[key].quote.price;
        const marketValue = quotePrice * allocation.quantity;
        const averagePrice = Math.trunc(100 * allocation.initialValue / allocation.quantity) / 100;

        acc[key] = {
            ...allocation,
            marketValue,
            averagePrice,
            quote: quotes[key].quote,
            percAllocation: 0,
            profit: allocation.quantity * (quotePrice - averagePrice),
            performance: (marketValue - allocation.initialValue) / allocation.initialValue
        };

        const total = acc['total'];

        total.marketValue += acc[key].marketValue;
        total.percPlanned += acc[key].percPlanned;
        total.percAllocation += acc[key].percAllocation || 0;
        total.profit += acc[key].profit || 0;
        total.performance = total.profit / total.marketValue;

        return acc;
    }, {
        total: { ...INITIAL_TOTAL }
    } as Record<string, Required<PortfolioAllocationType>>);

    Object.entries(calc).filter(([key, _]) => key !== 'total').forEach(([_, item]) => {
        item.percAllocation = item.marketValue / calc['total'].marketValue;
        (calc['total'] as Required<PortfolioAllocationSourceDataType>).percAllocation += item.percAllocation;
    });

    return calc;
}
