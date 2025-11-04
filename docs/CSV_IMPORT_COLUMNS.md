# CSV Import - Supported Column Headers

This document lists all column header names that the transaction import system recognizes. The import uses **case-insensitive matching**, so `propertyType`, `PropertyType`, and `PROPERTYTYPE` are all equivalent.

## Basic Information Fields

| Field | Supported Column Names |
|-------|----------------------|
| **Property Type** | `propertyType`, `Property Type`, `property_type`, `type` |
| **Client Type** | `clientType`, `Client Type`, `client_type`, `client` |
| **Source** | `source`, `Source`, `leadSource`, `lead_source` |
| **Address** | `address`, `Address`, `propertyAddress`, `property_address` |
| **City** | `city`, `City`, `propertyCity`, `property_city` |
| **Transaction Type** | `Transaction Type`, `transactionType`, `transaction_type`, `type` |
| **Status** | `status`, `Status` |

## Pricing & Dates

| Field | Supported Column Names |
|-------|----------------------|
| **List Price** | `listPrice`, `List Price`, `list_price`, `listingPrice`, `listing_price` |
| **Closed Price** | `closedPrice`, `Closed Price`, `closed_price`, `salePrice`, `sale_price`, `NetVolume` (fallback) |
| **Net Volume** | `netVolume`, `NetVolume`, `net_volume` |
| **List Date** | `listdate`, `listDate`, `List Date`, `list_date`, `listingDate`, `listing_date`, `LIST_DATE`, `LISTING_DATE`, `Listing Date`, `ListingDate` |
| **Closing Date** | `closingDate`, `Closing Date`, `closing_date`, `closeDate`, `close_date`, `date`, `closedDate`, `closed_date`, `CLOSING_DATE`, `CLOSED_DATE`, `Close Date`, `CloseDate` |

## Commission Fields

| Field | Supported Column Names |
|-------|----------------------|
| **Brokerage** | `brokerage`, `Brokerage`, `Broker` |
| **Commission %** | `commissionPct`, `Commission %`, `commission_pct`, `commission`, `Commission`, `commPct` |
| **Referral %** | `referralPct`, `Referral %`, `referral_pct`, `referral`, `Referral` |
| **Referral $** | `referralDollar`, `Referral $`, `referral_dollar`, `referralAmount`, `referral_amount` |
| **Referral Fee Received** | `Referral Fee Received`, `referralFeeReceived`, `referral_fee_received`, `feeReceived` |
| **Referring Agent** | `Referring Agent`, `referringAgent`, `referring_agent`, `agent` |

## Keller Williams (KW) Specific Fields

| Field | Supported Column Names |
|-------|----------------------|
| **EO (E&O Insurance)** | `eo`, `EO`, `E&O` |
| **Royalty** | `royalty`, `Royalty` |
| **Company Dollar** | `companyDollar`, `Company Dollar`, `company_dollar` |
| **HOA Transfer** | `hoaTransfer`, `HOA Transfer`, `hoa_transfer` |
| **Home Warranty** | `homeWarranty`, `Home Warranty`, `home_warranty` |
| **KW Cares** | `kwCares`, `KW Cares`, `kw_cares` |
| **KW NextGen** | `kwNextGen`, `KW NextGen`, `kw_next_gen` |
| **Bold Scholarship** | `boldScholarship`, `Bold Scholarship`, `bold_scholarship` |
| **TC Concierge** | `tcConcierge`, `TC Concierge`, `tc_concierge` |
| **Jelmberg Team** | `jelmbergTeam`, `Jelmberg Team`, `jelmberg_team` |

## Bennion Deville Homes (BDH) Specific Fields

| Field | Supported Column Names |
|-------|----------------------|
| **BDH Split %** | `bdhSplitPct`, `BDH Split %`, `bdh_split_pct`, `split` |
| **Pre-Split Deduction** | `preSplitDeduction`, `Pre-Split Deduction`, `pre_split_deduction`, `presplitdeduction` |
| **ASF** | `asf`, `ASF` |
| **Foundation 10** | `foundation10`, `Foundation 10`, `foundation_10` |
| **Admin Fee** | `adminFee`, `Admin Fee`, `admin_fee` |

## Universal Deductions

| Field | Supported Column Names |
|-------|----------------------|
| **Other Deductions** | `otherDeductions`, `Other Deductions`, `other_deductions` |
| **Buyer's Agent Split** | `buyersagentsplit`, `buyersAgentSplit`, `Buyer's Agent Split`, `buyers_agent_split` |
| **Assistant Bonus** | `assistantbonus`, `assistantBonus`, `Assistant Bonus`, `assistant_bonus` |
| **Brokerage Split** | `brokeragesplit`, `brokerageSplit`, `Brokerage Split`, `brokerage_split` |
| **Admin Fees/Other Deductions** | `adminfees-otherdeductions`, `adminfees-otherdeductions`, `adminFees-otherDeductions`, `Admin Fees-Other Deductions` |

## Notes

1. **Case-Insensitive**: All matching is case-insensitive, so `propertyType`, `PropertyType`, and `PROPERTYTYPE` all work.

2. **Exact Match First**: The system tries exact matches first, then falls back to case-insensitive matches.

3. **Multiple Variations**: If your CSV uses different column names, the system will try to match them intelligently. For example, both `closingDate` and `closing_date` work.

4. **Required Fields**: The following fields are **required** for a transaction to import:
   - `propertyType` (defaults to "Residential" if missing)
   - `clientType` (defaults to "Seller" if missing)
   - `transactionType` (defaults to "Sale" if missing)
   - `brokerage` (defaults to "BDH" if missing)
   - `status` (defaults to "Closed" if missing)

5. **Auto-Detection**: The system will auto-detect "Referral $ Received" transactions if:
   - `Referral Fee Received` > 0
   - `commissionPct` = 0 or missing

6. **Currency Parsing**: Monetary fields automatically handle:
   - Dollar signs: `$1,234.56` → `1234.56`
   - Commas: `1,234.56` → `1234.56`
   - Spaces: `$ 1,234.56` → `1234.56`

7. **Date Parsing**: Dates support formats:
   - `M/D/YYYY` (e.g., `3/29/2025`)
   - `YYYY-MM-DD` (e.g., `2025-03-29`)
   - Standard JavaScript Date parsing

8. **Percentage Parsing**: Percentages can be:
   - Whole numbers: `3` or `3.0` → converted to `0.03` (3%)
   - Decimals: `0.03` → kept as `0.03` (3%)

## Example CSV Headers

Here's an example of valid CSV headers:

```csv
propertyType,clientType,source,address,city,listPrice,commissionPct,listdate,closingDate,brokerage,NetVolume,closedPrice,gci,referralPct,referralDollar,adjustedGci,presplitdeduction,brokeragesplit,adminfees-otherdeductions,nci,status,assistantbonus,buyersagentsplit,Transaction Type,Referring Agent,Referral Fee Received
```

This matches the headers you provided in your CSV file.

