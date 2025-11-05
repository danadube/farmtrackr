# Commission System Improvement Roadmap

**Date:** October 31, 2025  
**Version:** 0.6.0 → 0.7.0  
**Target Completion:** November 15, 2025

---

## Quick Reference

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| P0 🔴 | Bidirectional Calculations | Medium | HIGH | Planning |
| P0 🔴 | Percentage Unit Standardization | Medium | CRITICAL | Blocked |
| P1 🟡 | Manual Edit Tracking | Low | HIGH | Planning |
| P1 🟡 | Deduction Recalculation | Low | MEDIUM | Planning |
| P2 🟢 | Form Layout Optimization | Low | MEDIUM | Backlog |
| P2 🟢 | Enhanced Validation | Low | LOW | Backlog |

---

## Phase 1: Critical Fixes (Week 1: Nov 4-8, 2025)

### Task 1: Implement Bidirectional Calculations ⭐ HIGHEST PRIORITY

**Goal:** Allow users to edit calculated fields and have the system compute dependent values automatically.

#### 1.1 GCI → Commission Percentage Calculation

**User Story:**
> As a real estate agent, I want to enter my target GCI and have the system calculate the required commission percentage, so I can quickly determine what % to negotiate.

**Implementation:**

**File:** `src/components/TransactionForm.tsx`

**Add Manual Edit Tracking:**
```typescript
const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set());
```

**Update handleInputChange:**
```typescript
const handleInputChange = (field: keyof TransactionFormData, value: string) => {
  // Bidirectional GCI → Commission % calculation
  if (field === 'gci' && value) {
    const gciValue = parseFloat(value) || 0;
    const closedPrice = parseFloat(formData.closedPrice) || 0;
    if (closedPrice > 0 && gciValue > 0) {
      const newCommissionPct = ((gciValue / closedPrice) * 100).toFixed(4);
      setFormData(prev => ({
        ...prev,
        commissionPct: newCommissionPct,
        gci: value
      }));
      setManuallyEditedFields(prev => new Set([...prev, 'gci']));
      return;
    }
  }
  
  // ... rest of handler
};
```

**Update useEffect to respect manual edits:**
```typescript
useEffect(() => {
  // Don't auto-calculate if user manually edited calculated fields
  if (manuallyEditedFields.has('gci') || manuallyEditedFields.has('referralDollar')) {
    return;
  }
  
  const calculated = calculateCommission(formData);
  // ... update fields
}, [formData.closedPrice, formData.commissionPct, formData.referralPct, formData.transactionType, formData.referralFeeReceived, formData.brokerage, manuallyEditedFields]);
```

**Acceptance Criteria:**
- [ ] User can enter GCI and commission % auto-calculates
- [ ] Manual edits are preserved across other field changes
- [ ] No infinite calculation loops
- [ ] Edge cases handled (zero values, division by zero)
- [ ] Unit tests written and passing

**Testing Checklist:**
- [ ] Enter GCI = $15,000, Closed Price = $500,000 → Commission % = 3.0
- [ ] Enter GCI = $10,000, Closed Price = $250,000 → Commission % = 4.0
- [ ] Change Closed Price after entering GCI → Commission % updates
- [ ] Clear GCI field → Commission % remains unchanged
- [ ] Enter 0 GCI → No calculation error

**Estimated Time:** 4 hours

---

#### 1.2 Referral Dollar → Referral Percentage Calculation

**User Story:**
> As a real estate agent, I want to enter the referral dollar amount I'm paying/receiving and have the system calculate the referral percentage automatically.

**Implementation:**

**File:** `src/components/TransactionForm.tsx`

**Add to handleInputChange:**
```typescript
// Bidirectional Referral $ → Referral % calculation
if (field === 'referralDollar' && value) {
  const referralValue = parseFloat(value) || 0;
  const gci = parseFloat(formData.gci) || 0;
  if (gci > 0 && referralValue > 0) {
    const newReferralPct = ((referralValue / gci) * 100).toFixed(4);
    setFormData(prev => ({
      ...prev,
      referralPct: newReferralPct,
      referralDollar: value
    }));
    setManuallyEditedFields(prev => new Set([...prev, 'referralDollar']));
    return;
  }
}
```

**Acceptance Criteria:**
- [ ] User can enter Referral $ and referral % auto-calculates
- [ ] Works correctly with different GCI values
- [ ] No calculation errors
- [ ] Manual edits preserved

**Testing Checklist:**
- [ ] Enter Referral $ = $3,750, GCI = $15,000 → Referral % = 25.0
- [ ] Enter Referral $ = $1,500, GCI = $10,000 → Referral % = 15.0
- [ ] Change GCI after entering Referral $ → Referral % updates
- [ ] Clear Referral $ → Referral % unchanged

**Estimated Time:** 3 hours

---

#### 1.3 Manual Edit Tracking Enhancement

**Goal:** Prevent auto-calculation from overwriting user's manual edits.

**Implementation:**

**Add manual edit detection:**
```typescript
const manuallyEditableFields = ['gci', 'referralDollar', 'adjustedGci', 'royalty', 'companyDollar', 'preSplitDeduction', 'totalBrokerageFees', 'nci'];

const handleInputChange = (field: keyof TransactionFormData, value: string) => {
  // Mark as manually edited
  if (manuallyEditableFields.includes(field)) {
    setManuallyEditedFields(prev => new Set([...prev, field]));
  }
  
  // ... rest of handler
};
```

**Add clear manual edit functionality:**
```typescript
const clearManualEdit = (field: string) => {
  setManuallyEditedFields(prev => {
    const newSet = new Set(prev);
    newSet.delete(field);
    return newSet;
  });
};

// Add "Reset to Auto" button next to calculated fields
<button 
  onClick={() => clearManualEdit('gci')}
  style={{ padding: '4px 8px', fontSize: '12px', ... }}
>
  Auto
</button>
```

**Acceptance Criteria:**
- [ ] Manual edits tracked correctly
- [ ] Auto-calculation respects manual edits
- [ ] Users can reset to auto-calculation
- [ ] Visual indication of manual vs auto values

**Estimated Time:** 4 hours

---

#### 1.4 Update Commission Calculation Library

**Goal:** Ensure `calculateCommission` function is called correctly with manual edit checks.

**File:** `src/lib/commissionCalculations.ts`

**Verify current implementation:**
```typescript
export function calculateCommission(data: TransactionInput): CommissionResult {
  // Current implementation is correct
  // Verify it handles empty string for royalty/companyDollar correctly
}
```

**Add utility functions:**
```typescript
/**
 * Check if a calculated field should be auto-updated
 */
export function shouldAutoUpdate(field: string, manuallyEditedFields: Set<string>): boolean {
  const autoUpdateableFields = ['gci', 'referralDollar', 'adjustedGci', 'royalty', 'companyDollar', 'preSplitDeduction', 'totalBrokerageFees', 'nci'];
  if (!autoUpdateableFields.includes(field)) return true;
  return !manuallyEditedFields.has(field);
}

/**
 * Format percentage for display (decimal to %)
 */
export function formatPercentageDisplay(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Parse percentage from display (% to decimal)
 */
export function parsePercentageInput(value: string): number {
  const cleaned = value.replace(/%/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num / 100;
}
```

**Estimated Time:** 2 hours

---

### Task 2: Standardize Percentage Units ⚠️ BLOCKED BY DECISION

**Goal:** Choose and implement a consistent percentage storage standard across the entire system.

**Status:** **BLOCKED** - Awaiting decision on percentage standard

#### Decision Required

**Option A: Keep Decimal Standard (0.03 = 3%)**
- **Pros:**
  - Industry standard
  - Cleaner database schema (DECIMAL)
  - Consistent with Prisma types
  - Better precision
- **Cons:**
  - Requires conversion for standalone import
- **Recommended:** ✅ **YES** - Keep decimal standard

**Option B: Switch to Percentage Standard (3.0 = 3%)**
- **Pros:**
  - Matches standalone exactly
  - Easier mental math for users
- **Cons:**
  - Non-standard in industry
  - Requires database migration
  - More precision issues
- **Recommended:** ❌ **NO**

#### Implementation (If Option A Selected)

**Tasks:**

1. **Update Display Functions:**
```typescript
// In commissionCalculations.ts
export function formatPercentageForInput(value: string | number | null | undefined): string {
  if (!value || value === '') return '';
  const num = parseFloat(String(value));
  if (isNaN(num)) return '';
  // Convert decimal to percentage (0.03 -> 3%)
  return `${(num * 100).toFixed(4)}%`;
}

export function parsePercentageFromInput(value: string): string {
  if (!value || value === '') return '';
  const cleaned = value.replace(/%/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : (num / 100).toString();
}
```

2. **Update Google Sheets Import:**
```typescript
// In /api/transactions/import-google/route.ts

// Add conversion function
function convertStandalonePercentage(value: any): number | null {
  if (!value) return null;
  const num = parseFloat(String(value));
  if (isNaN(num)) return null;
  
  // If value > 1, assume it's standalone format (3.0), convert to decimal (0.03)
  if (num > 1) {
    return num / 100;
  }
  // Otherwise assume it's already decimal
  return num;
}

// Update import to use conversion
const commissionPct = convertStandalonePercentage(rowData.commissionPct);
const referralPct = convertStandalonePercentage(rowData.referralPct);
```

3. **Update Google Sheets Export:**
```typescript
// In commission analytics calculations
// Convert back for display
const commissionPctDisplay = (parseFloat(String(t.commissionPct || 0)) * 100).toFixed(4);
```

4. **Update Form Display:**
```typescript
// In TransactionForm.tsx
<input
  value={formatPercentageForInput(formData.commissionPct)}
  onChange={(e) => handleInputChange('commissionPct', parsePercentageFromInput(e.target.value))}
/>
```

**Acceptance Criteria:**
- [ ] All percentages display as % (not decimals)
- [ ] All storage uses decimal (0.03)
- [ ] Google Sheets import converts correctly
- [ ] Google Sheets export converts correctly
- [ ] No data loss during conversion
- [ ] Unit tests cover conversion edge cases

**Testing Checklist:**
- [ ] Import from standalone: 3.0 → 0.03 stored
- [ ] Export to standalone: 0.03 → 3.0 displayed
- [ ] User enters 3% → stored as 0.03
- [ ] User enters 2.5% → stored as 0.025
- [ ] Display shows 3% for 0.03
- [ ] Bidirectional calculations work with new format

**Estimated Time:** 6 hours (when unblocked)

---

### Task 3: Update Documentation

**Goal:** Document all changes and maintain technical accuracy.

**Files to Update:**
- `TECHNICAL_DOCUMENTATION.md` - Add bidirectional calculation section
- `docs/COMMISSION_SYSTEM_AUDIT.md` - Mark resolved issues
- `README.md` - Update feature list

**Estimated Time:** 2 hours

---

## Phase 2: Enhanced Features (Week 2: Nov 11-15, 2025)

### Task 4: Improve Deduction Field Recalculation

**Goal:** Make deduction fields trigger appropriate recalculation.

**Implementation:**

```typescript
useEffect(() => {
  const calculated = calculateCommission(formData);
  
  // Always update these when deductions change
  setFormData(prev => ({
    ...prev,
    totalBrokerageFees: calculated.totalBrokerageFees,
    nci: calculated.nci,
  }));
  
  // Update auto-calculated intermediate values if not manually edited
  if (formData.brokerage === 'KW' || formData.brokerage === 'Keller Williams') {
    if (!manuallyEditedFields.has('royalty')) {
      // Update royalty
    }
    if (!manuallyEditedFields.has('companyDollar')) {
      // Update company dollar
    }
  } else if (formData.brokerage === 'BDH' || formData.brokerage === 'Bennion Deville Homes') {
    if (!manuallyEditedFields.has('preSplitDeduction')) {
      // Update pre-split
    }
  }
}, [
  formData.eo,
  formData.hoaTransfer,
  formData.homeWarranty,
  formData.kwCares,
  formData.kwNextGen,
  formData.boldScholarship,
  formData.tcConcierge,
  formData.jelmbergTeam,
  formData.otherDeductions,
  formData.buyersAgentSplit,
  formData.asf,
  formData.foundation10,
  formData.adminFee,
  formData.bdhSplitPct
]);
```

**Estimated Time:** 3 hours

---

### Task 5: Optimize Form Layout

**Goal:** Improve visual hierarchy and organization.

**Changes:**
- Add section headers
- Group related fields
- Add visual separators
- Improve spacing
- Better responsive layout

**Estimated Time:** 4 hours

---

### Task 6: Enhanced Validation

**Goal:** Better inline validation and error messages.

**Implementation:**
- Real-time validation
- Inline error messages
- Required field indicators
- Range validations (dates, percentages)
- Custom error messages

**Estimated Time:** 3 hours

---

## Testing Plan

### Unit Tests

**File:** `src/lib/__tests__/commissionCalculations.test.ts` (create new)

```typescript
import { calculateCommission, formatPercentageForInput, parsePercentageFromInput } from '../commissionCalculations';

describe('Commission Calculations', () => {
  describe('Basic Calculations', () => {
    it('should calculate KW commission correctly', () => {
      const result = calculateCommission({
        brokerage: 'KW',
        closedPrice: 500000,
        commissionPct: 0.03,
        eo: 0,
      });
      
      expect(result.gci).toBe('15000.00');
      expect(result.royalty).toBe('900.00');
      expect(result.nci).toBe('12100.00');
    });
  });

  describe('Bidirectional Calculations', () => {
    it('should convert GCI to commission percentage', () => {
      const gci = 15000;
      const closedPrice = 500000;
      const commissionPct = (gci / closedPrice) * 100;
      
      expect(commissionPct).toBe(3);
    });
    
    it('should convert referral dollar to referral percentage', () => {
      const referralDollar = 3750;
      const gci = 15000;
      const referralPct = (referralDollar / gci) * 100;
      
      expect(referralPct).toBe(25);
    });
  });

  describe('Percentage Formatting', () => {
    it('should format decimal to percentage display', () => {
      expect(formatPercentageForInput(0.03)).toBe('3.0000%');
      expect(formatPercentageForInput(0.025)).toBe('2.5000%');
    });
    
    it('should parse percentage input to decimal', () => {
      expect(parsePercentageFromInput('3%')).toBe('0.03');
      expect(parsePercentageFromInput('2.5%')).toBe('0.025');
    });
  });
});
```

**Estimated Time:** 4 hours

### Integration Tests

**File:** `tests/integration/transaction-flow.test.ts` (create new)

- Test complete transaction creation flow
- Test bidirectional calculations in context
- Test Google Sheets import/export
- Test form state management

**Estimated Time:** 3 hours

### Manual Testing Checklist

- [ ] Create new transaction with GCI input
- [ ] Create new transaction with referral $ input
- [ ] Edit existing transaction, change GCI
- [ ] Switch brokerage mid-form
- [ ] Toggle between Sale/Referral types
- [ ] Import from Google Sheets
- [ ] Export to CSV with all fields
- [ ] Test all calculation edge cases

**Estimated Time:** 2 hours

---

## Deployment Plan

### Pre-Deployment

1. **Code Review:** All changes reviewed
2. **Testing:** All tests passing
3. **Documentation:** Updated
4. **Migration Script:** Tested on staging
5. **Rollback Plan:** Prepared

### Deployment Steps

1. **Deploy to Staging:** Test with real data
2. **Smoke Tests:** Critical paths verified
3. **User Acceptance:** Stakeholder sign-off
4. **Production Deploy:** Gradual rollout
5. **Monitor:** Track errors, performance

### Post-Deployment

1. **Monitor:** 24 hours of watchful monitoring
2. **User Feedback:** Collect and respond
3. **Bug Fixes:** Address any issues quickly
4. **Documentation:** Update based on feedback

---

## Success Metrics

### Technical Metrics

- [ ] 100% unit test coverage on calculation logic
- [ ] <100ms calculation time for all scenarios
- [ ] Zero calculation errors in production
- [ ] <1% error rate on Google Sheets import

### User Experience Metrics

- [ ] Transaction entry time reduced by 30%
- [ ] User satisfaction score > 4.5/5
- [ ] <5 support tickets related to calculations
- [ ] Feature adoption rate > 80%

---

## Risk Mitigation

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Calculation bugs | Medium | High | Comprehensive testing |
| Data loss on import | Low | Critical | Staging testing, backups |
| User confusion | Medium | Medium | Clear UI labels, help docs |
| Performance issues | Low | Low | Optimize useEffect dependencies |

### Contingency Plans

- **Rollback:** Keep previous version ready
- **Hotfix Process:** 24-hour response SLA
- **User Support:** Dedicated support channel
- **Documentation:** FAQ and troubleshooting guide

---

## Timeline Summary

| Week | Tasks | Deliverable |
|------|-------|-------------|
| Week 1 (Nov 4-8) | Task 1: Bidirectional calculations<br>Task 2: Percentage standardization<br>Task 3: Documentation | Phase 1 complete |
| Week 2 (Nov 11-15) | Task 4: Deduction recalculation<br>Task 5: Form layout<br>Task 6: Validation | v0.7.0 release |
| Week 3 (Nov 18-22) | Testing, polish, bug fixes | Production ready |

**Total Estimated Effort:** 35-40 hours

---

## Team Assignments

- **Development:** Lead developer + 1 supporting
- **Testing:** QA team
- **Documentation:** Technical writer
- **Product:** Product owner for acceptance

---

**Next Steps:**

1. ✅ Review this roadmap
2. ⏳ Make decision on percentage standard
3. ⏳ Assign team members
4. ⏳ Set up development environment
5. ⏳ Begin Phase 1 implementation

---

**Last Updated:** October 31, 2025  
**Status:** Ready to Begin  
**Owner:** Development Team

