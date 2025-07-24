//
//  MailMerge.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import Foundation
import CoreData

class MailMerge {
    
    // MARK: - Main Mail Merge Function
    
    static func mergeTemplate(_ template: NSAttributedString, with values: [String: String]) -> NSAttributedString {
        let result = NSMutableAttributedString(attributedString: template)
        
        for (key, value) in values {
            let pattern = "{{\(key)}}"
            let range = (result.string as NSString).range(of: pattern)
            
            if range.location != NSNotFound {
                // Preserve the attributes from the template at the replacement location
                let attributes = result.attributes(at: range.location, effectiveRange: nil)
                let replacementString = NSAttributedString(string: value, attributes: attributes)
                result.replaceCharacters(in: range, with: replacementString)
            }
        }
        
        return result
    }
    
    // MARK: - Contact-Specific Mail Merge
    
    static func mergeTemplateWithContact(_ template: NSAttributedString, contact: FarmContact) -> NSAttributedString {
        let values = contactToDictionary(contact)
        return mergeTemplate(template, with: values)
    }
    
    static func mergeTemplateWithContacts(_ template: NSAttributedString, contacts: [FarmContact]) -> [NSAttributedString] {
        return contacts.map { contact in
            mergeTemplateWithContact(template, contact: contact)
        }
    }
    
    // MARK: - Batch Mail Merge
    
    static func performBatchMailMerge(template: NSAttributedString, contacts: [FarmContact], context: NSManagedObjectContext) -> [Document] {
        var generatedDocuments: [Document] = []
        
        for contact in contacts {
            let mergedContent = mergeTemplateWithContact(template, contact: contact)
            let documentName = "Mail Merge - \(contact.fullName) - \(Date().formatted(date: .abbreviated, time: .shortened))"
            
            let document = Document(context: context)
            document.id = UUID()
            document.name = documentName
            document.content = mergedContent.string
            document.createdDate = Date()
            document.modifiedDate = Date()
            document.contacts = NSSet(array: [contact])
            
            // Store the rich text content as RTF data
            if let rtfData = try? mergedContent.data(
                from: NSRange(location: 0, length: mergedContent.length),
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
            ) {
                document.richTextData = rtfData
            }
            
            generatedDocuments.append(document)
        }
        
        return generatedDocuments
    }
    
    // MARK: - Template Validation
    
    static func validateTemplate(_ template: NSAttributedString) -> [String] {
        var errors: [String] = []
        let text = template.string
        
        // Check for unmatched placeholders
        let placeholderPattern = "\\{\\{([^}]+)\\}\\}"
        let regex = try? NSRegularExpression(pattern: placeholderPattern, options: [])
        
        if let regex = regex {
            let matches = regex.matches(in: text, options: [], range: NSRange(location: 0, length: text.count))
            
            for match in matches {
                if let range = Range(match.range(at: 1), in: text) {
                    let placeholder = String(text[range])
                    if !isValidPlaceholder(placeholder) {
                        errors.append("Invalid placeholder: {{\(placeholder)}}")
                    }
                }
            }
        }
        
        return errors
    }
    
    static func extractPlaceholders(from template: NSAttributedString) -> [String] {
        let text = template.string
        let placeholderPattern = "\\{\\{([^}]+)\\}\\}"
        let regex = try? NSRegularExpression(pattern: placeholderPattern, options: [])
        
        var placeholders: [String] = []
        
        if let regex = regex {
            let matches = regex.matches(in: text, options: [], range: NSRange(location: 0, length: text.count))
            
            for match in matches {
                if let range = Range(match.range(at: 1), in: text) {
                    let placeholder = String(text[range])
                    if isValidPlaceholder(placeholder) {
                        placeholders.append(placeholder)
                    }
                }
            }
        }
        
        return Array(Set(placeholders)).sorted()
    }
    
    // MARK: - Helper Functions
    
    private static func contactToDictionary(_ contact: FarmContact) -> [String: String] {
        var values: [String: String] = [:]
        
        values["firstName"] = contact.firstName ?? ""
        values["lastName"] = contact.lastName ?? ""
        values["fullName"] = contact.fullName
        values["company"] = contact.farm ?? ""
        values["email"] = contact.email ?? ""
        values["phone"] = contact.phone ?? ""
        values["address"] = contact.mailingAddress ?? ""
        values["city"] = contact.city ?? ""
        values["state"] = contact.state ?? ""
        values["zipCode"] = contact.formattedZipCode
        values["siteAddress"] = contact.siteMailingAddress ?? ""
        values["siteCity"] = contact.siteCity ?? ""
        values["siteState"] = contact.siteState ?? ""
        values["siteZipCode"] = contact.formattedSiteZipCode
        values["notes"] = contact.notes ?? ""
        values["date"] = Date().formatted(date: .long, time: .omitted)
        
        return values
    }
    
    private static func isValidPlaceholder(_ placeholder: String) -> Bool {
        let validPlaceholders = [
            "firstName", "lastName", "fullName", "company", "email", "phone",
            "address", "city", "state", "zipCode", "siteAddress", "siteCity",
            "siteState", "siteZipCode", "notes", "date"
        ]
        
        return validPlaceholders.contains(placeholder)
    }
    
    // MARK: - Template Preview
    
    static func createPreviewContent(_ template: NSAttributedString, withSampleData: Bool = true) -> NSAttributedString {
        if withSampleData {
            let sampleData: [String: String] = [
                "firstName": "John",
                "lastName": "Doe",
                "fullName": "John Doe",
                "company": "Sample Farm",
                "email": "john.doe@samplefarm.com",
                "phone": "(555) 123-4567",
                "address": "123 Main Street",
                "city": "Sample City",
                "state": "CA",
                "zipCode": "90210",
                "siteAddress": "456 Farm Road",
                "siteCity": "Farm City",
                "siteState": "CA",
                "siteZipCode": "90211",
                "notes": "Sample contact for preview purposes",
                "date": Date().formatted(date: .long, time: .omitted)
            ]
            
            return mergeTemplate(template, with: sampleData)
        } else {
            return template
        }
    }
    
    // MARK: - Export Functions
    
    static func exportMergedDocuments(_ documents: [Document], format: DocumentExportFormat) -> [URL] {
        var exportedURLs: [URL] = []
        
        for document in documents {
            if let url = exportDocument(document, format: format) {
                exportedURLs.append(url)
            }
        }
        
        return exportedURLs
    }
    
    private static func exportDocument(_ document: Document, format: DocumentExportFormat) -> URL? {
        let fileName = "\(document.name ?? "Document").\(format.fileExtension)"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        do {
            switch format {
            case .txt:
                try document.content?.write(to: tempURL, atomically: true, encoding: .utf8)
            case .rtf:
                if let rtfData = document.richTextData {
                    try rtfData.write(to: tempURL)
                } else if let content = document.content {
                    let attributedString = NSAttributedString(string: content)
                    try RichTextDocument.saveAsRTF(attributedString, to: tempURL)
                }
            case .pdf:
                if let rtfData = document.richTextData,
                   let attributedString = try? NSAttributedString(
                       data: rtfData,
                       options: [.documentType: NSAttributedString.DocumentType.rtf],
                       documentAttributes: nil
                   ) {
                    try RichTextDocument.exportAsPDF(attributedString, to: tempURL)
                } else if let content = document.content {
                    let attributedString = NSAttributedString(string: content)
                    try RichTextDocument.exportAsPDF(attributedString, to: tempURL)
                }
            case .html:
                if let rtfData = document.richTextData,
                   let attributedString = try? NSAttributedString(
                       data: rtfData,
                       options: [.documentType: NSAttributedString.DocumentType.rtf],
                       documentAttributes: nil
                   ) {
                    try RichTextDocument.saveAsHTML(attributedString, to: tempURL)
                } else if let content = document.content {
                    let attributedString = NSAttributedString(string: content)
                    try RichTextDocument.saveAsHTML(attributedString, to: tempURL)
                }
            }
            
            return tempURL
        } catch {
            print("Failed to export document: \(error.localizedDescription)")
            return nil
        }
    }
}

// MARK: - Supporting Types

enum DocumentExportFormat: String, CaseIterable {
    case txt = "Plain Text"
    case rtf = "Rich Text Format"
    case pdf = "PDF"
    case html = "HTML"
    
    var fileExtension: String {
        switch self {
        case .txt: return "txt"
        case .rtf: return "rtf"
        case .pdf: return "pdf"
        case .html: return "html"
        }
    }
    
    var icon: String {
        switch self {
        case .txt: return "doc.text"
        case .rtf: return "doc.richtext"
        case .pdf: return "doc.pdf"
        case .html: return "doc.html"
        }
    }
} 