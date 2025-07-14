import XCTest
import CoreData
@testable import FarmTrackr

final class CoreDataModelTest: XCTestCase {
    
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
    
    func testFarmContactCreation() throws {
        // Test that we can create a FarmContact
        let contact = FarmContact(context: context)
        
        // Test that the firstName property exists and can be set
        contact.firstName = "John"
        contact.lastName = "Doe"
        contact.mailingAddress = "123 Main St"
        contact.city = "Springfield"
        contact.state = "IL"
        contact.zipCode = 62704
        contact.farm = "Test Farm"
        
        // Test that the properties can be read back
        XCTAssertEqual(contact.firstName, "John")
        XCTAssertEqual(contact.lastName, "Doe")
        XCTAssertEqual(contact.mailingAddress, "123 Main St")
        XCTAssertEqual(contact.city, "Springfield")
        XCTAssertEqual(contact.state, "IL")
        XCTAssertEqual(contact.zipCode, 62704)
        XCTAssertEqual(contact.farm, "Test Farm")
        
        // Test that we can save the context
        try context.save()
        
        // Test that we can fetch the contact back
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "firstName == %@", "John")
        
        let results = try context.fetch(fetchRequest)
        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.firstName, "John")
    }
    
    func testFarmContactComputedProperties() throws {
        let contact = FarmContact(context: context)
        contact.firstName = "Jane"
        contact.lastName = "Smith"
        contact.mailingAddress = "456 Oak Ave"
        contact.city = "Chicago"
        contact.state = "IL"
        contact.zipCode = 60601
        contact.farm = "Test Farm"
        
        // Test computed properties
        XCTAssertEqual(contact.fullName, "Jane Smith")
        XCTAssertEqual(contact.formattedZipCode, "60601")
        XCTAssertEqual(contact.displayAddress, "456 Oak Ave\nChicago, IL 60601")
        
        try context.save()
    }
} 