//
//  UnifiedImportExportManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import Foundation
import CoreData
import SwiftUI
import UniformTypeIdentifiers
import CoreXLSX

class UnifiedImportExportManager: ObservableObject {
    @Published var importProgress: Double = 0
    @Published var importStatus: String = ""
    @Published var isImporting: Bool = false
    @Published var exportProgress: Double = 0
    @Published var exportStatus: String = ""
    @Published var isExporting: Bool = false
    @Published var errorMessage: String?
    
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.context = context
    }
    
    // MARK: - Unified Import Methods
    
    /// Import contacts from various file formats
    func importContacts(from url: URL, format: ImportFormat) async throws -> [ContactRecord] {
        await MainActor.run {
            isImporting = true
            importProgress = 0.1
            importStatus = "Reading file..."
        }
        
        let contacts: [ContactRecord]
        
        switch format {
        case .csv:
            contacts = try await importContactsFromCSV(from: url)
        case .excel:
            contacts = try await importContactsFromExcel(from: url)
        case .json:
            contacts = try await importContactsFromJSON(from: url)
        }
        
        await MainActor.run {
            importProgress = 1.0
            importStatus = "Import completed successfully"
            isImporting = false
        }
        
        return contacts
    }
    
    /// Import documents from various file formats
    func importDocument(from url: URL, format: DocumentImportFormat) async throws -> (String, String) {
        await MainActor.run {
            isImporting = true
            importProgress = 0.1
            importStatus = "Reading document..."
        }
        
        let (name, content): (String, String)
        
        switch format {
        case .txt:
            (name, content) = try await importDocumentFromTXT(from: url)
        case .rtf:
            (name, content) = try await importDocumentFromRTF(from: url)
        case .docx:
            (name, content) = try await importDocumentFromDOCX(from: url)
        case .pdf:
            (name, content) = try await importDocumentFromPDF(from: url)
        case .html:
            (name, content) = try await importDocumentFromHTML(from: url)
        }
        
        await MainActor.run {
            importProgress = 1.0
            importStatus = "Document import completed"
            isImporting = false
        }
        
        return (name, content)
    }
    
    // MARK: - Unified Export Methods
    
    /// Export contacts to various formats
    func exportContacts(_ contacts: [FarmContact], format: ExportFormat, farmFilter: String? = nil) async throws -> URL {
        await MainActor.run {
            isExporting = true
            exportProgress = 0.1
            exportStatus = "Preparing export..."
        }
        
        let filteredContacts = farmFilter != nil && farmFilter != "All Farms" 
            ? contacts.filter { $0.farm == farmFilter }
            : contacts
        
        let url: URL
        
        switch format {
        case .csv:
            url = try await exportContactsToCSV(filteredContacts)
        case .json:
            url = try await exportContactsToJSON(filteredContacts)
        case .excel:
            url = try await exportContactsToExcel(filteredContacts)
        }
        
        await MainActor.run {
            exportProgress = 1.0
            exportStatus = "Export completed successfully"
            isExporting = false
        }
        
        return url
    }
    
    /// Export documents to various formats
    func exportDocument(_ document: Document, format: DocumentExportFormat) async throws -> URL {
        await MainActor.run {
            isExporting = true
            exportProgress = 0.1
            exportStatus = "Preparing document export..."
        }
        
        guard let content = document.content else {
            throw ExportError.invalidContent
        }
        
        let url: URL
        
        switch format {
        case .txt:
            url = try await exportDocumentToTXT(content, name: document.name ?? "Document")
        case .pdf:
            url = try await exportDocumentToPDF(content, name: document.name ?? "Document")
        case .rtf:
            url = try await exportDocumentToRTF(content, name: document.name ?? "Document")
        case .html:
            url = try await exportDocumentToHTML(content, name: document.name ?? "Document")
        case .docx:
            url = try await exportDocumentToWord(content, name: document.name ?? "Document")
        case .xlsx:
            url = try await exportDocumentToExcel(content, name: document.name ?? "Document")
        }
        
        await MainActor.run {
            exportProgress = 1.0
            exportStatus = "Document export completed"
            isExporting = false
        }
        
        return url
    }
    
    // MARK: - Mail Merge Export
    
    /// Export mail merge results to various formats
    func exportMailMergeResults(_ documents: [Document], format: MailMergeExportFormat) async throws -> URL {
        await MainActor.run {
            isExporting = true
            exportProgress = 0.1
            exportStatus = "Preparing mail merge export..."
        }
        
        let url: URL
        
        switch format {
        case .individual:
            url = try await exportIndividualDocuments(documents)
        case .combined:
            url = try await exportCombinedDocuments(documents)
        case .zip:
            url = try await exportDocumentsAsZip(documents)
        }
        
        await MainActor.run {
            exportProgress = 1.0
            exportStatus = "Mail merge export completed"
            isExporting = false
        }
        
        return url
    }
    
    // MARK: - Contact Import Implementations
    
    private func importContactsFromCSV(from url: URL) async throws -> [ContactRecord] {
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
        
        for (index, line) in dataRows.enumerated() {
            if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { 
                continue 
            }
            
            let values = parseCSVLine(line)
            if let contact = createContactRecord(from: values, mapping: columnMapping) {
                contacts.append(contact)
            }
            
            // Update progress
            await MainActor.run {
                importProgress = 0.1 + (0.8 * Double(index + 1) / Double(dataRows.count))
                importStatus = "Processing contact \(index + 1) of \(dataRows.count)..."
            }
        }
        
        return contacts
    }
    
    private func importContactsFromExcel(from url: URL) async throws -> [ContactRecord] {
        await MainActor.run {
            importProgress = 0.2
            importStatus = "Reading Excel file..."
        }
        
        // Use the working DataImportManager for Excel imports
        let dataImportManager = DataImportManager()
        let contacts = try await dataImportManager.importExcel(from: url)
        
        await MainActor.run {
            importProgress = 1.0
            importStatus = "Excel import completed successfully"
        }
        
        return contacts
    }
    
    private func importContactsFromJSON(from url: URL) async throws -> [ContactRecord] {
        // For now, return empty array as ContactRecord needs to be made Codable
        // In a production app, you'd implement proper JSON parsing
        return []
    }
    
    // MARK: - Document Import Implementations
    
    private func importDocumentFromTXT(from url: URL) async throws -> (String, String) {
        let content = try String(contentsOf: url, encoding: .utf8)
        let name = url.deletingPathExtension().lastPathComponent
        return (name, content)
    }
    
    private func importDocumentFromRTF(from url: URL) async throws -> (String, String) {
        let data = try Data(contentsOf: url)
        let attributedString = try NSAttributedString(
            data: data,
            options: [.documentType: NSAttributedString.DocumentType.rtf],
            documentAttributes: nil
        )
        let content = attributedString.string
        let name = url.deletingPathExtension().lastPathComponent
        return (name, content)
    }
    
    private func importDocumentFromDOCX(from url: URL) async throws -> (String, String) {
        // For now, we'll extract text content from DOCX
        // In a production app, you'd use a library like ZIPFoundation to parse DOCX
        let content = "DOCX import not yet implemented"
        let name = url.deletingPathExtension().lastPathComponent
        return (name, content)
    }
    
    private func importDocumentFromPDF(from url: URL) async throws -> (String, String) {
        // For now, we'll return a placeholder
        // In a production app, you'd use PDFKit to extract text
        let content = "PDF import not yet implemented"
        let name = url.deletingPathExtension().lastPathComponent
        return (name, content)
    }
    
    private func importDocumentFromHTML(from url: URL) async throws -> (String, String) {
        let data = try Data(contentsOf: url)
        let attributedString = try NSAttributedString(
            data: data,
            options: [.documentType: NSAttributedString.DocumentType.html],
            documentAttributes: nil
        )
        let content = attributedString.string
        let name = url.deletingPathExtension().lastPathComponent
        return (name, content)
    }
    
    // MARK: - Contact Export Implementations
    
    private func exportContactsToCSV(_ contacts: [FarmContact]) async throws -> URL {
        let csvString = createCSVString(from: contacts)
        let fileName = "FarmTrackr_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).csv"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportContactsToPDF(_ contacts: [FarmContact]) async throws -> URL {
        let pdfData = createPDFData(from: contacts)
        let fileName = "FarmTrackr_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).pdf"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try pdfData.write(to: fileURL)
        return fileURL
    }
    
    private func exportContactsToJSON(_ contacts: [FarmContact]) async throws -> URL {
        let jsonData = createJSONData(from: contacts)
        let fileName = "FarmTrackr_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).json"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try jsonData.write(to: fileURL)
        return fileURL
    }
    
    private func exportContactsToExcel(_ contacts: [FarmContact]) async throws -> URL {
        // For now, we'll create a CSV file that Excel can open
        let csvString = createCSVString(from: contacts)
        let fileName = "FarmTrackr_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).csv"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    // MARK: - Document Export Implementations
    
    private func exportDocumentToTXT(_ content: String, name: String) async throws -> URL {
        let fileName = "\(name).txt"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportDocumentToRTF(_ content: String, name: String) async throws -> URL {
        let attributedString = NSAttributedString(string: content)
        let data = try attributedString.data(
            from: NSRange(location: 0, length: attributedString.length),
            documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
        )
        
        let fileName = "\(name).rtf"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try data.write(to: fileURL)
        return fileURL
    }
    
    private func exportDocumentToPDF(_ content: String, name: String) async throws -> URL {
        // For now, we'll create a simple text-based PDF
        // In a production app, you'd use PDFKit for proper PDF generation
        let attributedString = NSAttributedString(string: content)
        let fileName = "\(name).pdf"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        #if os(iOS)
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(origin: .zero, size: CGSize(width: 612, height: 792)))
        try renderer.writePDF(to: fileURL) { context in
            context.beginPage()
            let textRect = CGRect(x: 72, y: 72, width: 468, height: 648)
            attributedString.draw(in: textRect)
        }
        #elseif os(macOS)
        // macOS PDF generation would go here
        try "PDF export not yet implemented".write(to: fileURL, atomically: true, encoding: .utf8)
        #endif
        
        return fileURL
    }
    
    private func exportDocumentToDOCX(_ content: String, name: String) async throws -> URL {
        // For now, we'll create a simple text file
        // In a production app, you'd use a library to create proper DOCX files
        let fileName = "\(name).docx"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportDocumentToWord(_ content: String, name: String) async throws -> URL {
        // For Word export, we'll create a simple HTML file that Word can open
        let htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>\(name)</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                p { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            \(content.replacingOccurrences(of: "\n", with: "<br>"))
        </body>
        </html>
        """
        
        let fileName = "\(name).docx"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try htmlContent.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportDocumentToExcel(_ content: String, name: String) async throws -> URL {
        // For Excel export, we'll create a CSV file that Excel can open
        let csvContent = """
        Content
        "\(content.replacingOccurrences(of: "\"", with: "\"\""))"
        """
        
        let fileName = "\(name).xlsx"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try csvContent.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportDocumentToHTML(_ content: String, name: String) async throws -> URL {
        let htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>\(name)</title>
        </head>
        <body>
            <div>\(content.replacingOccurrences(of: "\n", with: "<br>"))</div>
        </body>
        </html>
        """
        
        let fileName = "\(name).html"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try htmlContent.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    // MARK: - Mail Merge Export Implementations
    
    private func exportIndividualDocuments(_ documents: [Document]) async throws -> URL {
        // Create a directory with individual files
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let exportDir = documentsPath.appendingPathComponent("MailMerge_\(Date().formatted(date: .abbreviated, time: .omitted))")
        
        try FileManager.default.createDirectory(at: exportDir, withIntermediateDirectories: true)
        
        for document in documents {
            let fileName = "\(document.name ?? "Document").txt"
            let fileURL = exportDir.appendingPathComponent(fileName)
            try (document.content ?? "").write(to: fileURL, atomically: true, encoding: .utf8)
        }
        
        return exportDir
    }
    
    private func exportCombinedDocuments(_ documents: [Document]) async throws -> URL {
        let combinedContent = documents.map { doc in
            "=== \(doc.name ?? "Document") ===\n\n\(doc.content ?? "")\n\n"
        }.joined()
        
        let fileName = "MailMerge_Combined_\(Date().formatted(date: .abbreviated, time: .omitted)).txt"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try combinedContent.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    private func exportDocumentsAsZip(_ documents: [Document]) async throws -> URL {
        // For now, we'll create a directory with all files
        // In a production app, you'd use a library to create actual ZIP files
        return try await exportIndividualDocuments(documents)
    }
    
    // MARK: - Helper Methods
    
    private func parseCSVLine(_ line: String) -> [String] {
        // Simple CSV parsing - in production, use a proper CSV library
        return line.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    }
    
    private func createColumnMapping(from header: [String]) -> [String: Int] {
        var mapping: [String: Int] = [:]
        for (index, column) in header.enumerated() {
            let normalizedColumn = column.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            mapping[normalizedColumn] = index
        }
        return mapping
    }
    
    private func createContactRecord(from values: [String], mapping: [String: Int]) -> ContactRecord? {
        let firstName = getValue(from: values, mapping: mapping, keys: ["firstname", "first_name", "first name"])
        let lastName = getValue(from: values, mapping: mapping, keys: ["lastname", "last_name", "last name"])
        let farm = getValue(from: values, mapping: mapping, keys: ["farm"])
        
        guard !firstName.isEmpty && !lastName.isEmpty && !farm.isEmpty else {
            return nil
        }
        
        // Convert zip codes to Int32
        let zipCodeString = getValue(from: values, mapping: mapping, keys: ["zipcode", "zip", "zip_code"])
        let zipCode = Int32(zipCodeString) ?? 0
        
        let siteZipCodeString = getValue(from: values, mapping: mapping, keys: ["sitezipcode", "site_zipcode"])
        let siteZipCode = Int32(siteZipCodeString) ?? 0
        
        return ContactRecord(
            firstName: firstName,
            lastName: lastName,
            mailingAddress: getValue(from: values, mapping: mapping, keys: ["address", "mailingaddress", "mailing_address"]),
            city: getValue(from: values, mapping: mapping, keys: ["city"]),
            state: getValue(from: values, mapping: mapping, keys: ["state"]),
            zipCode: zipCode,
            email1: getValue(from: values, mapping: mapping, keys: ["email", "email1"]),
            email2: getValue(from: values, mapping: mapping, keys: ["email2"]),
            phoneNumber1: getValue(from: values, mapping: mapping, keys: ["phone", "phone1", "phonenumber1"]),
            phoneNumber2: getValue(from: values, mapping: mapping, keys: ["phone2", "phonenumber2"]),
            phoneNumber3: getValue(from: values, mapping: mapping, keys: ["phone3", "phonenumber3"]),
            phoneNumber4: getValue(from: values, mapping: mapping, keys: ["phone4", "phonenumber4"]),
            phoneNumber5: getValue(from: values, mapping: mapping, keys: ["phone5", "phonenumber5"]),
            phoneNumber6: getValue(from: values, mapping: mapping, keys: ["phone6", "phonenumber6"]),
            siteMailingAddress: getValue(from: values, mapping: mapping, keys: ["siteaddress", "site_address"]),
            siteCity: getValue(from: values, mapping: mapping, keys: ["sitecity", "site_city"]),
            siteState: getValue(from: values, mapping: mapping, keys: ["sitestate", "site_state"]),
            siteZipCode: siteZipCode,
            notes: getValue(from: values, mapping: mapping, keys: ["notes"]),
            farm: farm
        )
    }
    
    private func getValue(from values: [String], mapping: [String: Int], keys: [String]) -> String {
        for key in keys {
            if let index = mapping[key], index < values.count {
                return values[index]
            }
        }
        return ""
    }
    
    private func createCSVString(from contacts: [FarmContact]) -> String {
        let headers = ["First Name", "Last Name", "Farm", "Address", "City", "State", "ZIP Code", "Email 1", "Email 2", "Phone 1", "Phone 2", "Phone 3", "Phone 4", "Phone 5", "Phone 6", "Site Address", "Site City", "Site State", "Site ZIP Code", "Notes"]
        
        var csvString = headers.joined(separator: ",") + "\n"
        
        for contact in contacts {
            let firstName = contact.firstName ?? ""
            let lastName = contact.lastName ?? ""
            let farm = contact.farm ?? ""
            let mailingAddress = contact.mailingAddress ?? ""
            let city = contact.city ?? ""
            let state = contact.state ?? ""
            let zipCode = contact.zipCode > 0 ? String(contact.zipCode) : ""
            let email1 = contact.email1 ?? ""
            let email2 = contact.email2 ?? ""
            let phoneNumber1 = contact.phoneNumber1 ?? ""
            let phoneNumber2 = contact.phoneNumber2 ?? ""
            let phoneNumber3 = contact.phoneNumber3 ?? ""
            let phoneNumber4 = contact.phoneNumber4 ?? ""
            let phoneNumber5 = contact.phoneNumber5 ?? ""
            let phoneNumber6 = contact.phoneNumber6 ?? ""
            let siteMailingAddress = contact.siteMailingAddress ?? ""
            let siteCity = contact.siteCity ?? ""
            let siteState = contact.siteState ?? ""
            let siteZipCode = contact.siteZipCode > 0 ? String(contact.siteZipCode) : ""
            let notes = contact.notes ?? ""
            
            let row = [firstName, lastName, farm, mailingAddress, city, state, zipCode, email1, email2, phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6, siteMailingAddress, siteCity, siteState, siteZipCode, notes]
                .map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }
            
            csvString += row.joined(separator: ",") + "\n"
        }
        
        return csvString
    }
    
    private func createPDFData(from contacts: [FarmContact]) -> Data {
        // For now, we'll create a simple text-based PDF
        // In a production app, you'd use PDFKit for proper PDF generation
        let content = createCSVString(from: contacts)
        return content.data(using: .utf8) ?? Data()
    }
    
    private func createJSONData(from contacts: [FarmContact]) -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        
        let contactDicts = contacts.map { contact in
            let firstName = contact.firstName ?? ""
            let lastName = contact.lastName ?? ""
            let farm = contact.farm ?? ""
            let mailingAddress = contact.mailingAddress ?? ""
            let city = contact.city ?? ""
            let state = contact.state ?? ""
            let zipCode = contact.zipCode > 0 ? String(contact.zipCode) : ""
            let email1 = contact.email1 ?? ""
            let email2 = contact.email2 ?? ""
            let phoneNumber1 = contact.phoneNumber1 ?? ""
            let phoneNumber2 = contact.phoneNumber2 ?? ""
            let phoneNumber3 = contact.phoneNumber3 ?? ""
            let phoneNumber4 = contact.phoneNumber4 ?? ""
            let phoneNumber5 = contact.phoneNumber5 ?? ""
            let phoneNumber6 = contact.phoneNumber6 ?? ""
            let siteMailingAddress = contact.siteMailingAddress ?? ""
            let siteCity = contact.siteCity ?? ""
            let siteState = contact.siteState ?? ""
            let siteZipCode = contact.siteZipCode > 0 ? String(contact.siteZipCode) : ""
            let notes = contact.notes ?? ""
            
            return [
                "firstName": firstName,
                "lastName": lastName,
                "farm": farm,
                "mailingAddress": mailingAddress,
                "city": city,
                "state": state,
                "zipCode": zipCode,
                "email1": email1,
                "email2": email2,
                "phoneNumber1": phoneNumber1,
                "phoneNumber2": phoneNumber2,
                "phoneNumber3": phoneNumber3,
                "phoneNumber4": phoneNumber4,
                "phoneNumber5": phoneNumber5,
                "phoneNumber6": phoneNumber6,
                "siteMailingAddress": siteMailingAddress,
                "siteCity": siteCity,
                "siteState": siteState,
                "siteZipCode": siteZipCode,
                "notes": notes
            ]
        }
        
        return try! encoder.encode(contactDicts)
    }
}

// MARK: - Supporting Types

enum ImportFormat: String, CaseIterable {
    case csv = "CSV"
    case excel = "Excel"
    case json = "JSON"
    
    var fileExtensions: [String] {
        switch self {
        case .csv: return ["csv"]
        case .excel: return ["xlsx", "xls"]
        case .json: return ["json"]
        }
    }
    
    var icon: String {
        switch self {
        case .csv: return "doc.text"
        case .excel: return "tablecells"
        case .json: return "curlybraces"
        }
    }
}

enum DocumentImportFormat: String, CaseIterable {
    case txt = "Plain Text"
    case rtf = "Rich Text Format"
    case docx = "Microsoft Word"
    case pdf = "PDF"
    case html = "HTML"
    
    var fileExtensions: [String] {
        switch self {
        case .txt: return ["txt"]
        case .rtf: return ["rtf"]
        case .docx: return ["docx", "doc"]
        case .pdf: return ["pdf"]
        case .html: return ["html", "htm"]
        }
    }
    
    var icon: String {
        switch self {
        case .txt: return "doc.text"
        case .rtf: return "doc.richtext"
        case .docx: return "doc"
        case .pdf: return "doc.pdf"
        case .html: return "doc.html"
        }
    }
}

enum MailMergeExportFormat: String, CaseIterable {
    case individual = "Individual Files"
    case combined = "Combined File"
    case zip = "ZIP Archive"
    
    var icon: String {
        switch self {
        case .individual: return "doc.on.doc"
        case .combined: return "doc.text"
        case .zip: return "archivebox"
        }
    }
}

enum ExportError: Error, LocalizedError {
    case invalidContent
    case writeFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidContent:
            return "The document content is invalid"
        case .writeFailed:
            return "Failed to write the exported file"
        }
    }
} 