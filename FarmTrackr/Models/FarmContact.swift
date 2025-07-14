//
//  FarmContact.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData

// Only custom extensions and computed properties below

extension FarmContact {
    // Computed properties for display
    var fullName: String {
        let first = firstName?.trimmingCharacters(in: .whitespaces) ?? ""
        let last = lastName?.trimmingCharacters(in: .whitespaces) ?? ""
        
        if first.isEmpty && last.isEmpty {
            return ""
        } else if first.isEmpty {
            return last
        } else if last.isEmpty {
            return first
        } else {
            return "\(first) \(last)"
        }
    }
    
    // Formatted zip code properties
    var formattedZipCode: String {
        if zipCode > 0 {
            let zipString = String(zipCode)
            if zipString.count == 9 {
                return "\(zipString.prefix(5))-\(zipString.dropFirst(5))"
            } else {
                return zipString
            }
        }
        return ""
    }
    
    var formattedSiteZipCode: String {
        if siteZipCode > 0 {
            let zipString = String(siteZipCode)
            if zipString.count == 9 {
                return "\(zipString.prefix(5))-\(zipString.dropFirst(5))"
            } else {
                return zipString
            }
        }
        return ""
    }
    
    var displayAddress: String {
        var address = mailingAddress ?? ""
        var cityStateZip = ""
        
        if let city = city, !city.isEmpty {
            cityStateZip += city
        }
        if let state = state, !state.isEmpty {
            if !cityStateZip.isEmpty {
                cityStateZip += ", "
            }
            cityStateZip += state
        }
        if !formattedZipCode.isEmpty {
            if !cityStateZip.isEmpty {
                cityStateZip += " "
            }
            cityStateZip += formattedZipCode
        }
        
        if !cityStateZip.isEmpty {
            address += "\n\(cityStateZip)"
        }
        return address
    }
    
    var displaySiteAddress: String {
        guard let siteAddress = siteMailingAddress, !siteAddress.isEmpty else { return "" }
        var cityStateZip = ""
        
        if let siteCity = siteCity, !siteCity.isEmpty {
            cityStateZip += siteCity
        }
        if let siteState = siteState, !siteState.isEmpty {
            if !cityStateZip.isEmpty {
                cityStateZip += ", "
            }
            cityStateZip += siteState
        }
        if !formattedSiteZipCode.isEmpty {
            if !cityStateZip.isEmpty {
                cityStateZip += " "
            }
            cityStateZip += formattedSiteZipCode
        }
        
        if !cityStateZip.isEmpty {
            return "\(siteAddress)\n\(cityStateZip)"
        }
        return siteAddress
    }
    
    var primaryEmail: String? {
        if let email1 = email1, !email1.isEmpty { return email1 }
        return email2
    }
    
    var primaryPhone: String? {
        [phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
            .first
    }
    
    var primaryPhoneFormatted: String {
        let phoneNumbers = [phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6]
        if let raw = phoneNumbers.first(where: { ($0 ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false }) {
            let phone = FarmContact.formatPhone(raw ?? "")
            return phone
        }
        return ""
    }
    
    static func formatPhone(_ input: String) -> String {
        // Remove all non-digit characters
        let digits = input
            .replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        // If input is in scientific notation, try to convert
        if let doubleValue = Double(input), digits.count < 10 {
            let noExp = String(format: "%.0f", doubleValue)
            if noExp.count >= 10 {
                return FarmContact.formatPhone(noExp)
            }
        }
        // Format as (XXX) XXX-XXXX if 10 digits
        if digits.count == 10 {
            let area = digits.prefix(3)
            let mid = digits.dropFirst(3).prefix(3)
            let last = digits.suffix(4)
            return "(\(area)) \(mid)-\(last)"
        }
        // Format as +1 (XXX) XXX-XXXX if 11 digits and starts with 1
        if digits.count == 11 && digits.first == "1" {
            let area = digits.dropFirst().prefix(3)
            let mid = digits.dropFirst(4).prefix(3)
            let last = digits.suffix(4)
            return "+1 (\(area)) \(mid)-\(last)"
        }
        // Otherwise, return the original input trimmed
        return input.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    var allPhoneNumbers: [String] {
        [phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
    }
    
    var allEmails: [String] {
        [email1, email2]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
    }
    
    static func preview(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = "Jane"
        contact.lastName = "Doe"
        contact.mailingAddress = "123 Main St"
        contact.city = "Springfield"
        contact.state = "IL"
        contact.zipCode = 62704
        contact.email1 = "jane.doe@example.com"
        contact.phoneNumber1 = "555-123-4567"
        contact.siteMailingAddress = "456 Field Rd"
        contact.siteCity = "Springfield"
        contact.siteState = "IL"
        contact.siteZipCode = 62705
        contact.notes = "Preview contact for label template."
        contact.farm = "Doe Family Farm"
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
} 