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
    
    func createDocument(name: String, content: String, attributedContent: NSAttributedString? = nil, template: DocumentTemplate? = nil, contacts: [FarmContact] = []) -> Document {
        let document = Document(context: context)
        document.id = UUID()
        document.name = name
        document.content = content
        document.createdDate = Date()
        document.modifiedDate = Date()
        document.template = template
        document.contacts = NSSet(array: contacts)
        
        // Store rich text data if provided
        if let attributedContent = attributedContent {
            if let rtfData = try? attributedContent.data(
                from: NSRange(location: 0, length: attributedContent.length),
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
            ) {
                document.richTextData = rtfData
            }
        }
        
        saveContext()
        loadDocuments()
        return document
    }
    
    func updateDocument(_ document: Document, content: String, attributedContent: NSAttributedString? = nil) {
        document.content = content
        document.modifiedDate = Date()
        
        // Update rich text data if provided
        if let attributedContent = attributedContent {
            if let rtfData = try? attributedContent.data(
                from: NSRange(location: 0, length: attributedContent.length),
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
            ) {
                document.richTextData = rtfData
            }
        }
        
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
    
    func createTemplate(name: String, content: String, attributedContent: NSAttributedString? = nil, type: DocumentType) -> DocumentTemplate {
        let template = DocumentTemplate(context: context)
        template.id = UUID()
        template.name = name
        template.content = content
        template.type = type.rawValue
        template.createdDate = Date()
        
        // Store rich text data if provided
        if let attributedContent = attributedContent {
            if let rtfData = try? attributedContent.data(
                from: NSRange(location: 0, length: attributedContent.length),
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
            ) {
                template.richTextData = rtfData
            }
        }
        
        saveContext()
        loadTemplates()
        return template
    }
    
    func updateTemplate(_ template: DocumentTemplate, content: String, attributedContent: NSAttributedString? = nil) {
        template.content = content
        template.modifiedDate = Date()
        
        // Update rich text data if provided
        if let attributedContent = attributedContent {
            if let rtfData = try? attributedContent.data(
                from: NSRange(location: 0, length: attributedContent.length),
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
            ) {
                template.richTextData = rtfData
            }
        }
        
        saveContext()
        loadTemplates()
    }
    
    func deleteTemplate(_ template: DocumentTemplate) {
        context.delete(template)
        saveContext()
        loadTemplates()
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
            case .rtf:
                // For RTF, we'd need to use NSAttributedString
                // For now, we'll create a simple text file
                try content.write(to: tempURL, atomically: true, encoding: .utf8)
            case .html:
                // For HTML, we'd need to use NSAttributedString
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

 