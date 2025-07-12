//
//  DataValidator.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData

// MARK: - Data Quality Issues
enum DataQualityIssue: String, CaseIterable {
    case missingEmail = "Missing Email"
    case invalidEmail = "Invalid Email"
    case missingPhone = "Missing Phone"
    case invalidPhone = "Invalid Phone"
    case missingAddress = "Missing Address"
    case missingFarm = "Missing Farm"
    case duplicateContact = "Duplicate Contact"
    case incompleteName = "Incomplete Name"
    
    var icon: String {
        switch self {
        case .missingEmail, .invalidEmail:
            return "envelope.fill"
        case .missingPhone, .invalidPhone:
            return "phone.fill"
        case .missingAddress:
            return "location.fill"
        case .missingFarm:
            return "building.2.fill"
        case .duplicateContact:
            return "person.2.fill"
        case .incompleteName:
            return "person.fill"
        }
    }
    
    var severity: IssueSeverity {
        switch self {
        case .duplicateContact, .invalidEmail, .invalidPhone:
            return .high
        case .missingEmail, .missingPhone, .incompleteName:
            return .medium
        case .missingAddress, .missingFarm:
            return .low
        }
    }
}

enum IssueSeverity: String, CaseIterable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    
    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "orange"
        case .high: return "red"
        }
    }
}

// MARK: - Contact Quality Report
struct ContactQualityReport {
    let contact: FarmContact
    let issues: [DataQualityIssue]
    let completenessScore: Double
    let hasHighPriorityIssues: Bool
    
    var displayIssues: [DataQualityIssue] {
        issues.sorted { $0.severity.rawValue > $1.severity.rawValue }
    }
}

// MARK: - Data Validator
class DataValidator: ObservableObject {
    static let shared = DataValidator()
    
    private init() {}
    
    // MARK: - Validation Methods
    func validateEmail(_ email: String?) -> Bool {
        guard let email = email, !email.isEmpty else { return false }
        
        let emailRegex = Constants.Validation.emailRegex
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    func validatePhone(_ phone: String?) -> Bool {
        guard let phone = phone, !phone.isEmpty else { return false }
        
        // Remove all non-digit characters for validation
        let digits = phone.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        return digits.count >= 10 && digits.count <= 15
    }
    
    func validateZipCode(_ zipCode: String?) -> Bool {
        guard let zipCode = zipCode, !zipCode.isEmpty else { return false }
        
        let zipRegex = Constants.Validation.zipCodeRegex
        let zipPredicate = NSPredicate(format: "SELF MATCHES %@", zipRegex)
        return zipPredicate.evaluate(with: zipCode)
    }
    
    func isCompleteName(_ contact: FarmContact) -> Bool {
        let firstName = contact.firstName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let lastName = contact.lastName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return !firstName.isEmpty && !lastName.isEmpty
    }
    
    func hasCompleteAddress(_ contact: FarmContact) -> Bool {
        let address = contact.mailingAddress?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let city = contact.city?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let state = contact.state?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let zip = contact.formattedZipCode.trimmingCharacters(in: .whitespacesAndNewlines)
        
        return !address.isEmpty && !city.isEmpty && !state.isEmpty && !zip.isEmpty
    }
    
    // MARK: - Quality Assessment
    func assessContactQuality(_ contact: FarmContact) -> ContactQualityReport {
        var issues: [DataQualityIssue] = []
        
        // Check for missing email
        if contact.primaryEmail?.isEmpty ?? true {
            issues.append(.missingEmail)
        } else if !validateEmail(contact.primaryEmail) {
            issues.append(.invalidEmail)
        }
        
        // Check for missing phone
        if contact.primaryPhone?.isEmpty ?? true {
            issues.append(.missingPhone)
        } else if !validatePhone(contact.primaryPhone) {
            issues.append(.invalidPhone)
        }
        
        // Check for missing address
        if !hasCompleteAddress(contact) {
            issues.append(.missingAddress)
        }
        
        // Check for missing farm
        if contact.farm?.isEmpty ?? true {
            issues.append(.missingFarm)
        }
        
        // Check for incomplete name
        if !isCompleteName(contact) {
            issues.append(.incompleteName)
        }
        
        // Calculate completeness score
        let completenessScore = calculateCompletenessScore(contact, issues: issues)
        
        // Check for high priority issues
        let hasHighPriorityIssues = issues.contains { $0.severity == .high }
        
        return ContactQualityReport(
            contact: contact,
            issues: issues,
            completenessScore: completenessScore,
            hasHighPriorityIssues: hasHighPriorityIssues
        )
    }
    
    private func calculateCompletenessScore(_ contact: FarmContact, issues: [DataQualityIssue]) -> Double {
        let totalFields = 8.0 // firstName, lastName, email, phone, address, city, state, zip, farm
        var completedFields = 0.0
        
        if !(contact.firstName?.isEmpty ?? true) { completedFields += 1 }
        if !(contact.lastName?.isEmpty ?? true) { completedFields += 1 }
        if !(contact.primaryEmail?.isEmpty ?? true) && validateEmail(contact.primaryEmail) { completedFields += 1 }
        if !(contact.primaryPhone?.isEmpty ?? true) && validatePhone(contact.primaryPhone) { completedFields += 1 }
        if !(contact.mailingAddress?.isEmpty ?? true) { completedFields += 1 }
        if !(contact.city?.isEmpty ?? true) { completedFields += 1 }
        if !(contact.state?.isEmpty ?? true) { completedFields += 1 }
        if !contact.formattedZipCode.isEmpty && validateZipCode(contact.formattedZipCode) { completedFields += 1 }
        if !(contact.farm?.isEmpty ?? true) { completedFields += 1 }
        
        return (completedFields / totalFields) * 100
    }
    
    // MARK: - Duplicate Detection
    func findDuplicateContacts(_ contacts: [FarmContact]) -> [FarmContact] {
        var duplicates: [FarmContact] = []
        var seenEmails: Set<String> = []
        var seenPhones: Set<String> = []
        
        for contact in contacts {
            if let email = contact.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
               !email.isEmpty {
                if seenEmails.contains(email) {
                    duplicates.append(contact)
                } else {
                    seenEmails.insert(email)
                }
            }
            
            if let phone = contact.primaryPhone?.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression),
               !phone.isEmpty {
                if seenPhones.contains(phone) {
                    duplicates.append(contact)
                } else {
                    seenPhones.insert(phone)
                }
            }
        }
        
        return Array(Set(duplicates))
    }
    
    // MARK: - Bulk Quality Assessment
    func assessAllContactsQuality(_ contacts: [FarmContact]) -> [ContactQualityReport] {
        return contacts.map { assessContactQuality($0) }
    }
    
    func getQualitySummary(_ reports: [ContactQualityReport]) -> QualitySummary {
        let totalContacts = reports.count
        let contactsWithIssues = reports.filter { !$0.issues.isEmpty }.count
        let highPriorityIssues = reports.filter { $0.hasHighPriorityIssues }.count
        let averageCompleteness = reports.map { $0.completenessScore }.reduce(0, +) / Double(totalContacts)
        
        let issueCounts = reports.flatMap { $0.issues }.reduce(into: [:]) { counts, issue in
            counts[issue, default: 0] += 1
        }
        
        return QualitySummary(
            totalContacts: totalContacts,
            contactsWithIssues: contactsWithIssues,
            highPriorityIssues: highPriorityIssues,
            averageCompleteness: averageCompleteness,
            issueBreakdown: issueCounts
        )
    }
}

// MARK: - Quality Summary
struct QualitySummary {
    let totalContacts: Int
    let contactsWithIssues: Int
    let highPriorityIssues: Int
    let averageCompleteness: Double
    let issueBreakdown: [DataQualityIssue: Int]
    
    var qualityPercentage: Double {
        guard totalContacts > 0 else { return 100 }
        return Double(totalContacts - contactsWithIssues) / Double(totalContacts) * 100
    }
    
    var completenessPercentage: Double {
        return averageCompleteness
    }
} 