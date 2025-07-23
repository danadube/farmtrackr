//
//  DocumentManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData
import SwiftUI
import UniformTypeIdentifiers

class DocumentManager: ObservableObject {
    @Published var documents: [Document] = []
    @Published var templates: [DocumentTemplate] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.context = context
        loadDocuments()
        loadTemplates()
    }
    
    // MARK: - Document Management
    
    func loadDocuments() {
        let request: NSFetchRequest<Document> = Document.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Document.createdDate, ascending: false)]
        
        do {
            documents = try context.fetch(request)
        } catch {
            errorMessage = "Failed to load documents: \(error.localizedDescription)"
        }
    }
    
    func createDocument(name: String, content: String, template: DocumentTemplate? = nil, contacts: [FarmContact] = []) -> Document {
        let document = Document(context: context)
        document.id = UUID()
        document.name = name
        document.content = content
        document.createdDate = Date()
        document.modifiedDate = Date()
        document.template = template
        document.contacts = NSSet(array: contacts)
        
        saveContext()
        loadDocuments()
        return document
    }
    
    func updateDocument(_ document: Document, content: String) {
        document.content = content
        document.modifiedDate = Date()
        saveContext()
        loadDocuments()
    }
    
    func deleteDocument(_ document: Document) {
        context.delete(document)
        saveContext()
        loadDocuments()
    }
    
    // MARK: - Template Management
    
    func loadTemplates() {
        let request: NSFetchRequest<DocumentTemplate> = DocumentTemplate.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \DocumentTemplate.name, ascending: true)]
        
        do {
            templates = try context.fetch(request)
        } catch {
            errorMessage = "Failed to load templates: \(error.localizedDescription)"
        }
    }
    
    func createTemplate(name: String, content: String, type: DocumentType) -> DocumentTemplate {
        let template = DocumentTemplate(context: context)
        template.id = UUID()
        template.name = name
        template.content = content
        template.type = type.rawValue
        template.createdDate = Date()
        
        saveContext()
        loadTemplates()
        return template
    }
    
    func updateTemplate(_ template: DocumentTemplate, content: String) {
        template.content = content
        template.modifiedDate = Date()
        saveContext()
        loadTemplates()
    }
    
    func deleteTemplate(_ template: DocumentTemplate) {
        context.delete(template)
        saveContext()
        loadTemplates()
    }
    
    // MARK: - Mail Merge
    
    func performMailMerge(template: DocumentTemplate, contacts: [FarmContact]) -> [Document] {
        var generatedDocuments: [Document] = []
        
        for contact in contacts {
            let mergedContent = mergeTemplate(template.content ?? "", with: contact)
            let documentName = "\(template.name ?? "Template") - \(contact.fullName)"
            let document = createDocument(name: documentName, content: mergedContent, template: template, contacts: [contact])
            generatedDocuments.append(document)
        }
        
        return generatedDocuments
    }
    
    private func mergeTemplate(_ template: String, with contact: FarmContact) -> String {
        var mergedContent = template
        
        // Replace placeholders with contact data
        let placeholders: [String: String] = [
            "{{firstName}}": contact.firstName ?? "",
            "{{lastName}}": contact.lastName ?? "",
            "{{fullName}}": contact.fullName,
            "{{company}}": contact.farm ?? "",
            "{{email}}": contact.email ?? "",
            "{{phone}}": contact.phone ?? "",
            "{{address}}": contact.displayAddress,
            "{{city}}": contact.city ?? "",
            "{{state}}": contact.state ?? "",
            "{{zipCode}}": contact.formattedZipCode,
            "{{siteAddress}}": contact.displaySiteAddress,
            "{{siteCity}}": contact.siteCity ?? "",
            "{{siteState}}": contact.siteState ?? "",
            "{{siteZipCode}}": contact.formattedSiteZipCode,
            "{{notes}}": contact.notes ?? "",
            "{{date}}": DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .none)
        ]
        
        for (placeholder, value) in placeholders {
            mergedContent = mergedContent.replacingOccurrences(of: placeholder, with: value)
        }
        
        return mergedContent
    }
    
    // MARK: - Export
    
    func exportDocument(_ document: Document, format: DocumentExportFormat) -> URL? {
        guard let content = document.content else { return nil }
        
        let fileName = "\(document.name ?? "Document").\(format.fileExtension)"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        do {
            switch format {
            case .txt:
                try content.write(to: tempURL, atomically: true, encoding: .utf8)
            case .pdf:
                // For PDF, we'd need to use PDFKit or a third-party library
                // For now, we'll create a simple text file
                try content.write(to: tempURL, atomically: true, encoding: .utf8)
            case .docx:
                // For DOCX, we'd need to use a library like ZIPFoundation
                // For now, we'll create a simple text file
                try content.write(to: tempURL, atomically: true, encoding: .utf8)
            }
            return tempURL
        } catch {
            errorMessage = "Failed to export document: \(error.localizedDescription)"
            return nil
        }
    }
    
    // MARK: - Utilities
    
    private func saveContext() {
        do {
            try context.save()
        } catch {
            errorMessage = "Failed to save context: \(error.localizedDescription)"
        }
    }
}

// MARK: - Supporting Types

enum DocumentType: String, CaseIterable {
    case letter = "Letter"
    case invoice = "Invoice"
    case contract = "Contract"
    case report = "Report"
    case custom = "Custom"
    
    var icon: String {
        switch self {
        case .letter: return "envelope"
        case .invoice: return "doc.text"
        case .contract: return "doc.plaintext"
        case .report: return "chart.bar.doc.horizontal"
        case .custom: return "doc"
        }
    }
}

enum DocumentExportFormat: String, CaseIterable {
    case txt = "Text"
    case pdf = "PDF"
    case docx = "Word Document"
    
    var fileExtension: String {
        switch self {
        case .txt: return "txt"
        case .pdf: return "pdf"
        case .docx: return "docx"
        }
    }
} 