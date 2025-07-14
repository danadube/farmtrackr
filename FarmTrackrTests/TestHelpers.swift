//
//  TestHelpers.swift
//  FarmTrackrTests
//
//  Created by Dana Dube on 7/9/25.
//

import CoreData
import Foundation
@testable import FarmTrackr

struct TestHelpers {
    
    // MARK: - Test Persistence Controller
    
    static func createTestPersistenceController() -> PersistenceController {
        let controller = PersistenceController(inMemory: true)
        
        // Ensure the Core Data model is properly loaded
        let container = controller.container
        
        // Configure the persistent store for testing
        if let storeDescription = container.persistentStoreDescriptions.first {
            // Disable features that can cause issues in tests
            storeDescription.setOption(false as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            storeDescription.setOption(false as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
            
            // Use in-memory store for tests
            storeDescription.url = URL(fileURLWithPath: "/dev/null")
        }
        
        return controller
    }
    
    // MARK: - Test Data Creation
    
    static func createTestContact(in context: NSManagedObjectContext) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = "Test"
        contact.lastName = "Contact"
        contact.mailingAddress = "123 Test St"
        contact.city = "Test City"
        contact.state = "CA"
        contact.zipCode = 90210
        contact.farm = "Test Farm"
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
    
    static func createTestContactWithData(
        firstName: String = "Test",
        lastName: String = "Contact",
        farm: String = "Test Farm",
        in context: NSManagedObjectContext
    ) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = firstName
        contact.lastName = lastName
        contact.mailingAddress = "123 Test St"
        contact.city = "Test City"
        contact.state = "CA"
        contact.zipCode = 90210
        contact.farm = farm
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
    
    // MARK: - Context Management
    
    static func saveContext(_ context: NSManagedObjectContext) throws {
        if context.hasChanges {
            try context.save()
        }
    }
    
    static func clearContext(_ context: NSManagedObjectContext) {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = FarmContact.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        
        do {
            try context.execute(deleteRequest)
            try context.save()
        } catch {
            print("Error clearing test context: \(error)")
        }
    }
    
    // MARK: - Test Utilities
    
    static func waitForAsyncOperation(completion: @escaping () -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            completion()
        }
    }
    
    static func createMockThemeViewModel() -> ThemeViewModel {
        let themeVM = ThemeViewModel()
        themeVM.selectedTheme = "Modern Green"
        return themeVM
    }
} 