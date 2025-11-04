# Branding Debug Checklist

## Issue: Brand colors not showing in deployed app

### Verification Steps

1. **Check Vercel Deployment**
   - Go to Vercel dashboard
   - Verify latest commit `3ad9f3c` or `101b1b0` is deployed
   - Check deployment logs for build errors
   - Verify build completed successfully

2. **Browser Cache**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Clear browser cache completely
   - Try incognito/private window
   - Try different browser (Chrome, Safari, Arc)

3. **Check Actual Styles in Browser DevTools**
   - Right-click on header → Inspect
   - Check computed styles for:
     - `background` should show: `linear-gradient(135deg, rgb(104, 159, 56) 0%, rgb(85, 139, 47) 100%)`
     - `backgroundColor` should be `transparent` or `rgba(0, 0, 0, 0)`
   - If you see a solid color instead of gradient, there's an override

4. **Verify Code is Deployed**
   - Check browser DevTools → Network tab
   - Look for `_next/static/chunks/` files
   - Check file timestamps match recent deployment

5. **Check for CSS Overrides**
   - Look for any `!important` rules overriding styles
   - Check if Tailwind CSS classes are overriding inline styles
   - Verify no global CSS is setting `backgroundColor` on headers

### Expected Behavior

**Dashboard Header:**
- Should show green gradient (Meadow Green → Forest Green)
- White text
- Smooth gradient transition

**All Page Headers:**
- Commissions page: Green gradient header
- Settings page: Green gradient header  
- Import/Export page: Green gradient header
- Data Quality page: Green gradient header
- Documents page: Green gradient header
- Google Contacts page: Green gradient header

**Cards:**
- Should have 4px colored left border
- White background
- Subtle shadows

### If Still Not Working

1. **Force Rebuild on Vercel**
   - Go to Vercel dashboard
   - Redeploy latest commit
   - Wait for build to complete

2. **Check Environment**
   - Verify `NODE_ENV=production`
   - Check if build is using production optimizations

3. **Add Debug Logging**
   - Add console.log to verify colors object
   - Check if `colors.primary` is correct value

4. **Verify No CDN Caching**
   - Check Vercel CDN cache settings
   - May need to purge cache

### Quick Test

Open browser console and run:
```javascript
// Check if headerCard styles are correct
const header = document.querySelector('[style*="linear-gradient"]');
if (header) {
  const styles = window.getComputedStyle(header);
  console.log('Background:', styles.background);
  console.log('Background Color:', styles.backgroundColor);
}
```

If `background` shows the gradient but it's not visible, there might be a z-index or opacity issue.

