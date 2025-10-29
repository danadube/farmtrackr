//
//  GoogleSheetsConfig.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation

struct GoogleSheetsConfig {
    // MARK: - Google Sheets API Configuration
    
    /// Your Google Cloud Project Client ID
    /// To get this:
    /// 1. Go to https://console.cloud.google.com/
    /// 2. Create a new project or select existing one
    /// 3. Enable Google Sheets API
    /// 4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
    /// 5. Choose iOS as application type
    /// 6. Add your bundle identifier: com.danadube.FarmTrackr
    /// 7. Copy the Client ID here
    static let clientID = "1095090089380-dhl48jsd4umjdnvgnog82je9ubbelv05.apps.googleusercontent.com"
    
    /// Your Google Cloud Project Client Secret
    /// This is provided when you create the OAuth 2.0 Client ID
    /// For iOS apps, this is typically not required but kept for completeness
    /// IMPORTANT: Replace this with your actual client secret from Google Cloud Console
    /// 
    /// To get your Client Secret:
    /// 1. Go to https://console.cloud.google.com/
    /// 2. Select your project
    /// 3. Go to APIs & Services → Credentials
    /// 4. Click on your OAuth 2.0 Client ID
    /// 5. Copy the Client Secret and replace "YOUR_GOOGLE_CLIENT_SECRET" below
    static let clientSecret = ""
    
    /// OAuth 2.0 Redirect URI
    /// This must match exactly what you configure in Google Cloud Console
    /// Format: com.danadube.FarmTrackr://oauth2redirect
    static let redirectURI = "com.googleusercontent.apps.1095090089380-dhl48jsd4umjdnvgnog82je9ubbelv05:/oauth2redirect"
    
    /// Google Sheets API Scope
    /// This defines what permissions your app requests
    static let scope = "https://www.googleapis.com/auth/spreadsheets"
    
    // MARK: - Google Sheets API Endpoints
    
    /// Base URL for Google Sheets API
    static let baseURL = "https://sheets.googleapis.com/v4"
    
    /// OAuth 2.0 Authorization URL
    static let authURL = "https://accounts.google.com/o/oauth2/v2/auth"
    
    /// OAuth 2.0 Token URL
    static let tokenURL = "https://oauth2.googleapis.com/token"
    
    // MARK: - Configuration Validation
    
    /// Validates that all required configuration is set
    static var isConfigured: Bool {
        return !clientID.isEmpty && 
               clientID != "YOUR_GOOGLE_CLIENT_ID" &&
               !redirectURI.isEmpty
    }
    
    /// Returns a user-friendly error message if configuration is invalid
    static var configurationError: String? {
        if clientID.isEmpty || clientID == "YOUR_GOOGLE_CLIENT_ID" {
            return "Google Client ID is not configured. Please update GoogleSheetsConfig.swift with your Client ID from Google Cloud Console."
        }
        if clientSecret.isEmpty || clientSecret == "YOUR_GOOGLE_CLIENT_SECRET" {
            return "Google Client Secret is not configured. Please update GoogleSheetsConfig.swift with your Client Secret from Google Cloud Console."
        }
        if redirectURI.isEmpty {
            return "Redirect URI is not configured."
        }
        return nil
    }
} 
