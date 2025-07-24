//
//  TemplateEditorView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct TemplateEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var documentManager: DocumentManager
    @State private var templateName: String = ""
    @State private var templateContent: String = ""
    @State private var templateAttributedText: NSAttributedString = NSAttributedString(string: "")
    @State private var selectedType: DocumentType = .letter
    @State private var showingPlaceholderHelp = false
    @State private var showingPreview = false
    @State private var showingSaveDialog = false
    @State private var unsavedChanges = false
    @State private var selectedColor: PlatformColor = .label
    @State private var selectedFontName: String = "System"
    @State private var showingColorPicker = false
    @State private var showingFontPicker = false
    
    let template: DocumentTemplate?
    
    init(documentManager: DocumentManager, template: DocumentTemplate? = nil) {
        self.documentManager = documentManager
        self.template = template
        
        if let template = template {
            self._templateName = State(initialValue: template.name ?? "")
            self._templateContent = State(initialValue: template.content ?? "")
            
            // Load rich text data if available
            if let rtfData = template.richTextData,
               let attributedString = try? NSAttributedString(
                   data: rtfData,
                   options: [.documentType: NSAttributedString.DocumentType.rtf],
                   documentAttributes: nil
               ) {
                self._templateAttributedText = State(initialValue: attributedString)
            } else {
                self._templateAttributedText = State(initialValue: NSAttributedString(string: template.content ?? ""))
            }
            
            if let typeString = template.type, let type = DocumentType(rawValue: typeString) {
                self._selectedType = State(initialValue: type)
            }
        }
    }
    
    var body: some View {
        ZStack {
            // Background
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
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(8)
                        .shadow(color: Color.adaptiveShadowColor.opacity(0.15), radius: 2, x: 0, y: 1)
                    }
                    .help("Back to templates")
                    
                    Spacer()
                    
                    Text(templateName.isEmpty ? "New Template" : templateName)
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                    
                    HStack(spacing: 16) {
                        Button(action: { showingPreview = true }) {
                            Image(systemName: "eye")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Preview template")
                        
                        Button(action: saveTemplate) {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark")
                                Text("Save")
                            }
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(unsavedChanges && !templateName.isEmpty ? themeVM.theme.colors.accent : Color.gray)
                            .cornerRadius(8)
                            .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
                        }
                        .disabled(templateName.isEmpty || !unsavedChanges)
                        .help("Save template (⌘S)")
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Template info section
                VStack(spacing: 16) {
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Template Name")
                                .font(.caption)
                                .foregroundColor(Color.textColor.opacity(0.6))
                            
                            TextField("Enter template name", text: $templateName)
                                .textFieldStyle(PlainTextFieldStyle())
                                .font(.title3)
                                .fontWeight(.semibold)
                                .onChange(of: templateName) { _, _ in
                                    unsavedChanges = true
                                }
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Document Type")
                                .font(.caption)
                                .foregroundColor(Color.textColor.opacity(0.6))
                            
                            Picker("Type", selection: $selectedType) {
                                ForEach(DocumentType.allCases, id: \.self) { type in
                                    Label(type.rawValue, systemImage: type.icon).tag(type)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .onChange(of: selectedType) { _, _ in
                                unsavedChanges = true
                            }
                        }
                        
                        Button(action: { showingPlaceholderHelp = true }) {
                            Label("Placeholders", systemImage: "questionmark.circle")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                        .help("View available placeholders")
                        
                        Spacer()
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Rich text toolbar
                TextFormattingToolbar(attributedText: $templateAttributedText)
                    .padding(.vertical, 8)
                    .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Rich text editor
                RichTextEditorView(attributedText: $templateAttributedText)
                    .onChange(of: templateAttributedText) { _, _ in
                        templateContent = templateAttributedText.string
                        unsavedChanges = true
                    }
            }
        }
        .alert("Available Placeholders", isPresented: $showingPlaceholderHelp) {
            Button("OK") { }
        } message: {
            Text("""
            {{firstName}} - Contact's first name
            {{lastName}} - Contact's last name
            {{fullName}} - Contact's full name
            {{company}} - Company/farm name
            {{email}} - Email address
            {{phone}} - Phone number
            {{address}} - Full mailing address
            {{city}} - City
            {{state}} - State
            {{zipCode}} - ZIP code
            {{siteAddress}} - Site address
            {{siteCity}} - Site city
            {{siteState}} - Site state
            {{siteZipCode}} - Site ZIP code
            {{notes}} - Contact notes
            {{date}} - Current date
            """)
        }
        .sheet(isPresented: $showingPreview) {
            TemplatePreviewView(content: templateContent, type: selectedType)
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
                saveTemplate()
            }
            Button("Don't Save") {
                dismiss()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You have unsaved changes. Would you like to save them?")
        }
        .onAppear {
            // Template is already loaded in init
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
            // Auto-save when app goes to background
            if unsavedChanges && !templateName.isEmpty {
                saveTemplate()
            }
        }
        .onSubmit {
            // Save on Cmd+S or Ctrl+S
            if unsavedChanges && !templateName.isEmpty {
                saveTemplate()
            }
        }
    }
    

    
    private var placeholderOptions: [(key: String, label: String)] {
        [
            ("{{firstName}}", "First Name"),
            ("{{lastName}}", "Last Name"),
            ("{{fullName}}", "Full Name"),
            ("{{company}}", "Company"),
            ("{{email}}", "Email"),
            ("{{phone}}", "Phone"),
            ("{{address}}", "Address"),
            ("{{city}}", "City"),
            ("{{state}}", "State"),
            ("{{zipCode}}", "ZIP Code"),
            ("{{siteAddress}}", "Site Address"),
            ("{{siteCity}}", "Site City"),
            ("{{siteState}}", "Site State"),
            ("{{siteZipCode}}", "Site ZIP"),
            ("{{notes}}", "Notes"),
            ("{{date}}", "Date")
        ]
    }
    
    private func insertText(_ text: String) {
        templateContent += text
        unsavedChanges = true
    }
    
    private func saveTemplate() {
        if let existingTemplate = template {
            documentManager.updateTemplate(existingTemplate, content: templateContent, attributedContent: templateAttributedText)
        } else {
            _ = documentManager.createTemplate(
                name: templateName,
                content: templateContent,
                attributedContent: templateAttributedText,
                type: selectedType
            )
        }
        unsavedChanges = false
        dismiss()
    }
}

struct TemplatePreviewView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    let content: String
    let type: DocumentType
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Preview toolbar
                HStack(spacing: 16) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                    }
                    .help("Close preview")
                    
                    Spacer()
                    
                    HStack(spacing: 8) {
                        Image(systemName: type.icon)
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("\(type.rawValue) Template Preview")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.text)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Preview content
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(content)
                            .font(.system(.body, design: .serif))
                            .foregroundColor(Color.textColor)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(24)
                            .background(Color.cardBackgroundAdaptive)
                            .cornerRadius(12)
                            .shadow(color: Color.adaptiveShadowColor.opacity(0.2), radius: 12, x: 0, y: 6)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.borderColor.opacity(0.15), lineWidth: 1)
                            )
                    }
                    .padding(24)
                }
            }
        }
    }
}

#Preview {
    TemplateEditorView(documentManager: DocumentManager(context: PersistenceController.shared.container.viewContext))
        .environmentObject(ThemeViewModel())
} 