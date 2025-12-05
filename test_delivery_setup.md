# Delivery Setup Feature - Test Plan

## Test Scenarios

### Test 1: UI Elements Verification
**Objective**: Verify all UI elements are present and properly styled

**Steps**:
1. Login to admin dashboard
2. Navigate to Shop Info tab
3. Scroll to Delivery Setup section

**Expected Results**:
- ✅ "🚚 Delivery Setup" heading is visible
- ✅ "Delivery Partner Name" input field is present
- ✅ "Add Delivery Slab" section with:
  - Weight dropdown with placeholder "Select Weight"
  - Price input with placeholder "Price (₹)"
  - "Add Slab" button with plus icon
- ✅ Section is positioned below Social Media Links
- ✅ Section is above "Save Shop Information" button

---

### Test 2: Add Single Delivery Slab
**Objective**: Test adding a single delivery slab

**Steps**:
1. Navigate to Delivery Setup section
2. Enter delivery partner name: "Blue Dart"
3. Select weight: "1kg" from dropdown
4. Enter price: "50"
5. Click "Add Slab" button

**Expected Results**:
- ✅ Success message: "Delivery slab added"
- ✅ New slab appears in the display section below
- ✅ Slab shows: 📦 icon, "1kg", "₹50"
- ✅ Slab has delete button (X)
- ✅ Input fields are cleared (weight and price)
- ✅ "1kg" is no longer available in the weight dropdown

---

### Test 3: Add Multiple Delivery Slabs
**Objective**: Test adding multiple slabs and verify sorting

**Steps**:
1. Add slab: 2kg, ₹80
2. Add slab: 0.5kg, ₹40
3. Add slab: 5kg, ₹150
4. Add slab: 1.5kg, ₹60

**Expected Results**:
- ✅ All 4 slabs are displayed
- ✅ Slabs are sorted by weight: 0.5kg, 1.5kg, 2kg, 5kg
- ✅ Each slab shows correct weight and price
- ✅ Dropdown excludes all 4 added weights

---

### Test 4: Duplicate Prevention
**Objective**: Verify duplicate slabs cannot be added

**Steps**:
1. Add slab: 3kg, ₹100
2. Try to select "3kg" again from dropdown

**Expected Results**:
- ✅ "3kg" is not available in the dropdown
- ✅ Duplicate prevention works automatically via dropdown filtering

---

### Test 5: Remove Delivery Slab
**Objective**: Test removing a delivery slab

**Steps**:
1. Add slab: 4kg, ₹120
2. Click the X button on the 4kg slab

**Expected Results**:
- ✅ Success message: "Delivery slab removed"
- ✅ 4kg slab disappears from display
- ✅ "4kg" becomes available again in the dropdown

---

### Test 6: Input Validation
**Objective**: Test validation for empty fields

**Steps**:
1. Click "Add Slab" without selecting weight or entering price
2. Select weight only, click "Add Slab"
3. Enter price only, click "Add Slab"

**Expected Results**:
- ✅ Error message: "Please select weight and enter price"
- ✅ No slab is added in any case

---

### Test 7: Save and Persist Data
**Objective**: Verify data is saved to database correctly

**Steps**:
1. Enter delivery partner name: "DHL Express"
2. Add slabs:
   - 1kg, ₹55
   - 2kg, ₹85
   - 5kg, ₹180
3. Click "Save Shop Information"
4. Refresh the page

**Expected Results**:
- ✅ Success message: "Shop information saved successfully!"
- ✅ After refresh:
  - Delivery partner name is "DHL Express"
  - All 3 slabs are displayed
  - Slabs show correct weights and prices
  - Dropdown excludes the 3 added weights

---

### Test 8: Weight Options Completeness
**Objective**: Verify all 40 weight options are available

**Steps**:
1. Open weight dropdown
2. Verify options from 0.5kg to 20kg

**Expected Results**:
- ✅ Dropdown contains 40 options
- ✅ First option: 0.5kg
- ✅ Last option: 20kg
- ✅ Increments are in 0.5kg steps
- ✅ Options: 0.5kg, 1kg, 1.5kg, 2kg, ..., 19kg, 19.5kg, 20kg

---

### Test 9: Empty State
**Objective**: Test behavior with no slabs added

**Steps**:
1. Navigate to Delivery Setup (fresh setup)
2. Don't add any slabs

**Expected Results**:
- ✅ No slabs display section is shown
- ✅ All 40 weights are available in dropdown
- ✅ Can add first slab successfully

---

### Test 10: Maximum Capacity
**Objective**: Test adding all 40 weight options

**Steps**:
1. Add slabs for all weights from 0.5kg to 20kg
2. Verify dropdown behavior

**Expected Results**:
- ✅ All 40 slabs can be added
- ✅ Slabs are sorted correctly (0.5kg first, 20kg last)
- ✅ Dropdown becomes empty (no options left)
- ✅ All data saves correctly

---

## Database Verification

After completing tests, verify in Supabase:

1. Open Supabase dashboard
2. Navigate to Table Editor → shop_data
3. Check the `delivery` column for your admin's row

**Expected JSON structure**:
```json
{
  "partnerName": "DHL Express",
  "slabs": [
    {"weight": "0.5kg", "price": 40},
    {"weight": "1kg", "price": 55},
    {"weight": "2kg", "price": 85},
    {"weight": "5kg", "price": 180}
  ]
}
```

---

## Browser Compatibility

Test in:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive design)

---

## Performance Checks

- ✅ Page loads quickly
- ✅ No console errors
- ✅ Smooth UI interactions
- ✅ Data saves without lag

---

## Accessibility Checks

- ✅ Labels are properly associated with inputs
- ✅ Buttons have clear text/icons
- ✅ Color contrast is sufficient
- ✅ Keyboard navigation works

---

## Edge Cases

1. **Very long partner name**: Enter 200+ characters
2. **Very high price**: Enter 999999
3. **Decimal prices**: Enter 49.99, 50.50
4. **Zero price**: Enter 0
5. **Negative price**: Enter -50 (should be prevented by input type="number" min="0")

---

## Known Limitations

- Prices are stored as numbers (JavaScript number precision)
- No currency conversion support
- No region-specific pricing
- Partner name has no character limit enforced

---

## Success Criteria

✅ All 10 test scenarios pass
✅ Data persists correctly in Supabase
✅ UI is intuitive and responsive
✅ No console errors
✅ Duplicate prevention works flawlessly
