# FarmTrakr Email Module - Complete Implementation Guide

**Version:** 1.0  
**Date:** November 6, 2025  
**For:** Cursor AI Integration  
**Project:** FarmTrakr CRM

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Data Structures](#data-structures)
7. [Integration Steps](#integration-steps)
8. [Testing Checklist](#testing-checklist)
9. [Configuration](#configuration)

---

## 🎯 OVERVIEW

### What This Module Does

The Email Module integrates Gmail directly into FarmTrakr CRM, allowing users to:

- **Send and receive emails** from within the CRM
- **Link emails to transactions** for complete deal history
- **Use Gmail labels/folders** for organization
- **Select active transaction context** via dropdown
- **View unlinked emails** separately
- **Use email templates** for common scenarios
- **Search and filter** all communications

### Key Features

- ✅ Gmail API integration (Google Apps Script)
- ✅ Transaction selector dropdown
- ✅ Gmail label/folder sync
- ✅ Link/unlink emails to transactions
- ✅ Rich text email composer
- ✅ Email templates
- ✅ Attachment support
- ✅ Reply/forward functionality
- ✅ Search and filters
- ✅ Bi-directional sync with Gmail

---

## 🏗️ ARCHITECTURE

### System Flow

```
User Interface (HTML/CSS/JS)
    ↓
Google Apps Script Backend
    ↓
    ├─→ Gmail API (Send/Receive)
    ├─→ Google Sheets (Email Log)
    └─→ Google Sheets (Transactions)
```

### Data Flow

```
1. User selects transaction from dropdown
2. Frontend requests emails for that transaction
3. Backend queries:
   - Gmail API (get emails by label/search)
   - Email_Log sheet (get linked emails)
4. Backend merges and filters results
5. Frontend displays emails
6. User can link/unlink emails to transactions
7. Changes saved to Email_Log sheet
```

---

## 📁 FILE STRUCTURE

Create these files in your Google Apps Script project:

```
FarmTrakr-CRM/
├── Backend (Google Apps Script)
│   ├── emailService.gs           # Core email functions
│   ├── emailHelpers.gs           # Utility functions
│   ├── emailTemplates.gs         # Email templates
│   ├── emailLabels.gs            # Gmail label management
│   └── emailConfig.gs            # Configuration
│
├── Frontend (HTML Files)
│   ├── emailPanel.html           # Main email UI
│   ├── emailCompose.html         # Compose modal
│   ├── emailLinkModal.html       # Link to transaction modal
│   ├── emailStyles.css.html      # CSS styling
│   └── emailScripts.js.html      # JavaScript logic
│
└── Data (Google Sheets)
    ├── Email_Log                 # All email records
    ├── Email_Templates           # Saved templates
    └── Transactions              # Existing transactions sheet
```

---

## 💻 BACKEND IMPLEMENTATION

### File 1: `emailConfig.gs`

```javascript
// ==================================================
// EMAIL MODULE CONFIGURATION
// Version: 1.0
// ==================================================

const EmailConfig = {
  // Spreadsheet IDs
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  
  // Sheet Names
  EMAIL_LOG_SHEET: 'Email_Log',
  EMAIL_TEMPLATES_SHEET: 'Email_Templates',
  TRANSACTIONS_SHEET: 'Transactions',
  
  // Email Settings
  DEFAULT_FROM_NAME: 'Janice Glaab Real Estate',
  MAX_RESULTS_PER_QUERY: 50,
  CACHE_DURATION: 3600, // 1 hour in seconds
  
  // User Settings
  getUserEmail: function() {
    return Session.getActiveUser().getEmail();
  },
  
  // Get user's display name
  getUserName: function() {
    return 'Janice Glaab'; // Or pull from settings
  }
};
```

### File 2: `emailService.gs`

```javascript
// ==================================================
// EMAIL SERVICE - CORE FUNCTIONALITY
// Version: 1.0
// Lines: ~350
// ==================================================

const EmailService = {
  
  /**
   * Send email and log to transaction
   * @param {Object} params - Email parameters
   * @returns {Object} Result object
   */
  sendEmail: function(params) {
    try {
      // Validate required fields
      if (!params.to || !params.subject || !params.body) {
        throw new Error('Missing required fields: to, subject, or body');
      }
      
      // Prepare email options
      const emailOptions = {
        htmlBody: params.body,
        name: params.fromName || EmailConfig.DEFAULT_FROM_NAME
      };
      
      // Add optional fields
      if (params.cc) emailOptions.cc = params.cc;
      if (params.bcc) emailOptions.bcc = params.bcc;
      if (params.replyTo) emailOptions.replyTo = params.replyTo;
      if (params.attachments) emailOptions.attachments = params.attachments;
      
      // Send via Gmail
      GmailApp.sendEmail(params.to, params.subject, '', emailOptions);
      
      // Wait briefly for email to be sent
      Utilities.sleep(2000);
      
      // Get message ID
      const messageId = this._getLastSentMessageId(params.to, params.subject);
      
      // Log the email
      this._logEmail({
        messageId: messageId,
        transactionId: params.transactionId || '',
        direction: 'sent',
        from: EmailConfig.getUserEmail(),
        to: params.to,
        cc: params.cc || '',
        bcc: params.bcc || '',
        subject: params.subject,
        body: params.body,
        plainBody: EmailHelpers.stripHtml(params.body),
        timestamp: new Date(),
        attachments: params.attachments ? params.attachments.map(a => a.getName()).join(', ') : '',
        labels: params.labels || '',
        status: 'sent',
        sentBy: EmailConfig.getUserEmail()
      });
      
      return {
        success: true,
        messageId: messageId,
        timestamp: new Date()
      };
      
    } catch (error) {
      Logger.log('Error sending email: ' + error.message);
      
      // Log failed attempt
      this._logEmail({
        transactionId: params.transactionId || '',
        direction: 'sent',
        to: params.to,
        subject: params.subject,
        body: params.body,
        timestamp: new Date(),
        status: 'failed',
        error: error.message,
        sentBy: EmailConfig.getUserEmail()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get filtered emails based on transaction and/or label
   * @param {Object} filters - Filter parameters
   * @returns {Array} Array of email objects
   */
  getFilteredEmails: function(filters) {
    try {
      const {
        transactionId,    // 'all', 'none', or specific ID
        gmailLabel,       // Gmail label name
        searchTerm,       // Search query
        statusFilter,     // 'unread', 'starred', 'hasAttachments'
        maxResults
      } = filters;
      
      let emails = [];
      
      // Fetch from Gmail if label specified
      if (gmailLabel && gmailLabel !== 'all') {
        emails = EmailLabels.fetchEmailsByLabel(gmailLabel, maxResults || EmailConfig.MAX_RESULTS_PER_QUERY);
      } else {
        // Fetch recent emails
        emails = this._fetchRecentEmails(maxResults || EmailConfig.MAX_RESULTS_PER_QUERY);
      }
      
      // Get logged emails for transaction context
      const loggedEmails = this._getLoggedEmails(transactionId);
      
      // Merge Gmail emails with logged emails
      emails = EmailHelpers.mergeAndDeduplicateEmails(emails, loggedEmails);
      
      // Filter by transaction
      if (transactionId && transactionId !== 'all') {
        if (transactionId === 'none') {
          emails = emails.filter(e => !e.transactionId);
        } else {
          emails = emails.filter(e => e.transactionId === transactionId);
        }
      }
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        emails = emails.filter(e => 
          (e.subject && e.subject.toLowerCase().includes(term)) ||
          (e.from && e.from.toLowerCase().includes(term)) ||
          (e.to && e.to.toLowerCase().includes(term)) ||
          (e.plainBody && e.plainBody.toLowerCase().includes(term))
        );
      }
      
      // Apply status filters
      if (statusFilter === 'unread') {
        emails = emails.filter(e => e.isUnread);
      } else if (statusFilter === 'starred') {
        emails = emails.filter(e => e.isStarred);
      } else if (statusFilter === 'hasAttachments') {
        emails = emails.filter(e => e.attachments && e.attachments.length > 0);
      }
      
      // Sort by date (newest first)
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return emails;
      
    } catch (error) {
      Logger.log('Error getting filtered emails: ' + error.message);
      return [];
    }
  },
  
  /**
   * Get single email by ID
   * @param {string} messageId - Gmail message ID
   * @returns {Object} Email object
   */
  getEmailById: function(messageId) {
    try {
      const msg = GmailApp.getMessageById(messageId);
      const thread = msg.getThread();
      
      return {
        messageId: msg.getId(),
        threadId: thread.getId(),
        from: msg.getFrom(),
        to: msg.getTo(),
        cc: msg.getCc(),
        subject: msg.getSubject(),
        body: msg.getBody(),
        plainBody: msg.getPlainBody(),
        date: msg.getDate(),
        isUnread: msg.isUnread(),
        isStarred: msg.isStarred(),
        labels: thread.getLabels().map(l => l.getName()),
        attachments: msg.getAttachments().map(a => ({
          name: a.getName(),
          size: a.getSize(),
          type: a.getContentType()
        })),
        transactionId: this._getTransactionIdForEmail(messageId)
      };
      
    } catch (error) {
      Logger.log('Error getting email: ' + error.message);
      return null;
    }
  },
  
  /**
   * Link email to transaction
   * @param {string} messageId - Gmail message ID
   * @param {string} transactionId - Transaction ID (empty to unlink)
   * @returns {boolean} Success status
   */
  linkEmailToTransaction: function(messageId, transactionId) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.EMAIL_LOG_SHEET);
      const data = sheet.getDataRange().getValues();
      
      // Find email in log
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === messageId) { // Message ID column (column B)
          // Update transaction ID (column C)
          sheet.getRange(i + 1, 3).setValue(transactionId);
          return true;
        }
      }
      
      // Email not in log yet, fetch and add it
      const email = this.getEmailById(messageId);
      if (email) {
        this._logEmail({
          messageId: messageId,
          transactionId: transactionId,
          direction: email.from === EmailConfig.getUserEmail() ? 'sent' : 'received',
          from: email.from,
          to: email.to,
          cc: email.cc,
          subject: email.subject,
          body: email.body,
          plainBody: email.plainBody,
          timestamp: email.date,
          attachments: email.attachments.map(a => a.name).join(', '),
          labels: email.labels.join(', '),
          status: 'received'
        });
        return true;
      }
      
      return false;
      
    } catch (error) {
      Logger.log('Error linking email: ' + error.message);
      return false;
    }
  },
  
  /**
   * Reply to email
   * @param {string} messageId - Original message ID
   * @param {string} body - Reply body
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Result object
   */
  replyToEmail: function(messageId, body, transactionId) {
    try {
      const originalMsg = GmailApp.getMessageById(messageId);
      const thread = originalMsg.getThread();
      
      // Reply to thread
      thread.reply(body, {
        htmlBody: body
      });
      
      // Get the reply we just sent
      Utilities.sleep(2000);
      const messages = thread.getMessages();
      const replyMsg = messages[messages.length - 1];
      
      // Log the reply
      this._logEmail({
        messageId: replyMsg.getId(),
        transactionId: transactionId || '',
        direction: 'sent',
        from: EmailConfig.getUserEmail(),
        to: originalMsg.getFrom(),
        subject: 'Re: ' + originalMsg.getSubject(),
        body: body,
        plainBody: EmailHelpers.stripHtml(body),
        timestamp: new Date(),
        inReplyTo: messageId,
        status: 'sent',
        sentBy: EmailConfig.getUserEmail()
      });
      
      return {
        success: true,
        messageId: replyMsg.getId()
      };
      
    } catch (error) {
      Logger.log('Error replying to email: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get all active transactions for dropdown
   * @returns {Array} Array of transaction objects
   */
  getActiveTransactions: function() {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.TRANSACTIONS_SHEET);
      const data = sheet.getDataRange().getValues();
      
      const transactions = [];
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const status = data[i][8]; // Status column (adjust index as needed)
        
        if (status === 'Active' || status === 'Pending' || status === 'Closing') {
          transactions.push({
            id: data[i][0],           // Transaction ID
            property: data[i][2],     // Property address
            client: data[i][3],       // Client name
            clientEmail: data[i][4],  // Client email
            status: status,
            price: data[i][5],        // Price
            linkedEmails: this._countLinkedEmails(data[i][0])
          });
        }
      }
      
      return transactions;
      
    } catch (error) {
      Logger.log('Error getting transactions: ' + error.message);
      return [];
    }
  },
  
  // ==================== PRIVATE METHODS ====================
  
  /**
   * Log email to spreadsheet
   * @private
   */
  _logEmail: function(logData) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      let sheet = ss.getSheetByName(EmailConfig.EMAIL_LOG_SHEET);
      
      // Create sheet if doesn't exist
      if (!sheet) {
        sheet = ss.insertSheet(EmailConfig.EMAIL_LOG_SHEET);
        sheet.appendRow([
          'Log ID', 'Message ID', 'Transaction ID', 'Direction', 'From', 'To', 
          'CC', 'BCC', 'Subject', 'Plain Body', 'HTML Body', 'Timestamp', 
          'Attachments', 'Labels', 'Status', 'Error', 'User', 'In Reply To'
        ]);
        sheet.getRange(1, 1, 1, 18).setFontWeight('bold');
      }
      
      const logId = 'EML-' + Date.now();
      
      sheet.appendRow([
        logId,
        logData.messageId || '',
        logData.transactionId || '',
        logData.direction || '',
        logData.from || '',
        logData.to || '',
        logData.cc || '',
        logData.bcc || '',
        logData.subject || '',
        logData.plainBody ? logData.plainBody.substring(0, 1000) : '',
        logData.body ? logData.body.substring(0, 2000) : '',
        logData.timestamp || new Date(),
        logData.attachments || '',
        logData.labels || '',
        logData.status || '',
        logData.error || '',
        logData.sentBy || logData.linkedBy || EmailConfig.getUserEmail(),
        logData.inReplyTo || ''
      ]);
      
    } catch (error) {
      Logger.log('Error logging email: ' + error.message);
    }
  },
  
  /**
   * Get logged emails from sheet
   * @private
   */
  _getLoggedEmails: function(transactionId) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.EMAIL_LOG_SHEET);
      
      if (!sheet) return [];
      
      const data = sheet.getDataRange().getValues();
      const emails = [];
      
      for (let i = 1; i < data.length; i++) {
        // If filtering by transaction
        if (transactionId && transactionId !== 'all' && transactionId !== 'none') {
          if (data[i][2] !== transactionId) continue;
        }
        
        emails.push({
          logId: data[i][0],
          messageId: data[i][1],
          transactionId: data[i][2],
          direction: data[i][3],
          from: data[i][4],
          to: data[i][5],
          cc: data[i][6],
          subject: data[i][8],
          plainBody: data[i][9],
          body: data[i][10],
          date: data[i][11],
          attachments: data[i][12] ? data[i][12].split(', ').map(name => ({ name })) : [],
          labels: data[i][13] ? data[i][13].split(', ') : [],
          status: data[i][14]
        });
      }
      
      return emails;
      
    } catch (error) {
      Logger.log('Error getting logged emails: ' + error.message);
      return [];
    }
  },
  
  /**
   * Fetch recent emails from Gmail
   * @private
   */
  _fetchRecentEmails: function(maxResults) {
    try {
      const threads = GmailApp.getInboxThreads(0, maxResults);
      const emails = [];
      
      threads.forEach(thread => {
        const messages = thread.getMessages();
        messages.forEach(msg => {
          emails.push({
            messageId: msg.getId(),
            threadId: thread.getId(),
            from: msg.getFrom(),
            to: msg.getTo(),
            cc: msg.getCc(),
            subject: msg.getSubject(),
            body: msg.getBody(),
            plainBody: msg.getPlainBody(),
            date: msg.getDate(),
            isUnread: msg.isUnread(),
            isStarred: msg.isStarred(),
            labels: thread.getLabels().map(l => l.getName()),
            attachments: msg.getAttachments().map(a => ({
              name: a.getName(),
              size: a.getSize(),
              type: a.getContentType()
            })),
            transactionId: this._getTransactionIdForEmail(msg.getId())
          });
        });
      });
      
      return emails;
      
    } catch (error) {
      Logger.log('Error fetching recent emails: ' + error.message);
      return [];
    }
  },
  
  /**
   * Get transaction ID for email from log
   * @private
   */
  _getTransactionIdForEmail: function(messageId) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.EMAIL_LOG_SHEET);
      
      if (!sheet) return '';
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === messageId) {
          return data[i][2] || '';
        }
      }
      
      return '';
      
    } catch (error) {
      return '';
    }
  },
  
  /**
   * Get last sent message ID
   * @private
   */
  _getLastSentMessageId: function(to, subject) {
    try {
      const threads = GmailApp.search(`to:${to} subject:"${subject}"`, 0, 1);
      if (threads.length > 0) {
        const messages = threads[0].getMessages();
        return messages[messages.length - 1].getId();
      }
    } catch (error) {
      Logger.log('Error getting message ID: ' + error.message);
    }
    return 'MSG-' + Date.now();
  },
  
  /**
   * Count linked emails for transaction
   * @private
   */
  _countLinkedEmails: function(transactionId) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.EMAIL_LOG_SHEET);
      
      if (!sheet) return 0;
      
      const data = sheet.getDataRange().getValues();
      let count = 0;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] === transactionId) {
          count++;
        }
      }
      
      return count;
      
    } catch (error) {
      return 0;
    }
  }
};
```

### File 3: `emailLabels.gs`

```javascript
// ==================================================
// EMAIL LABELS - GMAIL LABEL MANAGEMENT
// Version: 1.0
// Lines: ~200
// ==================================================

const EmailLabels = {
  
  /**
   * Get all Gmail labels with counts
   * @returns {Array} Array of label objects
   */
  getAllLabels: function() {
    try {
      const allLabels = [];
      
      // System labels
      const systemLabels = this._getSystemLabels();
      allLabels.push(...systemLabels);
      
      // Custom user labels
      const customLabels = this._getCustomLabels();
      allLabels.push(...customLabels);
      
      return allLabels;
      
    } catch (error) {
      Logger.log('Error getting labels: ' + error.message);
      return [];
    }
  },
  
  /**
   * Get emails by label
   * @param {string} labelName - Label name
   * @param {number} maxResults - Max results
   * @returns {Array} Array of emails
   */
  fetchEmailsByLabel: function(labelName, maxResults) {
    try {
      let threads = [];
      
      // Handle system labels
      if (labelName === 'INBOX' || labelName === 'Inbox') {
        threads = GmailApp.getInboxThreads(0, maxResults);
      } else if (labelName === 'STARRED' || labelName === 'Starred') {
        threads = GmailApp.getStarredThreads(0, maxResults);
      } else if (labelName === 'SENT' || labelName === 'Sent') {
        threads = GmailApp.search('in:sent', 0, maxResults);
      } else if (labelName === 'DRAFT' || labelName === 'Drafts') {
        return this._getDraftEmails();
      } else {
        // Custom label
        const label = GmailApp.getUserLabelByName(labelName);
        if (label) {
          threads = label.getThreads(0, maxResults);
        }
      }
      
      // Convert threads to email objects
      return this._threadsToEmails(threads);
      
    } catch (error) {
      Logger.log('Error fetching emails by label: ' + error.message);
      return [];
    }
  },
  
  /**
   * Add label to email
   * @param {string} messageId - Message ID
   * @param {string} labelName - Label name
   * @returns {boolean} Success
   */
  addLabel: function(messageId, labelName) {
    try {
      const message = GmailApp.getMessageById(messageId);
      const thread = message.getThread();
      
      let label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        label = GmailApp.createLabel(labelName);
      }
      
      thread.addLabel(label);
      return true;
      
    } catch (error) {
      Logger.log('Error adding label: ' + error.message);
      return false;
    }
  },
  
  /**
   * Remove label from email
   * @param {string} messageId - Message ID
   * @param {string} labelName - Label name
   * @returns {boolean} Success
   */
  removeLabel: function(messageId, labelName) {
    try {
      const message = GmailApp.getMessageById(messageId);
      const thread = message.getThread();
      const label = GmailApp.getUserLabelByName(labelName);
      
      if (label) {
        thread.removeLabel(label);
      }
      
      return true;
      
    } catch (error) {
      Logger.log('Error removing label: ' + error.message);
      return false;
    }
  },
  
  /**
   * Create new label
   * @param {string} labelName - Label name
   * @returns {Object} Result
   */
  createLabel: function(labelName) {
    try {
      let label = GmailApp.getUserLabelByName(labelName);
      
      if (label) {
        return {
          success: false,
          error: 'Label already exists'
        };
      }
      
      label = GmailApp.createLabel(labelName);
      
      return {
        success: true,
        label: {
          id: label.getName(),
          name: label.getName()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ==================== PRIVATE METHODS ====================
  
  /**
   * Get system labels
   * @private
   */
  _getSystemLabels: function() {
    const labels = [];
    
    try {
      // Inbox
      const inbox = GmailApp.getInboxLabel();
      labels.push({
        id: 'INBOX',
        name: 'Inbox',
        type: 'system',
        count: inbox.getThreads().length,
        unreadCount: inbox.getUnreadCount(),
        color: '#4285f4'
      });
    } catch (e) {}
    
    try {
      // Starred
      const starred = GmailApp.getStarredLabel();
      labels.push({
        id: 'STARRED',
        name: 'Starred',
        type: 'system',
        count: starred.getThreads().length,
        unreadCount: starred.getUnreadCount(),
        color: '#fbbc04'
      });
    } catch (e) {}
    
    try {
      // Sent
      const sentThreads = GmailApp.search('in:sent', 0, 100);
      labels.push({
        id: 'SENT',
        name: 'Sent',
        type: 'system',
        count: sentThreads.length,
        unreadCount: 0,
        color: '#34a853'
      });
    } catch (e) {}
    
    try {
      // Drafts
      const drafts = GmailApp.getDrafts();
      labels.push({
        id: 'DRAFT',
        name: 'Drafts',
        type: 'system',
        count: drafts.length,
        unreadCount: 0,
        color: '#9e9e9e'
      });
    } catch (e) {}
    
    try {
      // Important
      labels.push({
        id: 'IMPORTANT',
        name: 'Important',
        type: 'system',
        count: GmailApp.search('is:important', 0, 100).length,
        unreadCount: 0,
        color: '#ea4335'
      });
    } catch (e) {}
    
    return labels;
  },
  
  /**
   * Get custom labels
   * @private
   */
  _getCustomLabels: function() {
    const labels = [];
    
    try {
      const userLabels = GmailApp.getUserLabels();
      
      userLabels.forEach(label => {
        try {
          const threads = label.getThreads(0, 100);
          
          labels.push({
            id: label.getName(),
            name: label.getName(),
            type: 'custom',
            count: threads.length,
            unreadCount: label.getUnreadCount(),
            color: this._getLabelColor(label.getName())
          });
        } catch (e) {
          Logger.log('Error getting custom label: ' + e.message);
        }
      });
    } catch (e) {
      Logger.log('Error getting user labels: ' + e.message);
    }
    
    return labels;
  },
  
  /**
   * Get color for label
   * @private
   */
  _getLabelColor: function(labelName) {
    const colors = {
      'Clients': '#9c27b0',
      'Transactions': '#ff9800',
      'Personal': '#00bcd4',
      'Follow Up': '#f4516c',
      'Vendors': '#673ab7',
      'Inspections': '#009688',
      'Offers': '#ff5722'
    };
    
    return colors[labelName] || '#689f38';
  },
  
  /**
   * Convert threads to email objects
   * @private
   */
  _threadsToEmails: function(threads) {
    const emails = [];
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(msg => {
        emails.push({
          messageId: msg.getId(),
          threadId: thread.getId(),
          from: msg.getFrom(),
          to: msg.getTo(),
          cc: msg.getCc(),
          subject: msg.getSubject(),
          body: msg.getBody(),
          plainBody: msg.getPlainBody(),
          date: msg.getDate(),
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
  },
  
  /**
   * Get draft emails
   * @private
   */
  _getDraftEmails: function() {
    const drafts = GmailApp.getDrafts();
    
    return drafts.map(draft => {
      const msg = draft.getMessage();
      return {
        messageId: draft.getId(),
        from: EmailConfig.getUserEmail(),
        to: msg.getTo(),
        subject: msg.getSubject(),
        body: msg.getBody(),
        plainBody: msg.getPlainBody(),
        date: msg.getDate(),
        isDraft: true,
        labels: ['Drafts']
      };
    });
  }
};
```

### File 4: `emailHelpers.gs`

```javascript
// ==================================================
// EMAIL HELPERS - UTILITY FUNCTIONS
// Version: 1.0
// Lines: ~150
// ==================================================

const EmailHelpers = {
  
  /**
   * Strip HTML tags from text
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripHtml: function(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  },
  
  /**
   * Merge and deduplicate emails from multiple sources
   * @param {Array} gmailEmails - Emails from Gmail
   * @param {Array} loggedEmails - Emails from log
   * @returns {Array} Merged emails
   */
  mergeAndDeduplicateEmails: function(gmailEmails, loggedEmails) {
    const emailMap = new Map();
    
    // Add Gmail emails
    gmailEmails.forEach(email => {
      emailMap.set(email.messageId, email);
    });
    
    // Merge logged emails (they have transaction info)
    loggedEmails.forEach(loggedEmail => {
      if (emailMap.has(loggedEmail.messageId)) {
        // Update existing email with transaction info
        const existing = emailMap.get(loggedEmail.messageId);
        existing.transactionId = loggedEmail.transactionId;
        existing.logId = loggedEmail.logId;
      } else {
        // Add logged email that's not in Gmail results
        emailMap.set(loggedEmail.messageId, loggedEmail);
      }
    });
    
    return Array.from(emailMap.values());
  },
  
  /**
   * Format email date for display
   * @param {Date} date - Email date
   * @returns {string} Formatted date
   */
  formatEmailDate: function(date) {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'h:mm a');
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'EEE');
    } else {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'MMM d');
    }
  },
  
  /**
   * Format full date for detail view
   * @param {Date} date - Email date
   * @returns {string} Formatted date
   */
  formatFullDate: function(date) {
    return Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      'EEEE, MMMM d, yyyy \'at\' h:mm a'
    );
  },
  
  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize: function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
  
  /**
   * Extract email address from "Name <email@domain.com>" format
   * @param {string} emailString - Email string
   * @returns {string} Clean email address
   */
  extractEmailAddress: function(emailString) {
    if (!emailString) return '';
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  },
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid
   */
  isValidEmail: function(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Get transaction info by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction object
   */
  getTransactionInfo: function(transactionId) {
    try {
      const ss = SpreadsheetApp.openById(EmailConfig.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(EmailConfig.TRANSACTIONS_SHEET);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          return {
            id: data[i][0],
            property: data[i][2],
            client: data[i][3],
            clientEmail: data[i][4],
            status: data[i][8],
            price: data[i][5]
          };
        }
      }
      
      return null;
      
    } catch (error) {
      Logger.log('Error getting transaction info: ' + error.message);
      return null;
    }
  }
};
```

### File 5: `emailTemplates.gs`

```javascript
// ==================================================
// EMAIL TEMPLATES
// Version: 1.0
// Lines: ~400
// ==================================================

const EmailTemplates = {
  
  /**
   * Get all templates
   * @returns {Array} Template list
   */
  getAllTemplates: function() {
    return [
      {
        id: 'welcome_buyer',
        name: 'Welcome - New Buyer',
        subject: 'Welcome to Your Home Search Journey!',
        category: 'buyer',
        variables: ['client_name', 'location', 'price_range', 'bedrooms', 'property_type', 'agent_phone', 'agent_email']
      },
      {
        id: 'welcome_seller',
        name: 'Welcome - New Seller',
        subject: 'Let\'s Get Your Property Sold!',
        category: 'seller',
        variables: ['client_name', 'property_address', 'walkthrough_date', 'photo_date', 'listing_date', 'agent_phone', 'agent_email']
      },
      {
        id: 'showing_confirmation',
        name: 'Showing Confirmation',
        subject: 'Property Showing Confirmed',
        category: 'showing',
        variables: ['client_name', 'property_address', 'showing_date', 'showing_time', 'duration', 'meeting_instructions', 'agent_phone']
      },
      {
        id: 'offer_received',
        name: 'Offer Received',
        subject: 'Offer Received on Your Property',
        category: 'offer',
        variables: ['client_name', 'property_address', 'offer_price', 'earnest_money', 'financing_type', 'closing_date', 'contingencies', 'recommendation', 'agent_phone']
      },
      {
        id: 'offer_accepted',
        name: 'Offer Accepted',
        subject: 'Congratulations - Offer Accepted!',
        category: 'offer',
        variables: ['client_name', 'property_address', 'purchase_price', 'closing_date', 'inspection_period', 'agent_phone', 'agent_email']
      },
      {
        id: 'closing_reminder',
        name: 'Closing Reminder',
        subject: 'Your Closing is Coming Up!',
        category: 'closing',
        variables: ['client_name', 'property_address', 'closing_date', 'closing_time', 'closing_location', 'closing_costs', 'agent_phone']
      }
    ];
  },
  
  /**
   * Get template by ID with variable substitution
   * @param {string} templateId - Template ID
   * @param {Object} variables - Variable values
   * @returns {Object} Template with subject and body
   */
  getTemplate: function(templateId, variables) {
    const template = this.getAllTemplates().find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found: ' + templateId);
    }
    
    let body = this._getTemplateBody(templateId);
    let subject = template.subject;
    
    // Replace variables
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, variables[key]);
      body = body.replace(placeholder, variables[key]);
    });
    
    return {
      id: template.id,
      name: template.name,
      subject: subject,
      body: body,
      category: template.category
    };
  },
  
  /**
   * Get template body HTML
   * @private
   */
  _getTemplateBody: function(templateId) {
    // Base template styles
    const styles = `
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #689f38 0%, #558b2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        h1 { margin: 0; font-family: 'Cormorant', serif; font-size: 36px; }
        .button { display: inline-block; background: #689f38; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        ul { margin-left: 20px; }
      </style>
    `;
    
    switch (templateId) {
      case 'welcome_buyer':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏡 Welcome to FarmTrakr</h1>
              </div>
              <div class="content">
                <p>Hi {{client_name}},</p>
                <p>Welcome! I'm thrilled to help you find your perfect home. This is an exciting journey, and I'm here to make it as smooth and enjoyable as possible.</p>
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>I'll set up your property search based on your criteria</li>
                  <li>You'll receive new listings as soon as they hit the market</li>
                  <li>We'll schedule showings for properties that interest you</li>
                  <li>I'll guide you through every step of the buying process</li>
                </ul>
                <p><strong>Your search criteria:</strong></p>
                <ul>
                  <li>Location: {{location}}</li>
                  <li>Price Range: {{price_range}}</li>
                  <li>Bedrooms: {{bedrooms}}</li>
                  <li>Property Type: {{property_type}}</li>
                </ul>
                <p>Feel free to reach out anytime with questions. I'm here to help!</p>
                <p>Best regards,<br>
                <strong>Janice Glaab</strong><br>
                Glaab & Associates Real Estate<br>
                📞 {{agent_phone}}<br>
                📧 {{agent_email}}</p>
              </div>
              <div class="footer">
                <p>© 2025 Glaab & Associates Real Estate. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      case 'welcome_seller':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏡 Let's Sell Your Property!</h1>
              </div>
              <div class="content">
                <p>Hi {{client_name}},</p>
                <p>Thank you for choosing me to sell your property at <strong>{{property_address}}</strong>. I'm committed to getting you the best possible price in the shortest time frame.</p>
                <p><strong>Our Game Plan:</strong></p>
                <ul>
                  <li><strong>Market Analysis:</strong> I'll prepare a comprehensive market analysis to determine the optimal listing price</li>
                  <li><strong>Property Prep:</strong> I'll walk through your property and suggest any improvements that could increase value</li>
                  <li><strong>Professional Marketing:</strong> High-quality photos, virtual tours, and targeted advertising</li>
                  <li><strong>Showings:</strong> We'll schedule convenient showing times that work for you</li>
                  <li><strong>Negotiations:</strong> I'll handle all offers and negotiate the best terms</li>
                </ul>
                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Property walkthrough scheduled for {{walkthrough_date}}</li>
                  <li>Professional photos scheduled for {{photo_date}}</li>
                  <li>Target listing date: {{listing_date}}</li>
                </ol>
                <p>I'll keep you updated every step of the way. Let's get your property sold!</p>
                <p>Best regards,<br>
                <strong>Janice Glaab</strong><br>
                Glaab & Associates Real Estate<br>
                📞 {{agent_phone}}<br>
                📧 {{agent_email}}</p>
              </div>
              <div class="footer">
                <p>© 2025 Glaab & Associates Real Estate. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      case 'showing_confirmation':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="content">
                <h2 style="color: #689f38;">📅 Showing Confirmed</h2>
                <p>Hi {{client_name}},</p>
                <p>Your property showing has been confirmed!</p>
                <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #689f38; margin: 20px 0;">
                  <p><strong>Property:</strong> {{property_address}}</p>
                  <p><strong>Date:</strong> {{showing_date}}</p>
                  <p><strong>Time:</strong> {{showing_time}}</p>
                  <p><strong>Duration:</strong> {{duration}} minutes</p>
                </div>
                <p><strong>Meeting Details:</strong></p>
                <p>{{meeting_instructions}}</p>
                <p>See you there!</p>
                <p>Best regards,<br>
                <strong>Janice Glaab</strong><br>
                📞 {{agent_phone}}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      case 'offer_received':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: #ff9800;">
                <h1>💰 Offer Received!</h1>
              </div>
              <div class="content">
                <p>Hi {{client_name}},</p>
                <p>Great news! We've received an offer on your property at <strong>{{property_address}}</strong>.</p>
                <div style="background: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Offer Details:</h3>
                  <p><strong>Offer Price:</strong> {{offer_price}}</p>
                  <p><strong>Earnest Money:</strong> {{earnest_money}}</p>
                  <p><strong>Financing:</strong> {{financing_type}}</p>
                  <p><strong>Closing Date:</strong> {{closing_date}}</p>
                  <p><strong>Contingencies:</strong> {{contingencies}}</p>
                </div>
                <p><strong>My Recommendation:</strong></p>
                <p>{{recommendation}}</p>
                <p>I've attached the full offer for your review. Let's schedule a call to discuss.</p>
                <p>Best regards,<br>
                <strong>Janice Glaab</strong><br>
                📞 {{agent_phone}}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      case 'offer_accepted':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <div style="text-align: center; font-size: 48px; margin: 20px 0;">🏡 ✅ 🎊</div>
                <p>Hi {{client_name}},</p>
                <p>Fantastic news! Your offer on <strong>{{property_address}}</strong> has been accepted!</p>
                <p><strong>Accepted Offer Details:</strong></p>
                <ul>
                  <li>Purchase Price: {{purchase_price}}</li>
                  <li>Closing Date: {{closing_date}}</li>
                  <li>Inspection Period: {{inspection_period}}</li>
                </ul>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>What Happens Next:</h3>
                  <ol>
                    <li>Earnest money deposit due</li>
                    <li>Home inspection</li>
                    <li>Appraisal ordered</li>
                    <li>Loan approval deadline</li>
                    <li>Closing day!</li>
                  </ol>
                </div>
                <p>I'll guide you through every step. Let's schedule a call to review the timeline in detail.</p>
                <p>Congratulations on your new home!</p>
                <p>Best regards,<br>
                <strong>Janice Glaab</strong><br>
                📞 {{agent_phone}}<br>
                📧 {{agent_email}}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      case 'closing_reminder':
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="content">
                <h2 style="color: #689f38;">🏡 Closing Day is Almost Here!</h2>
                <p>Hi {{client_name}},</p>
                <p>Your closing for <strong>{{property_address}}</strong> is scheduled for:</p>
                <p style="font-size: 20px; color: #689f38;"><strong>{{closing_date}} at {{closing_time}}</strong></p>
                <p><strong>Location:</strong><br>{{closing_location}}</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Final Checklist:</h3>
                  <ul>
                    <li>✅ Government-issued photo ID</li>
                    <li>✅ Cashier's check for closing costs ({{closing_costs}})</li>
                    <li>✅ Proof of homeowners insurance</li>
                    <li>✅ Any documents requested by your lender</li>
                  </ul>
                </div>
                <p><strong>What to Expect:</strong></p>
                <p>The closing typically takes 1-2 hours. You'll sign the final documents, pay closing costs, and receive the keys to your new home!</p>
                <p>I'll be there with you every step of the way.</p>
                <p>See you soon!<br>
                <strong>Janice Glaab</strong><br>
                📞 {{agent_phone}}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
      default:
        return '<p>Template not found</p>';
    }
  }
};
```

---

## 🎨 FRONTEND IMPLEMENTATION

### File 6: `emailPanel.html`

```html
<!DOCTYPE html>
<html>
<head>
    <base target="_top">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <?!= include('emailStyles.css'); ?>
</head>
<body>

<div id="emailModule" class="email-module">
    
    <!-- Email Header -->
    <div class="email-header">
        <div class="header-left">
            <h2>📧 Emails</h2>
            <span id="emailCount" class="count-badge">0</span>
        </div>
        <div class="header-right">
            <button onclick="composeEmail()" class="btn-primary">✉️ Compose</button>
            <button onclick="refreshEmails()" class="btn-secondary">🔄 Refresh</button>
        </div>
    </div>

    <!-- Transaction Selector -->
    <div class="transaction-selector-bar">
        <div class="transaction-selector-label">🏡 View Emails For:</div>
        <select id="transactionSelector" class="transaction-selector" onchange="switchTransaction()">
            <option value="all">All Transactions & Emails</option>
            <option value="none">📭 Unlinked Emails Only</option>
            <!-- Populated dynamically -->
        </select>
        <div class="transaction-info" id="transactionInfo"></div>
    </div>

    <!-- Gmail Labels -->
    <div class="gmail-labels">
        <div class="gmail-labels-header">
            <div class="gmail-labels-title">📁 Gmail Folders/Labels</div>
            <button class="btn-link" onclick="refreshLabels()">Refresh</button>
        </div>
        <div class="gmail-labels-list" id="gmailLabelsList">
            <!-- Populated dynamically -->
        </div>
    </div>

    <!-- Email Filters -->
    <div class="email-filters">
        <input type="text" id="emailSearch" class="search-input" placeholder="Search emails..." oninput="filterEmails()">
        <select id="emailFilter" class="filter-select" onchange="filterEmails()">
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="starred">Starred</option>
            <option value="hasAttachments">Has Attachments</option>
        </select>
        <select id="templateSelect" class="filter-select" onchange="loadTemplate()">
            <option value="">Load Template...</option>
            <!-- Populated dynamically -->
        </select>
    </div>

    <!-- Split View -->
    <div class="email-split-view">
        <div class="email-list" id="emailList">
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No emails found</p>
            </div>
        </div>
        <div class="email-detail" id="emailDetail">
            <div class="email-placeholder">
                <div class="placeholder-icon">📧</div>
                <p>Select an email to view</p>
            </div>
        </div>
    </div>

</div>

<!-- Compose Modal -->
<?!= include('emailCompose'); ?>

<!-- Link Email Modal -->
<?!= include('emailLinkModal'); ?>

<!-- Loading Overlay -->
<div id="loadingOverlay" class="loading-overlay">
    <div class="spinner"></div>
    <p id="loadingText">Loading...</p>
</div>

<?!= include('emailScripts.js'); ?>

</body>
</html>
```

### File 7: `emailCompose.html`

```html
<div id="composeModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>✉️ Compose New Email</h3>
            <span class="modal-close" onclick="closeComposeModal()">&times;</span>
        </div>
        <div class="modal-body">
            
            <div class="form-group">
                <label for="emailTo">To:</label>
                <input type="email" id="emailTo" class="form-control" placeholder="recipient@example.com">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="emailCc">CC:</label>
                    <input type="email" id="emailCc" class="form-control" placeholder="Optional">
                </div>
                <div class="form-group">
                    <label for="emailBcc">BCC:</label>
                    <input type="email" id="emailBcc" class="form-control" placeholder="Optional">
                </div>
            </div>

            <div class="form-group">
                <label for="emailSubject">Subject:</label>
                <input type="text" id="emailSubject" class="form-control" placeholder="Email subject">
            </div>

            <div class="form-group">
                <label for="emailBody">Message:</label>
                <div class="editor-toolbar">
                    <button type="button" onclick="formatText('bold')"><strong>B</strong></button>
                    <button type="button" onclick="formatText('italic')"><em>I</em></button>
                    <button type="button" onclick="formatText('underline')"><u>U</u></button>
                    <button type="button" onclick="insertLink()">🔗</button>
                    <button type="button" onclick="formatText('insertUnorderedList')">• List</button>
                </div>
                <div id="emailBody" class="email-editor" contenteditable="true" data-placeholder="Write your message..."></div>
            </div>

            <div class="form-group">
                <label for="linkToTransaction">Link to Transaction:</label>
                <select id="linkToTransaction" class="form-control">
                    <option value="">Don't link to any transaction</option>
                    <!-- Populated dynamically -->
                </select>
            </div>

        </div>
        <div class="modal-footer">
            <button onclick="closeComposeModal()" class="btn-secondary">Cancel</button>
            <button onclick="sendEmail()" class="btn-primary" style="background: #689f38; color: white;">📤 Send Email</button>
        </div>
    </div>
</div>
```

### File 8: `emailLinkModal.html`

```html
<div id="linkEmailModal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>🔗 Link Email to Transaction</h3>
            <span class="modal-close" onclick="closeLinkModal()">&times;</span>
        </div>
        <div class="modal-body">
            <p style="margin-bottom: 16px; color: #666;">Select which transaction to link this email to:</p>
            <div class="form-group">
                <select id="linkTransactionSelect" class="form-control">
                    <option value="">Remove transaction link</option>
                    <!-- Populated dynamically -->
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeLinkModal()" class="btn-secondary">Cancel</button>
            <button onclick="saveEmailLink()" class="btn-primary" style="background: #689f38; color: white;">Save Link</button>
        </div>
    </div>
</div>
```

### File 9: `emailScripts.js.html`

```html
<script>
// ==================================================
// EMAIL MODULE - JAVASCRIPT
// Version: 1.0
// ==================================================

// Global variables
let currentTransaction = 'all';
let currentLabel = 'INBOX';
let selectedEmail = null;
let emailToLink = null;
let allTransactions = [];
let allLabels = [];

/**
 * Initialize email module
 */
function initEmailModule() {
    console.log('Initializing email module...');
    
    showLoading('Loading email module...');
    
    // Load transactions for dropdown
    google.script.run
        .withSuccessHandler(function(transactions) {
            allTransactions = transactions;
            populateTransactionDropdown();
            
            // Load labels
            loadGmailLabels();
        })
        .withFailureHandler(handleError)
        .getActiveTransactions();
}

/**
 * Populate transaction dropdown
 */
function populateTransactionDropdown() {
    const selector = document.getElementById('transactionSelector');
    const linkSelect = document.getElementById('linkToTransaction');
    const modalSelect = document.getElementById('linkTransactionSelect');
    
    // Clear existing options (keep first two)
    while (selector.options.length > 2) {
        selector.remove(2);
    }
    
    // Add transaction options
    allTransactions.forEach(txn => {
        const option = document.createElement('option');
        option.value = txn.id;
        option.textContent = `${txn.id} - ${txn.property} (${txn.client})`;
        selector.appendChild(option);
        
        // Also add to compose modal
        const composeOption = option.cloneNode(true);
        linkSelect.appendChild(composeOption);
        
        // And link modal
        const linkOption = option.cloneNode(true);
        modalSelect.appendChild(linkOption);
    });
}

/**
 * Load Gmail labels
 */
function loadGmailLabels() {
    google.script.run
        .withSuccessHandler(function(labels) {
            allLabels = labels;
            renderGmailLabels(labels);
            
            // Load email templates
            loadTemplates();
        })
        .withFailureHandler(handleError)
        .getAllLabels();
}

/**
 * Render Gmail labels
 */
function renderGmailLabels(labels) {
    const container = document.getElementById('gmailLabelsList');
    container.innerHTML = '';
    
    labels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'gmail-label ' + label.type;
        if (label.id === currentLabel) {
            labelEl.classList.add('active');
        }
        labelEl.style.borderLeftColor = label.color;
        
        const icon = getLabelIcon(label.name);
        const count = label.unreadCount > 0 ? label.unreadCount : label.count;
        
        labelEl.innerHTML = `${icon} ${label.name} (${count})`;
        labelEl.onclick = () => filterByLabel(label.id);
        
        container.appendChild(labelEl);
    });
}

/**
 * Load email templates
 */
function loadTemplates() {
    google.script.run
        .withSuccessHandler(function(templates) {
            const selector = document.getElementById('templateSelect');
            
            // Clear existing (keep first option)
            while (selector.options.length > 1) {
                selector.remove(1);
            }
            
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                selector.appendChild(option);
            });
            
            // Now load emails
            loadEmails();
        })
        .withFailureHandler(handleError)
        .getAllTemplates();
}

/**
 * Load emails with current filters
 */
function loadEmails() {
    showLoading('Loading emails...');
    
    const filters = {
        transactionId: currentTransaction,
        gmailLabel: currentLabel,
        searchTerm: document.getElementById('emailSearch').value,
        statusFilter: document.getElementById('emailFilter').value
    };
    
    google.script.run
        .withSuccessHandler(function(emails) {
            hideLoading();
            renderEmailList(emails);
            updateEmailCount(emails.length);
        })
        .withFailureHandler(function(error) {
            hideLoading();
            handleError(error);
        })
        .getFilteredEmails(filters);
}

/**
 * Render email list
 */
function renderEmailList(emails) {
    const listEl = document.getElementById('emailList');
    
    if (emails.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No emails found</p>
                <p class="empty-subtext">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = '';
    emails.forEach(email => {
        const card = createEmailCard(email);
        listEl.appendChild(card);
    });
}

/**
 * Create email card element
 */
function createEmailCard(email) {
    const card = document.createElement('div');
    card.className = 'email-card';
    if (email.isUnread) card.classList.add('unread');
    if (selectedEmail && selectedEmail.messageId === email.messageId) {
        card.classList.add('selected');
    }
    
    const directionIcon = email.direction === 'sent' ? '📤' : '📥';
    const txnBadge = email.transactionId 
        ? `<span class="transaction-badge">${email.transactionId}</span>`
        : `<span class="transaction-badge no-transaction">No Transaction</span>`;
    
    card.innerHTML = `
        <div class="email-card-header">
            <div class="email-meta">
                <span class="direction-badge ${email.direction}">${directionIcon} ${email.direction}</span>
                ${txnBadge}
                ${email.isStarred ? '<span class="star">⭐</span>' : ''}
                ${email.attachments && email.attachments.length > 0 ? '<span class="attachment-icon">📎</span>' : ''}
            </div>
            <div class="email-date">${formatEmailDate(email.date)}</div>
        </div>
        
        <div class="email-from">
            ${email.direction === 'sent' ? 'To: ' : 'From: '} 
            ${email.direction === 'sent' ? email.to : email.from}
        </div>
        
        <div class="email-subject">${email.subject || '(No Subject)'}</div>
        
        <div class="email-preview">${email.plainBody || ''}</div>
    `;
    
    card.onclick = () => viewEmail(email);
    return card;
}

/**
 * View email details
 */
function viewEmail(email) {
    selectedEmail = email;
    
    // Update list selection
    document.querySelectorAll('.email-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    const detailEl = document.getElementById('emailDetail');
    
    const txnInfo = email.transactionId 
        ? `<div class="email-transaction-info">
            <strong>🏡 Linked to Transaction:</strong> ${email.transactionId}
            <br><button class="btn-link" onclick="changeLinkTransaction('${email.messageId}')">Change Transaction</button>
        </div>`
        : `<div class="email-transaction-info no-transaction">
            <strong>📭 Not linked to any transaction</strong>
            <br><button class="btn-link" onclick="linkToTransaction('${email.messageId}')">Link to Transaction</button>
        </div>`;
    
    detailEl.innerHTML = `
        <div class="email-detail-header">
            <div class="email-actions">
                <button onclick="replyToEmail()" class="btn-secondary btn-sm">↩️ Reply</button>
                <button onclick="forwardEmail()" class="btn-secondary btn-sm">➡️ Forward</button>
                <button onclick="starEmail()" class="btn-secondary btn-sm">${email.isStarred ? '⭐' : '☆'} Star</button>
            </div>
        </div>
        
        <div class="email-detail-body">
            <h3 class="email-detail-subject">${email.subject || '(No Subject)'}</h3>
            
            ${txnInfo}
            
            <div class="email-detail-meta">
                <div class="meta-row"><strong>From:</strong> ${email.from}</div>
                <div class="meta-row"><strong>To:</strong> ${email.to}</div>
                <div class="meta-row"><strong>Date:</strong> ${formatFullDate(email.date)}</div>
            </div>
            
            ${email.attachments && email.attachments.length > 0 ? `
                <div class="email-attachments">
                    <strong>📎 Attachments (${email.attachments.length}):</strong>
                    ${email.attachments.map(att => `
                        <div class="attachment-item">📄 ${att.name} (${formatFileSize(att.size)})</div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="email-body-content">${email.body || email.plainBody || ''}</div>
        </div>
    `;
}

/**
 * Switch transaction
 */
function switchTransaction() {
    currentTransaction = document.getElementById('transactionSelector').value;
    updateTransactionInfo();
    loadEmails();
}

/**
 * Update transaction info display
 */
function updateTransactionInfo() {
    const infoEl = document.getElementById('transactionInfo');
    
    if (currentTransaction === 'all') {
        infoEl.innerHTML = '<div class="transaction-info-item"><span>Viewing all emails</span></div>';
    } else if (currentTransaction === 'none') {
        infoEl.innerHTML = '<div class="transaction-info-item"><span>📭 Unlinked emails only</span></div>';
    } else {
        const txn = allTransactions.find(t => t.id === currentTransaction);
        if (txn) {
            infoEl.innerHTML = `
                <div class="transaction-info-item"><span>📅</span><span><strong>Status:</strong> ${txn.status}</span></div>
                <div class="transaction-info-item"><span>💰</span><span><strong>Price:</strong> ${txn.price}</span></div>
                <div class="transaction-info-item"><span>📧</span><span><strong>Linked:</strong> ${txn.linkedEmails} emails</span></div>
            `;
        }
    }
}

/**
 * Filter by Gmail label
 */
function filterByLabel(labelId) {
    currentLabel = labelId;
    
    // Update active state
    document.querySelectorAll('.gmail-label').forEach(el => {
        el.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    loadEmails();
}

/**
 * Filter emails (search/status)
 */
function filterEmails() {
    loadEmails();
}

/**
 * Compose new email
 */
function composeEmail() {
    document.getElementById('composeModal').style.display = 'block';
    document.getElementById('emailTo').value = '';
    document.getElementById('emailCc').value = '';
    document.getElementById('emailBcc').value = '';
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailBody').innerHTML = '';
    
    // Pre-select current transaction if applicable
    if (currentTransaction && currentTransaction !== 'all' && currentTransaction !== 'none') {
        document.getElementById('linkToTransaction').value = currentTransaction;
    }
}

/**
 * Close compose modal
 */
function closeComposeModal() {
    document.getElementById('composeModal').style.display = 'none';
}

/**
 * Send email
 */
function sendEmail() {
    const to = document.getElementById('emailTo').value.trim();
    const cc = document.getElementById('emailCc').value.trim();
    const bcc = document.getElementById('emailBcc').value.trim();
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').innerHTML;
    const transactionId = document.getElementById('linkToTransaction').value;
    
    if (!to || !subject || !body) {
        alert('Please fill in To, Subject, and Message');
        return;
    }
    
    showLoading('Sending email...');
    
    const params = {
        to: to,
        subject: subject,
        body: body,
        transactionId: transactionId
    };
    
    if (cc) params.cc = cc;
    if (bcc) params.bcc = bcc;
    
    google.script.run
        .withSuccessHandler(function(result) {
            hideLoading();
            
            if (result.success) {
                alert('✅ Email sent successfully!');
                closeComposeModal();
                loadEmails();
            } else {
                alert('❌ Failed to send email: ' + result.error);
            }
        })
        .withFailureHandler(function(error) {
            hideLoading();
            alert('❌ Error sending email: ' + error.message);
        })
        .sendEmail(params);
}

/**
 * Reply to email
 */
function replyToEmail() {
    if (!selectedEmail) return;
    
    composeEmail();
    document.getElementById('emailTo').value = selectedEmail.from;
    document.getElementById('emailSubject').value = 'Re: ' + selectedEmail.subject;
    
    if (selectedEmail.transactionId) {
        document.getElementById('linkToTransaction').value = selectedEmail.transactionId;
    }
    
    const originalMsg = `
        <br><br>
        <div style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">
            <p><strong>On ${formatFullDate(selectedEmail.date)}, ${selectedEmail.from} wrote:</strong></p>
            ${selectedEmail.body || selectedEmail.plainBody}
        </div>
    `;
    
    document.getElementById('emailBody').innerHTML = originalMsg;
}

/**
 * Forward email
 */
function forwardEmail() {
    if (!selectedEmail) return;
    
    composeEmail();
    document.getElementById('emailSubject').value = 'Fwd: ' + selectedEmail.subject;
    document.getElementById('emailBody').innerHTML = selectedEmail.body || selectedEmail.plainBody;
}

/**
 * Link email to transaction
 */
function linkToTransaction(messageId) {
    emailToLink = messageId;
    document.getElementById('linkTransactionSelect').value = '';
    document.getElementById('linkEmailModal').style.display = 'block';
}

/**
 * Change transaction link
 */
function changeLinkTransaction(messageId) {
    emailToLink = messageId;
    const email = selectedEmail;
    document.getElementById('linkTransactionSelect').value = email.transactionId || '';
    document.getElementById('linkEmailModal').style.display = 'block';
}

/**
 * Close link modal
 */
function closeLinkModal() {
    document.getElementById('linkEmailModal').style.display = 'none';
    emailToLink = null;
}

/**
 * Save email link
 */
function saveEmailLink() {
    const txnId = document.getElementById('linkTransactionSelect').value;
    
    showLoading('Saving link...');
    
    google.script.run
        .withSuccessHandler(function(success) {
            hideLoading();
            
            if (success) {
                alert(txnId ? '✅ Email linked to transaction' : '✅ Transaction link removed');
                closeLinkModal();
                loadEmails();
            } else {
                alert('❌ Failed to link email');
            }
        })
        .withFailureHandler(function(error) {
            hideLoading();
            alert('❌ Error: ' + error.message);
        })
        .linkEmailToTransaction(emailToLink, txnId);
}

/**
 * Star email
 */
function starEmail() {
    // Implementation
    alert('Star functionality coming soon!');
}

/**
 * Load template
 */
function loadTemplate() {
    const templateId = document.getElementById('templateSelect').value;
    
    if (!templateId) return;
    
    showLoading('Loading template...');
    
    // Get template with sample variables
    const variables = {
        client_name: 'Client Name',
        agent_phone: '(123) 456-7890',
        agent_email: 'janice@glaab.com'
    };
    
    google.script.run
        .withSuccessHandler(function(template) {
            hideLoading();
            
            composeEmail();
            document.getElementById('emailSubject').value = template.subject;
            document.getElementById('emailBody').innerHTML = template.body;
            
            document.getElementById('templateSelect').value = '';
        })
        .withFailureHandler(handleError)
        .getTemplate(templateId, variables);
}

/**
 * Refresh emails
 */
function refreshEmails() {
    loadEmails();
}

/**
 * Refresh labels
 */
function refreshLabels() {
    loadGmailLabels();
}

// ==================== UTILITY FUNCTIONS ====================

function formatEmailDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(date) {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function updateEmailCount(count) {
    document.getElementById('emailCount').textContent = count;
}

function getLabelIcon(labelName) {
    const icons = {
        'Inbox': '📥',
        'Sent': '📤',
        'Starred': '⭐',
        'Important': '❗',
        'Drafts': '📝',
        'Trash': '🗑️',
        'Clients': '👥',
        'Transactions': '🏡',
        'Personal': '🏠',
        'Follow Up': '📋',
        'Vendors': '🏢'
    };
    return icons[labelName] || '📁';
}

function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('emailBody').focus();
}

function insertLink() {
    const url = prompt('Enter URL:');
    if (url) document.execCommand('createLink', false, url);
}

function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function handleError(error) {
    hideLoading();
    console.error('Error:', error);
    alert('An error occurred: ' + error.message);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initEmailModule();
});
</script>
```

---

## 📊 DATA STRUCTURES

### Email_Log Sheet

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | Log ID | String | Unique identifier (EML-xxxxx) |
| B | Message ID | String | Gmail message ID |
| C | Transaction ID | String | Linked transaction ID |
| D | Direction | String | "sent" or "received" |
| E | From | String | Sender email |
| F | To | String | Recipient email(s) |
| G | CC | String | CC recipients |
| H | BCC | String | BCC recipients |
| I | Subject | String | Email subject |
| J | Plain Body | String | Plain text body (truncated to 1000 chars) |
| K | HTML Body | String | HTML body (truncated to 2000 chars) |
| L | Timestamp | Date | When email was sent/received |
| M | Attachments | String | Comma-separated attachment names |
| N | Labels | String | Comma-separated Gmail labels |
| O | Status | String | "sent", "received", "failed" |
| P | Error | String | Error message if failed |
| Q | User | String | User who sent/linked the email |
| R | In Reply To | String | Message ID of email being replied to |

### Transactions Sheet (Existing)

Assume your existing structure, but these columns are referenced:

| Column | Name | Used For |
|--------|------|----------|
| A | Transaction ID | Linking emails |
| C | Property Address | Display in UI |
| D | Client Name | Display in UI |
| E | Client Email | Filtering emails |
| F | Price | Display in UI |
| I | Status | Filtering active transactions |

---

## 🔧 INTEGRATION STEPS

### Step 1: Set Up Backend Files

1. **Open your Google Apps Script project**
2. **Create these files:** (File > New > Script file)
   - `emailConfig.gs`
   - `emailService.gs`
   - `emailLabels.gs`
   - `emailHelpers.gs`
   - `emailTemplates.gs`

3. **Copy the code** from each section above into the corresponding file

4. **Update configuration:**
   ```javascript
   // In emailConfig.gs
   const EmailConfig = {
     SPREADSHEET_ID: 'YOUR_ACTUAL_SPREADSHEET_ID', // Replace this!
     // ... rest of config
   };
   ```

### Step 2: Set Up Frontend Files

1. **Create HTML files:** (File > New > HTML file)
   - `emailPanel.html`
   - `emailCompose.html`
   - `emailLinkModal.html`
   - `emailStyles.css.html` (use CSS from demo)
   - `emailScripts.js.html`

2. **Copy the code** from each section into the corresponding file

### Step 3: Create Email_Log Sheet

1. **Open your Google Spreadsheet**
2. **Create new sheet** named "Email_Log"
3. **Add header row:**
   ```
   Log ID | Message ID | Transaction ID | Direction | From | To | CC | BCC | Subject | Plain Body | HTML Body | Timestamp | Attachments | Labels | Status | Error | User | In Reply To
   ```
4. **Format the sheet:**
   - Bold header row
   - Freeze header row (View > Freeze > 1 row)
   - Set column widths appropriately

### Step 4: Add Entry Point

In your main CRM interface, add a function to open the email module:

```javascript
// In your main Code.gs file
function showEmailModule() {
  const html = HtmlService.createHtmlOutputFromFile('emailPanel')
    .setWidth(1400)
    .setHeight(800)
    .setTitle('FarmTrakr Email Module');
  
  SpreadsheetUi.showModalDialog(html, 'Emails');
}

// Or add to sidebar
function showEmailSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('emailPanel')
    .setTitle('Emails');
  
  SpreadsheetUi.showSidebar(html);
}
```

### Step 5: Add Menu Item

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('FarmTrakr')
    .addItem('📧 Open Email Module', 'showEmailModule')
    .addToUi();
}
```

### Step 6: Test

1. **Open your spreadsheet**
2. **Refresh the page** to load the new menu
3. **Click:** FarmTrakr > Open Email Module
4. **Test each feature:**
   - ✅ Transaction selector loads
   - ✅ Gmail labels display
   - ✅ Emails load
   - ✅ Compose works
   - ✅ Link/unlink works
   - ✅ Search/filter works

---

## ✅ TESTING CHECKLIST

### Backend Tests

- [ ] `getActiveTransactions()` returns transaction list
- [ ] `getAllLabels()` returns Gmail labels
- [ ] `getFilteredEmails()` returns emails with correct filters
- [ ] `sendEmail()` successfully sends email
- [ ] `linkEmailToTransaction()` updates Email_Log sheet
- [ ] `getTemplate()` returns formatted template

### Frontend Tests

- [ ] Transaction dropdown populates correctly
- [ ] Gmail labels render with correct counts
- [ ] Email list displays emails
- [ ] Clicking email shows detail view
- [ ] Compose modal opens and functions
- [ ] Link modal opens and saves changes
- [ ] Search filters emails in real-time
- [ ] Status filters work (unread, starred, attachments)
- [ ] Template loading works
- [ ] Reply/forward pre-fills correctly

### Integration Tests

- [ ] Selecting transaction filters emails correctly
- [ ] Selecting "Unlinked Emails" shows only unlinked
- [ ] Clicking Gmail label filters correctly
- [ ] Combining filters works (transaction + label + search)
- [ ] Sending email from compose modal succeeds
- [ ] Sent email appears in Gmail
- [ ] Linking email to transaction updates immediately
- [ ] Changes persist after refresh

### Error Handling Tests

- [ ] Invalid email address shows error
- [ ] Missing required fields shows error
- [ ] Gmail API errors display user-friendly message
- [ ] Network errors handled gracefully
- [ ] Empty states display correctly

---

## ⚙️ CONFIGURATION

### Gmail API Permissions

The script automatically requests these permissions when first run:
- Read Gmail messages
- Send Gmail messages
- Manage Gmail labels
- Access Gmail drafts

User must authorize on first use.

### Performance Settings

```javascript
// In emailConfig.gs, adjust these for your needs:

MAX_RESULTS_PER_QUERY: 50,    // Increase for more emails (max 500)
CACHE_DURATION: 3600,          // Cache duration in seconds
```

### Customization

**Colors:**
```javascript
// In emailLabels.gs, customize label colors:
_getLabelColor: function(labelName) {
  const colors = {
    'Clients': '#9c27b0',     // Change to your preference
    'Transactions': '#ff9800',
    // Add more custom mappings
  };
  return colors[labelName] || '#689f38';
}
```

**Templates:**
Add more templates in `emailTemplates.gs` by following the existing pattern.

**Transaction Fields:**
Update column references in `emailService.gs` if your Transactions sheet has a different structure.

---

## 🚀 DEPLOYMENT

### Pre-Deployment Checklist

- [ ] All files uploaded to Apps Script
- [ ] `SPREADSHEET_ID` configured correctly
- [ ] Email_Log sheet created with correct headers
- [ ] Menu added to open email module
- [ ] Tested with at least 3 different transactions
- [ ] Tested sending/receiving emails
- [ ] Tested linking/unlinking emails

### Go Live

1. **Announce to team:** "Email module is now live!"
2. **Provide training:** Show team how to use transaction selector and Gmail labels
3. **Monitor usage:** Check Email_Log sheet for activity
4. **Gather feedback:** Ask team for improvement suggestions

---

## 📞 SUPPORT

### Common Issues

**Problem:** Emails not loading
- **Solution:** Check Gmail API permissions, refresh authorization

**Problem:** Transaction dropdown empty
- **Solution:** Verify Transactions sheet has Active/Pending transactions

**Problem:** Link to transaction not saving
- **Solution:** Check Email_Log sheet exists and has correct headers

---

## 📝 NOTES FOR CURSOR

**Implementation Priority:**
1. Start with backend files (emailConfig, emailService, emailLabels, emailHelpers)
2. Create Email_Log sheet
3. Implement frontend (emailPanel.html first)
4. Add compose and link modals
5. Test thoroughly

**Key Integration Points:**
- `EmailConfig.SPREADSHEET_ID` must match your spreadsheet
- Transaction sheet column references may need adjustment
- Customize Gmail label colors as desired

**Extensibility:**
- Add more templates in `emailTemplates.gs`
- Add custom Gmail label actions in `emailLabels.gs`
- Add auto-labeling rules based on sender/subject
- Add bulk operations (link multiple emails at once)

---

**End of Implementation Guide**  
Version 1.0 | November 6, 2025

This document contains everything needed to implement the FarmTrakr Email Module. Follow the steps sequentially, test thoroughly, and customize as needed for your specific use case.
