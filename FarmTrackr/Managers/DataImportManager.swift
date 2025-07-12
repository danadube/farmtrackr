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
                importProgress = Double(index + 1) / Double(dataRows.count)
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
        
        for (index, record) in records.enumerated() {
            // Only validate essential fields - be more lenient
            if record.firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && 
               record.lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                errors.append(ValidationError(
                    id: UUID(),
                    row: index + 1,
                    field: "name",
                    message: "At least first name or last name is required"
                ))
            }
            
            // Only validate email format if email is provided and looks like an email
            if let email = record.email1, !email.isEmpty {
                // Simple email validation - just check for @ symbol
                if !email.contains("@") || !email.contains(".") {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "email1",
                        message: "Email format appears invalid: \(email)"
                    ))
                }
            }
            
            if let email = record.email2, !email.isEmpty {
                // Simple email validation - just check for @ symbol
                if !email.contains("@") || !email.contains(".") {
                    errors.append(ValidationError(
                        id: UUID(),
                        row: index + 1,
                        field: "email2",
                        message: "Email format appears invalid: \(email)"
                    ))
                }
            }
            
            // Only validate phone numbers if they're provided and have some digits
            let phoneNumbers = [record.phoneNumber1, record.phoneNumber2, record.phoneNumber3,
                              record.phoneNumber4, record.phoneNumber5, record.phoneNumber6]
            
            for (phoneIndex, phone) in phoneNumbers.enumerated() {
                if let phone = phone, !phone.isEmpty {
                    let digits = phone.filter { $0.isNumber }
                    // Only validate if there are digits but not enough for a valid phone
                    if digits.count > 0 && digits.count < 7 {
                        errors.append(ValidationError(
                            id: UUID(),
                            row: index + 1,
                            field: "phoneNumber\(phoneIndex + 1)",
                            message: "Phone number appears too short: \(phone)"
                        ))
                    }
                }
            }
            
            // Skip ZIP code validation - our new logic handles formatting automatically
        }
        
        return errors
    }
    
    func saveContactsToCoreData(_ records: [ContactRecord], context: NSManagedObjectContext) async throws {
        try await MainActor.run {
            for (index, record) in records.enumerated() {
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
                importProgress = Double(index + 1) / Double(records.count)
                importStatus = "Saving contact \(index + 1) of \(records.count)"
            }
            
            do {
                try context.save()
            } catch {
                throw ImportError.saveFailed(error)
            }
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
        
        // Get the best available value for each field
        let firstName = getValue("firstname").isEmpty ? getValue("first_name") : getValue("firstname")
        let lastName = getValue("lastname").isEmpty ? getValue("last_name") : getValue("lastname")
        let mailingAddress = getValue("address").isEmpty ? getValue("mailingaddress") : getValue("address")
        let city = getValue("city")
        
        // Debug: Print extracted values for first few rows
        if values.count > 0 {
            print("Row values: \(values)")
            print("  firstName: '\(firstName)'")
            print("  lastName: '\(lastName)'")
            print("  city: '\(city)'")
            print("  farm: '\(getValue("farm"))'")
        }
        
        return ContactRecord(
            firstName: firstName.isEmpty ? getValue("first name") : firstName,
            lastName: lastName.isEmpty ? getValue("last name") : lastName,
            mailingAddress: mailingAddress.isEmpty ? getValue("mailing_address") : mailingAddress,
            city: getValue("city"),
            state: getValue("state"),
            zipCode: getIntValue("zipcode") + getIntValue("zip") + getIntValue("zip_code"),
            email1: getValue("email").isEmpty ? getValue("email1") : getValue("email"),
            email2: getValue("email2"),
            phoneNumber1: (getValue("phone") + getValue("phone1") + getValue("phonenumber1")).cleanedPhoneNumber,
            phoneNumber2: getValue("phone2").cleanedPhoneNumber,
            phoneNumber3: getValue("phone3").cleanedPhoneNumber,
            phoneNumber4: getValue("phone4").cleanedPhoneNumber,
            phoneNumber5: getValue("phone5").cleanedPhoneNumber,
            phoneNumber6: getValue("phone6").cleanedPhoneNumber,
            siteMailingAddress: getValue("siteaddress").isEmpty ? getValue("site_address") : getValue("siteaddress"),
            siteCity: getValue("sitecity").isEmpty ? getValue("site_city") : getValue("sitecity"),
            siteState: getValue("sitestate").isEmpty ? getValue("site_state") : getValue("sitestate"),
            siteZipCode: getIntValue("sitezipcode") + getIntValue("site_zipcode"),
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
        }
    }
} 