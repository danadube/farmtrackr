import Foundation
import CoreData

class DataCleanupManager: ObservableObject {
    @Published var isCleaning = false
    @Published var progress: Double = 0.0
    @Published var status = ""
    @Published var cleanupResults = CleanupResults()
    
    struct CleanupResults {
        var totalContacts = 0
        var fixedZipCodes = 0
        var fixedPhoneNumbers = 0
        var errors = 0
    }
    
    func cleanupData(context: NSManagedObjectContext) async {
        await MainActor.run {
            isCleaning = true
            progress = 0.0
            status = "Starting data cleanup..."
            cleanupResults = CleanupResults()
        }
        
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        
        do {
            let contacts = try context.fetch(fetchRequest)
            await MainActor.run {
                cleanupResults.totalContacts = contacts.count
            }
            
            for (index, contact) in contacts.enumerated() {
                await MainActor.run {
                    progress = Double(index) / Double(contacts.count)
                    status = "Processing contact \(index + 1) of \(contacts.count)..."
                }
                
                var needsSave = false
                
                // Fix zip codes
                if let fixedZip = fixZipCode(contact.zipCode) {
                    contact.zipCode = fixedZip
                    await MainActor.run {
                        cleanupResults.fixedZipCodes += 1
                    }
                    needsSave = true
                }
                
                // Fix site zip codes
                if let fixedSiteZip = fixZipCode(contact.siteZipCode) {
                    contact.siteZipCode = fixedSiteZip
                    await MainActor.run {
                        cleanupResults.fixedZipCodes += 1
                    }
                    needsSave = true
                }
                
                // Fix phone numbers
                let phoneFields = [
                    \FarmContact.phoneNumber1,
                    \FarmContact.phoneNumber2,
                    \FarmContact.phoneNumber3,
                    \FarmContact.phoneNumber4,
                    \FarmContact.phoneNumber5,
                    \FarmContact.phoneNumber6
                ]
                
                for phoneField in phoneFields {
                    if let currentPhone = contact[keyPath: phoneField],
                       !currentPhone.isEmpty,
                       let fixedPhone = fixPhoneNumber(currentPhone) {
                        contact[keyPath: phoneField] = fixedPhone
                        await MainActor.run {
                            cleanupResults.fixedPhoneNumbers += 1
                        }
                        needsSave = true
                    }
                }
                
                if needsSave {
                    contact.dateModified = Date()
                }
            }
            
            // Save all changes
            try context.save()
            
            await MainActor.run {
                progress = 1.0
                status = "Cleanup completed successfully!"
                isCleaning = false
            }
            
        } catch {
            await MainActor.run {
                cleanupResults.errors += 1
                status = "Error during cleanup: \(error.localizedDescription)"
                isCleaning = false
            }
        }
    }
    
    private func fixZipCode(_ zipCode: Int32) -> Int32? {
        let zipString = String(zipCode)
        
        // Remove trailing zeros if they make the zip code too long
        if zipString.count > 9 {
            let trimmed = zipString.trimmingCharacters(in: CharacterSet(charactersIn: "0"))
            if trimmed.count <= 9, let fixed = Int32(trimmed) {
                return fixed
            }
        }
        
        // Add leading zeros if needed (for 4-digit zip codes)
        if zipString.count == 4 {
            let withLeadingZero = "0" + zipString
            if let fixed = Int32(withLeadingZero) {
                return fixed
            }
        }
        
        // If zip code is 5 or 9 digits, it's already correct
        if zipString.count == 5 || zipString.count == 9 {
            return nil // No fix needed
        }
        
        return nil
    }
    
    private func fixPhoneNumber(_ phone: String) -> String? {
        // Remove all non-digit characters
        let digits = phone.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        
        // Handle scientific notation (e.g., 1.5551234567e+10)
        if let doubleValue = Double(phone), digits.count < 10 {
            let noExp = String(format: "%.0f", doubleValue)
            if noExp.count >= 10 {
                return formatPhoneNumber(noExp)
            }
        }
        
        // If it's already 10 digits, format it properly
        if digits.count == 10 {
            return formatPhoneNumber(digits)
        }
        
        // If it's 11 digits and starts with 1, remove the 1
        if digits.count == 11 && digits.hasPrefix("1") {
            let withoutOne = String(digits.dropFirst())
            return formatPhoneNumber(withoutOne)
        }
        
        return nil
    }
    
    private func formatPhoneNumber(_ digits: String) -> String {
        if digits.count == 10 {
            let area = digits.prefix(3)
            let mid = digits.dropFirst(3).prefix(3)
            let last = digits.suffix(4)
            return "(\(area)) \(mid)-\(last)"
        }
        return digits
    }
} 