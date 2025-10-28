//
//  DocumentEditorView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import CoreData

struct DocumentEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var documentManager: DocumentManager
    
    @State private var document: Document?
    
    @State private var documentName: String = ""
    @State private var documentContent: String = ""
    @State private var documentAttributedText: NSAttributedString = NSAttributedString(string: "")
    @State private var selectedRange: NSRange = NSRange(location: 0, length: 0)
    @State private var selectedTemplate: DocumentTemplate?
    @State private var showingTemplatePicker = false
    @State private var showingImportExport = false
    @State private var showingExportSheet = false
    @State private var showingSaveDialog = false
    @State private var unsavedChanges = false
    @State private var showingSaveSuccess = false
    @State private var selectedColor: PlatformColor = .label
    @State private var selectedFontName: String = "System"
    @State private var showingColorPicker = false
    @State private var showingFontPicker = false
    
    init(documentManager: DocumentManager, document: Document? = nil) {
        self.documentManager = documentManager
        self._document = State(initialValue: document)
    }
    
    var body: some View {
        ZStack {
            themeVM.theme.colors.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Main toolbar
                HStack(spacing: 16) {
                    Button(action: {
                        if unsavedChanges {
                            showingSaveDialog = true
                        } else {
                            dismiss()
                        }
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "chevron.left")
                            Text("Back")
                        }
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.accent)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.cardBackgroundColor)
                        .cornerRadius(8)
                        .shadow(color: Color.black.opacity(0.15), radius: 2, x: 0, y: 1)
                    }
                    .help("Back to documents")
                    
                    Spacer()
                    
                    Text(documentName.isEmpty ? "Untitled Document" : documentName)
                        .font(.headline)
                        .foregroundColor(Color.textColor)
                    
                    Spacer()
                    
                    HStack(spacing: 16) {
                        Button(action: { showingTemplatePicker = true }) {
                            Image(systemName: "doc.text.below.ecg")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Apply template to document")
                        
                        Button(action: { showingImportExport = true }) {
                            Image(systemName: "icloud.and.arrow.up")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Import from or export to cloud storage")
                        
                        Button(action: { showingExportSheet = true }) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Export document to file")
                        
                        Button(action: printDocument) {
                            Image(systemName: "printer")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Print document")
                        
                        Button(action: saveDocument) {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark")
                                Text("Save")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(unsavedChanges ? themeVM.theme.colors.accent : themeVM.theme.colors.disabled)
                            .cornerRadius(8)
                            .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
                        }
                        .disabled(!unsavedChanges)
                        .help("Save document (⌘S)")
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundColor)
                
                Divider()
                    .background(Color.borderColor)
                
                // Document info section
                VStack(spacing: 16) {
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Document Name")
                                .font(.caption)
                                .foregroundColor(Color.textColor.opacity(0.6))
                            
                            TextField("Enter document name", text: $documentName)
                                .textFieldStyle(PlainTextFieldStyle())
                                .font(.title3)
                                .fontWeight(.semibold)
                                .onChange(of: documentName) { _, _ in
                                    unsavedChanges = true
                                }
                        }
                        
                        if let template = selectedTemplate {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Template")
                                    .font(.caption)
                                    .foregroundColor(Color.textColor.opacity(0.6))
                                
                                HStack {
                                    Image(systemName: DocumentType(rawValue: template.type ?? "")?.icon ?? "doc.text")
                                        .foregroundColor(themeVM.theme.colors.accent)
                                    Text(template.name ?? "Unknown Template")
                                        .font(.caption)
                                        .foregroundColor(Color.textColor)
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // Document status indicator
                        HStack(spacing: 8) {
                            Circle()
                                .fill(unsavedChanges ? themeVM.theme.colors.warning : themeVM.theme.colors.success)
                                .frame(width: 8, height: 8)
                            
                            Text(unsavedChanges ? "Unsaved changes" : "Saved")
                                .font(.caption)
                                .foregroundColor(Color.textColor.opacity(0.6))
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundColor)
                
                Divider()
                    .background(Color.borderColor)
                
                // Rich text toolbar
                TextFormattingToolbar(attributedText: $documentAttributedText, selectedRange: $selectedRange)
                    .padding(.vertical, 8)
                    .background(Color.cardBackgroundColor)
                
                Divider()
                    .background(Color.borderColor)
                
                // Rich text editor
                RichTextEditorView(
                    attributedText: $documentAttributedText, 
                    selectedRange: $selectedRange,
                    onTextChange: onTextChange
                )
            }
        }
        .onAppear {
            loadDocument()
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
            // Auto-save when app goes to background
            if unsavedChanges {
                saveDocument()
            }
        }
        .onSubmit {
            // Save on Cmd+S or Ctrl+S
            if unsavedChanges {
                saveDocument()
            }
        }
        .sheet(isPresented: $showingTemplatePicker) {
            TemplatePickerView(selectedTemplate: $selectedTemplate, templates: documentManager.templates)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingImportExport) {
            UnifiedImportExportView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingColorPicker) {
            ColorPickerView(selectedColor: $selectedColor)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingFontPicker) {
            FontPickerView(selectedFontName: $selectedFontName)
                .environmentObject(themeVM)
        }
        .alert("Save Changes?", isPresented: $showingSaveDialog) {
            Button("Save") {
                saveDocument()
            }
            Button("Don't Save") {
                dismiss()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Do you want to save your changes before closing?")
        }
        .alert("Document Saved", isPresented: $showingSaveSuccess) {
            Button("OK") { }
        } message: {
            Text("Your document has been saved successfully.")
        }
    }
    

    
    // MARK: - Actions
    private func loadDocument() {
        if let document = document {
            documentName = document.name ?? "Untitled Document"
            documentContent = document.content ?? ""
            
            // First, try to use the extracted text content from the content field
            if let content = document.content, !content.isEmpty && content != "Imported document content" {
                // Check if the content looks like readable text (not binary data)
                // For Word documents with extracted content, we should show it as editable
                if content.count > 100 && content.contains(" ") {
                    // This looks like readable text content - show it directly
                    documentAttributedText = NSAttributedString(string: content)
                    documentContent = content
                } else if content.contains("Word Document") || content.contains("PDF Document") {
                    // This is a document with extracted content that needs to be made editable
                    handleExtractedDocument(document: document, content: content)
                } else {
                    // This might be binary data or very short content
                    handleBinaryDocument(document: document, content: content)
                }
            } else {
                // No text content available, try rich text data
                if let rtfData = document.richTextData {
                    handleRichTextData(document: document, rtfData: rtfData)
                } else {
                    // No content available at all
                    documentAttributedText = NSAttributedString(string: "Empty Document\n\nThis document has no content.")
                    documentContent = "Empty Document\n\nThis document has no content."
                }
            }
        }
    }
    
    private func handleExtractedDocument(document: Document, content: String) {
        // Handle documents that have been extracted but need to be made editable
        let fileName = document.name ?? ""
        let fileExtension = fileName.components(separatedBy: ".").last?.lowercased() ?? ""
        
        switch fileExtension {
        case "docx", "doc":
            // For Word documents, create an editable template
            let editableContent = createEditableWordTemplate(content: content, fileName: fileName)
            documentAttributedText = NSAttributedString(string: editableContent)
            documentContent = editableContent
            
        case "pdf":
            // For PDFs, create an editable template
            let editableContent = createEditablePDFTemplate(content: content, fileName: fileName)
            documentAttributedText = NSAttributedString(string: editableContent)
            documentContent = editableContent
            
        default:
            // For other formats, create a generic editable template
            let editableContent = createEditableTemplate(content: content, fileName: fileName)
            documentAttributedText = NSAttributedString(string: editableContent)
            documentContent = editableContent
        }
    }
    
    private func createEditableWordTemplate(content: String, fileName: String) -> String {
        var template = "📄 \(fileName)\n\n"
        template += "This Word document has been imported and is now editable.\n\n"
        template += "You can:\n"
        template += "• Edit the content below\n"
        template += "• Apply formatting (bold, italic, etc.)\n"
        template += "• Use mail merge with your contact data\n"
        template += "• Print the document\n\n"
        template += "--- START OF DOCUMENT CONTENT ---\n\n"
        
        // Extract any actual content from the original message
        if content.contains("Word Document Content Detected") {
            template += "Dear [Contact Name],\n\n"
            template += "Thank you for your interest in our services. This is a template letter that you can customize for your specific needs.\n\n"
            template += "You can replace the placeholder text above with actual content from your imported document, or start fresh with your own content.\n\n"
            template += "Best regards,\n[Your Name]\n[Your Company]"
        } else {
            template += "Document content will appear here. You can start typing or paste content from your original document.\n\n"
            template += "Use the formatting toolbar above to style your text, and the mail merge features to personalize your documents."
        }
        
        template += "\n\n--- END OF DOCUMENT CONTENT ---"
        return template
    }
    
    private func createEditablePDFTemplate(content: String, fileName: String) -> String {
        var template = "📄 \(fileName)\n\n"
        template += "This PDF document has been imported and converted to an editable format.\n\n"
        template += "You can:\n"
        template += "• Edit the content below\n"
        template += "• Apply formatting\n"
        template += "• Use mail merge with your contact data\n"
        template += "• Print the document\n\n"
        template += "--- START OF DOCUMENT CONTENT ---\n\n"
        template += "Document content from the PDF will appear here. You can edit this content and use it for mail merge operations.\n\n"
        template += "Note: Complex formatting from the original PDF may not be preserved, but the text content is now editable."
        template += "\n\n--- END OF DOCUMENT CONTENT ---"
        return template
    }
    
    private func createEditableTemplate(content: String, fileName: String) -> String {
        var template = "📄 \(fileName)\n\n"
        template += "This document has been imported and is now editable.\n\n"
        template += "You can:\n"
        template += "• Edit the content below\n"
        template += "• Apply formatting\n"
        template += "• Use mail merge with your contact data\n"
        template += "• Print the document\n\n"
        template += "--- START OF DOCUMENT CONTENT ---\n\n"
        template += "Document content will appear here. You can start typing or paste content from your original document."
        template += "\n\n--- END OF DOCUMENT CONTENT ---"
        return template
    }
    
    private func handleBinaryDocument(document: Document, content: String) {
        let fileName = document.name ?? ""
        let fileExtension = fileName.components(separatedBy: ".").last?.lowercased() ?? ""
        
        switch fileExtension {
        case "pdf":
            documentAttributedText = NSAttributedString(string: "PDF Document\n\nThis is a PDF document. The binary data has been stored and can be exported, but editing requires conversion to a text format.")
            documentContent = "PDF Document\n\nThis is a PDF document. The binary data has been stored and can be exported, but editing requires conversion to a text format."
            
        case "docx", "doc":
            documentAttributedText = NSAttributedString(string: "Word Document\n\nThis is a Word document. The binary data has been stored and can be exported, but editing requires conversion to a text format.")
            documentContent = "Word Document\n\nThis is a Word document. The binary data has been stored and can be exported, but editing requires conversion to a text format."
            
        default:
            documentAttributedText = NSAttributedString(string: "Binary Document\n\nThis document contains binary data that cannot be directly edited as text. You can export it in its original format.")
            documentContent = "Binary Document\n\nThis document contains binary data that cannot be directly edited as text. You can export it in its original format."
        }
    }
    
    private func handleRichTextData(document: Document, rtfData: Data) {
        // Try to load as RTF first
        if let attributedString = try? NSAttributedString(
            data: rtfData,
            options: [.documentType: NSAttributedString.DocumentType.rtf],
            documentAttributes: nil
        ) {
            documentAttributedText = attributedString
            documentContent = attributedString.string
        } else {
            // If RTF loading fails, handle as binary document
            handleBinaryDocument(document: document, content: "")
        }
    }
    
    private func saveDocument() {
        if documentName.isEmpty {
            documentName = "Untitled Document"
        }
        
        if let existingDocument = document {
            // Update existing document
            existingDocument.name = documentName
            existingDocument.template = selectedTemplate
            documentManager.updateDocument(existingDocument, content: documentContent, attributedContent: documentAttributedText)
        } else {
            // Create new document
            let newDocument = documentManager.createDocument(
                name: documentName,
                content: documentContent,
                attributedContent: documentAttributedText,
                template: selectedTemplate
            )
            // Update the document reference to prevent double creation
            document = newDocument
        }
        
        unsavedChanges = false
        showingSaveSuccess = true
    }
    
    private func printDocument() {
        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .general
        printInfo.jobName = documentName.isEmpty ? "Document" : documentName
        
        let controller = UIPrintInteractionController.shared
        controller.printInfo = printInfo
        
        // Create attributed string for printing
        let printAttributedString = documentAttributedText.length > 0 ? documentAttributedText : NSAttributedString(string: documentContent)
        controller.printingItem = printAttributedString
        
        controller.present(animated: true) { _, _, _ in }
    }
    
    private func onTextChange(_ newContent: String) {
        documentContent = newContent
        unsavedChanges = true
    }
}





// MARK: - Font Picker View
struct FontPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedFontName: String
    
    private let fonts = ["System", "Times New Roman", "Arial", "Courier New", "Georgia", "Verdana"]
    
    var body: some View {
        NavigationView {
            List(fonts, id: \.self) { font in
                Button(action: {
                    selectedFontName = font
                    dismiss()
                }) {
                    HStack {
                        Text(font)
                            .font(.system(size: 16, design: font == "System" ? .default : .serif))
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Spacer()
                        
                        if selectedFontName == font {
                            Image(systemName: "checkmark")
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                    }
                }
                .buttonStyle(PlainButtonStyle())
            }
            .background(Color.appBackground)
            .navigationTitle("Select Font")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct TemplatePickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedTemplate: DocumentTemplate?
    let templates: [DocumentTemplate]
    
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
                        .help("Cancel template selection")
                        
                        Spacer()
                        
                        Text("Select Template")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Spacer()
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(themeVM.theme.colors.cardBackground)
                    
                    Divider()
                        .background(themeVM.theme.colors.border)
                    
                    // Template list
                    ScrollView {
                        VStack(spacing: 12) {
                            Button(action: {
                                selectedTemplate = nil
                                dismiss()
                            }) {
                                HStack {
                                    Image(systemName: "doc")
                                        .font(.title2)
                                        .foregroundColor(themeVM.theme.colors.accent)
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("No Template")
                                            .font(.headline)
                                            .foregroundColor(themeVM.theme.colors.text)
                                        
                                        Text("Start with a blank document")
                                            .font(.caption)
                                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    }
                                    
                                    Spacer()
                                }
                                .padding(16)
                                .background(themeVM.theme.colors.cardBackground)
                                .cornerRadius(12)
                            }
                            .buttonStyle(PlainButtonStyle())
                            .help("Start with a blank document")
                            
                            ForEach(templates, id: \.id) { template in
                                Button(action: {
                                    selectedTemplate = template
                                    dismiss()
                                }) {
                                    HStack {
                                        Image(systemName: template.type == DocumentType.letter.rawValue ? "envelope" : "doc.text")
                                            .font(.title2)
                                            .foregroundColor(themeVM.theme.colors.accent)
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(template.name ?? "Untitled Template")
                                                .font(.headline)
                                                .foregroundColor(themeVM.theme.colors.text)
                                            
                                            Text(template.type ?? "Custom")
                                                .font(.caption)
                                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                        }
                                        
                                        Spacer()
                                    }
                                    .padding(16)
                                    .background(themeVM.theme.colors.cardBackground)
                                    .cornerRadius(12)
                                }
                                .buttonStyle(PlainButtonStyle())
                                .help("Apply \(template.name ?? "template")")
                            }
                        }
                        .padding(24)
                    }
                }
            }
        }
    }
}



#Preview {
    DocumentEditorView(documentManager: DocumentManager(context: PersistenceController.shared.container.viewContext))
        .environmentObject(ThemeViewModel())
} 