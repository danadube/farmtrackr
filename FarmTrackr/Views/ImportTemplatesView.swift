import SwiftUI

struct CSVImportTemplatesView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var templateManager = ImportTemplateManager()
    @State private var showingCreateTemplate = false
    @State private var showingEditTemplate = false
    @State private var selectedTemplate: ImportTemplate?
    @State private var templateToEdit: ImportTemplate?
    @State private var showingDeleteAlert = false
    @State private var templateToDelete: ImportTemplate?
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                // Header
                headerSection
                
                // Templates List
                if templateManager.templates.isEmpty {
                    emptyStateSection
                } else {
                    templatesListSection
                }
                
                Spacer()
            }
            .padding()
            .background(themeVM.theme.colors.background)
            .navigationTitle("Import Templates")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                },
                trailing: Button("New Template") {
                    showingCreateTemplate = true
                }
            )
        }
        .sheet(isPresented: $showingCreateTemplate) {
            CreateTemplateView(templateManager: templateManager)
        }
        .sheet(isPresented: $showingEditTemplate) {
            if let template = templateToEdit {
                EditTemplateView(templateManager: templateManager, template: template)
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
            Text("Are you sure you want to delete this template? This action cannot be undone.")
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Import Templates")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Save and reuse import configurations for faster data imports")
                .font(.body)
                .foregroundColor(themeVM.theme.colors.secondary)
                .multilineTextAlignment(.center)
        }
    }
    
    private var emptyStateSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            Image(systemName: "doc.text")
                .font(.system(size: 64))
                .foregroundColor(themeVM.theme.colors.secondary)
            
            Text("No Templates Yet")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("Create your first import template to save time on future imports")
                .font(.body)
                .foregroundColor(themeVM.theme.colors.secondary)
                .multilineTextAlignment(.center)
            
            Button("Create Template") {
                showingCreateTemplate = true
            }
            .buttonStyle(.borderedProminent)
            .tint(themeVM.theme.colors.primary)
        }
        .padding()
    }
    
    private var templatesListSection: some View {
        ScrollView {
            LazyVStack(spacing: Constants.Spacing.medium) {
                ForEach(templateManager.templates) { template in
                    TemplateCardView(
                        template: template,
                        onUse: {
                            selectedTemplate = template
                            templateManager.updateTemplateUsage(template.id)
                            dismiss()
                        },
                        onEdit: {
                            templateToEdit = template
                            showingEditTemplate = true
                        },
                        onDelete: {
                            templateToDelete = template
                            showingDeleteAlert = true
                        },
                        themeVM: themeVM
                    )
                }
            }
        }
    }
}

struct TemplateCardView: View {
    let template: ImportTemplate
    let onUse: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    let themeVM: ThemeViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(template.name)
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text(template.description)
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondary)
                }
                
                Spacer()
                
                Menu {
                    Button("Use Template") {
                        onUse()
                    }
                    Button("Edit Template") {
                        onEdit()
                    }
                    Divider()
                    Button("Delete Template", role: .destructive) {
                        onDelete()
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundColor(themeVM.theme.colors.secondary)
                }
            }
            
            // Stats
            HStack {
                Label("\(template.fieldMapping.count) fields", systemImage: "list.bullet")
                Spacer()
                Label("\(template.validationRules.count) rules", systemImage: "checkmark.shield")
                Spacer()
                Label("Used \(template.useCount) times", systemImage: "clock")
            }
            .font(.caption)
            .foregroundColor(themeVM.theme.colors.secondary)
            
            // Last used
            if let lastUsed = template.lastUsed {
                HStack {
                    Text("Last used: \(lastUsed, style: .relative) ago")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondary)
                    Spacer()
                }
            }
            
            // Action Button
            Button("Use This Template") {
                onUse()
            }
            .buttonStyle(.borderedProminent)
            .tint(themeVM.theme.colors.primary)
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

struct CreateTemplateView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var templateManager: ImportTemplateManager
    
    @State private var templateName = ""
    @State private var templateDescription = ""
    @State private var fieldMapping: [String: String] = [:]
    @State private var validationRules: [ValidationRule] = []
    @State private var showingFieldMapping = false
    @State private var showingValidationRules = false
    
    // Available CSV fields for mapping
    private let availableCSVFields = [
        "First Name", "Last Name", "Email", "Phone", "Address", "City", "State", "ZIP Code",
        "Farm", "Notes", "Company", "Title", "Website", "Birthday", "Anniversary"
    ]
    
    // Available FarmTrackr fields
    private let farmTrackrFields = [
        "firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode",
        "farm", "notes", "company", "title", "website", "birthday", "anniversary"
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Template Details") {
                    TextField("Template Name", text: $templateName)
                    TextField("Description", text: $templateDescription, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Field Mapping") {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("CSV Field → FarmTrackr Field")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Spacer()
                            Button("Configure") {
                                showingFieldMapping = true
                            }
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.primary)
                        }
                        
                        if fieldMapping.isEmpty {
                            Text("No field mappings configured")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .italic()
                        } else {
                            ForEach(Array(fieldMapping.keys.sorted()), id: \.self) { csvField in
                                HStack {
                                    Text(csvField)
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.text)
                                    Spacer()
                                    Text("→")
                                        .foregroundColor(themeVM.theme.colors.secondary)
                                    Spacer()
                                    Text(fieldMapping[csvField] ?? "Unmapped")
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.accent)
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
                
                Section("Validation Rules") {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Data Validation Rules")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Spacer()
                            Button("Configure") {
                                showingValidationRules = true
                            }
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.primary)
                        }
                        
                        if validationRules.isEmpty {
                            Text("No validation rules configured")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .italic()
                        } else {
                            ForEach(validationRules) { rule in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(rule.fieldName)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .foregroundColor(themeVM.theme.colors.text)
                                        Text(rule.ruleType.displayName)
                                            .font(.caption2)
                                            .foregroundColor(themeVM.theme.colors.secondary)
                                    }
                                    Spacer()
                                    if rule.isEnabled {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                            .font(.caption)
                                    } else {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                            .font(.caption)
                                    }
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Create Template")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                },
                trailing: Button("Save") {
                    saveTemplate()
                }
                .disabled(templateName.isEmpty)
            )
            .sheet(isPresented: $showingFieldMapping) {
                FieldMappingView(
                    fieldMapping: $fieldMapping,
                    availableCSVFields: availableCSVFields,
                    farmTrackrFields: farmTrackrFields
                )
            }
            .sheet(isPresented: $showingValidationRules) {
                ValidationRulesView(validationRules: $validationRules)
            }
        }
    }
    
    private func saveTemplate() {
        let template = ImportTemplate(
            name: templateName,
            description: templateDescription,
            fieldMapping: fieldMapping,
            validationRules: validationRules
        )
        templateManager.saveTemplate(template)
        dismiss()
    }
}

struct FieldMappingView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var fieldMapping: [String: String]
    let availableCSVFields: [String]
    let farmTrackrFields: [String]
    
    @State private var selectedCSVField = ""
    @State private var selectedFarmTrackrField = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                headerSection
                addNewMappingSection
                currentMappingsSection
                Spacer()
            }
            .padding()
            .background(themeVM.theme.colors.background)
            .navigationTitle("Field Mapping")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() },
                trailing: Button("Done") { dismiss() }
            )
        }
    }
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            Text("Field Mapping Configuration")
                .font(themeVM.theme.fonts.titleFont)
                .fontWeight(.bold)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("Map CSV fields to FarmTrackr contact fields")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var addNewMappingSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Add New Mapping")
                .font(themeVM.theme.fonts.headlineFont)
                .fontWeight(.semibold)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(spacing: Constants.Spacing.small) {
                csvFieldPicker
                farmTrackrFieldPicker
                addButton
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var csvFieldPicker: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("CSV Field")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Picker("CSV Field", selection: $selectedCSVField) {
                Text("Select CSV Field").tag("")
                ForEach(availableCSVFields, id: \.self) { field in
                    Text(field).tag(field)
                }
            }
            .pickerStyle(MenuPickerStyle())
            .padding()
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
        }
    }
    
    private var farmTrackrFieldPicker: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FarmTrackr Field")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Picker("FarmTrackr Field", selection: $selectedFarmTrackrField) {
                Text("Select FarmTrackr Field").tag("")
                ForEach(farmTrackrFields, id: \.self) { field in
                    Text(field).tag(field)
                }
            }
            .pickerStyle(MenuPickerStyle())
            .padding()
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
        }
    }
    
    private var addButton: some View {
        Button(action: addMapping) {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Add Mapping")
            }
            .font(themeVM.theme.fonts.bodyFont)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(buttonBackgroundColor)
            .cornerRadius(8)
        }
        .disabled(selectedCSVField.isEmpty || selectedFarmTrackrField.isEmpty)
    }
    
    private var buttonBackgroundColor: Color {
        selectedCSVField.isEmpty || selectedFarmTrackrField.isEmpty ? 
            themeVM.theme.colors.secondaryLabel : themeVM.theme.colors.primary
    }
    
    private var currentMappingsSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            HStack {
                Text("Current Mappings")
                    .font(themeVM.theme.fonts.headlineFont)
                    .fontWeight(.semibold)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                if !fieldMapping.isEmpty {
                    Button("Clear All") {
                        fieldMapping.removeAll()
                    }
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(.red)
                }
            }
            
            if fieldMapping.isEmpty {
                emptyMappingsView
            } else {
                mappingsListView
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var emptyMappingsView: some View {
        Text("No field mappings configured")
            .font(themeVM.theme.fonts.bodyFont)
            .foregroundColor(themeVM.theme.colors.secondaryLabel)
            .italic()
            .frame(maxWidth: .infinity, alignment: .center)
            .padding()
    }
    
    private var mappingsListView: some View {
        ScrollView {
            LazyVStack(spacing: Constants.Spacing.small) {
                ForEach(Array(fieldMapping.keys.sorted()), id: \.self) { csvField in
                    mappingRow(csvField: csvField)
                }
            }
        }
    }
    
    private func mappingRow(csvField: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(csvField)
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                    .foregroundColor(themeVM.theme.colors.text)
                Text("CSV Field")
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            
            Spacer()
            
            Image(systemName: "arrow.right")
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(fieldMapping[csvField] ?? "Unmapped")
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                    .foregroundColor(themeVM.theme.colors.accent)
                Text("FarmTrackr Field")
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            
            Button(action: {
                fieldMapping.removeValue(forKey: csvField)
            }) {
                Image(systemName: "trash")
                    .foregroundColor(.red)
                    .font(.caption)
            }
            .padding(.leading, 8)
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(8)
    }
    
    private func addMapping() {
        guard !selectedCSVField.isEmpty && !selectedFarmTrackrField.isEmpty else { return }
        fieldMapping[selectedCSVField] = selectedFarmTrackrField
        selectedCSVField = ""
        selectedFarmTrackrField = ""
    }
}

struct ValidationRulesView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var validationRules: [ValidationRule]
    
    @State private var selectedField = ""
    @State private var selectedRuleType = ValidationRuleType.required
    @State private var ruleValue = ""
    @State private var isEnabled = true
    
    private let availableFields = [
        "firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode",
        "farm", "notes", "company", "title", "website", "birthday", "anniversary"
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                headerSection
                addNewRuleSection
                currentRulesSection
                Spacer()
            }
            .padding()
            .background(themeVM.theme.colors.background)
            .navigationTitle("Validation Rules")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() },
                trailing: Button("Done") { dismiss() }
            )
        }
    }
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            Text("Validation Rules Configuration")
                .font(themeVM.theme.fonts.titleFont)
                .fontWeight(.bold)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("Configure data validation rules for import")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var addNewRuleSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Add New Rule")
                .font(themeVM.theme.fonts.headlineFont)
                .fontWeight(.semibold)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(spacing: Constants.Spacing.small) {
                fieldPicker
                ruleTypePicker
                ruleValueField
                enabledToggle
                addButton
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var fieldPicker: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Field")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Picker("Field", selection: $selectedField) {
                Text("Select Field").tag("")
                ForEach(availableFields, id: \.self) { field in
                    Text(field).tag(field)
                }
            }
            .pickerStyle(MenuPickerStyle())
            .padding()
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
        }
    }
    
    private var ruleTypePicker: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Rule Type")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Picker("Rule Type", selection: $selectedRuleType) {
                ForEach(ValidationRuleType.allCases, id: \.self) { ruleType in
                    Text(ruleType.displayName).tag(ruleType)
                }
            }
            .pickerStyle(MenuPickerStyle())
            .padding()
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
        }
    }
    
    private var ruleValueField: some View {
        Group {
            if selectedRuleType.requiresValue {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Value")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    TextField("Enter value", text: $ruleValue)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding()
                        .background(themeVM.theme.colors.cardBackground)
                        .cornerRadius(8)
                }
            }
        }
    }
    
    private var enabledToggle: some View {
        Toggle("Rule Enabled", isOn: $isEnabled)
            .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
            .padding()
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(8)
    }
    
    private var addButton: some View {
        Button(action: addRule) {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Add Rule")
            }
            .font(themeVM.theme.fonts.bodyFont)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(buttonBackgroundColor)
            .cornerRadius(8)
        }
        .disabled(selectedField.isEmpty)
    }
    
    private var buttonBackgroundColor: Color {
        selectedField.isEmpty ? themeVM.theme.colors.secondaryLabel : themeVM.theme.colors.primary
    }
    
    private var currentRulesSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            HStack {
                Text("Current Rules")
                    .font(themeVM.theme.fonts.headlineFont)
                    .fontWeight(.semibold)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                if !validationRules.isEmpty {
                    Button("Clear All") {
                        validationRules.removeAll()
                    }
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(.red)
                }
            }
            
            if validationRules.isEmpty {
                emptyRulesView
            } else {
                rulesListView
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var emptyRulesView: some View {
        Text("No validation rules configured")
            .font(themeVM.theme.fonts.bodyFont)
            .foregroundColor(themeVM.theme.colors.secondaryLabel)
            .italic()
            .frame(maxWidth: .infinity, alignment: .center)
            .padding()
    }
    
    private var rulesListView: some View {
        ScrollView {
            LazyVStack(spacing: Constants.Spacing.small) {
                ForEach(validationRules) { rule in
                    ruleRow(rule: rule)
                }
            }
        }
    }
    
    private func ruleRow(rule: ValidationRule) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(rule.fieldName)
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Text(rule.ruleType.displayName)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                
                if !rule.value.isEmpty {
                    Text("Value: \(rule.value)")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.accent)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                if rule.isEnabled {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title3)
                } else {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.red)
                        .font(.title3)
                }
                
                Button(action: {
                    if let index = validationRules.firstIndex(where: { $0.id == rule.id }) {
                        validationRules.remove(at: index)
                    }
                }) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(8)
    }
    
    private func addRule() {
        guard !selectedField.isEmpty else { return }
        
        let rule = ValidationRule(
            fieldName: selectedField,
            ruleType: selectedRuleType,
            value: ruleValue,
            isEnabled: isEnabled
        )
        
        validationRules.append(rule)
        
        // Reset form
        selectedField = ""
        selectedRuleType = .required
        ruleValue = ""
        isEnabled = true
    }
}

struct EditTemplateView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var templateManager: ImportTemplateManager
    let template: ImportTemplate
    
    @State private var templateName: String
    @State private var templateDescription: String
    @State private var fieldMapping: [String: String]
    @State private var validationRules: [ValidationRule]
    @State private var showingFieldMapping = false
    @State private var showingValidationRules = false
    
    // Available CSV fields for mapping
    private let availableCSVFields = [
        "First Name", "Last Name", "Email", "Phone", "Address", "City", "State", "ZIP Code",
        "Farm", "Notes", "Company", "Title", "Website", "Birthday", "Anniversary"
    ]
    
    // Available FarmTrackr fields
    private let farmTrackrFields = [
        "firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode",
        "farm", "notes", "company", "title", "website", "birthday", "anniversary"
    ]
    
    init(templateManager: ImportTemplateManager, template: ImportTemplate) {
        self.templateManager = templateManager
        self.template = template
        self._templateName = State(initialValue: template.name)
        self._templateDescription = State(initialValue: template.description)
        self._fieldMapping = State(initialValue: template.fieldMapping)
        self._validationRules = State(initialValue: template.validationRules)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Template Details") {
                    TextField("Template Name", text: $templateName)
                    TextField("Description", text: $templateDescription, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Field Mapping") {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("CSV Field → FarmTrackr Field")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Spacer()
                            Button("Configure") {
                                showingFieldMapping = true
                            }
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.primary)
                        }
                        
                        if fieldMapping.isEmpty {
                            Text("No field mappings configured")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .italic()
                        } else {
                            ForEach(Array(fieldMapping.keys.sorted()), id: \.self) { csvField in
                                HStack {
                                    Text(csvField)
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.text)
                                    Spacer()
                                    Text("→")
                                        .foregroundColor(themeVM.theme.colors.secondary)
                                    Spacer()
                                    Text(fieldMapping[csvField] ?? "Unmapped")
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.accent)
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
                
                Section("Validation Rules") {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Data Validation Rules")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Spacer()
                            Button("Configure") {
                                showingValidationRules = true
                            }
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.primary)
                        }
                        
                        if validationRules.isEmpty {
                            Text("No validation rules configured")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .italic()
                        } else {
                            ForEach(validationRules) { rule in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(rule.fieldName)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .foregroundColor(themeVM.theme.colors.text)
                                        Text(rule.ruleType.displayName)
                                            .font(.caption2)
                                            .foregroundColor(themeVM.theme.colors.secondary)
                                    }
                                    Spacer()
                                    if rule.isEnabled {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                            .font(.caption)
                                    } else {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                            .font(.caption)
                                    }
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
                
                Section("Template Statistics") {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Created")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Text(template.createdAt, style: .date)
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.text)
                        }
                        Spacer()
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Used")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondary)
                            Text("\(template.useCount) times")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.text)
                        }
                        Spacer()
                        if let lastUsed = template.lastUsed {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Last Used")
                                    .font(.caption)
                                    .foregroundColor(themeVM.theme.colors.secondary)
                                Text(lastUsed, style: .date)
                                    .font(.caption)
                                    .foregroundColor(themeVM.theme.colors.text)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Edit Template")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                },
                trailing: Button("Save") {
                    saveTemplate()
                }
                .disabled(templateName.isEmpty)
            )
            .sheet(isPresented: $showingFieldMapping) {
                FieldMappingView(
                    fieldMapping: $fieldMapping,
                    availableCSVFields: availableCSVFields,
                    farmTrackrFields: farmTrackrFields
                )
            }
            .sheet(isPresented: $showingValidationRules) {
                ValidationRulesView(validationRules: $validationRules)
            }
        }
    }
    
    private func saveTemplate() {
        var updatedTemplate = template
        updatedTemplate.name = templateName
        updatedTemplate.description = templateDescription
        updatedTemplate.fieldMapping = fieldMapping
        updatedTemplate.validationRules = validationRules
        
        templateManager.saveTemplate(updatedTemplate)
        dismiss()
    }
} 