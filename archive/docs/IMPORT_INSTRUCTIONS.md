# Import Instructions for FarmTrackr

## Manual Export from Google Sheets

Since your Google Sheets are private, you'll need to manually export them as CSV files. Here's how:

### Step 1: Export Each Farm's Data

For each of your farm Google Sheets:

1. **Open the Google Sheet** (e.g., Alicante, Cielo, etc.)
2. **Go to File → Download → CSV (.csv)**
3. **Save the file** with a descriptive name like `Alicante_contacts.csv`

### Step 2: Prepare Your Data

Your CSV should have these columns (in any order - the app will auto-detect them):

**Required Fields:**
- `firstname` or `first_name` or `first name`
- `lastname` or `last_name` or `last name`
- `farm` (the farm name)

**Optional Fields:**
- `address` or `mailingaddress` or `mailing_address`
- `city`
- `state`
- `zipcode` or `zip` or `zip_code`
- `email` or `email1`
- `email2`
- `phone` or `phone1` or `phonenumber1`
- `phone2` or `phonenumber2`
- `phone3` or `phonenumber3`
- `phone4` or `phonenumber4`
- `phone5` or `phonenumber5`
- `phone6` or `phonenumber6`
- `siteaddress` or `site_address`
- `sitecity` or `site_city`
- `sitestate` or `site_state`
- `sitezipcode` or `site_zipcode`
- `notes`

### Step 3: Import into CRM App

1. **Open your FarmTrackr app**
2. **Tap the Import button** (usually in the toolbar)
3. **Select your CSV file** from Files app
4. **Review the preview** - the app will show you what data will be imported
5. **Fix any validation errors** if shown
6. **Confirm the import**

### Step 4: Repeat for Each Farm

Do this process for each of your 9 farms:
- Alicante
- Cielo
- Escala
- Ivy
- Presidential
- Santo Tomas
- Sunterrace
- Versailles
- Victoria Falls

## Sample Data Format

See `farm_data_csv/sample_contact_template.csv` for an example of the expected format.

## Tips

- **Column names are flexible** - the app recognizes multiple variations
- **Missing data is OK** - only first name, last name, and farm are required
- **Phone numbers** should be in standard format (e.g., 555-123-4567)
- **ZIP codes** should be numeric
- **Email addresses** should be valid format

## Troubleshooting

If you get import errors:
1. Check that your CSV has a header row
2. Ensure required fields (first name, last name, farm) are present
3. Verify phone numbers and ZIP codes are in correct format
4. Make sure the file is saved as UTF-8 encoding

## Batch Import

You can import multiple CSV files one after another. The app will add new contacts without duplicating existing ones based on name and farm matching. 