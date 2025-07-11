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
        
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        })
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }
} 