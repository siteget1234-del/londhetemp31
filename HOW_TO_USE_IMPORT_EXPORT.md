# How to Use Import/Export Products Feature

## Quick Start Guide

### Exporting Products

1. **Navigate to Admin Dashboard**
   - Go to `/admin` in your browser
   - Log in with your credentials
   - Click on the "Products" tab

2. **Export Your Products**
   - Look for the **green "Export" button** at the top right (next to the Import button)
   - Click the "Export" button
   - A CSV file will automatically download to your computer
   - File name format: `products_export_2024-12-02.csv`

3. **What's in the Export?**
   - All your saved products (not pending products)
   - Every product field including:
     - Basic info (name, price, category, etc.)
     - Images and videos
     - Specifications
     - Special offers
     - Stock quantity

### Importing Products

#### Step 1: Prepare Your CSV File

**Option A: Download Sample Template**
1. Click the **green "Import" button** at the top right
2. A modal will open
3. Click "Download Sample CSV Template" button
4. Open the sample in Excel, Google Sheets, or any CSV editor
5. Replace the sample data with your products

**Option B: Export & Modify**
1. Export your existing products (see above)
2. Open the CSV file
3. Modify or add new products
4. Save the file

#### Step 2: Important - Image Requirements ⚠️

**CRITICAL**: Product image URLs must point to images under 20KB

How to get compressed images:
- Use the admin dashboard's product form (it auto-compresses to ~20KB)
- Use online tools: [TinyPNG](https://tinypng.com), [Compressor.io](https://compressor.io)
- Use Cloudinary or similar image CDN with compression
- Check image size: Right-click → Properties → Details

**Why 20KB?**
- Faster page loading
- Better mobile experience
- Prevents upload failures
- Database size management

#### Step 3: Import Your Products

1. Click the **"Import" button**
2. Read the instructions in the modal (blue box)
3. Click "Choose File" under "Step 2: Upload Your CSV File"
4. Select your prepared CSV file
5. Click **"Import Products"** button
6. Wait for the success message
7. Your products will appear in the list!

### Import Behavior

**What happens during import:**

1. **New Products** (ID doesn't exist)
   - Added to database immediately
   - Search keywords auto-generated
   - Counted as "Added"

2. **Existing Products** (ID matches)
   - Updated with new data from CSV
   - Old data is replaced
   - Counted as "Updated"

3. **Success Message Format:**
   ```
   Import successful! Added: 5, Updated: 3
   ```

### CSV File Format

#### Required Fields (Must Have Values)
- `name` - Product name
- `price` - Selling price
- `category` - Must be one of: बीज, पोषण, संरक्षण, हार्डवेअर

#### Optional Fields
All other fields can be empty but must have the column headers.

#### Example CSV Structure:
```
id,name,price,mrp,offer,description,category,image,videoUrl,stockQuantity,featured,spec_ingredients,spec_quantity,spec_usageMethod,spec_effectiveness,spec_applicableCrops,spec_additionalInfo,spec_specialNotes,specialOffer_name,specialOffer_quantity,specialOffer_pricePerUnit
abc-123,धान बियाणे,100,120,,Premium seeds,बीज,https://example.com/seed.jpg,,50,true,Hybrid,1kg,Direct sowing,90 days,धान,,,,,
```

### Tips & Best Practices

#### For Export:
✅ Export regularly as backup
✅ Use exports to analyze pricing
✅ Share product list with team
✅ Keep a version history

#### For Import:
✅ Always download sample first
✅ Keep your CSV organized
✅ Use unique IDs for each product
✅ Test with a few products first
✅ Double-check required fields
⚠️ Verify image URLs are under 20KB
⚠️ Don't remove column headers
⚠️ Save as CSV (not Excel format)

### Troubleshooting

**Problem: Export button is disabled/grayed out**
- Solution: You have no saved products. Add some products first.

**Problem: Import fails with "No valid products found"**
- Check: CSV has required fields (name, price, category)
- Check: Column headers match exactly
- Check: File is saved as CSV, not Excel

**Problem: Import successful but products look wrong**
- Cause: Column order doesn't match headers
- Solution: Use the sample CSV as template

**Problem: Some products not imported**
- Check console for skipped rows
- Verify each row has name, price, and category
- Check for special characters breaking CSV format

**Problem: Images not showing after import**
- Cause: Image URLs are broken or too large
- Solution: Test URLs in browser, compress images to <20KB

### Advanced Usage

#### Bulk Update Prices
1. Export products
2. Update only the `price` and/or `mrp` columns
3. Keep all IDs the same
4. Import → All prices updated!

#### Add Products from Another Shop
1. Get CSV from other shop
2. Change all IDs to new UUIDs
3. Import → New products added!

#### Change Categories
1. Export products
2. Change `category` column values
3. Import → Categories updated!

### Important Notes

📌 **Direct Database Save**
- Imported products go directly to database
- No pending queue like manual add
- Immediate effect on shop

📌 **ID Matching**
- Import uses product ID to match
- Same ID = update existing
- New ID = add new product

📌 **No Undo**
- Import changes are immediate
- Keep backups of your CSV
- Export before major imports

📌 **Character Encoding**
- CSV supports Unicode (Marathi/Devanagari text)
- Save with UTF-8 encoding
- Test special characters

### Need Help?

Common issues and solutions documented in `/app/IMPORT_EXPORT_FEATURE.md`

For technical details, check the implementation notes in that file.
