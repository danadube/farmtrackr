import XCTest
import CoreData
@testable import FarmTrackr

final class DuplicateDetectionTest: XCTestCase {
    
    var persistenceController: PersistenceController!
    var context: NSManagedObjectContext!
    var dataValidator: DataValidator!
    
    override func setUpWithError() throws {
        persistenceController = PersistenceController(inMemory: true)
        context = persistenceController.container.viewContext
        dataValidator = DataValidator()
    }
    
    override func tearDownWithError() throws {
        persistenceController = nil
        context = nil
        dataValidator = nil
    }
    
    func testDuplicateDetection() throws {
        // Create test contacts with duplicates
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
        
        let contact3 = FarmContact(context: context)
        contact3.firstName = "Jane"
        contact3.lastName = "Smith"
        contact3.email1 = "jane.smith@example.com"
        contact3.phoneNumber1 = "555-5678"
        contact3.farm = "Test Farm"
        contact3.city = "Test City"
        contact3.state = "CA"
        contact3.zipCode = 12345
        contact3.mailingAddress = "456 Test St"
        
        // Save the contacts
        try context.save()
        
        // Convert to ContactRecord for duplicate detection
        let contactRecords = [
            ContactRecord(
                firstName: contact1.firstName ?? "",
                lastName: contact1.lastName ?? "",
                mailingAddress: contact1.mailingAddress ?? "",
                city: contact1.city ?? "",
                state: contact1.state ?? "",
                zipCode: Int32(contact1.zipCode),
                email1: contact1.email1,
                email2: contact1.email2,
                phoneNumber1: contact1.phoneNumber1,
                phoneNumber2: contact1.phoneNumber2,
                phoneNumber3: contact1.phoneNumber3,
                phoneNumber4: contact1.phoneNumber4,
                phoneNumber5: contact1.phoneNumber5,
                phoneNumber6: contact1.phoneNumber6,
                siteMailingAddress: contact1.siteMailingAddress,
                siteCity: contact1.siteCity,
                siteState: contact1.siteState,
                siteZipCode: Int32(contact1.siteZipCode),
                notes: contact1.notes,
                farm: contact1.farm ?? ""
            ),
            ContactRecord(
                firstName: contact2.firstName ?? "",
                lastName: contact2.lastName ?? "",
                mailingAddress: contact2.mailingAddress ?? "",
                city: contact2.city ?? "",
                state: contact2.state ?? "",
                zipCode: Int32(contact2.zipCode),
                email1: contact2.email1,
                email2: contact2.email2,
                phoneNumber1: contact2.phoneNumber1,
                phoneNumber2: contact2.phoneNumber2,
                phoneNumber3: contact2.phoneNumber3,
                phoneNumber4: contact2.phoneNumber4,
                phoneNumber5: contact2.phoneNumber5,
                phoneNumber6: contact2.phoneNumber6,
                siteMailingAddress: contact2.siteMailingAddress,
                siteCity: contact2.siteCity,
                siteState: contact2.siteState,
                siteZipCode: Int32(contact2.siteZipCode),
                notes: contact2.notes,
                farm: contact2.farm ?? ""
            ),
            ContactRecord(
                firstName: contact3.firstName ?? "",
                lastName: contact3.lastName ?? "",
                mailingAddress: contact3.mailingAddress ?? "",
                city: contact3.city ?? "",
                state: contact3.state ?? "",
                zipCode: Int32(contact3.zipCode),
                email1: contact3.email1,
                email2: contact3.email2,
                phoneNumber1: contact3.phoneNumber1,
                phoneNumber2: contact3.phoneNumber2,
                phoneNumber3: contact3.phoneNumber3,
                phoneNumber4: contact3.phoneNumber4,
                phoneNumber5: contact3.phoneNumber5,
                phoneNumber6: contact3.phoneNumber6,
                siteMailingAddress: contact3.siteMailingAddress,
                siteCity: contact3.siteCity,
                siteState: contact3.siteState,
                siteZipCode: Int32(contact3.siteZipCode),
                notes: contact3.notes,
                farm: contact3.farm ?? ""
            )
        ]
        
        // Test duplicate detection
        let duplicateGroups = dataValidator.detectDuplicates(contactRecords, context: context)
        
        // Should find 1 duplicate group with 2 contacts (John Doe)
        XCTAssertEqual(duplicateGroups.count, 1, "Should find exactly 1 duplicate group")
        XCTAssertEqual(duplicateGroups.first?.contacts.count, 2, "Duplicate group should contain 2 contacts")
        
        // Verify the duplicate group contains the John Doe contacts
        let duplicateGroup = duplicateGroups.first!
        let duplicateNames = duplicateGroup.contacts.map { "\($0.firstName) \($0.lastName)" }
        XCTAssertTrue(duplicateNames.allSatisfy { $0 == "John Doe" }, "All contacts in duplicate group should be John Doe")
    }
    
    func testNoDuplicates() throws {
        // Create test contacts without duplicates
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
        
        let contact2 = FarmContact(context: context)
        contact2.firstName = "Jane"
        contact2.lastName = "Smith"
        contact2.email1 = "jane.smith@example.com"
        contact2.phoneNumber1 = "555-5678"
        contact2.farm = "Test Farm"
        contact2.city = "Test City"
        contact2.state = "CA"
        contact2.zipCode = 12345
        contact2.mailingAddress = "456 Test St"
        
        // Save the contacts
        try context.save()
        
        // Convert to ContactRecord for duplicate detection
        let contactRecords = [
            ContactRecord(
                firstName: contact1.firstName ?? "",
                lastName: contact1.lastName ?? "",
                mailingAddress: contact1.mailingAddress ?? "",
                city: contact1.city ?? "",
                state: contact1.state ?? "",
                zipCode: Int32(contact1.zipCode),
                email1: contact1.email1,
                email2: contact1.email2,
                phoneNumber1: contact1.phoneNumber1,
                phoneNumber2: contact1.phoneNumber2,
                phoneNumber3: contact1.phoneNumber3,
                phoneNumber4: contact1.phoneNumber4,
                phoneNumber5: contact1.phoneNumber5,
                phoneNumber6: contact1.phoneNumber6,
                siteMailingAddress: contact1.siteMailingAddress,
                siteCity: contact1.siteCity,
                siteState: contact1.siteState,
                siteZipCode: Int32(contact1.siteZipCode),
                notes: contact1.notes,
                farm: contact1.farm ?? ""
            ),
            ContactRecord(
                firstName: contact2.firstName ?? "",
                lastName: contact2.lastName ?? "",
                mailingAddress: contact2.mailingAddress ?? "",
                city: contact2.city ?? "",
                state: contact2.state ?? "",
                zipCode: Int32(contact2.zipCode),
                email1: contact2.email1,
                email2: contact2.email2,
                phoneNumber1: contact2.phoneNumber1,
                phoneNumber2: contact2.phoneNumber2,
                phoneNumber3: contact2.phoneNumber3,
                phoneNumber4: contact2.phoneNumber4,
                phoneNumber5: contact2.phoneNumber5,
                phoneNumber6: contact2.phoneNumber6,
                siteMailingAddress: contact2.siteMailingAddress,
                siteCity: contact2.siteCity,
                siteState: contact2.siteState,
                siteZipCode: Int32(contact2.siteZipCode),
                notes: contact2.notes,
                farm: contact2.farm ?? ""
            )
        ]
        
        // Test duplicate detection
        let duplicateGroups = dataValidator.detectDuplicates(contactRecords, context: context)
        
        // Should find no duplicate groups
        XCTAssertEqual(duplicateGroups.count, 0, "Should find no duplicate groups")
    }
} 