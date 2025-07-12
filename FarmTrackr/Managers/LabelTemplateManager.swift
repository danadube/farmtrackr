import Foundation
import SwiftUI

class LabelTemplateManager: ObservableObject {
    @Published var templates: [LabelTemplate] = []
    @Published var selectedTemplate: LabelTemplate?
    
    private let userDefaultsKey = "SavedLabelTemplates"
    
    init() {
        loadTemplates()
        if templates.isEmpty {
            templates = LabelTemplate.defaultTemplates
            selectedTemplate = templates.first
            saveTemplates()
        } else if selectedTemplate == nil {
            selectedTemplate = templates.first
        }
    }
    
    // MARK: - Template Management
    
    func addTemplate(_ template: LabelTemplate) {
        templates.append(template)
        saveTemplates()
    }
    
    func updateTemplate(_ template: LabelTemplate) {
        if let index = templates.firstIndex(where: { $0.id == template.id }) {
            templates[index] = template
            if selectedTemplate?.id == template.id {
                selectedTemplate = template
            }
            saveTemplates()
        }
    }
    
    func deleteTemplate(_ template: LabelTemplate) {
        templates.removeAll { $0.id == template.id }
        if selectedTemplate?.id == template.id {
            selectedTemplate = templates.first
        }
        saveTemplates()
    }
    
    func duplicateTemplate(_ template: LabelTemplate) -> LabelTemplate {
        var newTemplate = template
        newTemplate.name = "\(template.name) (Copy)"
        newTemplate.isDefault = false
        addTemplate(newTemplate)
        return newTemplate
    }
    
    func setDefaultTemplate(_ template: LabelTemplate) {
        // Remove default from other templates
        for i in 0..<templates.count {
            templates[i].isDefault = false
        }
        
        // Set new default
        if let index = templates.firstIndex(where: { $0.id == template.id }) {
            templates[index].isDefault = true
            selectedTemplate = templates[index]
            saveTemplates()
        }
    }
    
    // MARK: - Template Rendering
    
    func renderLabel(for contact: FarmContact, using template: LabelTemplate) -> String {
        let sortedFields = template.fields.filter { $0.isEnabled }.sorted { $0.order < $1.order }
        
        var labelText = ""
        
        for field in sortedFields {
            let fieldValue = getFieldValue(for: contact, fieldType: field.type)
            if !fieldValue.isEmpty {
                labelText += fieldValue + "\n"
            }
        }
        
        return labelText.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func getFieldValue(for contact: FarmContact, fieldType: FieldType) -> String {
        switch fieldType {
        case .name:
            return contact.fullName
        case .company:
            return "" // No company field in model
        case .mailingAddress:
            return contact.mailingAddress ?? ""
        case .mailingCity:
            return contact.city ?? ""
        case .mailingState:
            return contact.state ?? ""
        case .mailingZipCode:
            return contact.formattedZipCode
        case .siteAddress:
            return contact.siteMailingAddress ?? ""
        case .siteCity:
            return contact.siteCity ?? ""
        case .siteState:
            return contact.siteState ?? ""
        case .siteZipCode:
            return contact.formattedSiteZipCode
        case .primaryPhone:
            return contact.primaryPhone ?? ""
        case .secondaryPhone:
            return contact.phoneNumber2 ?? ""
        case .primaryEmail:
            return contact.primaryEmail ?? ""
        case .secondaryEmail:
            return contact.email2 ?? ""
        case .notes:
            return contact.notes ?? ""
        case .custom:
            return ""
        }
    }
    
    private func formatZipCode(_ zipCode: Int32) -> String {
        let zipString = String(zipCode)
        if zipString.count == 9 {
            let prefix = String(zipString.prefix(5))
            let suffix = String(zipString.suffix(4))
            return "\(prefix)-\(suffix)"
        }
        return zipString
    }
    
    // MARK: - Persistence
    
    private func saveTemplates() {
        if let encoded = try? JSONEncoder().encode(templates) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }
    
    private func loadTemplates() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let decoded = try? JSONDecoder().decode([LabelTemplate].self, from: data) {
            templates = decoded
        }
    }
    
    // MARK: - Template Validation
    
    func validateTemplate(_ template: LabelTemplate) -> [String] {
        var errors: [String] = []
        
        if template.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errors.append("Template name is required")
        }
        
        if template.fields.isEmpty {
            errors.append("At least one field must be enabled")
        }
        
        if template.fontSize < 8 || template.fontSize > 24 {
            errors.append("Font size must be between 8 and 24")
        }
        
        return errors
    }
    
    // MARK: - Export/Import
    
    func exportTemplates() -> Data? {
        return try? JSONEncoder().encode(templates)
    }
    
    func importTemplates(from data: Data) -> Bool {
        do {
            let importedTemplates = try JSONDecoder().decode([LabelTemplate].self, from: data)
            templates = importedTemplates
            selectedTemplate = templates.first
            saveTemplates()
            return true
        } catch {
            return false
        }
    }
} 