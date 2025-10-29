import Foundation
import CoreData

class TestDataHelper {
    
    static func addTestDuplicates(context: NSManagedObjectContext) {
        // Create duplicate contacts for testing
        let contact1 = FarmContact(context: context)
        contact1.firstName = "John"
        contact1.lastName = "Doe"
        contact1.email1 = "john.doe@example.com"
        contact1.phoneNumber1 = "555-1234"
        contact1.farm = "Test Farm"
        contact1.city = "Test City"
        contact1.state = "CA"
        contact1.zipCode = 12345
        contact1.mailingAddress = "123 Test St"
        contact1.dateCreated = Date()
        contact1.dateModified = Date()
        
        let contact2 = FarmContact(context: context)
        contact2.firstName = "John"
        contact2.lastName = "Doe"
        contact2.email1 = "john.doe@example.com"
        contact2.phoneNumber1 = "555-1234"
        contact2.farm = "Test Farm"
        contact2.city = "Test City"
        contact2.state = "CA"
        contact2.zipCode = 12345
        contact2.mailingAddress = "123 Test St"
        contact2.dateCreated = Date()
        contact2.dateModified = Date()
        
        let contact3 = FarmContact(context: context)
        contact3.firstName = "Jane"
        contact3.lastName = "Smith"
        contact3.email1 = "jane.smith@example.com"
        contact3.phoneNumber1 = "555-5678"
        contact3.farm = "Another Farm"
        contact3.city = "Another City"
        contact3.state = "NY"
        contact3.zipCode = 54321
        contact3.mailingAddress = "456 Another St"
        contact3.dateCreated = Date()
        contact3.dateModified = Date()
        
        let contact4 = FarmContact(context: context)
        contact4.firstName = "Jane"
        contact4.lastName = "Smith"
        contact4.email1 = "jane.smith@example.com"
        contact4.phoneNumber1 = "555-5678"
        contact4.farm = "Another Farm"
        contact4.city = "Another City"
        contact4.state = "NY"
        contact4.zipCode = 54321
        contact4.mailingAddress = "456 Another St"
        contact4.dateCreated = Date()
        contact4.dateModified = Date()
        
        let contact5 = FarmContact(context: context)
        contact5.firstName = "Bob"
        contact5.lastName = "Johnson"
        contact5.email1 = "bob.johnson@example.com"
        contact5.phoneNumber1 = "555-9999"
        contact5.farm = "Third Farm"
        contact5.city = "Third City"
        contact5.state = "TX"
        contact5.zipCode = 98765
        contact5.mailingAddress = "789 Third St"
        contact5.dateCreated = Date()
        contact5.dateModified = Date()
        
        let contact6 = FarmContact(context: context)
        contact6.firstName = "Bob"
        contact6.lastName = "Johnson"
        contact6.email1 = "bob.johnson@example.com"
        contact6.phoneNumber1 = "555-9999"
        contact6.farm = "Third Farm"
        contact6.city = "Third City"
        contact6.state = "TX"
        contact6.zipCode = 98765
        contact6.mailingAddress = "789 Third St"
        contact6.dateCreated = Date()
        contact6.dateModified = Date()
        
        do {
            try context.save()
            print("Test duplicates added successfully")
        } catch {
            print("Failed to add test duplicates: \(error)")
        }
    }
    
    static func addTestContact(context: NSManagedObjectContext) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = "Test"
        contact.lastName = "Contact"
        contact.email1 = "test.contact@example.com"
        contact.phoneNumber1 = "555-9999"
        contact.farm = "Test Farm"
        contact.city = "Test City"
        contact.state = "CA"
        contact.zipCode = 12345
        contact.mailingAddress = "789 Test St"
        contact.notes = "This is a test contact for popup testing"
        contact.dateCreated = Date()
        contact.dateModified = Date()
        
        do {
            try context.save()
            print("Test contact added successfully")
        } catch {
            print("Failed to add test contact: \(error)")
        }
        
        return contact
    }
    
    static func clearTestData(context: NSManagedObjectContext) {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = FarmContact.fetchRequest()
        
        do {
            let contacts = try context.fetch(fetchRequest) as! [FarmContact]
            for contact in contacts {
                context.delete(contact)
            }
            try context.save()
            print("Test data cleared successfully")
        } catch {
            print("Failed to clear test data: \(error)")
        }
    }
    
    static func cleanupMergedContacts(context: NSManagedObjectContext) {
        let request: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        request.predicate = NSPredicate(format: "firstName == %@ AND lastName == %@", "Merged", "Contact")
        
        do {
            let mergedContacts = try context.fetch(request)
            print("TestDataHelper: Found \(mergedContacts.count) incorrectly created 'Merged Contact' entries")
            
            for contact in mergedContacts {
                print("TestDataHelper: Deleting bad merged contact: \(contact.fullName)")
                context.delete(contact)
            }
            
            try context.save()
            print("TestDataHelper: Successfully cleaned up \(mergedContacts.count) bad merged contacts")
        } catch {
            print("TestDataHelper: Failed to clean up merged contacts: \(error.localizedDescription)")
        }
    }
    
    static func cleanupMergedContactsWithNoData(context: NSManagedObjectContext) {
        let request: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        request.predicate = NSPredicate(format: "firstName == %@ OR (firstName == %@ AND lastName == %@)", "Unknown", "Merged", "Contact")
        
        do {
            let badContacts = try context.fetch(request)
            print("TestDataHelper: Found \(badContacts.count) contacts with bad data to clean up")
            
            for contact in badContacts {
                print("TestDataHelper: Deleting contact with bad data: \(contact.fullName)")
                context.delete(contact)
            }
            
            try context.save()
            print("TestDataHelper: Successfully cleaned up \(badContacts.count) contacts with bad data")
        } catch {
            print("TestDataHelper: Failed to clean up contacts with bad data: \(error.localizedDescription)")
        }
    }
    
    static func cleanupAllBadMergedContacts(context: NSManagedObjectContext) {
        print("TestDataHelper: Starting comprehensive cleanup of bad merged contacts")
        
        // Clean up contacts with generic names
        let genericNamesRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        genericNamesRequest.predicate = NSPredicate(format: "firstName IN %@ OR lastName IN %@", 
                                                   ["Merged", "Unknown", "Test"], 
                                                   ["Contact", "Unknown", "Contact"])
        
        do {
            let genericContacts = try context.fetch(genericNamesRequest)
            print("TestDataHelper: Found \(genericContacts.count) contacts with generic names")
            
            for contact in genericContacts {
                print("TestDataHelper: Deleting generic contact: \(contact.fullName)")
                context.delete(contact)
            }
            
            // Also clean up contacts with no meaningful data
            let emptyDataRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            emptyDataRequest.predicate = NSPredicate(format: "(firstName == %@ OR firstName == %@ OR firstName == %@) AND (email1 == %@ OR email1 == nil) AND (phoneNumber1 == %@ OR phoneNumber1 == nil)", 
                                                    "", "Unknown", "Merged", "", "")
            
            let emptyContacts = try context.fetch(emptyDataRequest)
            print("TestDataHelper: Found \(emptyContacts.count) contacts with empty data")
            
            for contact in emptyContacts {
                print("TestDataHelper: Deleting empty contact: \(contact.fullName)")
                context.delete(contact)
            }
            
            try context.save()
            print("TestDataHelper: Successfully cleaned up \(genericContacts.count + emptyContacts.count) bad contacts")
        } catch {
            print("TestDataHelper: Failed to clean up bad contacts: \(error.localizedDescription)")
        }
    }
} 