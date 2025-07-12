import SwiftUI

struct LabelTemplateEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var templateManager: LabelTemplateManager
    @State private var template: LabelTemplate
    @State private var showingFieldEditor = false
    @State private var editingField: LabelField?
    @State private var showingValidationAlert = false
    @State private var validationErrors: [String] = []
    @State private var showingPreview = false
    
    init(templateManager: LabelTemplateManager, template: LabelTemplate? = nil) {
        self.templateManager = templateManager
        if let template = template {
            self._template = State(initialValue: template)
        } else {
            self._template = State(initialValue: LabelTemplate(
                name: "New Template",
                description: "Custom label template",
                layout: .standard,
                fields: [],
                fontSize: 12,
                fontName: "Helvetica"
            ))
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Information
                Section("Template Information") {
                    TextField("Template Name", text: $template.name)
                    TextField("Description", text: $template.description, axis: .vertical)
                        .lineLimit(2...4)
                }
                
                // Layout Settings
                Section("Layout") {
                    Picker("Layout Type", selection: $template.layout) {
                        ForEach(LabelLayout.allCases, id: \.self) { layout in
                            VStack(alignment: .leading) {
                                Text(layout.rawValue)
                                Text(layout.description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .tag(layout)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    HStack {
                        Text("Font Size")
                        Spacer()
                        TextField("Size", value: Binding(
                            get: { Double(template.fontSize) },
                            set: { template.fontSize = CGFloat($0) }
                        ), format: .number)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 80)
                    }
                    
                    Picker("Font", selection: $template.fontName) {
                        ForEach(availableFonts, id: \.self) { font in
                            Text(font).tag(font)
                        }
                    }
                    .pickerStyle(.menu)
                }
                
                // Fields Management
                Section("Fields") {
                    ForEach(template.fields.sorted(by: { $0.order < $1.order })) { field in
                        FieldRowView(field: field) {
                            editingField = field
                            showingFieldEditor = true
                        }
                    }
                    .onMove { from, to in
                        template.fields.move(fromOffsets: from, toOffset: to)
                        updateFieldOrder()
                    }
                    .onDelete { indexSet in
                        template.fields.remove(atOffsets: indexSet)
                        updateFieldOrder()
                    }
                    
                    Button("Add Field") {
                        let newField = LabelField(
                            type: .name,
                            label: "New Field",
                            order: template.fields.count
                        )
                        template.fields.append(newField)
                        editingField = newField
                        showingFieldEditor = true
                    }
                }
                
                // Preview
                Section("Preview") {
                    Button("Preview Template") {
                        showingPreview = true
                    }
                    .disabled(template.fields.isEmpty)
                }
            }
            .navigationTitle(template.name)
            .navigationBarTitleDisplayMode(.inline)
        }
        .toolbar(content: {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    saveTemplate()
                }
            }
        })
        .sheet(isPresented: $showingFieldEditor) {
            if let field = editingField {
                FieldEditorView(field: field) { updatedField in
                    if let index = template.fields.firstIndex(where: { $0.id == field.id }) {
                        template.fields[index] = updatedField
                    }
                }
            }
        }
        .sheet(isPresented: $showingPreview) {
            LabelPreviewView(
                contacts: [FarmContact.preview()],
                labelFormat: .avery5160,
                addressType: .mailing,
                template: template,
                templateManager: templateManager
            )
        }
        .alert("Validation Errors", isPresented: $showingValidationAlert) {
            Button("OK") { }
        } message: {
            Text(validationErrors.joined(separator: "\n"))
        }
    }
    
    private var availableFonts: [String] {
        ["Helvetica", "Arial", "Times New Roman", "Georgia", "Verdana", "Courier New"]
    }
    
    private func updateFieldOrder() {
        for (index, _) in template.fields.enumerated() {
            template.fields[index].order = index
        }
    }
    
    private func saveTemplate() {
        validationErrors = templateManager.validateTemplate(template)
        
        if validationErrors.isEmpty {
            if templateManager.templates.contains(where: { $0.id == template.id }) {
                templateManager.updateTemplate(template)
            } else {
                templateManager.addTemplate(template)
            }
            dismiss()
        } else {
            showingValidationAlert = true
        }
    }
}

struct FieldRowView: View {
    let field: LabelField
    let onEdit: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(field.label)
                    .font(.headline)
                Text(field.type.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if field.isEnabled {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else {
                Image(systemName: "circle")
                    .foregroundColor(.gray)
            }
            
            Button("Edit") {
                onEdit()
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 4)
    }
}

struct FieldEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var field: LabelField
    let onSave: (LabelField) -> Void
    
    init(field: LabelField, onSave: @escaping (LabelField) -> Void) {
        self._field = State(initialValue: field)
        self.onSave = onSave
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Field Settings") {
                    TextField("Label", text: $field.label)
                    
                    Picker("Field Type", selection: $field.type) {
                        ForEach(FieldType.allCases, id: \.self) { type in
                            VStack(alignment: .leading) {
                                Text(type.rawValue)
                                Text(type.description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .tag(type)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    Toggle("Enabled", isOn: $field.isEnabled)
                    
                    if field.type == .custom {
                        TextField("Format (optional)", text: Binding(
                            get: { field.format ?? "" },
                            set: { field.format = $0.isEmpty ? nil : $0 }
                        ))
                    }
                }
            }
            .navigationTitle("Edit Field")
            .navigationBarTitleDisplayMode(.inline)
        }
        .toolbar(content: {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    onSave(field)
                    dismiss()
                }
            }
        })
    }
} 