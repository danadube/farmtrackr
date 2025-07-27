//
//  GoogleSheetsManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import SwiftUI

@MainActor
class GoogleSheetsManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var importProgress: Double = 0
    @Published var importStatus: String = ""
    @Published var importedContacts: [ContactRecord] = []
    
    private let oauthManager = GoogleSheetsOAuthManager()
    
    // Public access to OAuth manager's access token for Drive picker
    var accessToken: String? {
        return oauthManager.accessToken
    }
    
    init() {
        // Observe OAuth manager state
        oauthManager.$isAuthenticated
            .assign(to: &$isAuthenticated)
        oauthManager.$isLoading
            .assign(to: &$isLoading)
        oauthManager.$errorMessage
            .assign(to: &$errorMessage)
        
        print("📱 GoogleSheetsManager initialized")
        print("🔗 OAuth Manager isAuthenticated: \(oauthManager.isAuthenticated)")
        print("🔄 OAuth Manager isLoading: \(oauthManager.isLoading)")
    }
    
    // MARK: - Authentication
    
    func authenticate() async {
        print("🔐 GoogleSheetsManager: Starting authentication...")
        await oauthManager.authenticate()
        print("🔐 GoogleSheetsManager: Authentication completed")
        print("✅ GoogleSheetsManager isAuthenticated: \(isAuthenticated)")
        print("❌ GoogleSheetsManager errorMessage: \(errorMessage ?? "None")")
    }
    
    // MARK: - Google Sheets Operations
    
    func importFromGoogleSheets(spreadsheetID: String, range: String = "A:Z") async throws -> [ContactRecord] {
        guard isAuthenticated, let token = oauthManager.getAccessToken() else {
            throw GoogleSheetsError.notAuthenticated
        }
        
        isLoading = true
        importProgress = 0
        importStatus = "Fetching data from Google Sheets..."
        
        let urlString = "https://sheets.googleapis.com/v4/spreadsheets/\(spreadsheetID)/values/\(range)"
        guard let url = URL(string: urlString) else {
            throw GoogleSheetsError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw GoogleSheetsError.apiError("Failed to fetch data from Google Sheets")
            }
            
            let sheetsResponse = try JSONDecoder().decode(GoogleSheetsResponse.self, from: data)
            
            importProgress = 0.5
            importStatus = "Processing data..."
            
            let contacts = try await parseGoogleSheetsData(sheetsResponse.values)
            
            importProgress = 1.0
            importStatus = "Import completed"
            isLoading = false
            
            return contacts
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
            throw error
        }
    }
    
    func exportToGoogleSheets(contacts: [ContactRecord], spreadsheetTitle: String) async throws -> String {
        guard isAuthenticated, let token = oauthManager.getAccessToken() else {
            throw GoogleSheetsError.notAuthenticated
        }
        
        isLoading = true
        importProgress = 0
        importStatus = "Creating Google Sheets..."
        
        // Create new spreadsheet
        let createURL = URL(string: "https://sheets.googleapis.com/v4/spreadsheets")!
        var createRequest = URLRequest(url: createURL)
        createRequest.httpMethod = "POST"
        createRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        createRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let createBody = CreateSpreadsheetRequest(properties: SpreadsheetProperties(title: spreadsheetTitle))
        createRequest.httpBody = try JSONEncoder().encode(createBody)
        
        let (createData, createResponse) = try await URLSession.shared.data(for: createRequest)
        
        guard let httpResponse = createResponse as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw GoogleSheetsError.apiError("Failed to create Google Sheets")
        }
        
        let spreadsheet = try JSONDecoder().decode(SpreadsheetResponse.self, from: createData)
        let spreadsheetID = spreadsheet.spreadsheetId
        
        importProgress = 0.3
        importStatus = "Preparing data..."
        
        // Prepare data for export
        let values = prepareContactDataForExport(contacts)
        
        importProgress = 0.6
        importStatus = "Uploading data..."
        
        // Update spreadsheet with data
        let updateURL = URL(string: "https://sheets.googleapis.com/v4/spreadsheets/\(spreadsheetID)/values/A1:append?valueInputOption=RAW")!
        var updateRequest = URLRequest(url: updateURL)
        updateRequest.httpMethod = "POST"
        updateRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        updateRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let updateBody = UpdateValuesRequest(values: values)
        updateRequest.httpBody = try JSONEncoder().encode(updateBody)
        
        let (_, updateResponse) = try await URLSession.shared.data(for: updateRequest)
        
        guard let updateHttpResponse = updateResponse as? HTTPURLResponse,
              updateHttpResponse.statusCode == 200 else {
            throw GoogleSheetsError.apiError("Failed to update Google Sheets")
        }
        
        importProgress = 1.0
        importStatus = "Export completed"
        isLoading = false
        
        return spreadsheetID
    }
    
    func importSheet(withID id: String) {
        Task {
            do {
                print("📥 Importing Google Sheet with ID: \(id)")
                let contacts = try await importFromGoogleSheets(spreadsheetID: id)
                await MainActor.run {
                    self.importedContacts = contacts
                    self.importStatus = "Imported \(contacts.count) contacts."
                    self.errorMessage = nil
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.importStatus = "Import failed."
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    
    /// Normalizes a key by converting to lowercase and removing spaces and underscores
    private func normalizeKey(_ key: String) -> String {
        return key.lowercased()
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "_", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func parseGoogleSheetsData(_ values: [[String]]) async throws -> [ContactRecord] {
        guard !values.isEmpty else {
            throw GoogleSheetsError.emptyData
        }
        
        print("📊 Parsing Google Sheets data...")
        print("📋 Total rows received: \(values.count)")
        
        let header = values[0]
        let dataRows = Array(values.dropFirst())
        
        print("📋 Header row: \(header)")
        print("📋 Data rows count: \(dataRows.count)")
        
        // Print first few data rows for debugging
        for (index, row) in dataRows.prefix(3).enumerated() {
            print("📋 Data row \(index + 1): \(row)")
        }
        
        var contacts: [ContactRecord] = []
        
        for (index, row) in dataRows.enumerated() {
            if row.allSatisfy({ $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) {
                print("⏭️ Skipping empty row \(index + 1)")
                continue
            }
            
            print("🔄 Processing row \(index + 1): \(row)")
            
            if let contact = createContactRecord(from: row, header: header) {
                contacts.append(contact)
                print("✅ Created contact \(contacts.count): \(contact.firstName) \(contact.lastName)")
            } else {
                print("❌ Failed to create contact from row \(index + 1)")
            }
            
            importProgress = 0.5 + (Double(index) / Double(dataRows.count)) * 0.5
        }
        
        print("📊 Parsing complete. Created \(contacts.count) contacts.")
        return contacts
    }
    
    private func createContactRecord(from values: [String], header: [String]) -> ContactRecord? {
        let columnMapping = createColumnMapping(from: header)
        
        print("🗺️ Column mapping: \(columnMapping)")
        
        func getValue(_ key: String) -> String {
            let normalizedKey = normalizeKey(key)
            guard let index = columnMapping[normalizedKey], index < values.count else { 
                print("❌ No mapping found for key '\(key)' (normalized: '\(normalizedKey)') or index out of bounds")
                return "" 
            }
            let value = values[index]
            print("📝 Extracted '\(key)' (normalized: '\(normalizedKey)'): '\(value)'")
            return value
        }
        
        func getIntValue(_ key: String) -> Int32 {
            let stringValue = getValue(key)
            // Clean the string by removing non-numeric characters
            let cleanedValue = stringValue.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
            let intValue = Int32(cleanedValue) ?? 0
            print("🔢 Extracted int '\(key)': \(intValue) (from '\(stringValue)' -> cleaned: '\(cleanedValue)')")
            return intValue
        }
        
        func getFirstNonEmpty(_ keys: [String]) -> String {
            for key in keys {
                let value = getValue(key)
                if !value.isEmpty { 
                    print("✅ Found non-empty value for \(keys): '\(value)'")
                    return value 
                }
            }
            print("❌ No non-empty value found for keys: \(keys)")
            return ""
        }
        
        let firstName = getFirstNonEmpty(["firstname", "first_name", "first name"])
        let lastName = getFirstNonEmpty(["lastname", "last_name", "last name"])
        let mailingAddress = getFirstNonEmpty(["address", "mailingaddress", "mailing_address", "street address"])
        let city = getValue("city")
        let zipCodeString = getValue("zipcode").cleanedZipCode
        let siteZipCodeString = getValue("sitezipcode").cleanedZipCode
        
        // Debug: Print zip code processing
        if !zipCodeString.isEmpty {
            print("[GoogleSheetsManager] Zip code processing - Original: '\(getValue("zipcode"))', Cleaned: '\(zipCodeString)'")
        }
        if !siteZipCodeString.isEmpty {
            print("[GoogleSheetsManager] Site zip code processing - Original: '\(getValue("sitezipcode"))', Cleaned: '\(siteZipCodeString)'")
        }
        
        let zipCode = Int32(zipCodeString) ?? 0
        let siteZipCode = Int32(siteZipCodeString) ?? 0
        let phoneNumber1 = formatPhoneNumberForImport(getFirstNonEmpty(["phone", "phone1", "phonenumber1", "phone number 1", "telephone"]))
        let phoneNumber2 = formatPhoneNumberForImport(getFirstNonEmpty(["phone2", "phone number 2", "mobile", "cell", "cell phone", "phone 2"]))
        let phoneNumber3 = formatPhoneNumberForImport(getFirstNonEmpty(["phone3", "phone number 3", "work phone", "phone 3"]))
        let phoneNumber4 = formatPhoneNumberForImport(getFirstNonEmpty(["phone4", "phone number 4", "home phone", "phone 4"]))
        let phoneNumber5 = formatPhoneNumberForImport(getFirstNonEmpty(["phone5", "phone number 5", "phone 5"]))
        let phoneNumber6 = formatPhoneNumberForImport(getFirstNonEmpty(["phone6", "phone number 6", "phone 6"]))
        let siteMailingAddress = getFirstNonEmpty(["siteaddress", "site_address", "site address", "site addr", "service address", "location address"])
        let siteCity = getFirstNonEmpty(["sitecity", "site_city", "site city"])
        let siteState = getFirstNonEmpty(["sitestate", "site_state", "site state"])
        
        // Require at least one name
        if firstName.isEmpty && lastName.isEmpty {
            print("❌ Skipping contact - no name found")
            return nil
        }
        
        print("🏷️ Extracted zip codes - Main: \(zipCode), Site: \(siteZipCode)")
        
        let contact = ContactRecord(
            firstName: firstName,
            lastName: lastName,
            mailingAddress: mailingAddress,
            city: city,
            state: getValue("state"),
            zipCode: zipCode,
            email1: getFirstNonEmpty(["email", "email1"]),
            email2: getValue("email2"),
            phoneNumber1: phoneNumber1,
            phoneNumber2: phoneNumber2,
            phoneNumber3: phoneNumber3,
            phoneNumber4: phoneNumber4,
            phoneNumber5: phoneNumber5,
            phoneNumber6: phoneNumber6,
            siteMailingAddress: siteMailingAddress,
            siteCity: siteCity,
            siteState: siteState,
            siteZipCode: siteZipCode,
            notes: getValue("notes"),
            farm: getValue("farm")
        )
        
        print("✅ Created contact: \(contact.firstName) \(contact.lastName) - Farm: \(contact.farm)")
        return contact
    }
    
    private func createColumnMapping(from header: [String]) -> [String: Int] {
        var mapping: [String: Int] = [:]
        
        print("🔍 Creating column mapping from header: \(header)")
        
        for (index, column) in header.enumerated() {
            let normalizedColumn = normalizeKey(column)
            mapping[normalizedColumn] = index
            print("📋 Column \(index): '\(column)' -> '\(normalizedColumn)'")
        }
        
        print("🗺️ Final column mapping: \(mapping)")
        return mapping
    }
    
    private func prepareContactDataForExport(_ contacts: [ContactRecord]) -> [[String]] {
        let header = [
            "First Name", "Last Name", "Mailing Address", "City", "State", "ZIP Code",
            "Email 1", "Email 2", "Phone 1", "Phone 2", "Phone 3", "Phone 4", "Phone 5", "Phone 6",
            "Site Address", "Site City", "Site State", "Site ZIP", "Notes", "Farm"
        ]
        
        var rows: [[String]] = [header]
        
        for contact in contacts {
            let firstName: String = contact.firstName
            let lastName: String = contact.lastName
            let mailingAddress: String = contact.mailingAddress
            let city: String = contact.city
            let state: String = contact.state
            let zipCode: String = String(contact.zipCode)
            let email1: String = contact.email1 ?? ""
            let email2: String = contact.email2 ?? ""
            let phoneNumber1: String = contact.phoneNumber1 ?? ""
            let phoneNumber2: String = contact.phoneNumber2 ?? ""
            let phoneNumber3: String = contact.phoneNumber3 ?? ""
            let phoneNumber4: String = contact.phoneNumber4 ?? ""
            let phoneNumber5: String = contact.phoneNumber5 ?? ""
            let phoneNumber6: String = contact.phoneNumber6 ?? ""
            let siteMailingAddress: String = contact.siteMailingAddress ?? ""
            let siteCity: String = contact.siteCity ?? ""
            let siteState: String = contact.siteState ?? ""
            let siteZipCode: String = String(contact.siteZipCode)
            let notes: String = contact.notes ?? ""
            let farm: String = contact.farm
            
            let row: [String] = [
                firstName,
                lastName,
                mailingAddress,
                city,
                state,
                zipCode,
                email1,
                email2,
                phoneNumber1,
                phoneNumber2,
                phoneNumber3,
                phoneNumber4,
                phoneNumber5,
                phoneNumber6,
                siteMailingAddress,
                siteCity,
                siteState,
                siteZipCode,
                notes,
                farm
            ]
            rows.append(row)
        }
        
        return rows
    }
    
    func logout() {
        oauthManager.logout()
    }
    
    // MARK: - Formatting Helper Methods
    
    private func formatPhoneNumberForImport(_ phone: String?) -> String? {
        guard let phone = phone, !phone.isEmpty else { return nil }
        
        // Remove all non-digit characters
        let digits = phone.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        
        // Handle scientific notation (e.g., 1.5551234567e+10)
        if phone.contains("e") || phone.contains("E") {
            if let doubleValue = Double(phone) {
                let noExp = String(format: "%.0f", doubleValue)
                if noExp.count >= 10 {
                    return formatPhoneNumber(noExp)
                }
            }
        }
        
        // If it's 10 digits, format it properly
        if digits.count == 10 {
            return formatPhoneNumber(digits)
        }
        
        // If it's 11 digits and starts with 1, remove the 1 and format
        if digits.count == 11 && digits.hasPrefix("1") {
            let withoutOne = String(digits.dropFirst())
            return formatPhoneNumber(withoutOne)
        }
        
        // For other valid lengths, return cleaned digits
        if digits.count >= 10 && digits.count <= 15 {
            return digits
        }
        
        // Return original if we can't process it
        return phone
    }
    
    private func formatPhoneNumber(_ digits: String) -> String {
        if digits.count == 10 {
            let area = digits.prefix(3)
            let mid = digits.dropFirst(3).prefix(3)
            let last = digits.suffix(4)
            return "(\(area)) \(mid)-\(last)"
        }
        return digits
    }
}

// MARK: - Data Models

struct GoogleSheetsResponse: Codable {
    let values: [[String]]
}

struct CreateSpreadsheetRequest: Codable {
    let properties: SpreadsheetProperties
}

struct SpreadsheetProperties: Codable {
    let title: String
}

struct SpreadsheetResponse: Codable {
    let spreadsheetId: String
    let properties: SpreadsheetProperties
}

struct UpdateValuesRequest: Codable {
    let values: [[String]]
}

enum GoogleSheetsError: LocalizedError {
    case notAuthenticated
    case authenticationFailed(String)
    case invalidURL
    case apiError(String)
    case emptyData
    case parsingError
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Not authenticated with Google Sheets. Please authenticate first."
        case .authenticationFailed(let message):
            return "Authentication failed: \(message)"
        case .invalidURL:
            return "Invalid Google Sheets URL."
        case .apiError(let message):
            return "Google Sheets API error: \(message)"
        case .emptyData:
            return "No data found in the Google Sheets."
        case .parsingError:
            return "Failed to parse Google Sheets data."
        }
    }
} 