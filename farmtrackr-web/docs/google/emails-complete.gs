/**
 * FarmTrackr Gmail Integration - Google Apps Script
 * 
 * This script provides email functionality for the FarmTrackr CRM:
 * - Send emails via Gmail API
 * - Fetch emails from Gmail
 * - Log emails to transactions
 * - Gmail labels management
 * - Email templates
 * - Link/unlink emails to transactions
 * - Reply/forward functionality
 * 
 * Setup:
 * 1. Deploy this as a Web App
 * 2. Set execution permissions to "Me"
 * 3. Set access to "Anyone" or specific users
 * 4. Copy the Web App URL to use in Next.js app
 */

// ============================================
// CONFIGURATION
// ============================================

// Google Sheet ID for Email Log (create this sheet manually)
const EMAIL_LOG_SHEET_NAME = 'Email_Log';
const EMAIL_TEMPLATES_SHEET_NAME = 'Email_Templates';
const TRANSACTIONS_SHEET_NAME = 'Transactions';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Send email from CRM
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body (HTML supported)
 * @param {string} emailData.transactionId - Optional transaction ID to link
 * @param {string} emailData.contactId - Optional contact ID to link
 * @param {Array} emailData.attachments - Optional array of attachment objects
 * @returns {Object} Result object with success status and message ID
 */
function sendEmailFromCRM(emailData) {
  try {
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return {
        success: false,
        error: 'Missing required fields: to, subject, body'
      };
    }

    // Prepare email options
    const options = {
      htmlBody: emailData.body,
      name: 'Janice Glaab',
      replyTo: 'janice@glaab.com'
    };

    // Add CC if provided
    if (emailData.cc) {
      options.cc = emailData.cc;
    }

    // Add BCC if provided
    if (emailData.bcc) {
      options.bcc = emailData.bcc;
    }

    // Add attachments if provided
    if (emailData.attachments && emailData.attachments.length > 0) {
      options.attachments = emailData.attachments.map(att => {
        // Convert base64 to blob if needed
        if (att.content && att.filename) {
          return Utilities.newBlob(
            Utilities.base64Decode(att.content),
            att.mimeType || 'application/octet-stream',
            att.filename
          );
        }
        return null;
      }).filter(att => att !== null);
    }

    // Send email via Gmail API
    GmailApp.sendEmail(emailData.to, emailData.subject, '', options);

    // Get the sent message ID (for logging)
    const threads = GmailApp.search(`to:${emailData.to} subject:"${emailData.subject}"`, 0, 1);
    let messageId = null;
    if (threads.length > 0) {
      const messages = threads[0].getMessages();
      if (messages.length > 0) {
        messageId = messages[messages.length - 1].getId();
      }
    }

    // Log to Email_Log sheet if transaction ID provided
    if (emailData.transactionId) {
      logEmailToSheet({
        messageId: messageId || `sent-${Date.now()}`,
        transactionId: emailData.transactionId,
        contactId: emailData.contactId || null,
        direction: 'sent',
        to: emailData.to,
        from: Session.getActiveUser().getEmail(),
        subject: emailData.subject,
        body: emailData.body,
        date: new Date(),
        attachments: emailData.attachments || []
      });
    }

    return {
      success: true,
      messageId: messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get recent emails from Gmail
 * @param {Object} queryParams - Query parameters
 * @param {string} queryParams.query - Gmail search query (e.g., "from:client@email.com")
 * @param {number} queryParams.maxResults - Maximum number of results (default: 25)
 * @returns {Array} Array of email objects
 */
function getRecentEmails(queryParams) {
  try {
    const query = queryParams.query || '';
    const maxResults = queryParams.maxResults || 25;

    // Search Gmail threads
    const threads = GmailApp.search(query, 0, maxResults);
    const emails = [];

    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(msg => {
        emails.push({
          id: msg.getId(),
          messageId: msg.getId(), // Alias for compatibility
          threadId: thread.getId(),
          from: msg.getFrom(),
          to: msg.getTo(),
          cc: msg.getCc(),
          subject: msg.getSubject(),
          body: msg.getBody(),
          plainBody: msg.getPlainBody(),
          date: msg.getDate().toISOString(),
          isUnread: msg.isUnread(),
          isStarred: msg.isStarred(),
          attachments: msg.getAttachments().map(att => ({
            name: att.getName(),
            size: att.getSize(),
            type: att.getContentType()
          })),
          labels: thread.getLabels().map(l => l.getName())
        });
      });
    });

    return {
      success: true,
      emails: emails,
      count: emails.length
    };
  } catch (error) {
    Logger.log('Error fetching emails: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      emails: []
    };
  }
}

/**
 * Log email to Email_Log sheet
 * @param {Object} emailData - Email data object
 */
function logEmailToSheet(emailData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(EMAIL_LOG_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(EMAIL_LOG_SHEET_NAME);
      
      // Add headers
      sheet.appendRow([
        'Message ID',
        'Transaction ID',
        'Contact ID',
        'Direction',
        'From',
        'To',
        'Subject',
        'Date/Time',
        'Body Preview',
        'Full Body',
        'Attachments JSON',
        'Thread ID',
        'Saved By'
      ]);

      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, 13);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }

    // Append email data
    sheet.appendRow([
      emailData.messageId || '',
      emailData.transactionId || '',
      emailData.contactId || '',
      emailData.direction || 'sent',
      emailData.from || '',
      emailData.to || '',
      emailData.subject || '',
      emailData.date || new Date(),
      (emailData.body || '').substring(0, 200), // Preview
      emailData.body || '', // Full body
      JSON.stringify(emailData.attachments || []),
      emailData.threadId || '',
      Session.getActiveUser().getEmail()
    ]);
  } catch (error) {
    Logger.log('Error logging email: ' + error.toString());
  }
}

// ============================================
// NEW FUNCTIONS - Email Module Enhancements
// ============================================

/**
 * Get active transactions for dropdown
 * Note: This queries from database via Next.js API, but for Apps Script we'll query from Google Sheets if available
 * @returns {Array} Array of transaction objects
 */
function getActiveTransactions() {
  try {
    // Try to get from Google Sheets if Transactions sheet exists
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        const transactions = [];
        
        // Skip header row (row 0)
        for (let i = 1; i < data.length; i++) {
          // Adjust column indices based on your sheet structure
          // Assuming: A=ID, C=Address, D=Client Name, E=Client Email, F=Price, I=Status
          const status = data[i][8]; // Status column (adjust as needed)
          
          if (['Active', 'Pending', 'Closing', 'Under Contract'].includes(status)) {
            transactions.push({
              id: data[i][0] || `TXN-${i}`,
              propertyAddress: data[i][2] || '',
              clientName: data[i][3] || '',
              clientEmail: data[i][4] || '',
              status: status,
              price: data[i][5] || 0
            });
          }
        }
        
        return transactions;
      }
    } catch (e) {
      Logger.log('Transactions sheet not found, returning empty array');
    }
    
    // If no sheet, return empty array (Next.js will handle database queries)
    return [];
  } catch (error) {
    Logger.log('Error getting transactions: ' + error.toString());
    return [];
  }
}

/**
 * Link email to transaction
 * @param {string} messageId - Gmail message ID
 * @param {string} transactionId - Transaction ID (empty string to unlink)
 * @returns {boolean} Success status
 */
function linkEmailToTransaction(messageId, transactionId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(EMAIL_LOG_SHEET_NAME);
    
    if (!sheet) {
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find email in log (Message ID is column A, Transaction ID is column B)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === messageId) { // Message ID column (column A after header)
        // Update transaction ID (column B)
        sheet.getRange(i + 1, 2).setValue(transactionId || '');
        return true;
      }
    }
    
    // Email not in log yet - would need to fetch and add it
    // For now, return false (Next.js can handle fetching and logging)
    return false;
  } catch (error) {
    Logger.log('Error linking email: ' + error.toString());
    return false;
  }
}

/**
 * Reply to email
 * @param {string} messageId - Original message ID
 * @param {string} replyBody - Reply body (HTML)
 * @param {string} transactionId - Transaction ID
 * @returns {Object} Result object
 */
function replyToEmail(messageId, replyBody, transactionId) {
  try {
    const message = GmailApp.getMessageById(messageId);
    const thread = message.getThread();
    
    // Reply to thread
    thread.reply(replyBody, {
      htmlBody: replyBody
    });
    
    // Wait for reply to send
    Utilities.sleep(2000);
    
    // Get the reply we just sent
    const messages = thread.getMessages();
    const replyMessage = messages[messages.length - 1];
    
    // Log the reply
    logEmailToSheet({
      messageId: replyMessage.getId(),
      transactionId: transactionId || '',
      direction: 'sent',
      from: Session.getActiveUser().getEmail(),
      to: message.getFrom(),
      subject: 'Re: ' + message.getSubject(),
      body: replyBody,
      date: new Date(),
      threadId: thread.getId(),
      inReplyTo: messageId
    });
    
    return {
      success: true,
      messageId: replyMessage.getId()
    };
  } catch (error) {
    Logger.log('Error replying to email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Forward email
 * @param {string} messageId - Original message ID
 * @param {string} forwardTo - Recipient email
 * @param {string} forwardBody - Forward body (HTML)
 * @param {string} transactionId - Transaction ID
 * @returns {Object} Result object
 */
function forwardEmail(messageId, forwardTo, forwardBody, transactionId) {
  try {
    const message = GmailApp.getMessageById(messageId);
    
    GmailApp.sendEmail(forwardTo, 'Fwd: ' + message.getSubject(), '', {
      htmlBody: forwardBody
    });
    
    Utilities.sleep(2000);
    
    // Get the forward we just sent
    const threads = GmailApp.search(`to:${forwardTo} subject:"Fwd: ${message.getSubject()}"`, 0, 1);
    let forwardMessageId = null;
    if (threads.length > 0) {
      const messages = threads[0].getMessages();
      if (messages.length > 0) {
        forwardMessageId = messages[messages.length - 1].getId();
      }
    }
    
    // Log the forward
    logEmailToSheet({
      messageId: forwardMessageId || `FWD-${Date.now()}`,
      transactionId: transactionId || '',
      direction: 'sent',
      from: Session.getActiveUser().getEmail(),
      to: forwardTo,
      subject: 'Fwd: ' + message.getSubject(),
      body: forwardBody,
      date: new Date()
    });
    
    return {
      success: true,
      messageId: forwardMessageId
    };
  } catch (error) {
    Logger.log('Error forwarding email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get Gmail labels (system + custom real estate labels)
 * @returns {Array} Array of label objects
 */
function getGmailLabels() {
  const labels = [];
  
  // System labels
  try {
    labels.push({
      id: 'INBOX',
      name: 'Inbox',
      type: 'system',
      count: GmailApp.getInboxThreads(0, 100).length,
      unreadCount: GmailApp.getInboxUnreadCount(),
      color: '#4285f4',
      icon: '📥'
    });
  } catch (e) {}
  
  try {
    const sentThreads = GmailApp.search('in:sent', 0, 100);
    labels.push({
      id: 'SENT',
      name: 'Sent',
      type: 'system',
      count: sentThreads.length,
      unreadCount: 0,
      color: '#34a853',
      icon: '📤'
    });
  } catch (e) {}
  
  try {
    labels.push({
      id: 'STARRED',
      name: 'Starred',
      type: 'system',
      count: GmailApp.getStarredThreads(0, 100).length,
      unreadCount: 0,
      color: '#fbbc04',
      icon: '⭐'
    });
  } catch (e) {}
  
  try {
    labels.push({
      id: 'DRAFT',
      name: 'Drafts',
      type: 'system',
      count: GmailApp.getDrafts().length,
      unreadCount: 0,
      color: '#9e9e9e',
      icon: '📝'
    });
  } catch (e) {}
  
  // Custom real estate labels
  const customLabels = [
    'Clients',
    'Transactions',
    'Follow Up',
    'Vendors',
    'Inspections',
    'Offers'
  ];
  
  customLabels.forEach(labelName => {
    try {
      const label = GmailApp.getUserLabelByName(labelName);
      if (label) {
        const threads = label.getThreads(0, 100);
        labels.push({
          id: labelName,
          name: labelName,
          type: 'custom',
          count: threads.length,
          unreadCount: label.getUnreadCount(),
          color: getCustomLabelColor(labelName),
          icon: getCustomLabelIcon(labelName)
        });
      }
    } catch (e) {}
  });
  
  return labels;
}

/**
 * Get custom label color
 * @private
 */
function getCustomLabelColor(labelName) {
  const colors = {
    'Clients': '#9c27b0',
    'Transactions': '#ff9800',
    'Follow Up': '#f4516c',
    'Vendors': '#673ab7',
    'Inspections': '#009688',
    'Offers': '#ff5722'
  };
  return colors[labelName] || '#689f38';
}

/**
 * Get custom label icon
 * @private
 */
function getCustomLabelIcon(labelName) {
  const icons = {
    'Clients': '👥',
    'Transactions': '🏡',
    'Follow Up': '📋',
    'Vendors': '🏢',
    'Inspections': '🔍',
    'Offers': '💰'
  };
  return icons[labelName] || '🏷️';
}

/**
 * Get filtered emails with transaction and label filters
 * @param {Object} filters - Filter parameters
 * @returns {Array} Array of email objects
 */
function getFilteredEmails(filters) {
  try {
    const {
      transactionId = 'all',
      gmailLabel = 'INBOX',
      searchTerm = '',
      statusFilter = 'all',
      maxResults = 50
    } = filters;
    
    let emails = [];
    
    // Fetch from Gmail based on label
    if (gmailLabel && gmailLabel !== 'all') {
      emails = fetchEmailsByLabel(gmailLabel, maxResults);
    } else {
      const result = getRecentEmails({ query: '', maxResults: maxResults });
      emails = result.emails || [];
    }
    
    // Get logged emails for transaction context
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EMAIL_LOG_SHEET_NAME);
      
      if (sheet) {
        const logData = sheet.getDataRange().getValues();
        
        // Merge with logged data to add transaction IDs
        emails = emails.map(email => {
          for (let i = 1; i < logData.length; i++) {
            if (logData[i][0] === email.id || logData[i][0] === email.messageId) { // Message ID column
              email.transactionId = logData[i][1] || ''; // Transaction ID column
              email.logId = logData[i][0]; // Log ID
              break;
            }
          }
          return email;
        });
      }
    } catch (e) {
      Logger.log('Email_Log sheet not found, skipping transaction linking');
    }
    
    // Filter by transaction
    if (transactionId && transactionId !== 'all') {
      if (transactionId === 'none') {
        emails = emails.filter(e => !e.transactionId);
      } else {
        emails = emails.filter(e => e.transactionId === transactionId);
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      emails = emails.filter(e =>
        (e.subject && e.subject.toLowerCase().includes(term)) ||
        (e.from && e.from.toLowerCase().includes(term)) ||
        (e.to && e.to.toLowerCase().includes(term)) ||
        (e.plainBody && e.plainBody.toLowerCase().includes(term))
      );
    }
    
    // Filter by status
    if (statusFilter === 'unread') {
      emails = emails.filter(e => e.isUnread);
    } else if (statusFilter === 'starred') {
      emails = emails.filter(e => e.isStarred);
    } else if (statusFilter === 'hasAttachments') {
      emails = emails.filter(e => e.attachments && e.attachments.length > 0);
    }
    
    // Sort by date (newest first)
    emails.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
    
    return emails;
  } catch (error) {
    Logger.log('Error getting filtered emails: ' + error.toString());
    return [];
  }
}

/**
 * Fetch emails by Gmail label
 * @param {string} labelName - Label name
 * @param {number} maxResults - Max results
 * @returns {Array} Array of email objects
 */
function fetchEmailsByLabel(labelName, maxResults) {
  try {
    let threads = [];
    
    if (labelName === 'INBOX') {
      threads = GmailApp.getInboxThreads(0, maxResults);
    } else if (labelName === 'SENT') {
      threads = GmailApp.search('in:sent', 0, maxResults);
    } else if (labelName === 'STARRED') {
      threads = GmailApp.getStarredThreads(0, maxResults);
    } else if (labelName === 'DRAFT') {
      return getDraftEmails();
    } else {
      const label = GmailApp.getUserLabelByName(labelName);
      if (label) {
        threads = label.getThreads(0, maxResults);
      }
    }
    
    return threadsToEmails(threads);
  } catch (error) {
    Logger.log('Error fetching emails by label: ' + error.toString());
    return [];
  }
}

/**
 * Convert Gmail threads to email objects
 * @param {Array} threads - Gmail threads
 * @returns {Array} Array of email objects
 */
function threadsToEmails(threads) {
  const emails = [];
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      emails.push({
        id: msg.getId(),
        messageId: msg.getId(), // Alias for compatibility
        threadId: thread.getId(),
        from: msg.getFrom(),
        to: msg.getTo(),
        cc: msg.getCc(),
        subject: msg.getSubject(),
        body: msg.getBody(),
        plainBody: msg.getPlainBody(),
        date: msg.getDate().toISOString(),
        isUnread: msg.isUnread(),
        isStarred: msg.isStarred(),
        labels: thread.getLabels().map(l => l.getName()),
        attachments: msg.getAttachments().map(a => ({
          name: a.getName(),
          size: a.getSize(),
          type: a.getContentType()
        }))
      });
    });
  });
  
  return emails;
}

/**
 * Get draft emails
 * @returns {Array} Array of draft email objects
 */
function getDraftEmails() {
  try {
    const drafts = GmailApp.getDrafts();
    return drafts.map(draft => {
      const msg = draft.getMessage();
      return {
        id: draft.getId(),
        messageId: draft.getId(),
        from: Session.getActiveUser().getEmail(),
        to: msg.getTo(),
        subject: msg.getSubject(),
        body: msg.getBody(),
        plainBody: msg.getPlainBody(),
        date: msg.getDate().toISOString(),
        isDraft: true,
        labels: ['Drafts']
      };
    });
  } catch (error) {
    Logger.log('Error getting drafts: ' + error.toString());
    return [];
  }
}

/**
 * Get all email templates from Email_Templates sheet
 * @returns {Array} Array of template objects
 */
function getAllTemplates() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(EMAIL_TEMPLATES_SHEET_NAME);
    
    // If sheet doesn't exist, return hardcoded templates
    if (!sheet) {
      return getDefaultTemplates();
    }
    
    const data = sheet.getDataRange().getValues();
    const templates = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const isActive = data[i][6]; // Column G: Active (TRUE/FALSE)
      
      if (isActive === true || isActive === 'TRUE') {
        templates.push({
          id: data[i][0] || '', // Column A: Template ID
          name: data[i][1] || '', // Column B: Template Name
          category: data[i][2] || '', // Column C: Category
          subject: data[i][3] || '', // Column D: Subject
          body: data[i][4] || '', // Column E: Body HTML
          variables: data[i][5] ? data[i][5].split(',').map(v => v.trim()) : [] // Column F: Variables
        });
      }
    }
    
    // If no templates in sheet, return defaults
    if (templates.length === 0) {
      return getDefaultTemplates();
    }
    
    return templates;
  } catch (error) {
    Logger.log('Error getting templates: ' + error.toString());
    // Return default templates on error
    return getDefaultTemplates();
  }
}

/**
 * Get default email templates (hardcoded fallback)
 * @private
 */
function getDefaultTemplates() {
  return [
    {
      id: 'welcome_buyer',
      name: 'Welcome - New Buyer',
      category: 'buyer',
      subject: 'Welcome to Your Home Search Journey!',
      variables: ['client_name', 'location', 'price_range', 'bedrooms', 'property_type', 'agent_phone', 'agent_email']
    },
    {
      id: 'welcome_seller',
      name: 'Welcome - New Seller',
      category: 'seller',
      subject: 'Let\'s Get Your Property Sold!',
      variables: ['client_name', 'property_address', 'walkthrough_date', 'photo_date', 'listing_date', 'agent_phone', 'agent_email']
    },
    {
      id: 'showing_confirmation',
      name: 'Showing Confirmation',
      category: 'showing',
      subject: 'Property Showing Confirmed',
      variables: ['client_name', 'property_address', 'showing_date', 'showing_time', 'duration', 'meeting_instructions', 'agent_phone']
    },
    {
      id: 'offer_received',
      name: 'Offer Received',
      category: 'offer',
      subject: 'Offer Received on Your Property',
      variables: ['client_name', 'property_address', 'offer_price', 'earnest_money', 'financing_type', 'closing_date', 'contingencies', 'recommendation', 'agent_phone']
    },
    {
      id: 'offer_accepted',
      name: 'Offer Accepted',
      category: 'offer',
      subject: 'Congratulations - Offer Accepted!',
      variables: ['client_name', 'property_address', 'purchase_price', 'closing_date', 'inspection_period', 'agent_phone', 'agent_email']
    },
    {
      id: 'closing_reminder',
      name: 'Closing Reminder',
      category: 'closing',
      subject: 'Your Closing is Coming Up!',
      variables: ['client_name', 'property_address', 'closing_date', 'closing_time', 'closing_location', 'closing_costs', 'agent_phone']
    }
  ];
}

/**
 * Get template by ID with variable substitution
 * @param {string} templateId - Template ID
 * @param {Object} variables - Variable values
 * @returns {Object} Template with subject and body
 */
function getTemplate(templateId, variables) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(EMAIL_TEMPLATES_SHEET_NAME);
    let template = null;
    
    // Try to get from sheet first
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === templateId && (data[i][6] === true || data[i][6] === 'TRUE')) {
          template = {
            id: data[i][0],
            name: data[i][1],
            category: data[i][2],
            subject: data[i][3],
            body: data[i][4],
            variables: data[i][5] ? data[i][5].split(',').map(v => v.trim()) : []
          };
          break;
        }
      }
    }
    
    // If not found in sheet, try default templates
    if (!template) {
      const defaults = getDefaultTemplates();
      template = defaults.find(t => t.id === templateId);
      
      if (template) {
        // Get body from hardcoded template body function
        template.body = getDefaultTemplateBody(templateId);
      }
    }
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found: ' + templateId
      };
    }
    
    // Replace variables
    let subject = template.subject;
    let body = template.body;
    
    if (variables) {
      Object.keys(variables).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const value = variables[key] || '';
        subject = subject.replace(placeholder, value);
        body = body.replace(placeholder, value);
      });
    }
    
    return {
      success: true,
      id: template.id,
      name: template.name,
      subject: subject,
      body: body,
      category: template.category
    };
  } catch (error) {
    Logger.log('Error getting template: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get default template body HTML (fallback if sheet doesn't have it)
 * @private
 */
function getDefaultTemplateBody(templateId) {
  // This is a simplified version - full templates would be in the sheet
  // For now, return a basic template structure
  const baseStyles = `
    <style>
      body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #689f38 0%, #558b2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
  `;
  
  // Return basic template - full templates should be in Google Sheets
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FarmTrackr</h1>
        </div>
        <div class="content">
          <p>Template content for ${templateId}</p>
          <p>Please add full template content to Email_Templates sheet.</p>
        </div>
        <div class="footer">
          <p>© 2025 FarmTrackr. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// WEB APP ENTRY POINTS
// ============================================

/**
 * Web app entry point - Handle POST requests from Next.js
 * @param {Object} e - Event object from doPost
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;

    switch (action) {
      case 'send':
        result = sendEmailFromCRM(data.emailData);
        break;
      case 'fetch':
        result = getRecentEmails(data.queryParams);
        break;
      case 'getActiveTransactions':
        result = getActiveTransactions();
        break;
      case 'linkEmailToTransaction':
        result = {
          success: linkEmailToTransaction(data.messageId, data.transactionId || '')
        };
        break;
      case 'replyToEmail':
        result = replyToEmail(data.messageId, data.replyBody, data.transactionId || '');
        break;
      case 'forwardEmail':
        result = forwardEmail(data.messageId, data.forwardTo, data.forwardBody, data.transactionId || '');
        break;
      case 'getGmailLabels':
        result = getGmailLabels();
        break;
      case 'getFilteredEmails':
        result = getFilteredEmails(data.filters || {});
        break;
      case 'getAllTemplates':
        result = getAllTemplates();
        break;
      case 'getTemplate':
        result = getTemplate(data.templateId, data.variables || {});
        break;
      default:
        result = {
          success: false,
          error: 'Invalid action: ' + action
        };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web app entry point - Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'FarmTrackr Email Service is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

