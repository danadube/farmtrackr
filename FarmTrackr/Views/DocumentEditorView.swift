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
    
    let document: Document?
    
    @State private var documentName: String = ""
    @State private var documentContent: String = ""
    @State private var documentAttributedText: NSAttributedString = NSAttributedString(string: "")
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
        self.document = document
    }
    
    var body: some View {
        ZStack {
            Color.appBackground
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
                TextFormattingToolbar(attributedText: $documentAttributedText)
                    .padding(.vertical, 8)
                    .background(Color.cardBackgroundColor)
                
                Divider()
                    .background(Color.borderColor)
                
                // Rich text editor
                RichTextEditorView(attributedText: $documentAttributedText)
                    .onChange(of: documentAttributedText) { _, _ in
                        documentContent = documentAttributedText.string
                        unsavedChanges = true
                    }
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
            
            // Load rich text data if available
            if let rtfData = document.richTextData,
               let attributedString = try? NSAttributedString(
                   data: rtfData,
                   options: [.documentType: NSAttributedString.DocumentType.rtf],
                   documentAttributes: nil
               ) {
                documentAttributedText = attributedString
            } else {
                documentAttributedText = NSAttributedString(string: documentContent)
            }
            
            selectedTemplate = document.template
        } else {
            documentName = ""
            documentContent = ""
            documentAttributedText = NSAttributedString(string: "")
            selectedTemplate = nil
        }
        unsavedChanges = false
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
            _ = documentManager.createDocument(
                name: documentName,
                content: documentContent,
                attributedContent: documentAttributedText,
                template: selectedTemplate
            )
        }
        
        unsavedChanges = false
        showingSaveSuccess = true
    }
    
    private func onTextChange(_ newContent: String) {
        documentContent = newContent
        unsavedChanges = true
    }
}



// MARK: - Color Picker View
struct ColorPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedColor: PlatformColor
    
    private let colors: [PlatformColor] = [
        .label, .systemBlue, .systemGreen, .systemRed, .systemOrange,
        .systemPurple, .systemPink, .systemYellow, .systemGray
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Select Color")
                    .font(.headline)
                    .foregroundColor(themeVM.theme.colors.text)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 16) {
                    ForEach(colors, id: \.self) { color in
                        Button(action: {
                            selectedColor = color
                            dismiss()
                        }) {
                            Circle()
                                .fill(Color(color))
                                .frame(width: 50, height: 50)
                                .overlay(
                                    Circle()
                                        .stroke(selectedColor == color ? themeVM.theme.colors.accent : Color.clear, lineWidth: 3)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                Spacer()
            }
            .padding()
            .background(Color.appBackground)
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