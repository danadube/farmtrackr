//
//  UnifiedImportExportView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import CoreData
import UniformTypeIdentifiers

struct UnifiedImportExportView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var unifiedManager: UnifiedImportExportManager
    @ObservedObject var documentManager: DocumentManager
    
    @State private var selectedTab = 0
    @State private var showingFilePicker = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    @State private var showingErrorAlert = false
    @State private var errorMessage = ""
    @State private var selectedImportFormat: ImportFormat = .csv
    @State private var selectedDocumentImportFormat: DocumentImportFormat = .txt
    @State private var selectedExportFormat: ExportFormat = .csv
    @State private var selectedDocumentExportFormat: DocumentExportFormat = .txt
    @State private var selectedMailMergeExportFormat: MailMergeExportFormat = .individual
    @State private var selectedFarm: String = "All Farms"
    @State private var showingImportPreview = false
    @State private var importPreviewData: ImportPreviewData?
    @State private var selectedFileURL: URL?
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    var availableFarms: [String] {
        Array(Set(contacts.compactMap { $0.farm }.filter { !$0.isEmpty })).sorted()
    }
    
    var filteredContacts: [FarmContact] {
        if selectedFarm == "All Farms" {
            return Array(contacts)
        } else {
            return Array(contacts.filter { $0.farm == selectedFarm })
        }
    }
    
    init(documentManager: DocumentManager) {
        self.documentManager = documentManager
        self._unifiedManager = StateObject(wrappedValue: UnifiedImportExportManager(context: PersistenceController.shared.container.viewContext))
    }
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack(spacing: 16) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                    }
                    .help("Close")
                    
                    Spacer()
                    
                    Text("Import & Export")
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Tab selector
                Picker("Operation Type", selection: $selectedTab) {
                    Text("Import").tag(0)
                    Text("Export").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                
                // Content based on selected tab
                if selectedTab == 0 {
                    importView
                } else {
                    exportView
                }
            }
        }
        .alert("Success", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text(successMessage)
        }
        .alert("Error", isPresented: $showingErrorAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .sheet(isPresented: $showingFilePicker) {
            DocumentPicker(types: allowedContentTypes) { url in
                selectedFileURL = url
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
        .sheet(isPresented: $showingImportPreview) {
            if let previewData = importPreviewData {
                ImportPreviewSheet(previewData: previewData) {
                    // Handle import confirmation
                    Task {
                        await performImport()
                    }
                }
            }
        }
    }
    
    // MARK: - Import View
    
    private var importView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Import Contacts Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "person.2")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Import Contacts")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color.textColor)
                    }
                    
                    VStack(spacing: 12) {
                        // Format selector
                        HStack {
                            Text("Format:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Import Format", selection: $selectedImportFormat) {
                                ForEach(ImportFormat.allCases, id: \.self) { format in
                                    Text(format.rawValue).tag(format)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Import button
                        Button(action: { 
                            selectedFileURL = nil
                            showingFilePicker = true 
                        }) {
                            HStack {
                                Image(systemName: "square.and.arrow.down")
                                Text("Import Contacts")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .cornerRadius(8)
                        }
                        .disabled(unifiedManager.isImporting)
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                }
                
                // Import Documents Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "doc.text")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Import Documents")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color.textColor)
                    }
                    
                    VStack(spacing: 12) {
                        // Format selector
                        HStack {
                            Text("Format:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Document Import Format", selection: $selectedDocumentImportFormat) {
                                ForEach(DocumentImportFormat.allCases, id: \.self) { format in
                                    Text(format.rawValue).tag(format)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Import button
                        Button(action: { 
                            selectedFileURL = nil
                            showingFilePicker = true 
                        }) {
                            HStack {
                                Image(systemName: "square.and.arrow.down")
                                Text("Import Document")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .cornerRadius(8)
                        }
                        .disabled(unifiedManager.isImporting)
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                }
                
                // Progress indicator
                if unifiedManager.isImporting {
                    VStack(spacing: 12) {
                        ProgressView(value: unifiedManager.importProgress)
                            .progressViewStyle(LinearProgressViewStyle())
                        
                        Text(unifiedManager.importStatus)
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.7))
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                }
            }
            .padding(24)
        }
    }
    
    // MARK: - Export View
    
    private var exportView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Export Contacts Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "person.2")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Export Contacts")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color.textColor)
                    }
                    
                    VStack(spacing: 12) {
                        // Farm filter
                        HStack {
                            Text("Farm:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Farm", selection: $selectedFarm) {
                                Text("All Farms").tag("All Farms")
                                ForEach(availableFarms, id: \.self) { farm in
                                    Text(farm).tag(farm)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Format selector
                        HStack {
                            Text("Format:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Export Format", selection: $selectedExportFormat) {
                                ForEach(ExportFormat.allCases, id: \.self) { format in
                                    Text(format.rawValue).tag(format)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Export button
                        Button(action: { 
                            Task {
                                await exportContacts()
                            }
                        }) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Export \(filteredContacts.count) Contacts")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .cornerRadius(8)
                        }
                        .disabled(unifiedManager.isExporting || filteredContacts.isEmpty)
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                }
                
                // Export Documents Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "doc.text")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Export Documents")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color.textColor)
                    }
                    
                    VStack(spacing: 12) {
                        // Format selector
                        HStack {
                            Text("Format:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Document Export Format", selection: $selectedDocumentExportFormat) {
                                ForEach(DocumentExportFormat.allCases, id: \.self) { format in
                                    Text(format.rawValue).tag(format)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Document list
                        if !documentManager.documents.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Select Document:")
                                    .font(.subheadline)
                                    .foregroundColor(Color.textColor)
                                
                                ForEach(documentManager.documents, id: \.id) { document in
                                    Button(action: {
                                        Task {
                                            await exportDocument(document)
                                        }
                                    }) {
                                        HStack {
                                            Image(systemName: "doc.text")
                                                .foregroundColor(themeVM.theme.colors.accent)
                                            
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(document.name ?? "Untitled")
                                                    .font(.subheadline)
                                                    .foregroundColor(Color.textColor)
                                                
                                                Text(document.modifiedDate?.formatted() ?? "")
                                                    .font(.caption)
                                                    .foregroundColor(Color.textColor.opacity(0.6))
                                            }
                                            
                                            Spacer()
                                            
                                            Image(systemName: "square.and.arrow.up")
                                                .foregroundColor(themeVM.theme.colors.accent)
                                        }
                                        .padding(8)
                                        .background(Color.cardBackgroundAdaptive.opacity(0.5))
                                        .cornerRadius(6)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                        } else {
                            Text("No documents available for export")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor.opacity(0.6))
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, 20)
                        }
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                }
                
                // Export Mail Merge Results Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "envelope")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Export Mail Merge Results")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color.textColor)
                    }
                    
                    VStack(spacing: 12) {
                        // Format selector
                        HStack {
                            Text("Format:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            Picker("Mail Merge Export Format", selection: $selectedMailMergeExportFormat) {
                                ForEach(MailMergeExportFormat.allCases, id: \.self) { format in
                                    Text(format.rawValue).tag(format)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                        }
                        
                        // Export button
                        Button(action: { 
                            Task {
                                await exportMailMergeResults()
                            }
                        }) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Export Mail Merge Results")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .cornerRadius(8)
                        }
                        .disabled(unifiedManager.isExporting || documentManager.documents.isEmpty)
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                }
                
                // Progress indicator
                if unifiedManager.isExporting {
                    VStack(spacing: 12) {
                        ProgressView(value: unifiedManager.exportProgress)
                            .progressViewStyle(LinearProgressViewStyle())
                        
                        Text(unifiedManager.exportStatus)
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.7))
                    }
                    .padding(16)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(12)
                }
            }
            .padding(24)
        }
    }
    
    // MARK: - Computed Properties
    
    private var allowedContentTypes: [UTType] {
        if selectedTab == 0 {
            // Import
            if selectedImportFormat == .csv {
                return [.commaSeparatedText]
            } else if selectedImportFormat == .excel {
                return [UTType("org.openxmlformats.spreadsheetml.sheet")!, UTType("org.openxmlformats.spreadsheetml.sheet")!]
            } else if selectedImportFormat == .json {
                return [.json]
            } else {
                // Document import
                switch selectedDocumentImportFormat {
                case .txt: return [.plainText]
                case .rtf: return [.rtf]
                case .docx: return [UTType("org.openxmlformats.wordprocessingml.document")!]
                case .pdf: return [.pdf]
                case .html: return [.html]
                }
            }
        }
        return []
    }
    
    // MARK: - Actions
    
    private func performImport() async {
        guard let url = selectedFileURL else { return }
        
        do {
            if selectedTab == 0 {
                if selectedImportFormat != .csv || selectedImportFormat != .excel || selectedImportFormat != .json {
                    // Document import
                    let (name, content) = try await unifiedManager.importDocument(from: url, format: selectedDocumentImportFormat)
                    
                    // Create document in Core Data
                    let document = Document(context: viewContext)
                    document.id = UUID()
                    document.name = name
                    document.content = content
                    document.createdDate = Date()
                    document.modifiedDate = Date()
                    
                    try viewContext.save()
                    documentManager.loadDocuments()
                    
                    successMessage = "Document '\(name)' imported successfully"
                    showingSuccessAlert = true
                } else {
                    // Contact import
                    let contacts = try await unifiedManager.importContacts(from: url, format: selectedImportFormat)
                    
                    // Save contacts to Core Data
                    for record in contacts {
                        let contact = FarmContact(context: viewContext)
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
                    
                    try viewContext.save()
                    
                    successMessage = "Imported \(contacts.count) contacts successfully"
                    showingSuccessAlert = true
                }
            }
        } catch {
            errorMessage = "Import failed: \(error.localizedDescription)"
            showingErrorAlert = true
        }
    }
    
    private func exportContacts() async {
        do {
            let url = try await unifiedManager.exportContacts(filteredContacts, format: selectedExportFormat, farmFilter: selectedFarm)
            exportURL = url
            successMessage = "Contacts exported successfully"
            showingSuccessAlert = true
            showingShareSheet = true
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            showingErrorAlert = true
        }
    }
    
    private func exportDocument(_ document: Document) async {
        do {
            let url = try await unifiedManager.exportDocument(document, format: selectedDocumentExportFormat)
            exportURL = url
            successMessage = "Document exported successfully"
            showingSuccessAlert = true
            showingShareSheet = true
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            showingErrorAlert = true
        }
    }
    
    private func exportMailMergeResults() async {
        do {
            let url = try await unifiedManager.exportMailMergeResults(documentManager.documents, format: selectedMailMergeExportFormat)
            exportURL = url
            successMessage = "Mail merge results exported successfully"
            showingSuccessAlert = true
            showingShareSheet = true
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            showingErrorAlert = true
        }
    }
}

// MARK: - Supporting Views

struct ImportPreviewSheet: View {
    let previewData: ImportPreviewData
    let onConfirm: () -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Import Preview")
                    .font(.headline)
                    .padding()
                
                // Preview content would go here
                Text("Preview data for \(previewData.count) items")
                    .padding()
                
                Spacer()
                
                HStack {
                    Button("Cancel") {
                        // Dismiss
                    }
                    .buttonStyle(.bordered)
                    
                    Button("Import") {
                        onConfirm()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
        }
    }
}

struct ImportPreviewData {
    let count: Int
    let preview: String
} 