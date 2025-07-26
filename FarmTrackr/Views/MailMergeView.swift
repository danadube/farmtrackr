//
//  MailMergeView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct MailMergeView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var documentManager: DocumentManager
    @StateObject private var unifiedManager = UnifiedImportExportManager(context: PersistenceController.shared.container.viewContext)
    @State private var selectedTemplate: DocumentTemplate?
    @State private var selectedContacts: Set<FarmContact> = []
    @State private var selectedFarms: Set<String> = []
    @State private var searchText = ""
    @State private var showingTemplatePicker = false
    @State private var showingPreview = false
    @State private var showingResults = false
    @State private var generatedDocuments: [Document] = []
    @State private var isProcessing = false
    @State private var showingFarmSelector = false
    @State private var showingExportOptions = false
    
    var body: some View {
        ZStack {
            themeVM.theme.colors.background
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
                    
                    Text("Mail Merge")
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Template selection
                VStack(spacing: 16) {
                    HStack {
                        Button(action: { showingTemplatePicker = true }) {
                            HStack {
                                Image(systemName: "doc.text.below.ecg")
                                Text(selectedTemplate?.name ?? "Select Template")
                                Image(systemName: "chevron.down")
                            }
                            .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .buttonStyle(.bordered)
                        .help("Choose a template for mail merge")
                        
                        Spacer()
                        
                        if selectedTemplate != nil {
                            Button(action: { showingPreview = true }) {
                                HStack {
                                    Image(systemName: "eye")
                                    Text("Preview")
                                }
                                .foregroundColor(themeVM.theme.colors.accent)
                            }
                            .buttonStyle(.bordered)
                            .help("Preview the selected template")
                        }
                    }
                    
                    if let template = selectedTemplate {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Template: \(template.name ?? "Untitled")")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            Spacer()
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(themeVM.theme.colors.accent.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Farm selection
                VStack(spacing: 16) {
                    HStack {
                        Text("Select Farms")
                            .font(.headline)
                            .foregroundColor(Color.textColor)
                        
                        Spacer()
                        
                        Button(action: { showingFarmSelector = true }) {
                            HStack {
                                Image(systemName: "building.2")
                                Text("Choose Farms")
                                Image(systemName: "chevron.right")
                            }
                            .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .buttonStyle(.bordered)
                        .help("Select which farms to include")
                    }
                    
                    if !selectedFarms.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Selected Farms:")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 8) {
                                ForEach(Array(selectedFarms), id: \.self) { farm in
                                    HStack {
                                        Image(systemName: "building.2.fill")
                                            .foregroundColor(themeVM.theme.colors.accent)
                                        Text(farm)
                                            .font(.caption)
                                            .foregroundColor(Color.textColor)
                                        Spacer()
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(themeVM.theme.colors.accent.opacity(0.1))
                                    .cornerRadius(6)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Contact selection
                VStack(spacing: 0) {
                    HStack {
                        Text("Contacts from Selected Farms")
                            .font(.headline)
                            .foregroundColor(Color.textColor)
                        
                        Spacer()
                        
                        Button(action: { selectedContacts = Set(filteredContacts) }) {
                            HStack {
                                Image(systemName: "checkmark.circle")
                                Text("Select All")
                            }
                            .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .buttonStyle(.bordered)
                        .help("Select all contacts from chosen farms")
                        
                        Button(action: { selectedContacts.removeAll() }) {
                            HStack {
                                Image(systemName: "circle")
                                Text("Clear All")
                            }
                            .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .buttonStyle(.bordered)
                        .help("Clear all selected contacts")
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.cardBackgroundAdaptive)
                    
                    SearchBar(text: $searchText, placeholder: "Search contacts...")
                        .padding(.horizontal, 24)
                        .padding(.bottom, 8)
                    
                    List(filteredContacts, id: \.id) { contact in
                        ContactSelectionRow(
                            contact: contact,
                            isSelected: selectedContacts.contains(contact)
                        ) {
                            if selectedContacts.contains(contact) {
                                selectedContacts.remove(contact)
                            } else {
                                selectedContacts.insert(contact)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .background(Color.cardBackgroundAdaptive)
                }
                
                // Action buttons
                VStack(spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(selectedContacts.count) contacts selected")
                                .font(.subheadline)
                                .foregroundColor(Color.textColor.opacity(0.6))
                            
                            if !selectedFarms.isEmpty {
                                Text("From \(selectedFarms.count) farm\(selectedFarms.count == 1 ? "" : "s")")
                                    .font(.caption)
                                    .foregroundColor(Color.textColor.opacity(0.6))
                            }
                        }
                        
                        Spacer()
                    }
                    
                    Button(action: performMailMerge) {
                        HStack {
                            if isProcessing {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .scaleEffect(0.8)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "envelope.badge")
                            }
                            
                            Text("Generate Documents")
                                .fontWeight(.medium)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(themeVM.theme.colors.accent)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(selectedTemplate == nil || selectedContacts.isEmpty || isProcessing)
                    .help("Generate mail merge documents for selected contacts")
                }
                .padding(24)
                .background(Color.cardBackgroundAdaptive)
            }
        }
        .sheet(isPresented: $showingTemplatePicker) {
            TemplatePickerView(selectedTemplate: $selectedTemplate, templates: documentManager.templates)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingPreview) {
            if let template = selectedTemplate {
                TemplatePreviewView(content: template.content ?? "", type: DocumentType(rawValue: template.type ?? "") ?? .custom)
                    .environmentObject(themeVM)
            }
        }
        .sheet(isPresented: $showingFarmSelector) {
            FarmSelectorView(selectedFarms: $selectedFarms, allFarms: allFarms)
                .environmentObject(themeVM)
        }
        .fullScreenCover(isPresented: $showingResults) {
            MailMergeResultsView(documents: generatedDocuments, documentManager: documentManager)
                .environmentObject(themeVM)
        }
    }
    
    private var allContacts: [FarmContact] {
        let request: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.lastName, ascending: true)]
        
        do {
            return try viewContext.fetch(request)
        } catch {
            return []
        }
    }
    
    private var allFarms: [String] {
        let farms = Set(allContacts.compactMap { $0.farm }.filter { !$0.isEmpty })
        return Array(farms).sorted()
    }
    
    private var filteredContacts: [FarmContact] {
        var contacts = allContacts
        
        // Filter by selected farms
        if !selectedFarms.isEmpty {
            contacts = contacts.filter { contact in
                if let farm = contact.farm, !farm.isEmpty {
                    return selectedFarms.contains(farm)
                }
                return false
            }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            contacts = contacts.filter { contact in
                contact.fullName.localizedCaseInsensitiveContains(searchText) ||
                contact.farm?.localizedCaseInsensitiveContains(searchText) == true ||
                contact.email?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
        
        return contacts
    }
    
    private func performMailMerge() {
        guard let template = selectedTemplate else { return }
        
        isProcessing = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            // Load template as NSAttributedString
            var templateAttributedString: NSAttributedString
            if let rtfData = template.richTextData,
               let attributedString = try? NSAttributedString(
                   data: rtfData,
                   options: [.documentType: NSAttributedString.DocumentType.rtf],
                   documentAttributes: nil
               ) {
                templateAttributedString = attributedString
            } else {
                templateAttributedString = NSAttributedString(string: template.content ?? "")
            }
            
            // Perform mail merge with rich text
            let documents = MailMerge.performBatchMailMerge(
                template: templateAttributedString,
                contacts: Array(selectedContacts),
                context: viewContext
            )
            
            generatedDocuments = documents
            isProcessing = false
            showingResults = true
        }
    }
}

struct FarmSelectorView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedFarms: Set<String>
    let allFarms: [String]
    @State private var searchText = ""
    
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
                    
                    Text("Select Farms")
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Search
                SearchBar(text: $searchText, placeholder: "Search farms...")
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Farm selection
                VStack(spacing: 16) {
                    HStack {
                        Text("Available Farms")
                            .font(.headline)
                            .foregroundColor(Color.textColor)
                        
                        Spacer()
                        
                        Button(action: { selectedFarms = Set(filteredFarms) }) {
                            HStack {
                                Image(systemName: "checkmark.circle")
                                Text("Select All")
                            }
                            .foregroundColor(Color.accentColor)
                        }
                        .buttonStyle(.bordered)
                        .help("Select all farms")
                        
                        Button(action: { selectedFarms.removeAll() }) {
                            HStack {
                                Image(systemName: "circle")
                                Text("Clear All")
                            }
                            .foregroundColor(Color.accentColor)
                        }
                        .buttonStyle(.bordered)
                        .help("Clear all selections")
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.cardBackgroundAdaptive)
                    
                    List(filteredFarms, id: \.self) { farm in
                        FarmSelectionRow(
                            farm: farm,
                            isSelected: selectedFarms.contains(farm)
                        ) {
                            if selectedFarms.contains(farm) {
                                selectedFarms.remove(farm)
                            } else {
                                selectedFarms.insert(farm)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .background(Color.cardBackgroundAdaptive)
                }
                
                // Action buttons
                VStack(spacing: 12) {
                    HStack {
                        Text("\(selectedFarms.count) farm\(selectedFarms.count == 1 ? "" : "s") selected")
                            .font(.subheadline)
                            .foregroundColor(Color.textColor.opacity(0.6))
                        
                        Spacer()
                    }
                    
                    Button(action: { dismiss() }) {
                        Text("Done")
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .help("Confirm farm selection")
                }
                .padding(24)
                .background(Color.cardBackgroundAdaptive)
            }
        }
    }
    
    private var filteredFarms: [String] {
        if searchText.isEmpty {
            return allFarms
        } else {
            return allFarms.filter { farm in
                farm.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
}

struct FarmSelectionRow: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let farm: String
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? Color.accentColor : Color.textColor.opacity(0.6))
                    .font(.title3)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(farm)
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    Text("Farm")
                        .font(.caption)
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
                
                Spacer()
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ContactSelectionRow: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let contact: FarmContact
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? Color.accentColor : Color.textColor.opacity(0.6))
                    .font(.title3)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(contact.fullName)
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    if let farm = contact.farm, !farm.isEmpty {
                        Text(farm)
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.6))
                    }
                    
                    if let email = contact.email, !email.isEmpty {
                        Text(email)
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.6))
                    }
                }
                
                Spacer()
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct MailMergeResultsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    let documents: [Document]
    @ObservedObject var documentManager: DocumentManager
    @StateObject private var unifiedManager = UnifiedImportExportManager(context: PersistenceController.shared.container.viewContext)
    @State private var showingExportSheet = false
    @State private var selectedExportFormat: MailMergeExportFormat = .individual
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    
    var body: some View {
        ZStack {
            themeVM.theme.colors.background
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
                    
                    Text("Mail Merge Results")
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(themeVM.theme.colors.cardBackground)
                
                Divider()
                    .background(themeVM.theme.colors.border)
                
                // Content
                VStack(spacing: 24) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title)
                            .foregroundColor(.green)
                        
                        VStack(alignment: .leading) {
                            Text("Mail Merge Complete")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(themeVM.theme.colors.text)
                            
                            Text("\(documents.count) documents generated")
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        
                        Spacer()
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Generated Documents:")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        ScrollView {
                            LazyVStack(spacing: 8) {
                                ForEach(documents, id: \.id) { document in
                                    DocumentResultRow(document: document)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                    
                    Spacer()
                    
                    VStack(spacing: 12) {
                        Button(action: { 
                            Task {
                                await exportMailMergeResults()
                            }
                        }) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Export Mail Merge Results")
                            }
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(unifiedManager.isExporting)
                        .help("Export all generated documents")
                        
                        Button(action: { dismiss() }) {
                            HStack {
                                Image(systemName: "doc.text")
                                Text("View in Documents")
                            }
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.cardBackground)
                            .foregroundColor(themeVM.theme.colors.accent)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(themeVM.theme.colors.accent, lineWidth: 1)
                            )
                        }
                        .help("View documents in the main Documents view")
                    }
                    
                    // Progress indicator
                    if unifiedManager.isExporting {
                        VStack(spacing: 12) {
                            ProgressView(value: unifiedManager.exportProgress)
                                .progressViewStyle(LinearProgressViewStyle())
                            
                            Text(unifiedManager.exportStatus)
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        .padding(16)
                        .background(themeVM.theme.colors.cardBackground)
                        .cornerRadius(12)
                    }
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
        .alert("Export Complete", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text(successMessage)
        }
    }
    
    private func exportMailMergeResults() async {
        do {
            let url = try await unifiedManager.exportMailMergeResults(documents, format: selectedExportFormat)
            exportURL = url
            successMessage = "Mail merge results exported successfully"
            showingSuccessAlert = true
            showingShareSheet = true
        } catch {
            successMessage = "Export failed: \(error.localizedDescription)"
            showingSuccessAlert = true
        }
    }
}

struct DocumentResultRow: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    
    var body: some View {
        HStack {
            Image(systemName: "doc.text")
                .foregroundColor(themeVM.theme.colors.accent)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(document.name ?? "Untitled")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(themeVM.theme.colors.text)
                
                if let contacts = document.contacts?.allObjects as? [FarmContact], !contacts.isEmpty {
                    Text("For: \(contacts.map { $0.fullName }.joined(separator: ", "))")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
            }
            
            Spacer()
            
            if let date = document.createdDate {
                Text(date, style: .time)
                    .font(.caption)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ExportAllDocumentsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    let documents: [Document]
    @ObservedObject var documentManager: DocumentManager
    @State private var selectedFormat: DocumentExportFormat = .txt
    @State private var showingShareSheet = false
    @State private var exportURLs: [URL] = []
    
    var body: some View {
        ZStack {
            themeVM.theme.colors.background
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Header
                HStack(spacing: 16) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                    }
                    .help("Close")
                    
                    Spacer()
                    
                    Text("Export Documents")
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(themeVM.theme.colors.cardBackground)
                
                Divider()
                    .background(themeVM.theme.colors.border)
                
                // Content
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Export Format:")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Picker("Format", selection: $selectedFormat) {
                            ForEach(DocumentExportFormat.allCases, id: \.self) { format in
                                Text(format.rawValue).tag(format)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Documents to export:")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Text("\(documents.count) documents")
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    }
                    
                    Spacer()
                    
                    Button(action: exportAllDocuments) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Export All")
                        }
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(themeVM.theme.colors.accent)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(documents.isEmpty)
                    .help("Export all documents in selected format")
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(items: exportURLs)
        }
    }
    
    private func exportAllDocuments() {
        var urls: [URL] = []
        
        for document in documents {
            if let url = documentManager.exportDocument(document, format: selectedFormat) {
                urls.append(url)
            }
        }
        
        exportURLs = urls
        showingShareSheet = true
    }
}

#Preview {
    MailMergeView(documentManager: DocumentManager(context: PersistenceController.shared.container.viewContext))
        .environment(\.managedObjectContext, PersistenceController.shared.container.viewContext)
        .environmentObject(ThemeViewModel())
}