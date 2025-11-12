import Foundation
import SwiftUI

class ImportTemplateManager: ObservableObject {
    @Published var templates: [ImportTemplate] = []
    private let userDefaults = UserDefaults.standard
    private let templatesKey = "savedImportTemplates"
    
    init() {
        loadTemplates()
    }
    
    // MARK: - Template Management
    
    func saveTemplate(_ template: ImportTemplate) {
        if let index = templates.firstIndex(where: { $0.id == template.id }) {
            templates[index] = template
        } else {
            templates.append(template)
        }
        saveTemplates()
    }
    
    func deleteTemplate(_ template: ImportTemplate) {
        templates.removeAll { $0.id == template.id }
        saveTemplates()
    }
    
    func getTemplate(by id: UUID) -> ImportTemplate? {
        return templates.first { $0.id == id }
    }
    
    func updateTemplateUsage(_ templateId: UUID) {
        if let index = templates.firstIndex(where: { $0.id == templateId }) {
            templates[index].incrementUseCount()
            saveTemplates()
        }
    }
    
    // MARK: - Template Creation Helpers
    
    func createTemplateFromCurrentMapping(name: String, description: String, fieldMapping: [String: String], validationRules: [ValidationRule] = []) -> ImportTemplate {
        let template = ImportTemplate(
            name: name,
            description: description,
            fieldMapping: fieldMapping,
            validationRules: validationRules
        )
        saveTemplate(template)
        return template
    }
    
    func createDefaultTemplates() {
        // Create some default templates for common scenarios
        let defaultTemplates = [
            ImportTemplate(
                name: "Standard Contact Import",
                description: "Basic contact import with name, email, and phone",
                fieldMapping: [
                    "firstname": "firstName",
                    "lastname": "lastName",
                    "email": "email1",
                    "phone": "phoneNumber1",
                    "address": "mailingAddress",
                    "city": "city",
                    "state": "state",
                    "zipcode": "zipCode",
                    "farm": "farm"
                ],
                validationRules: [
                    ValidationRule(fieldName: "firstName", ruleType: .required),
                    ValidationRule(fieldName: "lastName", ruleType: .required),
                    ValidationRule(fieldName: "email1", ruleType: .email),
                    ValidationRule(fieldName: "phoneNumber1", ruleType: .phone),
                    ValidationRule(fieldName: "zipCode", ruleType: .zipCode)
                ]
            ),
            ImportTemplate(
                name: "Farm Contact Import",
                description: "Complete farm contact with all fields",
                fieldMapping: [
                    "firstname": "firstName",
                    "lastname": "lastName",
                    "email1": "email1",
                    "email2": "email2",
                    "phone1": "phoneNumber1",
                    "phone2": "phoneNumber2",
                    "phone3": "phoneNumber3",
                    "phone4": "phoneNumber4",
                    "phone5": "phoneNumber5",
                    "phone6": "phoneNumber6",
                    "address": "mailingAddress",
                    "city": "city",
                    "state": "state",
                    "zipcode": "zipCode",
                    "siteaddress": "siteMailingAddress",
                    "sitecity": "siteCity",
                    "sitestate": "siteState",
                    "sitezipcode": "siteZipCode",
                    "farm": "farm",
                    "notes": "notes"
                ],
                validationRules: [
                    ValidationRule(fieldName: "firstName", ruleType: .required),
                    ValidationRule(fieldName: "lastName", ruleType: .required),
                    ValidationRule(fieldName: "farm", ruleType: .required),
                    ValidationRule(fieldName: "email1", ruleType: .email),
                    ValidationRule(fieldName: "phoneNumber1", ruleType: .phone),
                    ValidationRule(fieldName: "zipCode", ruleType: .zipCode)
                ]
            ),
            ImportTemplate(
                name: "Minimal Contact Import",
                description: "Import with just name and farm",
                fieldMapping: [
                    "firstname": "firstName",
                    "lastname": "lastName",
                    "farm": "farm"
                ],
                validationRules: [
                    ValidationRule(fieldName: "firstName", ruleType: .required),
                    ValidationRule(fieldName: "lastName", ruleType: .required),
                    ValidationRule(fieldName: "farm", ruleType: .required)
                ]
            )
        ]
        
        for template in defaultTemplates {
            if !templates.contains(where: { $0.name == template.name }) {
                templates.append(template)
            }
        }
        saveTemplates()
    }
    
    // MARK: - Private Methods
    
    private func saveTemplates() {
        do {
            let data = try JSONEncoder().encode(templates)
            userDefaults.set(data, forKey: templatesKey)
        } catch {
            print("Failed to save templates: \(error)")
        }
    }
    
    private func loadTemplates() {
        guard let data = userDefaults.data(forKey: templatesKey) else {
            // No saved templates, create defaults
            createDefaultTemplates()
            return
        }
        
        do {
            templates = try JSONDecoder().decode([ImportTemplate].self, from: data)
        } catch {
            print("Failed to load templates: \(error)")
            templates = []
            createDefaultTemplates()
        }
    }
} 