//
//  DocumentImportExportView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import UniformTypeIdentifiers

struct DocumentImportExportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var cloudStorageManager = CloudStorageManager()
    @ObservedObject var documentManager: DocumentManager
    
    let document: Document?
    let content: String
    let name: String
    
    @State private var selectedTab = 0
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    @State private var showingFilePicker = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    @State private var importContent: String = ""
    @State private var showingImportPreview = false
    
    init(documentManager: DocumentManager, document: Document? = nil, content: String = "", name: String = "") {
        self.documentManager = documentManager
        self.document = document
        self.content = content
        self.name = name
    }
    
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
                    .help("Close import/export")
                    
                    Spacer()
                    
                    Text("Import & Export")
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(themeVM.theme.colors.cardBackground)
                
                Divider()
                    .background(themeVM.theme.colors.border)
                
                // Tab selector
                HStack(spacing: 0) {
                    Button(action: { selectedTab = 0 }) {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.down.doc")
                                .font(.subheadline)
                            Text("Import")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(selectedTab == 0 ? themeVM.theme.colors.accent : themeVM.theme.colors.secondaryLabel)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(selectedTab == 0 ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                    }
                    
                    Button(action: { selectedTab = 1 }) {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.up.doc")
                                .font(.subheadline)
                            Text("Export")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(selectedTab == 1 ? themeVM.theme.colors.accent : themeVM.theme.colors.secondaryLabel)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(selectedTab == 1 ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                    }
                }
                .background(themeVM.theme.colors.cardBackground)
                
                Divider()
                    .background(themeVM.theme.colors.border)
                
                // Content
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
        .sheet(isPresented: $showingFilePicker) {
            DocumentPickerView { url in
                importFromFile(url)
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
        .sheet(isPresented: $showingImportPreview) {
            DocumentImportPreviewView(content: importContent) { confirmedContent in
                importContent = confirmedContent
                successMessage = "Document imported successfully"
                showingSuccessAlert = true
            }
            .environmentObject(themeVM)
        }
    }
    
    // MARK: - Import View
    private var importView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Import from file
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "doc.badge.plus")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Import from File")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                    }
                    
                    Text("Import content from a text file, Word document, or other supported formats.")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Button(action: { showingFilePicker = true }) {
                        HStack {
                            Image(systemName: "folder")
                            Text("Choose File")
                        }
                        .foregroundColor(themeVM.theme.colors.accent)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(themeVM.theme.colors.cardBackground)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(themeVM.theme.colors.border, lineWidth: 1)
                        )
                    }
                    .help("Select a file to import")
                }
                .padding(20)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
                
                // Import from cloud storage
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "icloud.and.arrow.down")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Import from Cloud")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                    }
                    
                    Text("Import content from iCloud, Google Drive, OneDrive, or Dropbox.")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    VStack(spacing: 12) {
                        ForEach(CloudStorageManager.CloudStorageType.allCases, id: \.self) { storageType in
                            Button(action: { importFromCloud(storageType) }) {
                                HStack {
                                    Image(systemName: storageType.icon)
                                        .foregroundColor(themeVM.theme.colors.accent)
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(storageType.rawValue)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                            .foregroundColor(themeVM.theme.colors.text)
                                        
                                        Text("Import from \(storageType.rawValue)")
                                            .font(.caption)
                                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    }
                                    
                                    Spacer()
                                    
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                }
                                .padding(12)
                                .background(themeVM.theme.colors.cardBackground)
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(themeVM.theme.colors.border, lineWidth: 1)
                                )
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                .padding(20)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
                
                // Supported formats
                VStack(alignment: .leading, spacing: 12) {
                    Text("Supported Import Formats")
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        FormatRow(icon: "doc.text", name: "Plain Text", extensions: [".txt", ".md"])
                        FormatRow(icon: "doc.richtext", name: "Rich Text", extensions: [".rtf", ".rtfd"])
                        FormatRow(icon: "doc.plaintext", name: "Word Document", extensions: [".docx", ".doc"])
                        FormatRow(icon: "doc.text", name: "Markdown", extensions: [".md", ".markdown"])
                        FormatRow(icon: "doc.text", name: "HTML", extensions: [".html", ".htm"])
                    }
                }
                .padding(20)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
            }
            .padding(24)
        }
    }
    
    // MARK: - Export View
    private var exportView: some View {
        ScrollView {
            VStack(spacing: 24) {
                exportToFileSection
                exportToCloudSection
            }
            .padding(24)
        }
    }
    
    private var exportToFileSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "square.and.arrow.up")
                    .font(.title2)
                    .foregroundColor(themeVM.theme.colors.accent)
                
                Text("Export to File")
                    .font(.headline)
                    .foregroundColor(themeVM.theme.colors.text)
            }
            
            Text("Export your document in various formats for sharing or backup.")
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            VStack(spacing: 12) {
                ForEach(CloudStorageManager.DocumentFormat.allCases, id: \.self) { format in
                    exportFormatButton(format)
                }
            }
        }
        .padding(20)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private func exportFormatButton(_ format: CloudStorageManager.DocumentFormat) -> some View {
        Button(action: { exportToFile(format) }) {
            HStack {
                Image(systemName: iconForFormat(format))
                    .foregroundColor(themeVM.theme.colors.accent)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(format.rawValue)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text("Export as \(format.rawValue)")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                
                Spacer()
                
                Image(systemName: "arrow.down.doc")
                    .font(.caption)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            .padding(12)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(themeVM.theme.colors.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func iconForFormat(_ format: CloudStorageManager.DocumentFormat) -> String {
        switch format {
        case .txt: return "doc.text"
        case .rtf: return "doc.richtext"
        case .docx: return "doc.plaintext"
        case .pdf: return "doc.plaintext"
        case .html: return "doc.text"
        }
    }
    
    private var exportToCloudSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "icloud.and.arrow.up")
                    .font(.title2)
                    .foregroundColor(themeVM.theme.colors.accent)
                
                Text("Export to Cloud")
                    .font(.headline)
                    .foregroundColor(themeVM.theme.colors.text)
            }
            
            Text("Save your document to cloud storage for backup and sharing.")
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            VStack(spacing: 12) {
                ForEach(CloudStorageManager.CloudStorageType.allCases, id: \.self) { storageType in
                    exportCloudButton(storageType)
                }
            }
        }
        .padding(20)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private func exportCloudButton(_ storageType: CloudStorageManager.CloudStorageType) -> some View {
        Button(action: { exportToCloud(storageType) }) {
            HStack {
                Image(systemName: storageType.icon)
                    .foregroundColor(themeVM.theme.colors.accent)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Save to \(storageType.rawValue)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text("Upload document to \(storageType.rawValue)")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                
                Spacer()
                
                Image(systemName: "icloud.and.arrow.up")
                    .font(.caption)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            .padding(12)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(themeVM.theme.colors.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Actions
    private func importFromFile(_ url: URL) {
        do {
            let content = try String(contentsOf: url, encoding: .utf8)
            importContent = content
            showingImportPreview = true
        } catch {
            successMessage = "Failed to import file: \(error.localizedDescription)"
            showingSuccessAlert = true
        }
    }
    
    private func importFromCloud(_ storageType: CloudStorageManager.CloudStorageType) {
        successMessage = "Import from \(storageType.rawValue) - Feature coming soon"
        showingSuccessAlert = true
    }
    
    private func exportToFile(_ format: CloudStorageManager.DocumentFormat) {
        if let existingDocument = document {
            exportURL = documentManager.exportDocument(existingDocument, format: .txt)
        } else {
            let tempDocument = documentManager.createDocument(
                name: name,
                content: content
            )
            exportURL = documentManager.exportDocument(tempDocument, format: .txt)
            documentManager.deleteDocument(tempDocument)
        }
        
        if exportURL != nil {
            showingShareSheet = true
        } else {
            successMessage = "Failed to export document"
            showingSuccessAlert = true
        }
    }
    
    private func exportToCloud(_ storageType: CloudStorageManager.CloudStorageType) {
        successMessage = "Export to \(storageType.rawValue) - Feature coming soon"
        showingSuccessAlert = true
    }
}

// MARK: - Supporting Views
struct FormatRow: View {
    let icon: String
    let name: String
    let extensions: [String]
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.accent)
                .frame(width: 20)
            
            Text(name)
                .font(.subheadline)
                .foregroundColor(themeVM.theme.colors.text)
            
            Spacer()
            
            Text(extensions.joined(separator: ", "))
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
        }
    }
}

struct DocumentPickerView: UIViewControllerRepresentable {
    let onFileSelected: (URL) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [
            .plainText,
            .rtf,
            .rtfd,
            .pdf
        ])
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onFileSelected: onFileSelected)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onFileSelected: (URL) -> Void
        
        init(onFileSelected: @escaping (URL) -> Void) {
            self.onFileSelected = onFileSelected
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            onFileSelected(url)
        }
    }
}

struct DocumentImportPreviewView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    let content: String
    let onConfirm: (String) -> Void
    
    var body: some View {
        NavigationView {
            ZStack {
                themeVM.theme.colors.background
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    HStack {
                        Button(action: { dismiss() }) {
                            Image(systemName: "xmark")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Cancel import")
                        
                        Spacer()
                        
                        Text("Import Preview")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Spacer()
                        
                        Button(action: {
                            onConfirm(content)
                            dismiss()
                        }) {
                            Text("Import")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(themeVM.theme.colors.accent)
                                .cornerRadius(8)
                        }
                        .help("Import this content")
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(themeVM.theme.colors.cardBackground)
                    
                    Divider()
                        .background(themeVM.theme.colors.border)
                    
                    // Preview content
                    ScrollView {
                        Text(content)
                            .font(.system(.body, design: .monospaced))
                            .foregroundColor(themeVM.theme.colors.text)
                            .padding(24)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
    }
}

#Preview {
    DocumentImportExportView(
        documentManager: DocumentManager(context: PersistenceController.shared.container.viewContext),
        content: "Sample content",
        name: "Sample Document"
    )
    .environmentObject(ThemeViewModel())
} 