//
//  BatchActionManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/11/25.
//

import Foundation
import CoreData
import SwiftUI

class BatchActionManager: ObservableObject {
    @Published var selectedContacts: Set<FarmContact> = []
    @Published var isSelectionMode = false
    @Published var isProcessing = false
    @Published var progress: Double = 0.0
    @Published var currentOperation: String = ""
    
    private let viewContext: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.viewContext = context
    }
    
    // MARK: - Selection Management
    
    func toggleSelection(for contact: FarmContact) {
        if selectedContacts.contains(contact) {
            selectedContacts.remove(contact)
        } else {
            selectedContacts.insert(contact)
        }
    }
    
    func selectAll(contacts: [FarmContact]) {
        selectedContacts = Set(contacts)
    }
    
    func deselectAll() {
        selectedContacts.removeAll()
    }
    
    func invertSelection(contacts: [FarmContact]) {
        let allContacts = Set(contacts)
        selectedContacts = allContacts.subtracting(selectedContacts)
    }
    
    func selectByFilter(contacts: [FarmContact], filter: (FarmContact) -> Bool) {
        let filteredContacts = contacts.filter(filter)
        selectedContacts = Set(filteredContacts)
    }
    
    // MARK: - Batch Operations
    
    func deleteSelectedContacts() async throws {
        await MainActor.run {
            isProcessing = true
            currentOperation = "Deleting contacts..."
            progress = 0.0
        }
        
        let contactsToDelete = Array(selectedContacts)
        let totalCount = contactsToDelete.count
        
        for (index, contact) in contactsToDelete.enumerated() {
            await MainActor.run {
                progress = Double(index) / Double(totalCount)
                currentOperation = "Deleting \(contact.fullName)..."
            }
            
            viewContext.delete(contact)
            
            // Save periodically to avoid memory issues
            if index % 10 == 0 {
                try viewContext.save()
            }
        }
        
        try viewContext.save()
        
        await MainActor.run {
            selectedContacts.removeAll()
            isSelectionMode = false
            isProcessing = false
            progress = 1.0
        }
    }
    
    func exportSelectedContacts(format: ExportFormat) async throws -> URL {
        await MainActor.run {
            isProcessing = true
            currentOperation = "Exporting contacts..."
            progress = 0.0
        }
        
        let contactsToExport = Array(selectedContacts)
        
        let exportManager = ExportManager()
        
        let url: URL
        switch format {
        case .csv:
            url = try await exportManager.exportToCSV(contacts: contactsToExport)
        case .json:
            url = try await exportManager.exportToJSON(contacts: contactsToExport)
        case .excel:
            url = try await exportManager.exportToExcel(contacts: contactsToExport)
        }
        
        await MainActor.run {
            isProcessing = false
            progress = 1.0
        }
        
        return url
    }
    
    func printLabelsForSelectedContacts() async throws {
        await MainActor.run {
            isProcessing = true
            currentOperation = "Preparing labels..."
            progress = 0.0
        }
        
        let contactsToPrint = Array(selectedContacts)
        let totalCount = contactsToPrint.count
        
        // Create a temporary CSV file for label printing
        let labelData = createLabelData(from: contactsToPrint)
        
        await MainActor.run {
            progress = 0.5
            currentOperation = "Generating label file..."
        }
        
        let fileName = "Labels_\(Date().formatted(date: .abbreviated, time: .omitted)).csv"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try labelData.write(to: fileURL, atomically: true, encoding: .utf8)
        
        await MainActor.run {
            progress = 1.0
            currentOperation = "Labels ready for printing"
            isProcessing = false
        }
        
        // In a real implementation, you would integrate with the PrintLabelsView
        // For now, we create a CSV file that can be used with label printing software
    }
    
    func addTagToSelectedContacts(tag: String) async throws {
        await MainActor.run {
            isProcessing = true
            currentOperation = "Adding tag to contacts..."
            progress = 0.0
        }
        
        let contactsToUpdate = Array(selectedContacts)
        let totalCount = contactsToUpdate.count
        
        for (index, contact) in contactsToUpdate.enumerated() {
            await MainActor.run {
                progress = Double(index) / Double(totalCount)
                currentOperation = "Adding tag to \(contact.fullName)..."
            }
            
            // Add tag to contact (you might want to store tags in a separate field)
            // For now, we'll append to notes
            let currentNotes = contact.notes ?? ""
            let newNotes = currentNotes.isEmpty ? "Tag: \(tag)" : "\(currentNotes)\nTag: \(tag)"
            contact.notes = newNotes
            contact.dateModified = Date()
        }
        
        try await viewContext.perform {
            try self.viewContext.save()
        }
        
        await MainActor.run {
            isProcessing = false
            progress = 1.0
            currentOperation = "Tag added successfully"
        }
    }
    
    func bulkEditSelectedContacts(farm: String?, state: String?, notes: String?) async throws {
        await MainActor.run {
            isProcessing = true
            currentOperation = "Updating contacts..."
            progress = 0.0
        }
        
        let contactsToUpdate = Array(selectedContacts)
        let totalCount = contactsToUpdate.count
        
        guard totalCount > 0 else {
            await MainActor.run {
                isProcessing = false
            }
            throw NSError(domain: "BatchActionManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "No contacts selected"])
        }
        
        for (index, contact) in contactsToUpdate.enumerated() {
            await MainActor.run {
                progress = Double(index) / Double(totalCount)
                currentOperation = "Updating \(contact.fullName)..."
            }
            
            // Update fields if provided
            if let farm = farm {
                contact.farm = farm
            }
            if let state = state {
                contact.state = state
            }
            if let notes = notes {
                contact.notes = notes
            }
            
            contact.dateModified = Date()
        }
        
        // Save changes
        try await viewContext.perform {
            if self.viewContext.hasChanges {
                try self.viewContext.save()
            }
        }
        
        await MainActor.run {
            isProcessing = false
            progress = 1.0
            currentOperation = "Contacts updated successfully"
        }
    }
    
    // MARK: - Utility Methods
    
    var selectedCount: Int {
        selectedContacts.count
    }
    
    var hasSelection: Bool {
        !selectedContacts.isEmpty
    }
    
    func enterSelectionMode() {
        isSelectionMode = true
        selectedContacts.removeAll()
    }
    
    func exitSelectionMode() {
        isSelectionMode = false
        selectedContacts.removeAll()
    }
    
    // MARK: - Helper Methods
    
    private func createLabelData(from contacts: [FarmContact]) -> String {
        var labelData = "Name,Address,City,State,ZIP\n"
        
        for contact in contacts {
            let name = "\(contact.firstName ?? "") \(contact.lastName ?? "")"
            let address = contact.mailingAddress ?? ""
            let city = contact.city ?? ""
            let state = contact.state ?? ""
            let zip = contact.zipCode > 0 ? String(contact.zipCode) : ""
            
            let line = "\(name),\(address),\(city),\(state),\(zip)\n"
            labelData += line
        }
        
        return labelData
    }
}

// MARK: - Supporting Types

enum ExportFormat: String, CaseIterable {
    case csv = "CSV"
    case json = "JSON"
    case excel = "Excel"
    
    var fileExtension: String {
        switch self {
        case .csv: return "csv"
        case .json: return "json"
        case .excel: return "xlsx"
        }
    }
    
    var mimeType: String {
        switch self {
        case .csv: return "text/csv"
        case .json: return "application/json"
        case .excel: return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    }
} 