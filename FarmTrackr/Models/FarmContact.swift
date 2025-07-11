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
        "\(firstName ?? "") \(lastName ?? "")".trimmingCharacters(in: .whitespaces)
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
    
    var allPhoneNumbers: [String] {
        [phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
    }
    
    var allEmails: [String] {
        [email1, email2]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
    }
} 