# Commission Calculation Comparison Analysis

## Critical Differences Found

### 1. **Commission Percentage Format (CRITICAL)**

#### Standalone App (`commission-dashboard`):
```javascript
// Expects whole number percentages (3.0 = 3%)
gci = price * (commPct / 100);
referralDollar = refPct > 0 ? gci * (refPct / 100) : 0;
```

#### FarmTrackr:
```javascript
// Expects decimal percentages (0.03 = 3%)
gci = price * commPct
referralDollar = refPct > 0 ? gci * refPct : 0
```

**Issue**: The CSV import normalizes percentages, but if the data is already in the wrong format, calculations will be wrong.

### 2. **BDH Split Percentage Format**

#### Standalone App:
```javascript
const splitPct = parseFloat(bdhSplitPct) || 94; // Default 94% (whole number)
const agentSplit = afterPreSplit * (splitPct / 100); // Divides by 100
```

#### FarmTrackr:
```javascript
let splitPctNum = parseFloat(String(bdhSplitPct)) || 0.94
// If > 1, it's a whole number percentage (94), convert to decimal (0.94)
const splitPct = splitPctNum > 1 ? splitPctNum / 100 : splitPctNum
const agentSplit = afterPreSplit * splitPct
```

**Status**: FarmTrackr handles this correctly with normalization.

### 3. **BDH Brokerage Portion Calculation**

#### Standalone App:
```javascript
totalBrokerageFees = 
  preSplitDeductionValue +
  (adjustedGci - agentSplit) + // ALWAYS calculates brokerage portion
  (parseFloat(asf) || 0) +
  ...
```

#### FarmTrackr:
```javascript
const brokerageSplitNum = brokerageSplit ? parseFloat(String(brokerageSplit)) : 0
const brokeragePortion = brokerageSplitNum > 0
  ? brokerageSplitNum  // Uses CSV value if provided
  : (adjustedGci - agentSplit) // Calculates if not provided

totalBrokerageFees = 
  preSplitDeductionValue +
  brokeragePortion +  // Uses CSV value or calculated
  (parseFloat(String(asf)) || 0) +
  ...
```

**Issue**: FarmTrackr correctly uses CSV value, but if the CSV value is incorrect or includes other fees, it will cause negative numbers.

### 4. **Commission Percentage Parsing in CSV Import**

#### CSV Import Logic:
```javascript
const normalizePercentage = (value: any): number | null => {
  if (!value) return null
  const num = parseFloat(String(value).replace(/[%,]/g, ''))
  if (isNaN(num)) return null
  // If > 1, assume it's a percentage (3.0 = 3%) and convert to decimal
  // If <= 1, assume it's already decimal
  return num > 1 ? num / 100 : num
}
```

**Issue**: This logic converts whole numbers (3.0) to decimals (0.03), which is correct. However, the `calculateCommission` function then uses it directly without division, which matches.

### 5. **Data Storage vs Calculation**

#### Database Storage:
- Commission percentages are stored as `Decimal(5, 4)` - meaning up to 5 digits total with 4 decimal places
- This supports decimal format (0.0300 = 3%)

#### Calculation:
- The calculation function expects decimal format (0.03)
- But the CSV might provide whole numbers (3.0)

**Status**: The normalization function should handle this, but we need to verify it's being called correctly.

### 6. **Missing Transaction Detection**

#### Duplicate Detection Logic:
```javascript
// Current logic checks:
1. address + clientType (required)
2. closingDate (if available)
3. listDate (if closingDate not available)
4. address + clientType + transactionType + brokerage (if no dates)
```

**Potential Issue**: If dates are missing or invalid, transactions might not be matched correctly, leading to duplicates or missing updates.

## Recommendations

1. **Verify Commission Percentage Format**: Ensure CSV values are correctly normalized
2. **Check Brokerage Split Values**: Ensure CSV `brokeragesplit` values don't double-count fees
3. **Improve Duplicate Detection**: Add more fallback criteria
4. **Add Calculation Tooltip**: Show the formula used for Total Brokerage Fees

