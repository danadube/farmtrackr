import SwiftUI
import UniformTypeIdentifiers

struct LabelTemplatesView: View {
    @ObservedObject var templateManager: LabelTemplateManager
    @State private var showingTemplateEditor = false
    @State private var editingTemplate: LabelTemplate?
    @State private var showingDeleteAlert = false
    @State private var templateToDelete: LabelTemplate?
    @State private var showingExportSheet = false
    @State private var showingImportSheet = false
    @State private var showingImportAlert = false
    @State private var importSuccess = false
    
    var body: some View {
        NavigationView {
            List {
                if templateManager.templates.isEmpty {
                    ContentUnavailableView(
                        "No Templates",
                        systemImage: "doc.text",
                        description: Text("Create your first label template to get started")
                    )
                } else {
                    ForEach(templateManager.templates) { template in
                        TemplateRowView(
                            template: template,
                            isSelected: templateManager.selectedTemplate?.id == template.id,
                            onEdit: {
                                editingTemplate = template
                                showingTemplateEditor = true
                            },
                            onDelete: {
                                templateToDelete = template
                                showingDeleteAlert = true
                            },
                            onDuplicate: {
                                _ = templateManager.duplicateTemplate(template)
                            },
                            onSetDefault: {
                                templateManager.setDefaultTemplate(template)
                            }
                        )
                    }
                }
            }
            .navigationTitle("Label Templates")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("New Template") {
                            editingTemplate = nil
                            showingTemplateEditor = true
                        }
                        
                        Button("Import Templates") {
                            showingImportSheet = true
                        }
                        
                        if !templateManager.templates.isEmpty {
                            Button("Export Templates") {
                                showingExportSheet = true
                            }
                        }
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showingTemplateEditor) {
            LabelTemplateEditorView(
                templateManager: templateManager,
                template: editingTemplate
            )
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportTemplatesView(templateManager: templateManager)
        }
        .sheet(isPresented: $showingImportSheet) {
            ImportTemplatesView(templateManager: templateManager) { success in
                importSuccess = success
                showingImportAlert = true
            }
        }
        .alert("Delete Template", isPresented: $showingDeleteAlert) {
            Button("Delete", role: .destructive) {
                if let template = templateToDelete {
                    templateManager.deleteTemplate(template)
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Are you sure you want to delete '\(templateToDelete?.name ?? "")'? This action cannot be undone.")
        }
        .alert(importSuccess ? "Import Successful" : "Import Failed", isPresented: $showingImportAlert) {
            Button("OK") { }
        } message: {
            Text(importSuccess ? "Templates imported successfully" : "Failed to import templates. Please check the file format.")
        }
    }
}

struct TemplateRowView: View {
    let template: LabelTemplate
    let isSelected: Bool
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onDuplicate: () -> Void
    let onSetDefault: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(template.name)
                            .font(.headline)
                        
                        if template.isDefault {
                            Text("Default")
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(4)
                        }
                        
                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        }
                    }
                    
                    Text(template.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Menu {
                    Button("Edit") {
                        onEdit()
                    }
                    
                    Button("Duplicate") {
                        onDuplicate()
                    }
                    
                    if !template.isDefault {
                        Button("Set as Default") {
                            onSetDefault()
                        }
                    }
                    
                    Divider()
                    
                    Button("Delete", role: .destructive) {
                        onDelete()
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundColor(.blue)
                }
            }
            
            // Template details
            HStack(spacing: 16) {
                Label("\(template.layout.rawValue)", systemImage: "rectangle.grid.1x2")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Label("\(template.fields.filter(\.isEnabled).count) fields", systemImage: "list.bullet")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Label("\(Int(template.fontSize))pt", systemImage: "textformat")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ExportTemplatesView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var templateManager: LabelTemplateManager
    @State private var showingShareSheet = false
    @State private var exportData: Data?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Export Templates")
                    .font(.title2)
                    .padding()
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Export Details")
                        .font(.headline)
                    
                    Text("Templates to export: \(templateManager.templates.count)")
                    Text("Default template: \(templateManager.templates.first(where: \.isDefault)?.name ?? "None")")
                    
                    if let data = exportData {
                        Text("Export size: \(ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file))")
                    }
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
                .padding(.horizontal)
                
                Button("Export Templates") {
                    exportData = templateManager.exportTemplates()
                    showingShareSheet = true
                }
                .buttonStyle(.borderedProminent)
                .disabled(templateManager.templates.isEmpty)
                
                Spacer()
            }
            .navigationTitle("Export")
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
            if let data = exportData {
                ShareSheet(items: [data])
            }
        }
    }
}

struct ImportTemplatesView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var templateManager: LabelTemplateManager
    let onImportComplete: (Bool) -> Void
    
    @State private var showingDocumentPicker = false
    @State private var importData: Data?
    @State private var showingPreview = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Import Templates")
                    .font(.title2)
                    .padding()
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Import Instructions")
                        .font(.headline)
                    
                    Text("• Select a JSON file containing label templates")
                    Text("• Existing templates will be replaced")
                    Text("• Make sure to backup your current templates first")
                }
                .padding()
                .background(Color.orange.opacity(0.1))
                .cornerRadius(8)
                .padding(.horizontal)
                
                if let data = importData {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("File Ready")
                            .font(.headline)
                        
                        Text("File size: \(ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file))")
                        
                        Button("Preview Import") {
                            showingPreview = true
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                    .padding(.horizontal)
                }
                
                Button("Select File") {
                    showingDocumentPicker = true
                }
                .buttonStyle(.borderedProminent)
                
                if importData != nil {
                    Button("Import Templates") {
                        if let data = importData {
                            let success = templateManager.importTemplates(from: data)
                            onImportComplete(success)
                            dismiss()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                }
                
                Spacer()
            }
            .navigationTitle("Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPicker(types: [.json]) { url in
                if let data = try? Data(contentsOf: url) {
                    importData = data
                }
            }
        }
        .sheet(isPresented: $showingPreview) {
            if let data = importData {
                LabelTemplateImportPreviewView(data: data)
            }
        }
    }
} 