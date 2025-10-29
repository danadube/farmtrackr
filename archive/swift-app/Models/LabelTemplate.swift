import Foundation
import CoreData

struct LabelTemplate: Identifiable, Codable {
    let id: UUID
    var name: String
    var description: String
    var layout: LabelLayout
    var fields: [LabelField]
    var fontSize: CGFloat
    var fontName: String
    var isDefault: Bool
    
    init(id: UUID = UUID(), name: String, description: String, layout: LabelLayout = .standard, fields: [LabelField] = [], fontSize: CGFloat = 12, fontName: String = "Helvetica", isDefault: Bool = false) {
        self.id = id
        self.name = name
        self.description = description
        self.layout = layout
        self.fields = fields
        self.fontSize = fontSize
        self.fontName = fontName
        self.isDefault = isDefault
    }
}

enum LabelLayout: String, CaseIterable, Codable {
    case standard = "Standard"
    case compact = "Compact"
    case large = "Large"
    case custom = "Custom"
    
    var description: String {
        switch self {
        case .standard:
            return "Standard address label format"
        case .compact:
            return "Compact layout for small labels"
        case .large:
            return "Large format for easy reading"
        case .custom:
            return "Fully customizable layout"
        }
    }
}

struct LabelField: Identifiable, Codable {
    let id: UUID
    var type: FieldType
    var label: String
    var isEnabled: Bool
    var order: Int
    var format: String?
    
    init(id: UUID = UUID(), type: FieldType, label: String, isEnabled: Bool = true, order: Int = 0, format: String? = nil) {
        self.id = id
        self.type = type
        self.label = label
        self.isEnabled = isEnabled
        self.order = order
        self.format = format
    }
}

enum FieldType: String, CaseIterable, Codable {
    case name = "Name"
    case company = "Company"
    case mailingAddress = "Mailing Address"
    case mailingCity = "Mailing City"
    case mailingState = "Mailing State"
    case mailingZipCode = "Mailing Zip Code"
    case siteAddress = "Site Address"
    case siteCity = "Site City"
    case siteState = "Site State"
    case siteZipCode = "Site Zip Code"
    case primaryPhone = "Primary Phone"
    case secondaryPhone = "Secondary Phone"
    case primaryEmail = "Primary Email"
    case secondaryEmail = "Secondary Email"
    case notes = "Notes"
    case custom = "Custom"
    
    var description: String {
        switch self {
        case .name:
            return "Contact's full name"
        case .company:
            return "Company or organization name"
        case .mailingAddress:
            return "Mailing address street"
        case .mailingCity:
            return "Mailing address city"
        case .mailingState:
            return "Mailing address state"
        case .mailingZipCode:
            return "Mailing address zip code"
        case .siteAddress:
            return "Site address street"
        case .siteCity:
            return "Site address city"
        case .siteState:
            return "Site address state"
        case .siteZipCode:
            return "Site address zip code"
        case .primaryPhone:
            return "Primary phone number"
        case .secondaryPhone:
            return "Secondary phone number"
        case .primaryEmail:
            return "Primary email address"
        case .secondaryEmail:
            return "Secondary email address"
        case .notes:
            return "Contact notes"
        case .custom:
            return "Custom field"
        }
    }
}

// Default templates
extension LabelTemplate {
    static let defaultTemplates: [LabelTemplate] = [
        LabelTemplate(
            name: "Standard Address",
            description: "Traditional address label format",
            layout: .standard,
            fields: [
                LabelField(type: .name, label: "Name", order: 1),
                LabelField(type: .company, label: "Company", order: 2),
                LabelField(type: .mailingAddress, label: "Address", order: 3),
                LabelField(type: .mailingCity, label: "City", order: 4),
                LabelField(type: .mailingState, label: "State", order: 5),
                LabelField(type: .mailingZipCode, label: "ZIP", order: 6)
            ],
            fontSize: 12,
            fontName: "Helvetica",
            isDefault: true
        ),
        LabelTemplate(
            name: "Compact Contact",
            description: "Compact layout with essential info",
            layout: .compact,
            fields: [
                LabelField(type: .name, label: "Name", order: 1),
                LabelField(type: .primaryPhone, label: "Phone", order: 2),
                LabelField(type: .primaryEmail, label: "Email", order: 3)
            ],
            fontSize: 10,
            fontName: "Helvetica"
        ),
        LabelTemplate(
            name: "Large Format",
            description: "Large text for easy reading",
            layout: .large,
            fields: [
                LabelField(type: .name, label: "Name", order: 1),
                LabelField(type: .company, label: "Company", order: 2),
                LabelField(type: .mailingAddress, label: "Address", order: 3),
                LabelField(type: .mailingCity, label: "City", order: 4),
                LabelField(type: .mailingState, label: "State", order: 5),
                LabelField(type: .mailingZipCode, label: "ZIP", order: 6)
            ],
            fontSize: 16,
            fontName: "Arial"
        )
    ]
} 