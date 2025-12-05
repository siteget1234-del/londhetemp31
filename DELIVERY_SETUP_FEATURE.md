# Delivery Setup Feature Documentation

## Overview
The Delivery Setup feature allows admins to configure delivery pricing based on weight slabs. This is integrated into the Shop Profile section of the Admin Dashboard.

## Location
**Admin Dashboard → Shop Info Tab → Delivery Setup Section**
(Located below the Social Media Links section)

## Features

### 1. Delivery Partner Name
- Input field to enter the name of the delivery partner
- Stored in the `delivery.partnerName` field

### 2. Weight Slabs Management
- **Weight Options**: 0.5kg to 20kg in 0.5kg increments (40 total options)
- **Add Slabs**: Select weight and enter price, then click "Add Slab"
- **Prevent Duplicates**: Already-added weights are automatically removed from the dropdown
- **Remove Slabs**: Each slab has an X button to remove it
- **Sorted Display**: Slabs are displayed sorted by weight (ascending)

## Data Structure

### Database Storage
Data is stored in the `delivery` JSONB column of the `shop_data` table:

```json
{
  "partnerName": "Blue Dart",
  "slabs": [
    { "weight": "0.5kg", "price": 40 },
    { "weight": "1kg", "price": 50 },
    { "weight": "1.5kg", "price": 60 },
    { "weight": "2kg", "price": 70 }
  ]
}
```

### State Management
```javascript
shopData.delivery = {
  partnerName: '',
  slabs: [
    { weight: '1kg', price: 50 }
  ]
}
```

## Code Implementation

### Key Functions

1. **handleAddSlab()**: Adds a new delivery slab
   - Validates weight and price are entered
   - Checks for duplicate slabs
   - Adds slab to the array
   - Clears the input form

2. **handleRemoveSlab(weight)**: Removes a slab by weight
   - Filters out the slab with matching weight

3. **getAvailableWeightOptions()**: Returns filtered weight options
   - Excludes weights that are already added
   - Prevents duplicate slabs in the dropdown

### Weight Options Generation
```javascript
const WEIGHT_OPTIONS = Array.from({ length: 40 }, (_, i) => {
  const weight = (i + 1) * 0.5;
  return `${weight}kg`;
});
// Result: ['0.5kg', '1kg', '1.5kg', ..., '19.5kg', '20kg']
```

## UI Components

### Delivery Partner Name Input
```jsx
<input
  type="text"
  value={shopData.delivery?.partnerName || ''}
  onChange={(e) => setShopData(prev => ({ 
    ...prev, 
    delivery: { ...prev.delivery, partnerName: e.target.value }
  }))}
  placeholder="Enter delivery partner name"
/>
```

### Add Slab Form
- **Weight Dropdown**: Shows only available (not-yet-added) weights
- **Price Input**: Numeric input for price in ₹
- **Add Button**: Validates and adds the slab

### Slabs Display
- Grid layout (2 columns on desktop)
- Each slab shows:
  - 📦 Icon
  - Weight (e.g., "1.5kg")
  - Price in green (e.g., "₹60")
  - Delete button (X)
- Sorted by weight (ascending)

## User Workflow

1. Admin navigates to **Admin Dashboard → Shop Info**
2. Scrolls to **Delivery Setup** section
3. Enters **Delivery Partner Name** (optional)
4. Adds delivery slabs:
   - Select weight from dropdown
   - Enter price
   - Click "Add Slab"
5. Reviews added slabs (displayed below)
6. Removes slabs if needed (click X button)
7. Clicks **"Save Shop Information"** button to persist changes

## Validation

- Weight and price must both be provided when adding a slab
- Duplicate weights are prevented (dropdown filters out added weights)
- Price must be a valid number

## Error Messages

- "Please select weight and enter price" - When trying to add without filling both fields
- "This weight slab already exists" - Redundant check (should not occur due to dropdown filtering)
- "Delivery slab added" - Success message
- "Delivery slab removed" - Success message
- "Shop information saved successfully!" - When entire form is saved

## Database Schema Requirement

The `shop_data` table must have a `delivery` column of type JSONB:

```sql
ALTER TABLE public.shop_data 
ADD COLUMN IF NOT EXISTS delivery JSONB DEFAULT NULL;
```

## Integration Notes

1. **Fetch Data**: The `fetchShopData()` function parses the delivery JSONB
2. **Save Data**: The `handleSaveShopInfo()` function saves delivery as JSONB
3. **Real-time**: Uses Supabase for immediate persistence
4. **Type Safety**: Handles both string and object types from database

## Future Enhancements

Potential improvements:
- Add location-based pricing (different slabs for different regions)
- Import/export delivery pricing
- Bulk slab addition
- Delivery time estimation based on weight
- Integration with actual delivery partner APIs

## Testing

To test the feature:
1. Login to admin dashboard
2. Go to Shop Info tab
3. Add delivery partner name
4. Add multiple slabs with different weights
5. Verify duplicate prevention
6. Remove a slab
7. Save and refresh page
8. Verify data persists correctly

## Files Modified

- `/app/app/admin/page.js` - Main implementation file
  - Added delivery state to shopData (line ~28-46)
  - Added WEIGHT_OPTIONS constant (line ~52-57)
  - Added delivery functions (line ~277-322)
  - Updated fetchShopData() (line ~215-265)
  - Updated handleSaveShopInfo() (line ~277-322)
  - Added UI section (line ~1791-1888)
