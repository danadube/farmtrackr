# Quick Update: Add createTestEmails to Your Apps Script

## The Problem
Your Apps Script is working (✅ confirmed at https://script.google.com/macros/s/AKfycbzAVOeNafmcMycFzTKojnV3zD2mLKUxsEQ6lEoA0GPxmCYt-YAKaUz2K_zOZ7D16Q6j/exec), but it doesn't have the `createTestEmails` function yet.

## Quick Fix (2 minutes)

### Step 1: Open Your Apps Script
1. Go to [Google Apps Script](https://script.google.com/)
2. Find the project that matches this URL: `AKfycbzAVOeNafmcMycFzTKojnV3zD2mLKUxsEQ6lEoA0GPxmCYt-YAKaUz2K_zOZ7D16Q6j`
3. Open it

### Step 2: Find the doPost Function
1. Press `Ctrl+F` (or `Cmd+F` on Mac)
2. Search for: `case 'getTemplate':`
3. You should see something like:
```javascript
case 'getTemplate':
  result = getTemplate(data.templateId, data.variables || {});
  break;
default:
  result = {
    success: false,
    error: 'Invalid action: ' + action
  };
```

### Step 3: Add the Missing Case
Right after `case 'getTemplate':` and before `default:`, add:

```javascript
case 'createTestEmails':
  result = createTestEmails(data.count || 5);
  break;
```

### Step 4: Add the Function
Scroll to the bottom of your file (before `doGet` function) and add:

```javascript
/**
 * Create test emails for development/testing
 * @param {number} count - Number of test emails to create
 * @returns {Object} Result object
 */
function createTestEmails(count) {
  try {
    const testEmails = [
      {
        to: 'test@example.com',
        subject: 'Welcome to Your Home Search Journey!',
        body: '<p>Hi Test Client,</p><p>Welcome! I\'m thrilled to help you find your perfect home.</p>',
        direction: 'sent'
      },
      {
        from: 'client@example.com',
        subject: 'Re: Property Showing Confirmed',
        body: '<p>Thank you for confirming the showing. I\'m looking forward to it!</p>',
        direction: 'received'
      },
      {
        to: 'buyer@example.com',
        subject: 'Offer Received on Your Property',
        body: '<p>Great news! We\'ve received an offer on your property.</p>',
        direction: 'sent'
      },
      {
        from: 'seller@example.com',
        subject: 'Re: Offer Received',
        body: '<p>Thank you for the update. Let\'s discuss this offer.</p>',
        direction: 'received'
      },
      {
        to: 'client@example.com',
        subject: 'Closing Reminder - Your Closing is Coming Up!',
        body: '<p>Your closing is scheduled for next week. Here\'s what you need to bring.</p>',
        direction: 'sent'
      }
    ];
    
    const created = [];
    const userEmail = Session.getActiveUser().getEmail();
    
    for (let i = 0; i < Math.min(count, testEmails.length); i++) {
      const email = testEmails[i];
      const messageId = `test-${Date.now()}-${i}`;
      
      // Log to Email_Log sheet
      logEmailToSheet({
        messageId: messageId,
        transactionId: '',
        contactId: '',
        direction: email.direction,
        from: email.from || userEmail,
        to: email.to || userEmail,
        subject: email.subject,
        body: email.body,
        date: new Date(),
        attachments: [],
        threadId: `thread-${i}`
      });
      
      created.push({
        messageId: messageId,
        subject: email.subject,
        direction: email.direction
      });
    }
    
    return {
      success: true,
      count: created.length,
      emails: created
    };
  } catch (error) {
    Logger.log('Error creating test emails: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
```

### Step 5: Save and Redeploy
1. **Save** the file (Ctrl+S or Cmd+S)
2. Click **Deploy** → **Manage deployments**
3. Click the **pencil icon** (✏️) next to your active deployment
4. Click **Deploy**
5. The Web App URL stays the same - no need to update `.env.local`

### Step 6: Test
Go back to your FarmTrackr app and click "Create Test Emails" - it should work now!

## Alternative: Copy Entire File
If you prefer, you can copy the entire `emails.gs` file from `farmtrackr-web/docs/google/emails.gs` and replace all code in your Apps Script. This ensures you have all the latest features including full email templates.

