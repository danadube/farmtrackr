//
//  DataImportManager.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData

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
        // For now, we'll implement a basic Excel parser
        // In a real implementation, you'd use a library like CoreXLSX
        throw ImportError.excelNotSupported
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
                contact.zipCode = record.zipCode
                contact.email1 = record.email1
                contact.email2 = record.email2
                contact.phoneNumber1 = record.phoneNumber1
                contact.phoneNumber2 = record.phoneNumber2
                contact.phoneNumber3 = record.phoneNumber3
                contact.phoneNumber4 = record.phoneNumber4
                contact.phoneNumber5 = record.phoneNumber5
                contact.phoneNumber6 = record.phoneNumber6
                contact.siteMailingAddress = record.siteMailingAddress
                contact.siteCity = record.siteCity
                contact.siteState = record.siteState
                contact.siteZipCode = record.siteZipCode
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
            contact.zipCode = record.zipCode
            contact.email1 = record.email1
            contact.email2 = record.email2
            contact.phoneNumber1 = record.phoneNumber1
            contact.phoneNumber2 = record.phoneNumber2
            contact.phoneNumber3 = record.phoneNumber3
            contact.phoneNumber4 = record.phoneNumber4
            contact.phoneNumber5 = record.phoneNumber5
            contact.phoneNumber6 = record.phoneNumber6
            contact.siteMailingAddress = record.siteMailingAddress
            contact.siteCity = record.siteCity
            contact.siteState = record.siteState
            contact.siteZipCode = record.siteZipCode
            contact.notes = record.notes
            contact.farm = record.farm
            contact.dateCreated = Date()
            contact.dateModified = Date()
        }
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
        
        for (index, column) in header.enumerated() {
            let normalizedColumn = column.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            mapping[normalizedColumn] = index
        }
        
        // Debug: Print the column mapping
        print("Column mapping:")
        for (key, value) in mapping {
            print("  '\(key)' -> column \(value)")
        }
        
        return mapping
    }
    
    private func createContactRecord(from values: [String], mapping: [String: Int]) -> ContactRecord? {
        func getValue(_ key: String) -> String {
            guard let index = mapping[key], index < values.count else { return "" }
            return values[index]
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
        // Get the best available value for each field
        let firstName = getFirstNonEmpty(["firstname", "first_name", "first name"])
        let lastName = getFirstNonEmpty(["lastname", "last_name", "last name"])
        let mailingAddress = getFirstNonEmpty(["address", "mailingaddress", "mailing_address", "street address"])
        let city = getValue("city")
        let zipCode = getFirstNonZeroInt(["zipcode", "zip", "zip_code", "postal code"])
        let siteZipCode = getFirstNonZeroInt(["sitezipcode", "site_zipcode", "site zip", "site zip code"])
        let phoneNumber1 = getFirstNonEmpty(["phone", "phone1", "phonenumber1", "phone number 1", "telephone"]).cleanedPhoneNumber
        let phoneNumber2 = getFirstNonEmpty(["phone2", "phone number 2", "mobile", "cell", "cell phone", "phone 2"]).cleanedPhoneNumber
        let phoneNumber3 = getFirstNonEmpty(["phone3", "phone number 3", "work phone", "phone 3"]).cleanedPhoneNumber
        let phoneNumber4 = getFirstNonEmpty(["phone4", "phone number 4", "home phone", "phone 4"]).cleanedPhoneNumber
        let phoneNumber5 = getFirstNonEmpty(["phone5", "phone number 5", "phone 5"]).cleanedPhoneNumber
        let phoneNumber6 = getFirstNonEmpty(["phone6", "phone number 6", "phone 6"]).cleanedPhoneNumber
        // Site address fields
        let siteMailingAddress = getFirstNonEmpty(["siteaddress", "site_address", "site address", "site addr", "service address", "location address"])
        let siteCity = getFirstNonEmpty(["sitecity", "site_city", "site city"])
        let siteState = getFirstNonEmpty(["sitestate", "site_state", "site state"])
        return ContactRecord(
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
        case .saveFailed(let error):
            return "Failed to save contacts: \(error.localizedDescription)"
        case .timeout:
            return "Import operation timed out. Please try again with a smaller file."
        }
    }
} 