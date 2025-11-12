import Foundation

struct ImportTemplate: Identifiable, Codable {
    let id: UUID
    var name: String
    var description: String
    var fieldMapping: [String: String]
    var validationRules: [ValidationRule]
    var createdAt: Date
    var lastUsed: Date?
    var useCount: Int
    
    init(name: String, description: String, fieldMapping: [String: String], validationRules: [ValidationRule] = []) {
        self.id = UUID()
        self.name = name
        self.description = description
        self.fieldMapping = fieldMapping
        self.validationRules = validationRules
        self.createdAt = Date()
        self.lastUsed = nil
        self.useCount = 0
    }
    
    mutating func incrementUseCount() {
        useCount += 1
        lastUsed = Date()
    }
}

struct ValidationRule: Codable, Identifiable {
    let id: UUID
    var fieldName: String
    var ruleType: ValidationRuleType
    var value: String
    var isEnabled: Bool
    
    init(fieldName: String, ruleType: ValidationRuleType, value: String = "", isEnabled: Bool = true) {
        self.id = UUID()
        self.fieldName = fieldName
        self.ruleType = ruleType
        self.value = value
        self.isEnabled = isEnabled
    }
}

enum ValidationRuleType: String, CaseIterable, Codable {
    case required = "required"
    case email = "email"
    case phone = "phone"
    case zipCode = "zipCode"
    case maxLength = "maxLength"
    case minLength = "minLength"
    case customRegex = "customRegex"
    
    var displayName: String {
        switch self {
        case .required: return "Required Field"
        case .email: return "Email Format"
        case .phone: return "Phone Format"
        case .zipCode: return "ZIP Code Format"
        case .maxLength: return "Maximum Length"
        case .minLength: return "Minimum Length"
        case .customRegex: return "Custom Pattern"
        }
    }
    
    var description: String {
        switch self {
        case .required: return "Field must not be empty"
        case .email: return "Field must be a valid email address"
        case .phone: return "Field must be a valid phone number"
        case .zipCode: return "Field must be a valid ZIP code"
        case .maxLength: return "Field must not exceed specified length"
        case .minLength: return "Field must meet minimum length"
        case .customRegex: return "Field must match custom pattern"
        }
    }
    
    var requiresValue: Bool {
        switch self {
        case .required, .email, .phone, .zipCode:
            return false
        case .maxLength, .minLength, .customRegex:
            return true
        }
    }
} 