//
//  DataValidator.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/11/25.
//

import Foundation
import CoreData

// MARK: - Validation Results
struct ValidationResult: Identifiable {
    let id: UUID
    let field: String
    let isValid: Bool
    let score: Int // 0-100
    let suggestions: [String]
    let errors: [String]
    let warnings: [String]
}

struct DataQualityScore {
    let overallScore: Int // 0-100
    let fieldScores: [String: Int]
    let recommendations: [String]
    let criticalIssues: [String]
    let minorIssues: [String]
}

// MARK: - Enhanced Data Validator
class DataValidator: ObservableObject {
    
    // MARK: - Email Validation
    func validateEmail(_ email: String) -> ValidationResult {
        var errors: [String] = []
        var warnings: [String] = []
        var suggestions: [String] = []
        var score = 100
        
        // Basic format validation
        if !email.isValidEmail {
            errors.append("Invalid email format")
            score -= 50
        }
        
        // Check for common issues
        if email.contains(" ") {
            errors.append("Email contains spaces")
            suggestions.append("Remove spaces from email address")
            score -= 20
        }
        
        if email.hasPrefix(".") || email.hasSuffix(".") {
            warnings.append("Email starts or ends with a period")
            suggestions.append("Remove leading/trailing periods")
            score -= 10
        }
        
        if email.contains("..") {
            warnings.append("Email contains consecutive periods")
            suggestions.append("Remove consecutive periods")
            score -= 10
        }
        
        // Check for common typos
        let commonTypos = [
            "gamil.com": "gmail.com",
            "gmial.com": "gmail.com",
            "gmai.com": "gmail.com",
            "hotmai.com": "hotmail.com",
            "hotmial.com": "hotmail.com",
            "yahooo.com": "yahoo.com",
            "yaho.com": "yahoo.com"
        ]
        
        for (typo, correction) in commonTypos {
            if email.lowercased().contains(typo) {
                suggestions.append("Did you mean \(correction)?")
                score -= 15
            }
        }
        
        // Domain validation
        let components = email.components(separatedBy: "@")
        if components.count == 2 {
            let domain = components[1].lowercased()
            let validDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"]
            
            if !validDomains.contains(domain) && !domain.contains(".") {
                warnings.append("Unusual domain format")
                score -= 5
            }
        }
        
        return ValidationResult(
            id: UUID(),
            field: "Email",
            isValid: errors.isEmpty,
            score: max(0, score),
            suggestions: suggestions,
            errors: errors,
            warnings: warnings
        )
    }
    
    // MARK: - Phone Number Validation
    func validatePhoneNumber(_ phone: String) -> ValidationResult {
        var errors: [String] = []
        var warnings: [String] = []
        var suggestions: [String] = []
        var score = 100
        
        let cleaned = phone.cleanedPhoneNumber
        
        // Check if it's a valid phone number
        if !phone.isValidPhone {
            errors.append("Invalid phone number format")
            score -= 40
        }
        
        // Check length
        let digits = cleaned.filter { $0.isNumber }
        if digits.count < 10 {
            errors.append("Phone number too short (minimum 10 digits)")
            suggestions.append("Add country code or area code")
            score -= 30
        } else if digits.count > 15 {
            warnings.append("Phone number unusually long")
            score -= 10
        }
        
        // Check for common patterns
        if cleaned.hasPrefix("1") && digits.count == 11 {
            // US number with country code
            score += 10
        } else if digits.count == 10 {
            // Standard US number
            score += 5
        }
        
        // Check for suspicious patterns
        if digits.allSatisfy({ $0 == digits.first }) {
            warnings.append("All digits are the same")
            score -= 20
        }
        
        // Format suggestions
        if digits.count == 10 {
            let areaCode = String(digits.prefix(3))
            let prefix = String(digits.dropFirst(3).prefix(3))
            let line = String(digits.dropFirst(6))
            suggestions.append("Format as: (\(areaCode)) \(prefix)-\(line)")
        }
        
        return ValidationResult(
            id: UUID(),
            field: "Phone",
            isValid: errors.isEmpty,
            score: max(0, score),
            suggestions: suggestions,
            errors: errors,
            warnings: warnings
        )
    }
    
    // MARK: - Address Validation
    func validateAddress(_ address: String) -> ValidationResult {
        var errors: [String] = []
        var warnings: [String] = []
        var suggestions: [String] = []
        var score = 100
        
        let trimmed = address.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmed.isEmpty {
            errors.append("Address is empty")
            score -= 100
            return ValidationResult(
                id: UUID(),
                field: "Address",
                isValid: false,
                score: 0,
                suggestions: suggestions,
                errors: errors,
                warnings: warnings
            )
        }
        
        // Check for minimum length
        if trimmed.count < 5 {
            warnings.append("Address seems too short")
            score -= 20
        }
        
        // Check for common address patterns
        let addressPatterns = ["street", "avenue", "road", "drive", "lane", "boulevard", "way", "court", "place"]
        let hasAddressPattern = addressPatterns.contains { trimmed.lowercased().contains($0) }
        
        if !hasAddressPattern {
            warnings.append("Address may be missing street type")
            suggestions.append("Consider adding street type (St, Ave, Rd, etc.)")
            score -= 10
        }
        
        // Check for numbers
        let numbers = trimmed.components(separatedBy: CharacterSet.decimalDigits.inverted)
            .compactMap { Int($0) }
        
        if numbers.isEmpty {
            warnings.append("Address may be missing street number")
            score -= 15
        }
        
        // Check for PO Box
        if trimmed.lowercased().contains("po box") || trimmed.lowercased().contains("p.o. box") {
            score += 5 // PO Box addresses are valid
        }
        
        return ValidationResult(
            id: UUID(),
            field: "Address",
            isValid: errors.isEmpty,
            score: max(0, score),
            suggestions: suggestions,
            errors: errors,
            warnings: warnings
        )
    }
    
    // MARK: - ZIP Code Validation
    func validateZipCode(_ zipCode: String) -> ValidationResult {
        var errors: [String] = []
        var warnings: [String] = []
        var suggestions: [String] = []
        var score = 100
        
        let cleaned = zipCode.replacingOccurrences(of: "-", with: "")
        
        if cleaned.isEmpty {
            errors.append("ZIP code is empty")
            score -= 100
            return ValidationResult(
                id: UUID(),
                field: "ZIP Code",
                isValid: false,
                score: 0,
                suggestions: suggestions,
                errors: errors,
                warnings: warnings
            )
        }
        
        // Check if it's all digits
        if !cleaned.allSatisfy({ $0.isNumber }) {
            errors.append("ZIP code contains non-numeric characters")
            score -= 50
        }
        
        // Check length
        if cleaned.count == 5 {
            score += 10
        } else if cleaned.count == 9 {
            score += 5
        } else if cleaned.count < 5 {
            errors.append("ZIP code too short")
            score -= 30
        } else if cleaned.count > 9 {
            warnings.append("ZIP code unusually long")
            score -= 10
        }
        
        // Format suggestion
        if cleaned.count == 9 && !zipCode.contains("-") {
            let firstFive = String(cleaned.prefix(5))
            let lastFour = String(cleaned.dropFirst(5))
            suggestions.append("Format as: \(firstFive)-\(lastFour)")
        }
        
        return ValidationResult(
            id: UUID(),
            field: "ZIP Code",
            isValid: errors.isEmpty,
            score: max(0, score),
            suggestions: suggestions,
            errors: errors,
            warnings: warnings
        )
    }
    
    // MARK: - Name Validation
    func validateName(_ name: String, fieldName: String) -> ValidationResult {
        var errors: [String] = []
        var warnings: [String] = []
        var suggestions: [String] = []
        var score = 100
        
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmed.isEmpty {
            errors.append("\(fieldName) is empty")
            score -= 100
            return ValidationResult(
                id: UUID(),
                field: fieldName,
                isValid: false,
                score: 0,
                suggestions: suggestions,
                errors: errors,
                warnings: warnings
            )
        }
        
        // Check for minimum length
        if trimmed.count < 2 {
            warnings.append("\(fieldName) seems too short")
            score -= 20
        }
        
        // Check for numbers
        if trimmed.rangeOfCharacter(from: .decimalDigits) != nil {
            warnings.append("\(fieldName) contains numbers")
            score -= 15
        }
        
        // Check for special characters
        let specialChars = CharacterSet.letters.union(.whitespaces).union(CharacterSet(charactersIn: ".-'"))
        if !trimmed.unicodeScalars.allSatisfy({ specialChars.contains($0) }) {
            warnings.append("\(fieldName) contains unusual characters")
            score -= 10
        }
        
        // Check for all caps
        if trimmed == trimmed.uppercased() && trimmed.count > 1 {
            suggestions.append("Consider proper case formatting")
            score -= 5
        }
        
        return ValidationResult(
            id: UUID(),
            field: fieldName,
            isValid: errors.isEmpty,
            score: max(0, score),
            suggestions: suggestions,
            errors: errors,
            warnings: warnings
        )
    }
    
    // MARK: - Duplicate Detection
    func detectDuplicates(_ contacts: [ContactRecord], context: NSManagedObjectContext) -> [DuplicateGroup] {
        var duplicateGroups: [DuplicateGroup] = []
        let _: Set<Int> = []
        
        print("DataValidator: Starting duplicate detection for \(contacts.count) contacts")
        
        // Group contacts by farm for better analysis
        let contactsByFarm = Dictionary(grouping: contacts) { $0.farm }
        
        for (farm, farmContacts) in contactsByFarm {
            print("DataValidator: Analyzing \(farmContacts.count) contacts for farm: \(farm)")
            
            var farmDuplicateGroups: [DuplicateGroup] = []
            var farmProcessedIndices: Set<Int> = []
            
            // Get indices for this farm's contacts
            let farmIndices = contacts.enumerated().compactMap { index, contact in
                contact.farm == farm ? index : nil
            }
            
            for i in farmIndices {
                if farmProcessedIndices.contains(i) { continue }
                
                var group = DuplicateGroup(contacts: [contacts[i]], indices: [i])
                
                for j in farmIndices {
                    if j <= i || farmProcessedIndices.contains(j) { continue }
                    
                    if isDuplicate(contacts[i], contacts[j]) {
                        group.contacts.append(contacts[j])
                        group.indices.append(j)
                        farmProcessedIndices.insert(j)
                        print("DataValidator: Found duplicate in \(farm) - \(contacts[i].firstName) \(contacts[i].lastName) matches \(contacts[j].firstName) \(contacts[j].lastName)")
                    }
                }
                
                if group.contacts.count > 1 {
                    farmDuplicateGroups.append(group)
                    farmProcessedIndices.insert(i)
                    print("DataValidator: Duplicate group in \(farm) with \(group.contacts.count) contacts")
                }
            }
            
            duplicateGroups.append(contentsOf: farmDuplicateGroups)
        }
        
        print("DataValidator: Found \(duplicateGroups.count) duplicate groups across all farms")
        return duplicateGroups
    }
    
    private func isDuplicate(_ contact1: ContactRecord, _ contact2: ContactRecord) -> Bool {
        // Check exact name match (most reliable)
        let name1 = "\(contact1.firstName) \(contact1.lastName)".lowercased().trimmingCharacters(in: .whitespaces)
        let name2 = "\(contact2.firstName) \(contact2.lastName)".lowercased().trimmingCharacters(in: .whitespaces)
        
        if name1 == name2 && !name1.isEmpty {
            print("DataValidator: Duplicate by name: \(name1)")
            return true
        }
        
        // Check email match (very reliable)
        if let email1 = contact1.email1, let email2 = contact2.email1,
           email1.lowercased().trimmingCharacters(in: .whitespaces) == email2.lowercased().trimmingCharacters(in: .whitespaces) && !email1.isEmpty {
            print("DataValidator: Duplicate by email: \(email1)")
            return true
        }
        
        // Check phone match (reliable but needs cleaning)
        if let phone1 = contact1.phoneNumber1, let phone2 = contact2.phoneNumber1,
           phone1.cleanedPhoneNumber == phone2.cleanedPhoneNumber && !phone1.isEmpty {
            print("DataValidator: Duplicate by phone: \(phone1)")
            return true
        }
        
        // Additional checks for potential duplicates
        // Check if names are very similar (fuzzy matching)
        if areNamesSimilar(contact1, contact2) {
            print("DataValidator: Potential duplicate by similar names: \(contact1.firstName) \(contact1.lastName) vs \(contact2.firstName) \(contact2.lastName)")
            return true
        }
        
        return false
    }
    
    private func areNamesSimilar(_ contact1: ContactRecord, _ contact2: ContactRecord) -> Bool {
        let firstName1 = contact1.firstName.lowercased().trimmingCharacters(in: .whitespaces)
        let lastName1 = contact1.lastName.lowercased().trimmingCharacters(in: .whitespaces)
        let firstName2 = contact2.firstName.lowercased().trimmingCharacters(in: .whitespaces)
        let lastName2 = contact2.lastName.lowercased().trimmingCharacters(in: .whitespaces)
        
        // Check for common variations
        let variations1 = [
            firstName1,
            firstName1.replacingOccurrences(of: " ", with: ""),
            firstName1.components(separatedBy: " ").first ?? "",
            firstName1.components(separatedBy: " ").last ?? ""
        ]
        
        let variations2 = [
            firstName2,
            firstName2.replacingOccurrences(of: " ", with: ""),
            firstName2.components(separatedBy: " ").first ?? "",
            firstName2.components(separatedBy: " ").last ?? ""
        ]
        
        // If last names match and first names are similar
        if lastName1 == lastName2 && !lastName1.isEmpty {
            for var1 in variations1 {
                for var2 in variations2 {
                    if var1 == var2 && !var1.isEmpty {
                        return true
                    }
                }
            }
        }
        
        return false
    }
    
    // MARK: - Data Quality Scoring
    func calculateDataQualityScore(_ contacts: [ContactRecord]) -> DataQualityScore {
        if contacts.isEmpty {
            return DataQualityScore(
                overallScore: 100,
                fieldScores: [:],
                recommendations: ["No contacts to assess."],
                criticalIssues: [],
                minorIssues: []
            )
        }
        let fieldScores: [String: Int] = [:]
        var criticalIssues: [String] = []
        var minorIssues: [String] = []
        var recommendations: [String] = []
        
        var totalScore = 0
        let maxScore = contacts.count * 100
        
        for contact in contacts {
            var contactScore = 0
            
            // Validate names
            let firstNameResult = validateName(contact.firstName, fieldName: "First Name")
            let lastNameResult = validateName(contact.lastName, fieldName: "Last Name")
            
            if firstNameResult.score < 50 || lastNameResult.score < 50 {
                criticalIssues.append("Invalid name format for \(contact.firstName) \(contact.lastName)")
            }
            
            contactScore += (firstNameResult.score + lastNameResult.score) / 2
            
            // Validate emails
            if let email = contact.email1, !email.isEmpty {
                let emailResult = validateEmail(email)
                if emailResult.score < 50 {
                    criticalIssues.append("Invalid email format: \(email)")
                }
                contactScore += emailResult.score
            } else {
                contactScore += 50 // Partial score for missing email
            }
            
            // Validate phone numbers
            if let phone = contact.phoneNumber1, !phone.isEmpty {
                let phoneResult = validatePhoneNumber(phone)
                if phoneResult.score < 50 {
                    minorIssues.append("Invalid phone format: \(phone)")
                }
                contactScore += phoneResult.score
            } else {
                contactScore += 30 // Lower score for missing phone
            }
            
            // Validate address
            if !contact.mailingAddress.isEmpty {
                let addressResult = validateAddress(contact.mailingAddress)
                contactScore += addressResult.score
            } else {
                contactScore += 40 // Partial score for missing address
            }
            
            // Validate ZIP code
            if contact.zipCode > 0 {
                let zipResult = validateZipCode(String(contact.zipCode))
                contactScore += zipResult.score
            } else {
                contactScore += 30 // Lower score for missing ZIP
            }
            
            totalScore += contactScore
        }
        
        let overallScore = max(0, min(100, (totalScore * 100) / maxScore))
        
        // Generate recommendations
        if overallScore < 70 {
            recommendations.append("Consider reviewing and correcting data quality issues")
        }
        if criticalIssues.count > 0 {
            recommendations.append("Fix critical validation errors before import")
        }
        if minorIssues.count > 0 {
            recommendations.append("Review and correct minor data issues")
        }
        
        return DataQualityScore(
            overallScore: overallScore,
            fieldScores: fieldScores,
            recommendations: recommendations,
            criticalIssues: criticalIssues,
            minorIssues: minorIssues
        )
    }
    
    // MARK: - Farm-Specific Duplicate Analysis
    func analyzeDuplicatesByFarm(_ contacts: [ContactRecord], context: NSManagedObjectContext) -> [FarmDuplicateAnalysis] {
        let farms = Set(contacts.map { $0.farm })
        var analyses: [FarmDuplicateAnalysis] = []
        
        for farm in farms {
            let analysis = analyzeFarmDuplicates(contacts, farmName: farm)
            analyses.append(analysis)
        }
        
        // Sort by duplicate percentage (highest first)
        return analyses.sorted { $0.duplicatePercentage > $1.duplicatePercentage }
    }
    
    func analyzeFarmDuplicates(_ contacts: [ContactRecord], farmName: String) -> FarmDuplicateAnalysis {
        let farmContacts = contacts.filter { $0.farm == farmName }
        let duplicateGroups = detectDuplicates(farmContacts, context: NSManagedObjectContext(concurrencyType: .mainQueueConcurrencyType))
        
        var analysis = FarmDuplicateAnalysis(
            farmName: farmName,
            totalContacts: farmContacts.count,
            duplicateGroups: duplicateGroups.count,
            totalDuplicates: duplicateGroups.reduce(0) { $0 + $1.contacts.count },
            duplicatePatterns: [],
            recommendations: []
        )
        
        // Analyze duplicate patterns
        var nameDuplicates = 0
        var emailDuplicates = 0
        var phoneDuplicates = 0
        var similarNameDuplicates = 0
        
        for group in duplicateGroups {
            for i in 0..<group.contacts.count {
                for j in (i+1)..<group.contacts.count {
                    let contact1 = group.contacts[i]
                    let contact2 = group.contacts[j]
                    
                    // Check what caused the duplicate
                    let name1 = "\(contact1.firstName) \(contact1.lastName)".lowercased().trimmingCharacters(in: .whitespaces)
                    let name2 = "\(contact2.firstName) \(contact2.lastName)".lowercased().trimmingCharacters(in: .whitespaces)
                    
                    if name1 == name2 && !name1.isEmpty {
                        nameDuplicates += 1
                    }
                    
                    if let email1 = contact1.email1, let email2 = contact2.email1,
                       email1.lowercased().trimmingCharacters(in: .whitespaces) == email2.lowercased().trimmingCharacters(in: .whitespaces) && !email1.isEmpty {
                        emailDuplicates += 1
                    }
                    
                    if let phone1 = contact1.phoneNumber1, let phone2 = contact2.phoneNumber1,
                       phone1.cleanedPhoneNumber == phone2.cleanedPhoneNumber && !phone1.isEmpty {
                        phoneDuplicates += 1
                    }
                    
                    if areNamesSimilar(contact1, contact2) {
                        similarNameDuplicates += 1
                    }
                }
            }
        }
        
        analysis.duplicatePatterns = [
            DuplicatePattern(type: "Exact Name Match", count: nameDuplicates),
            DuplicatePattern(type: "Email Match", count: emailDuplicates),
            DuplicatePattern(type: "Phone Match", count: phoneDuplicates),
            DuplicatePattern(type: "Similar Names", count: similarNameDuplicates)
        ]
        
        // Generate recommendations
        if nameDuplicates > 0 {
            analysis.recommendations.append("Multiple contacts with identical names - check for import duplicates")
        }
        if emailDuplicates > 0 {
            analysis.recommendations.append("Multiple contacts with identical emails - verify if these are the same person")
        }
        if phoneDuplicates > 0 {
            analysis.recommendations.append("Multiple contacts with identical phone numbers - check for formatting issues")
        }
        if similarNameDuplicates > 0 {
            analysis.recommendations.append("Contacts with similar names - consider merging or clarifying")
        }
        
        if duplicateGroups.count > 5 {
            analysis.recommendations.append("High number of duplicate groups - consider reviewing import process")
        }
        
        return analysis
    }
    
    // MARK: - Contact Validation
    
    func validateContacts(_ contacts: [ContactRecord]) -> [ValidationError] {
        var errors: [ValidationError] = []
        
        for (index, contact) in contacts.enumerated() {
            let row = index + 1 // 1-based row numbers
            
            // Validate first name
            if contact.firstName.isEmpty {
                errors.append(ValidationError(
                    id: UUID(),
                    row: row,
                    field: "First Name",
                    message: "First name is required"
                ))
            } else {
                let nameResult = validateName(contact.firstName, fieldName: "First Name")
                if !nameResult.isValid {
                    let errorMessage = nameResult.errors.first ?? "Invalid first name"
                    errors.append(ValidationError(
                        id: UUID(),
                        row: row,
                        field: "First Name",
                        message: errorMessage
                    ))
                }
            }
            
            // Validate last name
            if contact.lastName.isEmpty {
                errors.append(ValidationError(
                    id: UUID(),
                    row: row,
                    field: "Last Name",
                    message: "Last name is required"
                ))
            } else {
                let nameResult = validateName(contact.lastName, fieldName: "Last Name")
                if !nameResult.isValid {
                    let errorMessage = nameResult.errors.first ?? "Invalid last name"
                    errors.append(ValidationError(
                        id: UUID(),
                        row: row,
                        field: "Last Name",
                        message: errorMessage
                    ))
                }
            }
            
            // Validate email if provided
            if let email = contact.email1, !email.isEmpty {
                let emailResult = validateEmail(email)
                if !emailResult.isValid {
                    let errorMessage = emailResult.errors.first ?? "Invalid email format"
                    errors.append(ValidationError(
                        id: UUID(),
                        row: row,
                        field: "Email",
                        message: errorMessage
                    ))
                }
            }
            
            // Validate phone number if provided
            if let phone = contact.phoneNumber1, !phone.isEmpty {
                let phoneResult = validatePhoneNumber(phone)
                if !phoneResult.isValid {
                    let errorMessage = phoneResult.errors.first ?? "Invalid phone number format"
                    errors.append(ValidationError(
                        id: UUID(),
                        row: row,
                        field: "Phone Number",
                        message: errorMessage
                    ))
                }
            }
            
            // Validate ZIP code if provided
            if contact.zipCode > 0 {
                let zipResult = validateZipCode(String(contact.zipCode))
                if !zipResult.isValid {
                    let errorMessage = zipResult.errors.first ?? "Invalid ZIP code format"
                    errors.append(ValidationError(
                        id: UUID(),
                        row: row,
                        field: "ZIP Code",
                        message: errorMessage
                    ))
                }
            }
        }
        
        return errors
    }
    
    // MARK: - Backward Compatibility
    
    func validateData(_ contacts: [ContactRecord]) -> [ValidationError] {
        return validateContacts(contacts)
    }
}

// MARK: - Duplicate Group
struct DuplicateGroup {
    var contacts: [ContactRecord]
    var indices: [Int]
    
    var primaryContact: ContactRecord {
        // Return the contact with the most complete data
        return contacts.max { contact1, contact2 in
            let score1 = calculateCompletenessScore(contact1)
            let score2 = calculateCompletenessScore(contact2)
            return score1 < score2
        } ?? contacts[0]
    }
    
    private func calculateCompletenessScore(_ contact: ContactRecord) -> Int {
        var score = 0
        
        if !contact.firstName.isEmpty { score += 10 }
        if !contact.lastName.isEmpty { score += 10 }
        if !contact.mailingAddress.isEmpty { score += 15 }
        if !contact.city.isEmpty { score += 10 }
        if !contact.state.isEmpty { score += 10 }
        if contact.zipCode > 0 { score += 10 }
        if contact.email1 != nil && !contact.email1!.isEmpty { score += 15 }
        if contact.phoneNumber1 != nil && !contact.phoneNumber1!.isEmpty { score += 10 }
        if !contact.farm.isEmpty { score += 10 }
        
        return score
    }
} 

// MARK: - Farm Duplicate Analysis Models
struct FarmDuplicateAnalysis {
    let farmName: String
    let totalContacts: Int
    let duplicateGroups: Int
    let totalDuplicates: Int
    var duplicatePatterns: [DuplicatePattern]
    var recommendations: [String]
    
    var duplicatePercentage: Double {
        guard totalContacts > 0 else { return 0 }
        return Double(totalDuplicates) / Double(totalContacts) * 100
    }
}

struct DuplicatePattern {
    let type: String
    let count: Int
} 