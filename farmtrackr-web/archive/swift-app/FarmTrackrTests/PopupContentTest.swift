import XCTest
import CoreData
@testable import FarmTrackr

final class PopupContentTest: XCTestCase {
    
    var persistenceController: PersistenceController!
    var context: NSManagedObjectContext!
    
    override func setUpWithError() throws {
        persistenceController = PersistenceController(inMemory: true)
        context = persistenceController.container.viewContext
    }
    
    override func tearDownWithError() throws {
        persistenceController = nil
        context = nil
    }
    
    func testContactDetailViewContent() throws {
        // Create a test contact with all required fields
        let contact = FarmContact(context: context)
        contact.firstName = "John"
        contact.lastName = "Doe"
        contact.email1 = "john.doe@example.com"
        contact.phoneNumber1 = "555-1234"
        contact.farm = "Test Farm"
        contact.city = "Test City"
        contact.state = "CA"
        contact.zipCode = 12345
        contact.mailingAddress = "123 Test St"
        contact.dateCreated = Date()
        contact.dateModified = Date()
        
        try context.save()
        
        // Test that the contact has the expected properties
        XCTAssertEqual(contact.fullName, "John Doe")
        XCTAssertEqual(contact.primaryEmail, "john.doe@example.com")
        XCTAssertEqual(contact.primaryPhone, "555-1234")
        XCTAssertEqual(contact.farm, "Test Farm")
        XCTAssertFalse(contact.displayAddress.isEmpty)
    }
    
    func testDuplicateResolutionViewContent() throws {
        // Create test duplicate contacts
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
        
        try context.save()
        
        // Test that the contacts are similar
        let name1 = contact1.fullName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let name2 = contact2.fullName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(name1, name2)
        
        // Test email similarity
        let email1 = contact1.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let email2 = contact2.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertEqual(email1, email2)
    }
    
    func testMergePreviewGeneration() throws {
        // Create test contacts for merging
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
        contact2.email2 = "john.doe2@example.com"
        contact2.phoneNumber2 = "555-5678"
        contact2.farm = "Test Farm"
        contact2.city = "Test City"
        contact2.state = "CA"
        contact2.zipCode = 12345
        contact2.mailingAddress = "123 Test St"
        contact2.dateCreated = Date()
        contact2.dateModified = Date()
        
        try context.save()
        
        // Test merge preview generation
        let contacts = [contact1, contact2]
        
        // Create a temporary contact for preview
        let tempContact = FarmContact(context: context)
        
        // Combine data from all contacts
        let firstName = contacts.compactMap { $0.firstName }.first { !$0.isEmpty } ?? ""
        let lastName = contacts.compactMap { $0.lastName }.first { !$0.isEmpty } ?? ""
        let farm = contacts.compactMap { $0.farm }.first { !$0.isEmpty } ?? ""
        
        // Collect all unique emails and phones
        let allEmails = Array(Set(contacts.compactMap { $0.email1 } + contacts.compactMap { $0.email2 }).filter { !$0.isEmpty })
        let allPhones = Array(Set([
            contacts.compactMap { $0.phoneNumber1 },
            contacts.compactMap { $0.phoneNumber2 }
        ].flatMap { $0 }).filter { !$0.isEmpty })
        
        // Set the properties
        tempContact.firstName = firstName
        tempContact.lastName = lastName
        tempContact.farm = farm
        tempContact.email1 = allEmails.indices.contains(0) ? allEmails[0] : nil
        tempContact.email2 = allEmails.indices.contains(1) ? allEmails[1] : nil
        tempContact.phoneNumber1 = allPhones.indices.contains(0) ? allPhones[0] : nil
        tempContact.phoneNumber2 = allPhones.indices.contains(1) ? allPhones[1] : nil
        
        // Test that the merged contact has the expected data
        XCTAssertEqual(tempContact.fullName, "John Doe")
        XCTAssertEqual(tempContact.farm, "Test Farm")
        XCTAssertNotNil(tempContact.email1)
        XCTAssertNotNil(tempContact.email2)
        XCTAssertNotNil(tempContact.phoneNumber1)
        XCTAssertNotNil(tempContact.phoneNumber2)
    }
} 