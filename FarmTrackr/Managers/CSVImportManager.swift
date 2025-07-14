//
//  CSVImportManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 1/15/25.
//

import Foundation
import CoreData
import UniformTypeIdentifiers

class CSVImportManager: ObservableObject {
    @Published var importProgress: Double = 0
    @Published var importStatus: String = ""
    @Published var isImporting: Bool = false
    @Published var previewData: [ContactRecord] = []
    @Published var fieldMapping: [String: String] = [:]
    @Published var availableFields: [String] = []
    @Published var detectedDelimiter: String = ","
    
    // Standard field names that we can map to
    private let standardFields = [
        "firstName", "lastName", "farm", "mailingAddress", "city", "state", 
        "zipCode", "email1", "phoneNumber1", "notes", "email2", "phoneNumber2",
        "phoneNumber3", "phoneNumber4", "phoneNumber5", "phoneNumber6",
        "siteMailingAddress", "siteCity", "siteState", "siteZipCode"
    ]
    
    func importCSVFile(from url: URL) async throws -> [ContactRecord] {
        await MainActor.run {
            importStatus = "Processing \(url.lastPathComponent)..."
            importProgress = 0.3
            isImporting = true
        }
        
        let csvData = try Data(contentsOf: url)
        let csvString = String(data: csvData, encoding: .utf8) ?? ""
        
        await MainActor.run {
            importStatus = "Parsing CSV data..."
            importProgress = 0.6
        }
        
        // Detect delimiter
        detectedDelimiter = detectDelimiter(from: csvString)
        
        // Parse CSV
        let lines = csvString.components(separatedBy: .newlines)
        guard lines.count > 1 else {
            throw CSVImportError.emptyFile
        }
        
        // Parse header
        let header = parseCSVLine(lines[0], delimiter: detectedDelimiter)
        availableFields = header
        
        // Create field mapping
        fieldMapping = createFieldMapping(from: header)
        
        await MainActor.run {
            importStatus = "Creating contact records..."
            importProgress = 0.8
        }
        
        // Parse data rows
        var contacts: [ContactRecord] = []
        for (_, line) in lines.dropFirst().enumerated() {
            if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                continue
            }
            
            let values = parseCSVLine(line, delimiter: detectedDelimiter)
            
            // Skip rows with no meaningful data
            let nonEmptyValues = values.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            if nonEmptyValues.isEmpty {
                continue
            }
            
            if let contact = createContactRecord(from: values, mapping: fieldMapping, farmName: extractFarmName(from: url)) {
                contacts.append(contact)
            }
        }
        
        let finalContacts = contacts
        await MainActor.run {
            importStatus = "Found \(finalContacts.count) contacts"
            importProgress = 1.0
            isImporting = false
            previewData = finalContacts
        }
        
        return contacts
    }
    
    func updateFieldMapping(field: String, mappedTo: String?) {
        if let mappedTo = mappedTo {
            fieldMapping[field] = mappedTo
        } else {
            fieldMapping.removeValue(forKey: field)
        }
        
        // Regenerate preview with new mapping
        regeneratePreview()
    }
    
    private func regeneratePreview() {
        // This would regenerate the preview data with the new field mapping
        // For now, we'll just update the preview data
        Task {
            // Re-import with current mapping
            if let url = getCurrentFileURL() {
                do {
                    let contacts = try await importCSVFile(from: url)
                    await MainActor.run {
                        previewData = contacts
                    }
                } catch {
                    print("Error regenerating preview: \(error)")
                }
            }
        }
    }
    
    private func getCurrentFileURL() -> URL? {
        // This would return the current file URL being processed
        // For now, return nil - in a real implementation, you'd store this
        return nil
    }
    
    private func detectDelimiter(from csvString: String) -> String {
        let firstLine = csvString.components(separatedBy: .newlines).first ?? ""
        
        // Count different delimiters
        let commaCount = firstLine.components(separatedBy: ",").count
        let tabCount = firstLine.components(separatedBy: "\t").count
        let semicolonCount = firstLine.components(separatedBy: ";").count
        let pipeCount = firstLine.components(separatedBy: "|").count
        
        // Return the delimiter with the most occurrences
        let delimiters = [
            (",", commaCount),
            ("\t", tabCount),
            (";", semicolonCount),
            ("|", pipeCount)
        ]
        
        return delimiters.max(by: { $0.1 < $1.1 })?.0 ?? ","
    }
    
    private func parseCSVLine(_ line: String, delimiter: String) -> [String] {
        var values: [String] = []
        var currentValue = ""
        var insideQuotes = false
        
        for char in line {
            if char == "\"" {
                insideQuotes.toggle()
            } else if char == Character(delimiter) && !insideQuotes {
                values.append(currentValue.trimmingCharacters(in: .whitespacesAndNewlines))
                currentValue = ""
            } else {
                currentValue.append(char)
            }
        }
        
        // Add the last value
        values.append(currentValue.trimmingCharacters(in: .whitespacesAndNewlines))
        
        return values
    }
    
    private func createFieldMapping(from header: [String]) -> [String: String] {
        var mapping: [String: String] = [:]
        
        for field in header {
            let normalizedField = normalizeFieldName(field)
            
            // Try to find a matching standard field
            for standardField in standardFields {
                if normalizedField.contains(standardField.lowercased()) || 
                   standardField.lowercased().contains(normalizedField) {
                    mapping[field] = standardField
                    break
                }
            }
            
            // If no match found, try common variations
            if mapping[field] == nil {
                let commonMappings = [
                    "first name": "firstName",
                    "firstname": "firstName",
                    "fname": "firstName",
                    "last name": "lastName",
                    "lastname": "lastName",
                    "lname": "lastName",
                    "email": "email1",
                    "email address": "email1",
                    "phone": "phoneNumber1",
                    "phone number": "phoneNumber1",
                    "telephone": "phoneNumber1",
                    "mobile": "phoneNumber2",
                    "cell": "phoneNumber2",
                    "cell phone": "phoneNumber2",
                    "work phone": "phoneNumber3",
                    "home phone": "phoneNumber4",
                    "phone 2": "phoneNumber2",
                    "phone 3": "phoneNumber3",
                    "phone 4": "phoneNumber4",
                    "phone 5": "phoneNumber5",
                    "phone 6": "phoneNumber6",
                    "address": "mailingAddress",
                    "street address": "mailingAddress",
                    "mailing address": "mailingAddress",
                    "zip": "zipCode",
                    "zip code": "zipCode",
                    "postal code": "zipCode",
                    "company": "farm",
                    "organization": "farm",
                    "business": "farm",
                    "site address": "siteMailingAddress",
                    "site addr": "siteMailingAddress",
                    "service address": "siteMailingAddress",
                    "location address": "siteMailingAddress",
                    "site city": "siteCity",
                    "site state": "siteState",
                    "site zip": "siteZipCode",
                    "site zip code": "siteZipCode"
                ]
                if let mappedField = commonMappings[normalizedField] {
                    mapping[field] = mappedField
                }
            }
        }
        
        return mapping
    }
    
    private func normalizeFieldName(_ field: String) -> String {
        return field.lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
    }
    
    private func createContactRecord(from values: [String], mapping: [String: String], farmName: String) -> ContactRecord? {
        var contactData: [String: String] = [:]
        
        // Map values to standard fields
        for (index, value) in values.enumerated() {
            if index < availableFields.count {
                let fieldName = availableFields[index]
                if let mappedField = mapping[fieldName] {
                    contactData[mappedField] = value.trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }
        }
        
        // Create contact record
        let contact = ContactRecord(
            firstName: contactData["firstName"] ?? "",
            lastName: contactData["lastName"] ?? "",
            mailingAddress: contactData["mailingAddress"] ?? "",
            city: contactData["city"] ?? "",
            state: contactData["state"] ?? "",
            zipCode: Int32(contactData["zipCode"] ?? "0") ?? 0,
            email1: contactData["email1"] ?? "",
            email2: contactData["email2"] ?? "",
            phoneNumber1: contactData["phoneNumber1"] ?? "",
            phoneNumber2: contactData["phoneNumber2"] ?? "",
            phoneNumber3: contactData["phoneNumber3"] ?? "",
            phoneNumber4: contactData["phoneNumber4"] ?? "",
            phoneNumber5: contactData["phoneNumber5"] ?? "",
            phoneNumber6: contactData["phoneNumber6"] ?? "",
            siteMailingAddress: contactData["siteMailingAddress"] ?? "",
            siteCity: contactData["siteCity"] ?? "",
            siteState: contactData["siteState"] ?? "",
            siteZipCode: Int32(contactData["siteZipCode"] ?? "0") ?? 0,
            notes: contactData["notes"] ?? "",
            farm: contactData["farm"] ?? farmName
        )
        
        // Only return contact if it has at least a first name or last name
        if !contact.firstName.isEmpty || !contact.lastName.isEmpty {
            return contact
        }
        
        return nil
    }
    
    private func extractFarmName(from url: URL) -> String {
        let fileName = url.deletingPathExtension().lastPathComponent
        return fileName.replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
    }
}

enum CSVImportError: Error, LocalizedError {
    case emptyFile
    case parsingFailed
    case invalidFormat
    
    var errorDescription: String? {
        switch self {
        case .emptyFile:
            return "The CSV file is empty or contains no data"
        case .parsingFailed:
            return "Failed to parse the CSV file"
        case .invalidFormat:
            return "The CSV file format is invalid"
        }
    }
} 