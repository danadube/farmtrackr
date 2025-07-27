//
//  DataImportManager.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData
import CoreXLSX

class DataImportManager: ObservableObject {
    @Published var importProgress: Double = 0
    @Published var importStatus: String = ""
    @Published var isImporting: Bool = false
    
    func importCSV(from url: URL) async throws -> [ContactRecord] {
        let data = try Data(contentsOf: url)
        guard let csvString = String(data: data, encoding: .utf8) else {
            throw ImportError.invalidEncoding
        }
        
        let lines = csvString.components(separatedBy: .newlines)
        guard lines.count > 1 else {
            throw ImportError.emptyFile
        }
        
        // Parse header
        let header = parseCSVLine(lines[0])
        let columnMapping = createColumnMapping(from: header)
        
        // Parse data rows
        var contacts: [ContactRecord] = []
        let dataRows = lines.dropFirst()
        print("Total data rows to process: \(dataRows.count)")
        
        for (index, line) in dataRows.enumerated() {
            if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { 
                print("Skipping empty row \(index + 1)")
                continue 
            }
            
            let values = parseCSVLine(line)
            if let contact = createContactRecord(from: values, mapping: columnMapping) {
                contacts.append(contact)
                print("Added contact \(contacts.count): \(contact.firstName) \(contact.lastName)")
            } else {
                print("Failed to create contact from row \(index + 1)")
            }
            
            // Update progress
            await MainActor.run {
                importProgress = dataRows.count > 0 ? Double(index + 1) / Double(dataRows.count) : 0.0
            }
        }
        
        print("Total contacts created: \(contacts.count)")
        
        return contacts
    }
    
    func importExcel(from url: URL) async throws -> [ContactRecord] {
        print("[DataImportManager] Starting Excel import from: \(url.path)")
        
        // Implement Excel import directly using CoreXLSX
        await MainActor.run {
            importProgress = 0.1
            importStatus = "Reading Excel file..."
        }
        
        guard let xlsx = try? XLSXFile(filepath: url.path) else {
            print("[DataImportManager] Failed to open XLSX file")
            throw ImportError.invalidFileFormat
        }
        
        print("[DataImportManager] Successfully opened XLSX file")
        
        await MainActor.run {
            importProgress = 0.3
            importStatus = "Parsing worksheet..."
        }
        
        // Load shared strings
        guard let sharedStrings = try? xlsx.parseSharedStrings() else {
            print("[DataImportManager] Failed to parse shared strings")
            throw ImportError.invalidFileFormat
        }
        
        // List available worksheets
        let worksheetPaths = try? xlsx.parseWorksheetPaths() ?? []
        print("[DataImportManager] Available worksheets: \(worksheetPaths)")
        
        // Try different worksheet paths
        var worksheet: Worksheet?
        var worksheetPath = ""
        
        // Try common worksheet paths
        let possiblePaths = [
            "xl/worksheets/sheet1.xml",
            "xl/worksheets/sheet2.xml", 
            "xl/worksheets/sheet3.xml",
            "xl/worksheets/Sheet1.xml",
            "xl/worksheets/Sheet2.xml",
            "xl/worksheets/Sheet3.xml"
        ]
        
        for path in possiblePaths {
            if let ws = try? xlsx.parseWorksheet(at: path) {
                worksheet = ws
                worksheetPath = path
                print("[DataImportManager] Successfully found worksheet at: \(path)")
                break
            }
        }
        
        guard let worksheet = worksheet else {
            print("[DataImportManager] Failed to parse any worksheet. Tried paths: \(possiblePaths)")
            throw ImportError.invalidFileFormat
        }
        
        print("[DataImportManager] Successfully parsed worksheet")
        
        await MainActor.run {
            importProgress = 0.5
            importStatus = "Processing data..."
        }
        
        // Get all rows from the worksheet
        let rows = worksheet.data?.rows ?? []
        print("[DataImportManager] Found \(rows.count) rows in worksheet")
        
        if rows.isEmpty {
            print("[DataImportManager] No rows found in worksheet")
            throw ImportError.emptyFile
        }
        
        if rows.count == 1 {
            print("[DataImportManager] Only 1 row found (likely just header)")
            throw ImportError.emptyFile
        }
        
        // Parse header row
        let headerRow = rows[0]
        let header = headerRow.cells.map { $0.stringValue(sharedStrings) ?? "" }
        print("[DataImportManager] Header row: \(header)")
        
        let columnMapping = createColumnMapping(from: header)
        
        await MainActor.run {
            importProgress = 0.7
            importStatus = "Creating contacts..."
        }
        
        // Process data rows
        var contacts: [ContactRecord] = []
        let dataRows = Array(rows.dropFirst())
        print("[DataImportManager] Processing \(dataRows.count) data rows")
        
        for (index, row) in dataRows.enumerated() {
            let values = row.cells.map { $0.stringValue(sharedStrings) ?? "" }
            print("[DataImportManager] Row \(index + 1) values: \(values)")
            
            // Skip empty rows
            if values.allSatisfy({ $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) {
                print("[DataImportManager] Skipping empty row \(index + 1)")
                continue
            }
            
            if let contact = createContactRecord(from: values, mapping: columnMapping) {
                print("[DataImportManager] Created contact: \(contact.firstName) \(contact.lastName)")
                contacts.append(contact)
            } else {
                print("[DataImportManager] Failed to create contact from row \(index + 1)")
            }
            
            // Update progress
            await MainActor.run {
                importProgress = 0.7 + (Double(index) / Double(dataRows.count)) * 0.3
                importStatus = "Processed \(index + 1) of \(dataRows.count) rows..."
            }
        }
        
        print("[DataImportManager] Excel import completed. Created \(contacts.count) contacts")
        return contacts
    }
    
    func validateData(_ records: [ContactRecord]) -> [ValidationError] {
        var errors: [ValidationError] = []
        let validator = DataValidator()
        
        for (index, record) in records.enumerated() {
            // Validate names
            let firstNameResult = validator.validateName(record.firstName, fieldName: "First Name")
            let lastNameResult = validator.validateName(record.lastName, fieldName: "Last Name")
            
            if !firstNameResult.isValid && !lastNameResult.isValid {
                errors.append(ValidationError(
                    id: UUID(),
                    row: index + 1,
                    field: "name",
                    message: "At least first name or last name is required"
                ))
            }
            
            // Validate emails with enhanced validation
            if let email = record.email1, !email.isEmpty {
                let emailResult = validator.validateEmail(email)
                if !emailResult.isValid {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "email1",
                        message: "Email validation failed: \(emailResult.errors.joined(separator: ", "))"
                    ))
                }
            }
            
            if let email = record.email2, !email.isEmpty {
                let emailResult = validator.validateEmail(email)
                if !emailResult.isValid {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "email2",
                        message: "Email validation failed: \(emailResult.errors.joined(separator: ", "))"
                    ))
                }
            }
            
            // Validate phone numbers with enhanced validation
            let phoneNumbers = [record.phoneNumber1, record.phoneNumber2, record.phoneNumber3,
                              record.phoneNumber4, record.phoneNumber5, record.phoneNumber6]
            
            for (phoneIndex, phone) in phoneNumbers.enumerated() {
                if let phone = phone, !phone.isEmpty {
                    let phoneResult = validator.validatePhoneNumber(phone)
                    if !phoneResult.isValid {
                        errors.append(ValidationError(
                            id: UUID(),
                            row: index + 1,
                            field: "phoneNumber\(phoneIndex + 1)",
                            message: "Phone validation failed: \(phoneResult.errors.joined(separator: ", "))"
                        ))
                    }
                }
            }
            
            // Validate address
            if !record.mailingAddress.isEmpty {
                let addressResult = validator.validateAddress(record.mailingAddress)
                if !addressResult.isValid {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "mailingAddress",
                        message: "Address validation failed: \(addressResult.errors.joined(separator: ", "))"
                    ))
                }
            }
            
            // Validate ZIP code
            if record.zipCode > 0 {
                let zipResult = validator.validateZipCode(String(record.zipCode))
                if !zipResult.isValid {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "zipCode",
                        message: "ZIP code validation failed: \(zipResult.errors.joined(separator: ", "))"
                    ))
                }
            }
        }
        
        return errors
    }
    
    func assessDataQuality(_ records: [ContactRecord]) -> DataQualityScore {
        let validator = DataValidator()
        return validator.calculateDataQualityScore(records)
    }
    
    func detectDuplicateContacts(_ records: [ContactRecord], context: NSManagedObjectContext) -> [DuplicateGroup] {
        let validator = DataValidator()
        return validator.detectDuplicates(records, context: context)
    }
    
    func getValidationSuggestions(_ records: [ContactRecord]) -> [String: [String]] {
        let validator = DataValidator()
        var suggestions: [String: [String]] = [:]
        
        for (index, record) in records.enumerated() {
            var recordSuggestions: [String] = []
            
            // Email suggestions
            if let email = record.email1, !email.isEmpty {
                let emailResult = validator.validateEmail(email)
                recordSuggestions.append(contentsOf: emailResult.suggestions)
            }
            
            if let email = record.email2, !email.isEmpty {
                let emailResult = validator.validateEmail(email)
                recordSuggestions.append(contentsOf: emailResult.suggestions)
            }
            
            // Phone suggestions
            let phoneNumbers = [record.phoneNumber1, record.phoneNumber2, record.phoneNumber3,
                              record.phoneNumber4, record.phoneNumber5, record.phoneNumber6]
            
            for phone in phoneNumbers {
                if let phone = phone, !phone.isEmpty {
                    let phoneResult = validator.validatePhoneNumber(phone)
                    recordSuggestions.append(contentsOf: phoneResult.suggestions)
                }
            }
            
            // Address suggestions
            if !record.mailingAddress.isEmpty {
                let addressResult = validator.validateAddress(record.mailingAddress)
                recordSuggestions.append(contentsOf: addressResult.suggestions)
            }
            
            // ZIP code suggestions
            if record.zipCode > 0 {
                let zipResult = validator.validateZipCode(String(record.zipCode))
                recordSuggestions.append(contentsOf: zipResult.suggestions)
            }
            
            if !recordSuggestions.isEmpty {
                suggestions["Row \(index + 1)"] = recordSuggestions
            }
        }
        
        return suggestions
    }
    
    func saveContactsToCoreData(_ records: [ContactRecord], context: NSManagedObjectContext, progress: @escaping (Double, String) -> Void) async throws {
        print("[DataImportManager] Starting to save \(records.count) contacts to Core Data...")
        progress(0.0, "Saving contacts...")
        guard !records.isEmpty else {
            print("[DataImportManager] No contacts to save")
            progress(1.0, "No contacts to save.")
            return
        }
        for (index, record) in records.enumerated() {
            print("[DataImportManager] Saving contact \(index + 1) of \(records.count): \(record.firstName) \(record.lastName)")
            await MainActor.run {
                let contact = FarmContact(context: context)
                
                contact.firstName = record.firstName
                contact.lastName = record.lastName
                contact.mailingAddress = record.mailingAddress
                contact.city = record.city
                contact.state = record.state
                contact.zipCode = formatZipCodeForImport(record.zipCode)
                contact.email1 = record.email1
                contact.email2 = record.email2
                contact.phoneNumber1 = formatPhoneNumberForImport(record.phoneNumber1)
                contact.phoneNumber2 = formatPhoneNumberForImport(record.phoneNumber2)
                contact.phoneNumber3 = formatPhoneNumberForImport(record.phoneNumber3)
                contact.phoneNumber4 = formatPhoneNumberForImport(record.phoneNumber4)
                contact.phoneNumber5 = formatPhoneNumberForImport(record.phoneNumber5)
                contact.phoneNumber6 = formatPhoneNumberForImport(record.phoneNumber6)
                contact.siteMailingAddress = record.siteMailingAddress
                contact.siteCity = record.siteCity
                contact.siteState = record.siteState
                contact.siteZipCode = formatZipCodeForImport(record.siteZipCode)
                contact.notes = record.notes
                contact.farm = record.farm
                contact.dateCreated = Date()
                contact.dateModified = Date()
                
                // Update progress
                importProgress = records.count > 0 ? Double(index + 1) / Double(records.count) : 0.0
                importStatus = "Saving contact \(index + 1) of \(records.count)"
            }
            if index % 10 == 0 {
                let prog = Double(index) / Double(records.count)
                progress(prog, "Saved \(index + 1) of \(records.count) contacts")
            }
        }
        
        print("[DataImportManager] Finished saving contacts.")
        progress(1.0, "All contacts saved.")
        
        print("All contacts created in context, attempting to save context...")
        
        do {
            try await context.perform {
                try context.save()
            }
            print("Successfully saved \(records.count) contacts to Core Data")
        } catch {
            print("Failed to save context: \(error)")
            throw ImportError.saveFailed(error)
        }
    }
    
    func importContact(_ record: ContactRecord, into context: NSManagedObjectContext) async throws {
        await MainActor.run {
            let contact = FarmContact(context: context)
            
            contact.firstName = record.firstName
            contact.lastName = record.lastName
            contact.mailingAddress = record.mailingAddress
            contact.city = record.city
            contact.state = record.state
            contact.zipCode = formatZipCodeForImport(record.zipCode)
            contact.email1 = record.email1
            contact.email2 = record.email2
            contact.phoneNumber1 = formatPhoneNumberForImport(record.phoneNumber1)
            contact.phoneNumber2 = formatPhoneNumberForImport(record.phoneNumber2)
            contact.phoneNumber3 = formatPhoneNumberForImport(record.phoneNumber3)
            contact.phoneNumber4 = formatPhoneNumberForImport(record.phoneNumber4)
            contact.phoneNumber5 = formatPhoneNumberForImport(record.phoneNumber5)
            contact.phoneNumber6 = formatPhoneNumberForImport(record.phoneNumber6)
            contact.siteMailingAddress = record.siteMailingAddress
            contact.siteCity = record.siteCity
            contact.siteState = record.siteState
            contact.siteZipCode = formatZipCodeForImport(record.siteZipCode)
            contact.notes = record.notes
            contact.farm = record.farm
            contact.dateCreated = Date()
            contact.dateModified = Date()
        }
    }
    
    // MARK: - Test Functions
    
    func testExcelImport() {
        print("[DataImportManager] TEST: testExcelImport() called\n", terminator: ""); fflush(stdout)
        
        let testFilePath = "/Users/danadube/Desktop/FarmTrackr-old/FarmTrackr/Resources/Farm Tables San Marino.xlsx"
        let testURL = URL(fileURLWithPath: testFilePath)
        print("[DataImportManager] TEST: Using file: \(testURL.path)\n", terminator: ""); fflush(stdout)
        
        do {
            guard let xlsx = try? XLSXFile(filepath: testURL.path) else {
                print("[DataImportManager] TEST: Failed to open XLSX file\n", terminator: ""); fflush(stdout)
                return
            }
            let worksheetPaths = (try? xlsx.parseWorksheetPaths()) ?? []
            print("[DataImportManager] TEST: Worksheet paths: \(worksheetPaths)\n", terminator: ""); fflush(stdout)
            
            // Load shared strings
            guard let sharedStrings = try? xlsx.parseSharedStrings() else {
                print("[DataImportManager] TEST: Failed to parse shared strings\n", terminator: ""); fflush(stdout)
                return
            }
            
            var foundRows = false
            for path in worksheetPaths {
                print("[DataImportManager] TEST: Trying worksheet path: \(path)\n", terminator: ""); fflush(stdout)
                guard let worksheet = try? xlsx.parseWorksheet(at: path) else {
                    print("[DataImportManager] TEST: Failed to parse worksheet at \(path)\n", terminator: ""); fflush(stdout)
                    continue
                }
                let rows = worksheet.data?.rows ?? []
                print("[DataImportManager] TEST: Found \(rows.count) rows in \(path)\n", terminator: ""); fflush(stdout)
                if rows.isEmpty { continue }
                foundRows = true
                // Print header row
                if let headerRow = rows.first {
                    let headerValues = headerRow.cells.map { $0.stringValue(sharedStrings) ?? "" }
                    print("[DataImportManager] TEST: Header: \(headerValues)\n", terminator: ""); fflush(stdout)
                }
                // Print first 3 data rows
                for (i, row) in rows.dropFirst().prefix(3).enumerated() {
                    let values = row.cells.map { $0.stringValue(sharedStrings) ?? "" }
                    print("[DataImportManager] TEST: Row \(i+1): \(values)\n", terminator: ""); fflush(stdout)
                }
                break // Only process the first worksheet with data
            }
            if !foundRows {
                print("[DataImportManager] TEST: No rows found in any worksheet\n", terminator: ""); fflush(stdout)
            }
        } catch {
            print("[DataImportManager] TEST: Error: \(error.localizedDescription)\n", terminator: ""); fflush(stdout)
        }
    }
    
    // MARK: - UI Test Function
    
    func testExcelImportFromUI() async -> String {
        var result = "=== EXCEL IMPORT TEST ===\n"
        
        let testFilePath = "/Users/danadube/Desktop/FarmTrackr-old/FarmTrackr/Resources/Farm Tables San Marino.xlsx"
        let testURL = URL(fileURLWithPath: testFilePath)
        
        result += "File path: \(testFilePath)\n"
        
        // Check if file exists
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: testFilePath) {
            result += "❌ File does not exist!\n"
            return result
        }
        result += "✅ File exists\n"
        
        // Now try the actual import
        result += "\n--- TRYING ACTUAL IMPORT ---\n"
        do {
            let contacts = try await importExcel(from: testURL)
            result += "✅ Import completed with \(contacts.count) contacts\n"
            
            if contacts.isEmpty {
                result += "⚠️ No contacts found - this might indicate an issue with parsing\n"
            } else {
                result += "📋 First few contacts:\n"
                for (index, contact) in contacts.prefix(3).enumerated() {
                    let contactInfo = "  \(index + 1). \(contact.firstName) \(contact.lastName) - \(contact.farm)"
                    result += contactInfo + "\n"
                }
            }
        } catch {
            result += "❌ Import failed with error: \(error.localizedDescription)\n"
        }
        
        return result
    }
    
    // MARK: - Private Methods
    
    private func parseCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false
        
        for char in line {
            switch char {
            case "\"":
                inQuotes.toggle()
            case ",":
                if !inQuotes {
                    result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
                    current = ""
                } else {
                    current.append(char)
                }
            default:
                current.append(char)
            }
        }
        
        result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
        return result
    }
    
    private func createColumnMapping(from header: [String]) -> [String: Int] {
        var mapping: [String: Int] = [:]
        
        print("[DataImportManager] DEBUG: Creating column mapping from header: \(header)")
        
        for (index, column) in header.enumerated() {
            let normalizedColumn = column.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            mapping[normalizedColumn] = index
            print("[DataImportManager] DEBUG: Column \(index): '\(column)' -> normalized: '\(normalizedColumn)'")
        }
        
        // Debug: Print the final column mapping
        print("[DataImportManager] DEBUG: Final column mapping:")
        for (key, value) in mapping.sorted(by: { $0.key < $1.key }) {
            print("[DataImportManager] DEBUG:   '\(key)' -> column \(value)")
        }
        
        return mapping
    }
    
    private func createContactRecord(from values: [String], mapping: [String: Int]) -> ContactRecord? {
        func getValue(_ key: String) -> String {
            guard let index = mapping[key], index < values.count else { 
                print("[DataImportManager] DEBUG: Key '\(key)' not found in mapping or index out of bounds")
                return "" 
            }
            let value = values[index]
            print("[DataImportManager] DEBUG: Found value '\(value)' for key '\(key)' at index \(index)")
            return value
        }
        
        func getIntValue(_ key: String) -> Int32 {
            let stringValue = getValue(key)
            return Int32(stringValue) ?? 0
        }
        
        // Helper to get first non-empty string from a list of keys
        func getFirstNonEmpty(_ keys: [String]) -> String {
            for key in keys {
                let value = getValue(key)
                if !value.isEmpty { return value }
            }
            return ""
        }
        // Helper to get first non-zero Int32 from a list of keys
        func getFirstNonZeroInt(_ keys: [String]) -> Int32 {
            for key in keys {
                let value = getValue(key)
                if let intVal = Int32(value), intVal != 0 { return intVal }
            }
            return 0
        }
        
        // Debug: Print what we're looking for
        print("[DataImportManager] Looking for columns in mapping: \(mapping.keys.sorted())")
        
        // Get the best available value for each field - updated to match actual Excel column names
        let firstName = getFirstNonEmpty(["first name", "firstname", "first_name", "First Name"])
        let lastName = getFirstNonEmpty(["last name", "lastname", "last_name", "Last Name"])
        let mailingAddress = getFirstNonEmpty(["mailing address", "address", "mailingaddress", "mailing_address", "street address", "Mailing Address"])
        let city = getFirstNonEmpty(["city", "City"])
        let state = getFirstNonEmpty(["state", "State"])
        let zipCodeString = getFirstNonEmpty(["zip code", "zipcode", "zip", "zip_code", "postal code", "Zip Code"]).cleanedZipCode
        let siteZipCodeString = getFirstNonEmpty(["site zip code", "sitezipcode", "site_zipcode", "site zip", "Site Zip Code"]).cleanedZipCode
        
        // Debug: Print zip code processing
        if !zipCodeString.isEmpty {
            print("[DataImportManager] Zip code processing - Original: '\(getFirstNonEmpty(["zip code", "zipcode", "zip", "zip_code", "postal code", "Zip Code"]))', Cleaned: '\(zipCodeString)'")
        }
        if !siteZipCodeString.isEmpty {
            print("[DataImportManager] Site zip code processing - Original: '\(getFirstNonEmpty(["site zip code", "sitezipcode", "site_zipcode", "site zip", "Site Zip Code"]))', Cleaned: '\(siteZipCodeString)'")
        }
        
        let zipCode = Int32(zipCodeString) ?? 0
        let siteZipCode = Int32(siteZipCodeString) ?? 0
        let phoneNumber1 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 1", "phone", "phone1", "phonenumber1", "telephone", "Phone Number 1"]))
        let phoneNumber2 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 2", "phone2", "mobile", "cell", "cell phone", "phone 2", "Phone Number 2"]))
        let phoneNumber3 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 3", "phone3", "work phone", "phone 3", "Phone Number 3"]))
        let phoneNumber4 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 4", "phone4", "home phone", "phone 4", "Phone Number 4"]))
        let phoneNumber5 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 5", "phone5", "phone 5", "Phone Number 5"]))
        let phoneNumber6 = formatPhoneNumberForImport(getFirstNonEmpty(["phone number 6", "phone6", "phone 6", "Phone Number 6"]))
        // Site address fields
        let siteMailingAddress = getFirstNonEmpty(["site mailing address", "siteaddress", "site_address", "site address", "site addr", "service address", "location address", "Site Mailing Address"])
        let siteCity = getFirstNonEmpty(["site city", "sitecity", "site_city", "Site City"])
        let siteState = getFirstNonEmpty(["site state", "sitestate", "site_state", "Site State"])
        let email1 = getFirstNonEmpty(["email 1", "email", "email1", "Email 1"])
        let email2 = getFirstNonEmpty(["email 2", "email2", "Email 2"])
        let notes = getFirstNonEmpty(["notes", "Notes"])
        let farm = getFirstNonEmpty(["farm", "Farm"])
        
        // Debug: Print what we found
        print("[DataImportManager] Found values - firstName: '\(firstName)', lastName: '\(lastName)', city: '\(city)', state: '\(state)'")
        
        // Check if we have at least some basic data
        if firstName.isEmpty && lastName.isEmpty {
            print("[DataImportManager] Both firstName and lastName are empty, skipping contact")
            return nil
        }
        
        return ContactRecord(
            firstName: firstName,
            lastName: lastName,
            mailingAddress: mailingAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            email1: email1.isEmpty ? nil : email1,
            email2: email2.isEmpty ? nil : email2,
            phoneNumber1: phoneNumber1,
            phoneNumber2: phoneNumber2,
            phoneNumber3: phoneNumber3,
            phoneNumber4: phoneNumber4,
            phoneNumber5: phoneNumber5,
            phoneNumber6: phoneNumber6,
            siteMailingAddress: siteMailingAddress.isEmpty ? nil : siteMailingAddress,
            siteCity: siteCity.isEmpty ? nil : siteCity,
            siteState: siteState.isEmpty ? nil : siteState,
            siteZipCode: siteZipCode,
            notes: notes.isEmpty ? nil : notes,
            farm: farm
        )
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
        
        // Apply formatting based on digit count
        if digits.count == 10 {
            return formatPhoneNumber(digits)
        } else if digits.count == 11 && digits.hasPrefix("1") {
            // For 11-digit numbers starting with '1' (e.g., US country code)
            let tenDigits = String(digits.dropFirst())
            return formatPhoneNumber(tenDigits)
        } else if digits.count > 0 {
            // If it has digits but doesn't fit standard formats, return cleaned digits
            return digits
        }
        
        return nil // Return nil if no digits or empty
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
    
    private func formatZipCodeForImport(_ zipCode: Int32) -> Int32 {
        if zipCode <= 0 { return 0 }
        
        let zipString = String(zipCode)
        
        // If it's already 5 digits, return as is
        if zipString.count == 5 {
            return zipCode
        }
        
        // If it's 9 digits, return as is (ZIP+4 format)
        if zipString.count == 9 {
            return zipCode
        }
        
        // If it's more than 9 digits, truncate to first 9
        if zipString.count > 9 {
            let truncated = String(zipString.prefix(9))
            return Int32(truncated) ?? zipCode
        }
        
        // If it's less than 5 digits, pad with zeros
        if zipString.count < 5 {
            let padded = String(format: "%05d", zipCode)
            return Int32(padded) ?? zipCode
        }
        
        return zipCode
    }
}

// MARK: - Data Models

struct ContactRecord {
    let firstName: String
    let lastName: String
    let mailingAddress: String
    let city: String
    let state: String
    let zipCode: Int32
    let email1: String?
    let email2: String?
    let phoneNumber1: String?
    let phoneNumber2: String?
    let phoneNumber3: String?
    let phoneNumber4: String?
    let phoneNumber5: String?
    let phoneNumber6: String?
    let siteMailingAddress: String?
    let siteCity: String?
    let siteState: String?
    let siteZipCode: Int32
    let notes: String?
    let farm: String
}

struct ValidationError: Identifiable {
    let id: UUID
    let row: Int
    let field: String
    let message: String
}

enum ImportError: LocalizedError {
    case invalidEncoding
    case emptyFile
    case excelNotSupported
    case invalidFileFormat
    case saveFailed(Error)
    case timeout
    
    var errorDescription: String? {
        switch self {
        case .invalidEncoding:
            return "The file encoding is not supported. Please use UTF-8 encoding."
        case .emptyFile:
            return "The file is empty or contains no data."
        case .excelNotSupported:
            return "Excel file import is not yet supported. Please use CSV format."
        case .invalidFileFormat:
            return "The file format is not supported or the file is corrupted."
        case .saveFailed(let error):
            return "Failed to save contacts: \(error.localizedDescription)"
        case .timeout:
            return "Import operation timed out. Please try again with a smaller file."
        }
    }
} 