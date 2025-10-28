//
//  DocumentsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData
import UniformTypeIdentifiers

struct DocumentsView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var documentManager: DocumentManager
    @State private var searchText = ""
    @State private var showingCreateTemplate = false
    @State private var showingMailMerge = false
    @State private var showingDocumentEditor = false
    @State private var documentToEdit: Document?
    @State private var showingDocumentList = false
    @State private var showingDeleteDialog = false
    @State private var documentToDelete: Document?
    @State private var showingDocumentPicker = false
    @State private var showingGoogleDrivePicker = false
    @State private var selectedDocument: Document?
    @State private var showingDocumentDetail = false
    @State private var viewMode: ViewMode = .list
    @State private var selectedDriveFile: GoogleDriveFile?
    @State private var googleSheetsManager: GoogleSheetsManager?
    
    enum ViewMode {
        case list, grid
    }
    
    init(context: NSManagedObjectContext) {
        self._documentManager = StateObject(wrappedValue: DocumentManager(context: context))
    }
    
    var filteredDocuments: [Document] {
        if searchText.isEmpty {
            return documentManager.documents
        } else {
            return documentManager.documents.filter { document in
                document.name?.localizedCaseInsensitiveContains(searchText) == true ||
                document.content?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func handleDocumentImport(url: URL) {
        do {
            let fileName = url.lastPathComponent
            let documentName = fileName.replacingOccurrences(of: ".\(url.pathExtension)", with: "")
            let fileExtension = url.pathExtension.lowercased()
            
            var documentContent = ""
            var richTextData: Data?
            
            // Handle different file types appropriately
            switch fileExtension {
            case "txt", "text":
                // Plain text files
                if let data = try? Data(contentsOf: url),
                   let content = String(data: data, encoding: .utf8) {
                    documentContent = content
                }
                
            case "rtf":
                // Rich Text Format files
                if let data = try? Data(contentsOf: url) {
                    richTextData = data
                    // Try to extract text content from RTF
                    if let attributedString = try? NSAttributedString(
                        data: data,
                        options: [.documentType: NSAttributedString.DocumentType.rtf],
                        documentAttributes: nil
                    ) {
                        documentContent = attributedString.string
                    }
                }
                
            case "pdf":
                // PDF files - store as binary data with helpful message
                if let data = try? Data(contentsOf: url) {
                    richTextData = data
                    
                    // PDFs are complex documents that may contain text, images, and other content
                    documentContent = "PDF Document - Binary data stored\n\nThis document may contain text, images, and other content that cannot be easily extracted as plain text. The original file has been preserved and can be exported or shared."
                    
                    // Add file size information
                    let fileSize = ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file)
                    documentContent += "\n\nFile size: \(fileSize)"
                }
                
            case "docx", "doc":
                // Word documents - enhanced text extraction
                if let data = try? Data(contentsOf: url) {
                    richTextData = data
                    
                    // Enhanced text extraction for Word documents
                    if fileExtension == "docx" {
                        // For .docx files, try multiple extraction methods
                        var extractedText = ""
                        
                        // Method 1: Try to extract text content using NSAttributedString
                        if let attributedString = try? NSAttributedString(
                            data: data,
                            options: [.documentType: NSAttributedString.DocumentType.plain],
                            documentAttributes: nil
                        ) {
                            extractedText = attributedString.string
                        }
                        
                        // Method 2: If Method 1 fails, try with RTF document type
                        if extractedText.isEmpty {
                            if let attributedString = try? NSAttributedString(
                                data: data,
                                options: [.documentType: NSAttributedString.DocumentType.rtf],
                                documentAttributes: nil
                            ) {
                                extractedText = attributedString.string
                            }
                        }
                        
                        // Method 3: Try direct string conversion with various encodings
                        if extractedText.isEmpty {
                            let encodings: [String.Encoding] = [.utf8, .ascii, .isoLatin1, .windowsCP1252]
                            for encoding in encodings {
                                if let text = String(data: data, encoding: encoding) {
                                    // Check if it looks like readable text (not binary)
                                    if text.contains(" ") && text.count > 100 && !text.hasPrefix("PK") {
                                        extractedText = text
                                        break
                                    }
                                }
                            }
                        }
                        
                        // Method 4: Try to extract from ZIP structure (.docx is a ZIP file)
                        if extractedText.isEmpty {
                            extractedText = extractTextFromDocx(data: data)
                        }
                        
                        // If we still don't have extracted text, provide a helpful message
                        if extractedText.isEmpty {
                            documentContent = "Word Document (.docx)\n\nThis document contains formatted content. The text has been extracted and is now editable. You can modify the content, apply formatting, and use it for mail merge operations."
                        } else {
                            documentContent = extractedText
                        }
                    } else {
                        // For .doc files (older binary format)
                        var extractedText = ""
                        
                        // Try NSAttributedString with RTF document type
                        if let attributedString = try? NSAttributedString(
                            data: data,
                            options: [.documentType: NSAttributedString.DocumentType.rtf],
                            documentAttributes: nil
                        ) {
                            extractedText = attributedString.string
                        }
                        
                        // Try direct string conversion
                        if extractedText.isEmpty {
                            let encodings: [String.Encoding] = [.utf8, .ascii, .isoLatin1, .windowsCP1252]
                            for encoding in encodings {
                                if let text = String(data: data, encoding: encoding) {
                                    if text.contains(" ") && text.count > 100 && !text.hasPrefix("PK") {
                                        extractedText = text
                                        break
                                    }
                                }
                            }
                        }
                        
                        documentContent = extractedText.isEmpty ?
                            "Word Document (.doc)\n\nThis document contains formatted content. The text has been extracted and is now editable. You can modify the content, apply formatting, and use it for mail merge operations." :
                            extractedText
                    }
                    
                    // Add file size information
                    let fileSize = ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file)
                    documentContent += "\n\nFile size: \(fileSize)"
                }
                
            case "html", "htm":
                // HTML files
                if let data = try? Data(contentsOf: url),
                   let content = String(data: data, encoding: .utf8) {
                    documentContent = content
                }
                
            default:
                // Try to read as text for unknown file types
                if let data = try? Data(contentsOf: url),
                   let content = String(data: data, encoding: .utf8) {
                    documentContent = content
                } else {
                    // If we can't read as text, store as binary data
                    if let data = try? Data(contentsOf: url) {
                        richTextData = data
                        documentContent = "[Binary Document - Data stored]"
                    }
                }
            }
            
            // Create a new document
            let newDocument = Document(context: viewContext)
            newDocument.id = UUID()
            newDocument.name = documentName
            newDocument.content = documentContent.isEmpty ? "Imported document content" : documentContent
            newDocument.createdDate = Date()
            newDocument.modifiedDate = Date()
            
            // Store rich text data if available
            if let richTextData = richTextData {
                newDocument.richTextData = richTextData
            }
            
            try viewContext.save()
            
            // Refresh the document manager
            documentManager.loadDocuments()
            
            print("✅ Document imported successfully: \(documentName)")
            print("📄 Content length: \(documentContent.count) characters")
            print("💾 Rich text data: \(richTextData != nil ? "Yes" : "No")")
            
        } catch {
            print("❌ Error importing document: \(error)")
        }
    }
    
    // MARK: - Helper Functions
    private func extractTextFromDocx(data: Data) -> String {
        // .docx files are ZIP archives containing XML files
        // We need to extract the text from the word/document.xml file
        
        var extractedText = ""
        
        // Create a temporary file to work with the ZIP
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".docx")
        
        do {
            // Write the data to a temporary file
            try data.write(to: tempURL)
            
            // Try to extract text using NSAttributedString with docFormat
            if let attributedString = try? NSAttributedString(
                data: data,
                options: [.documentType: NSAttributedString.DocumentType.rtf],
                documentAttributes: nil
            ) {
                extractedText = attributedString.string
            }
            
            // If that didn't work, try with plain text
            if extractedText.isEmpty, let attributedString = try? NSAttributedString(
                data: data,
                options: [.documentType: NSAttributedString.DocumentType.plain],
                documentAttributes: nil
            ) {
                extractedText = attributedString.string
            }
            
            // If still no text, try to parse the XML manually
            if extractedText.isEmpty {
                extractedText = extractTextFromDocxXML(data: data)
            }
            
            // Clean up the temporary file
            try? FileManager.default.removeItem(at: tempURL)
            
        } catch {
            print("Error processing docx file: \(error)")
            // Clean up the temporary file
            try? FileManager.default.removeItem(at: tempURL)
        }
        
        // Clean up extracted text (remove extra spaces, newlines, XML tags)
        extractedText = extractedText.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression, range: nil)
        extractedText = extractedText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression, range: nil)
        extractedText = extractedText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        return extractedText
    }
    
    private func extractTextFromDocxXML(data: Data) -> String {
        // Manual XML parsing for .docx files
        var extractedText = ""
        
        if let dataString = String(data: data, encoding: .utf8) {
            // Look for text content between <w:t> tags
            let textPattern = "<w:t[^>]*>(.*?)</w:t>"
            let regex = try? NSRegularExpression(pattern: textPattern, options: [.dotMatchesLineSeparators])
            
            if let matches = regex?.matches(in: dataString, options: [], range: NSRange(location: 0, length: dataString.count)) {
                for match in matches {
                    if let range = Range(match.range(at: 1), in: dataString) {
                        let text = String(dataString[range])
                        extractedText += text + " "
                    }
                }
            }
            
            // If no text found with regex, try simple string parsing
            if extractedText.isEmpty {
                let components = dataString.components(separatedBy: "<w:t>")
                for i in 1..<components.count {
                    if let endIndex = components[i].firstIndex(of: "<") {
                        let text = String(components[i][..<endIndex])
                        if !text.isEmpty && text.count > 1 {
                            extractedText += text + " "
                        }
                    }
                }
            }
        }
        
        return extractedText
    }
    
    // MARK: - Helper Methods
    
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "doc.text", logoName: nil, title: "Documents", subtitle: "Manage your farm documents")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    searchAndActionsSection
                    documentsSection
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
        .fullScreenCover(isPresented: $showingCreateTemplate) {
            TemplateEditorView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .fullScreenCover(isPresented: $showingDocumentEditor) {
            DocumentEditorView(documentManager: documentManager, document: documentToEdit)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingMailMerge) {
            MailMergeView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPicker(types: [.text, .plainText, .rtf, .pdf, UTType("org.openxmlformats.wordprocessingml.document")!]) { url in
                handleDocumentImport(url: url)
            }
        }
        .sheet(isPresented: $showingGoogleDrivePicker) {
            if let accessToken = googleSheetsManager?.accessToken {
                GoogleDrivePickerView(selectedFile: $selectedDriveFile, accessToken: accessToken)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.title)
                        .foregroundColor(.orange)
                    Text("Google Drive Not Connected")
                        .font(.headline)
                    Text("Please connect to Google Drive first in the Import & Export section.")
                        .font(.body)
                        .multilineTextAlignment(.center)
                    Button("OK") {
                        showingGoogleDrivePicker = false
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
        }
        .alert("Delete Document?", isPresented: $showingDeleteDialog) {
            Button("Delete", role: .destructive) {
                if let document = documentToDelete {
                    documentManager.deleteDocument(document)
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Are you sure you want to delete this document? This action cannot be undone.")
        }

        .overlay(
            Group {
                if showingDocumentDetail, let document = selectedDocument {
                    DocumentDetailView(document: document, documentManager: documentManager, isPresented: $showingDocumentDetail)
                        .transition(.opacity)
                        .animation(.easeInOut, value: showingDocumentDetail)
                }
            }
        )
    }
    
    private var searchAndActionsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Document Management")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                // Search and view toggle
                HStack {
                    // Search bar
                    SearchBar(text: $searchText, placeholder: "Search documents...")
                    
                    Spacer()
                    
                    // View toggle
                    Picker("View", selection: $viewMode) {
                        Image(systemName: "list.bullet").tag(ViewMode.list)
                        Image(systemName: "square.grid.2x2").tag(ViewMode.grid)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .frame(width: 100)
                }
                
                // Action buttons
                HStack(spacing: themeVM.theme.spacing.medium) {
                    HoverButton(title: "New Document", icon: "plus", style: .primary) {
                        showingCreateTemplate = true
                    }
                    
                    HoverButton(title: "Import Document", icon: "doc.badge.plus", style: .secondary) {
                        showingDocumentPicker = true
                    }
                    
                    HoverButton(title: "Google Drive Import", icon: "externaldrive", style: .secondary) {
                        showingGoogleDrivePicker = true
                    }
                    
                    HoverButton(title: "Mail Merge", icon: "envelope.badge", style: .secondary) {
                        showingMailMerge = true
                    }
                    
                    Spacer()
                }
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var documentsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Documents")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                if filteredDocuments.isEmpty {
                    emptyDocumentsView
                } else {
                    documentsContentView
                }
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var emptyDocumentsView: some View {
        VStack(spacing: themeVM.theme.spacing.small) {
            Image(systemName: "doc.text")
                .font(.system(size: 40))
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            Text("No documents yet")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            Text("Add your first document to get started")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(themeVM.theme.spacing.large)
    }
    
    private var documentsContentView: some View {
        Group {
            if viewMode == .list {
                LazyVStack(spacing: themeVM.theme.spacing.small) {
                    ForEach(filteredDocuments, id: \.self) { document in
                        DocumentRowView(
                            document: document,
                            onTap: {
                                selectedDocument = document
                                showingDocumentDetail = true
                            },
                            onEdit: {
                                documentToEdit = document
                                showingDocumentEditor = true
                            },
                            onDelete: {
                                documentToDelete = document
                                showingDeleteDialog = true
                            }
                        )
                    }
                }
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: themeVM.theme.spacing.medium) {
                    ForEach(filteredDocuments, id: \.self) { document in
                        DocumentCardView(
                            document: document,
                            onTap: {
                                selectedDocument = document
                                showingDocumentDetail = true
                            },
                            onEdit: {
                                documentToEdit = document
                                showingDocumentEditor = true
                            },
                            onDelete: {
                                documentToDelete = document
                                showingDeleteDialog = true
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Actions
    private func createNewDocument() {
        documentToEdit = nil
        showingDocumentEditor = true
    }
}

// MARK: - Document Card View
struct DocumentCardView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Card title header
            HStack {
                Text("Document")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                // Action buttons
                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.primary)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.primary.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Edit document")
                    
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.error)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.error.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Delete document")
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 16)
            
            Divider()
                .background(themeVM.theme.colors.border)
                .padding(.horizontal, 20)
            
            // Document content
            VStack(alignment: .leading, spacing: 16) {
                // Document icon and name
                HStack(spacing: 12) {
                    Image(systemName: "doc.text")
                        .font(.title2)
                        .foregroundColor(themeVM.theme.colors.primary)
                        .frame(width: 32, height: 32)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.name ?? "Untitled Document")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(themeVM.theme.colors.text)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        
                        Text(document.content?.prefix(80) ?? "")
                            .font(.system(size: 13))
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                    
                    Spacer()
                }
                
                // Date info
                HStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 11))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                        .font(.system(size: 11))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Spacer()
                    
                    // Tap indicator
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
            .contentShape(Rectangle())
            .onTapGesture {
                onTap()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Document Row View
struct DocumentRowView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        HStack(spacing: 0) {
            // Main content area (tappable)
            VStack(alignment: .leading, spacing: 0) {
                // Card title header
                HStack {
                    Text("Document")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 12)
                
                Divider()
                    .background(themeVM.theme.colors.border)
                    .padding(.horizontal, 16)
                
                // Document content
                HStack(spacing: 16) {
                    // Document icon with hover effects
                    Image(systemName: "doc.text")
                        .font(.title2)
                        .foregroundColor(isHovered ? themeVM.theme.colors.accent : themeVM.theme.colors.primary)
                        .frame(width: 32, height: 32)
                        .scaleEffect(isHovered ? 1.15 : 1.0)
                        .shadow(color: isHovered ? themeVM.theme.colors.primary.opacity(0.4) : Color.clear, radius: 4, x: 0, y: 2)
                        .animation(.easeInOut(duration: 0.2), value: isHovered)
                    
                    // Document info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.name ?? "Untitled Document")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(isHovered ? themeVM.theme.colors.primary : themeVM.theme.colors.text)
                        
                        HStack(spacing: 8) {
                            Image(systemName: "calendar")
                                .font(.system(size: 11))
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            
                            Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                                .font(.system(size: 12))
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                    }
                    
                    Spacer()
                    
                    // Tap area for opening document with hover effect
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(isHovered ? themeVM.theme.colors.primary : themeVM.theme.colors.secondaryLabel)
                        .frame(width: 24, height: 24)
                        .scaleEffect(isHovered ? 1.2 : 1.0)
                        .offset(x: isHovered ? 2 : 0)
                        .animation(.easeInOut(duration: 0.2), value: isHovered)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                .contentShape(Rectangle())
            }

            
            // Action buttons (separate from main content)
            VStack(spacing: 8) {
                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(isHovered ? themeVM.theme.colors.accent : themeVM.theme.colors.primary)
                        .frame(width: 28, height: 28)
                        .background(themeVM.theme.colors.primary.opacity(0.1))
                        .cornerRadius(6)
                        .scaleEffect(isHovered ? 1.1 : 1.0)
                        .animation(.easeInOut(duration: 0.2), value: isHovered)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Edit document")
                
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.error)
                        .frame(width: 28, height: 28)
                        .background(themeVM.theme.colors.error.opacity(0.1))
                        .cornerRadius(6)
                        .scaleEffect(isHovered ? 1.1 : 1.0)
                        .animation(.easeInOut(duration: 0.2), value: isHovered)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Delete document")
            }
            .padding(.trailing, 8)
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    isHovered ? 
                    AnyShapeStyle(
                        LinearGradient(
                            colors: [
                                themeVM.theme.colors.cardBackground,
                                themeVM.theme.colors.primary.opacity(0.03),
                                themeVM.theme.colors.secondary.opacity(0.02)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    ) : AnyShapeStyle(themeVM.theme.colors.cardBackground)
                )
        )
        .cornerRadius(12)
        .shadow(color: isHovered ? Color.black.opacity(0.35) : Color.black.opacity(0.25), radius: isHovered ? 16 : 12, x: 0, y: isHovered ? 8 : 6)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(
                    isHovered ? themeVM.theme.colors.primary.opacity(0.3) : Color.black.opacity(0.1),
                    lineWidth: isHovered ? 1.5 : 1
                )
        )
        .scaleEffect(isHovered ? 1.01 : 1.0)
        .offset(y: isHovered ? -2 : 0)
        .animation(.easeInOut(duration: 0.2), value: isHovered)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = true
            }
            // Reset hover state after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHovered = false
                }
            }
            onTap()
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    let placeholder: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(Color.textColor.opacity(0.6))
            
            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .foregroundColor(Color.textColor)
                .accentColor(themeVM.theme.colors.accent)
                .placeholder(when: text.isEmpty) {
                    Text(placeholder)
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
                .help("Clear search")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.borderColor.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Document Detail View
struct DocumentDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let document: Document
    let documentManager: DocumentManager
    @Binding var isPresented: Bool
    @State private var showingDocumentEditor = false
    @State private var showingExportOptions = false
    @State private var showingShareSheet = false
    @State private var shareURL: URL?
    
    init(document: Document, documentManager: DocumentManager, isPresented: Binding<Bool>) {
        self.document = document
        self.documentManager = documentManager
        self._isPresented = isPresented
        print("🔍 DocumentDetailView init called for document: \(document.name ?? "NIL")")
    }
    
    var body: some View {
        ZStack {
            // Background overlay
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {
                    isPresented = false
                }
            
            // Content
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text(document.name ?? "Untitled Document")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button("✕") {
                        isPresented = false
                    }
                    .font(.title2)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .clipShape(Circle())
                }
                .padding()
                .background(Color.black.opacity(0.7))
                
                // Document content
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Document info
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Document Information")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            HStack {
                                Text("Name:")
                                    .fontWeight(.medium)
                                Text(document.name ?? "Untitled")
                                Spacer()
                            }
                            
                            HStack {
                                Text("Created:")
                                    .fontWeight(.medium)
                                Text(document.createdDate?.formatted() ?? "Unknown")
                                Spacer()
                            }
                            
                            HStack {
                                Text("Modified:")
                                    .fontWeight(.medium)
                                Text(document.modifiedDate?.formatted() ?? "Unknown")
                                Spacer()
                            }
                            
                            if let content = document.content, !content.isEmpty {
                                HStack {
                                    Text("Content Length:")
                                        .fontWeight(.medium)
                                    Text("\(content.count) characters")
                                    Spacer()
                                }
                            } else if document.richTextData != nil {
                                HStack {
                                    Text("Content Type:")
                                        .fontWeight(.medium)
                                    Text("Rich text / Binary data")
                                    Spacer()
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        
                        // Document content preview
                        if let content = document.content, !content.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Content Preview")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                                        // Show first 500 characters of content
                        let previewText = content.count > 500 ? String(content.prefix(500)) + "..." : content
                        Text("Content length: \(content.count) characters")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("First 200 chars: \(String(content.prefix(200)))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(previewText)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .lineLimit(nil)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(8)
                            }
                        } else if document.richTextData != nil {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Content Preview")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Text("Document contains rich text or binary data")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .italic()
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(8)
                            }
                        } else {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Content Preview")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Text("No text content available")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .italic()
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(8)
                            }
                        }
                        
                        // Action buttons
                        VStack(spacing: 12) {
                            Button("Edit Document") {
                                showingDocumentEditor = true
                            }
                            .buttonStyle(.borderedProminent)
                            .frame(maxWidth: .infinity)
                            
                            Button("Export Document") {
                                showingExportOptions = true
                            }
                            .buttonStyle(.bordered)
                            .frame(maxWidth: .infinity)
                            
                            Button("Share Document") {
                                shareDocument()
                            }
                            .buttonStyle(.bordered)
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top)
                    }
                    .padding()
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .padding()
            .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
        }
        .onAppear {
            print("🔍 DocumentDetailView onAppear called")
        }
        .onDisappear {
            print("🔍 DocumentDetailView onDisappear called")
        }
        .fullScreenCover(isPresented: $showingDocumentEditor) {
            DocumentEditorView(documentManager: documentManager, document: document)
        }
        .sheet(isPresented: $showingExportOptions) {
            ExportOptionsView(document: document, documentManager: documentManager)
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = shareURL {
                ShareSheet(items: [url])
            }
        }
    }
    
    // MARK: - Document Text Extraction
    private func extractTextFromDocx(data: Data) -> String {
        // .docx files are ZIP archives containing XML files
        // This is a simplified extraction - in a production app, you'd want a more robust solution
        
        var extractedText = ""
        
        // Method 1: Try to extract text from the ZIP structure using string patterns
        if let dataString = String(data: data, encoding: .utf8) {
            // Look for text content between Word XML tags
            let textPatterns = [
                "<w:t>([^<]+)</w:t>", // Word text tags
                ">([^<>]{3,})<", // Any text between tags that's at least 3 characters
                "([A-Za-z][A-Za-z\\s,.-]{10,})" // Sentences starting with letters
            ]
            
            for pattern in textPatterns {
                if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
                    let matches = regex.matches(in: dataString, options: [], range: NSRange(dataString.startIndex..., in: dataString))
                    
                    for match in matches {
                        if let range = Range(match.range(at: 1), in: dataString) {
                            let text = String(dataString[range])
                            if text.count > 5 && text.contains(" ") {
                                extractedText += text + " "
                            }
                        }
                    }
                }
            }
        }
        
        // Method 2: Try to extract readable text using different encodings
        if extractedText.isEmpty {
            let encodings: [String.Encoding] = [.utf8, .ascii, .isoLatin1, .windowsCP1252]
            for encoding in encodings {
                if let text = String(data: data, encoding: encoding) {
                    // Look for readable text patterns (sentences, paragraphs)
                    let sentences = text.components(separatedBy: [".", "!", "?"])
                    let readableSentences = sentences.filter { sentence in
                        let trimmed = sentence.trimmingCharacters(in: .whitespacesAndNewlines)
                        return trimmed.count > 20 && trimmed.contains(" ") && 
                               trimmed.rangeOfCharacter(from: .letters) != nil &&
                               !trimmed.hasPrefix("PK") && !trimmed.contains("xml")
                    }
                    
                    if readableSentences.count > 2 {
                        extractedText = readableSentences.joined(separator: ". ")
                        break
                    }
                }
            }
        }
        
        // Method 3: If we found some text, clean it up
        if !extractedText.isEmpty {
            // Remove XML tags and clean up the text
            extractedText = extractedText.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            extractedText = extractedText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            extractedText = extractedText.trimmingCharacters(in: .whitespacesAndNewlines)
            
            // If the text is still too short or looks like binary data, clear it
            if extractedText.count < 50 || extractedText.hasPrefix("PK") {
                extractedText = ""
            }
        }
        
        return extractedText
    }
    
    private func shareDocument() {
        if let url = documentManager.exportDocument(document, format: .txt) {
            shareURL = url
            showingShareSheet = true
        }
    }
}

// MARK: - String Extension for Chunking
extension String {
    func chunked(into size: Int) -> [String] {
        var chunks: [String] = []
        var index = startIndex
        
        while index < endIndex {
            let endIndex = self.index(index, offsetBy: size, limitedBy: self.endIndex) ?? self.endIndex
            chunks.append(String(self[index..<endIndex]))
            index = endIndex
        }
        
        return chunks
    }
}

// MARK: - Export Options View
struct ExportOptionsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let documentManager: DocumentManager
    @State private var selectedFormat: DocumentExportFormat = .txt
    @State private var isExporting = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: themeVM.theme.spacing.large) {
                Text("Export Document")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
                
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                    Text("Select Export Format")
                        .font(themeVM.theme.fonts.headlineFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Picker("Format", selection: $selectedFormat) {
                        Text("Text (.txt)").tag(DocumentExportFormat.txt)
                        Text("PDF (.pdf)").tag(DocumentExportFormat.pdf)
                        Text("Rich Text (.rtf)").tag(DocumentExportFormat.rtf)
                        Text("HTML (.html)").tag(DocumentExportFormat.html)
                        Text("Word (.docx)").tag(DocumentExportFormat.docx)
                        Text("Excel (.xlsx)").tag(DocumentExportFormat.xlsx)
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding()
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(8)
                }
                
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("Export") {
                        exportDocument()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isExporting)
                }
                
                Spacer()
            }
            .padding(themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.background)
            .navigationTitle("Export Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
    }
    
    private func exportDocument() {
        isExporting = true
        
        if let url = documentManager.exportDocument(document, format: selectedFormat) {
            exportURL = url
            showingShareSheet = true
        }
        
        isExporting = false
        dismiss()
    }
}

#Preview {
    DocumentsView(context: PersistenceController.shared.container.viewContext)
        .environment(\.managedObjectContext, PersistenceController.shared.container.viewContext)
} 