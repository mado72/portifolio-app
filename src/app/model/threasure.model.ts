/**
 * Type to represent a financial index
 */
export type FinancialIndex = {
    /** Index code */
    cd: number;
    /** Index name (e.g., IPCA, SELIC) */
    nm: string;
}

/**
 * Type to represent the type of Treasury bond
 */
export type TreasuryBondType = {
    /** Bond type code */
    cd: number;
    /** Bond type name (e.g., NTNB PRINC) */
    nm: string;
    /** Custody fee (can be null) */
    ctdyRate: number | null;
    /** Gross price (can be null) */
    grPr: number | null;
}

/**
 * Type to represent a business segment (can be null)
 */
export type BusinessSegment = {
    /** Segment code */
    cd?: number;
    /** Segment name */
    nm?: string;
}

/**
 * Type to represent a Treasury Direct bond
 */
export type TreasuryBond = {
    /** Bond code */
    cd: number;
    /** Bond name (e.g., Tesouro IPCA+ 2029) */
    nm: string;
    /** Bond features */
    featrs: string;
    /** Bond maturity date */
    mtrtyDt: string;
    /** Minimum investment amount */
    minInvstmtAmt: number;
    /** Unit investment value */
    untrInvstmtVal: number;
    /** Investment stability description */
    invstmtStbl: string;
    /** Semiannual interest indicator */
    semiAnulIntrstInd: boolean;
    /** Income receipt description */
    rcvgIncm: string;
    /** Annual investment rate (%) */
    anulInvstmtRate: number;
    /** Annual redemption rate (%) */
    anulRedRate: number;
    /** Minimum redemption quantity */
    minRedQty: number;
    /** Unit redemption value */
    untrRedVal: number;
    /** Minimum redemption value */
    minRedVal: number;
    /** Bond ISIN code */
    isinCd: string;
    /** Financial index associated with the bond */
    FinIndxs: FinancialIndex;
    /** Withdrawal date (can be null) */
    wdwlDt: string | null;
    /** Conversion date (can be null) */
    convDt: string | null;
    /** Business segment (can be null) */
    BusSegmt: BusinessSegment | null;
    /** Number of amortization quotas */
    amortQuotQty: number;
}

/**
 * Type to represent the complete data of a Treasury bond
 */
export type TreasuryBondData = {
    /** Bond information */
    TrsrBd: TreasuryBond;
    /** Bond type */
    TrsrBdType: TreasuryBondType;
    /** SELIC code */
    SelicCode: number;
}

/**
 * Type to represent the list of bonds in the API response
 */
export type TreasuryBondResponse = Record<string, TreasuryBondData>;