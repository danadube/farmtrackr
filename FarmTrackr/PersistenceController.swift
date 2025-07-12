//
//  PersistenceController.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import CoreData

struct PersistenceController {
    static let shared = PersistenceController()

    static var preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        
        // Create sample data for previews
        let sampleContact = FarmContact(context: viewContext)
        sampleContact.firstName = "John"
        sampleContact.lastName = "Doe"
        sampleContact.mailingAddress = "123 Farm Road"
        sampleContact.city = "Farmville"
        sampleContact.state = "CA"
        sampleContact.zipCode = 90210
        sampleContact.email1 = "john.doe@farm.com"
        sampleContact.phoneNumber1 = "(555) 123-4567"
        sampleContact.farm = "Glaab Farm"
        sampleContact.dateCreated = Date()
        sampleContact.dateModified = Date()
        
        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "GlaabFarmCRM")
        
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        
        // Configure the persistent store for better performance and reliability
        if let storeDescription = container.persistentStoreDescriptions.first {
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
            
            // For in-memory stores, disable some features that can cause issues in tests
            if inMemory {
                storeDescription.setOption(false as NSNumber, forKey: NSPersistentHistoryTrackingKey)
                storeDescription.setOption(false as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
            }
        }
        
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                // In test environment, log the error but don't crash
                #if DEBUG
                print("Core Data store loading error: \(error), \(error.userInfo)")
                #endif
                
                // Only fatal error in production
                #if !DEBUG
                fatalError("Unresolved error \(error), \(error.userInfo)")
                #endif
            }
        })
        
        // Configure the view context
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        // For in-memory contexts (used in tests), disable automatic merging
        if inMemory {
            container.viewContext.automaticallyMergesChangesFromParent = false
        }
    }
    
    // MARK: - Convenience Methods
    
    func save() {
        let context = container.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                #if DEBUG
                print("Core Data save error: \(nsError), \(nsError.userInfo)")
                #endif
                
                // Only fatal error in production
                #if !DEBUG
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
                #endif
            }
        }
    }
    
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = container.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }
} 