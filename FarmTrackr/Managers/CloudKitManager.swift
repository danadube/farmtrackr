//
//  CloudKitManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CloudKit
import CoreData

class CloudKitManager: ObservableObject {
    static let shared = CloudKitManager()
    
    @Published var isCloudKitAvailable = false
    @Published var isSignedInToiCloud = false
    @Published var syncStatus: SyncStatus = .unknown
    @Published var lastSyncDate: Date?
    
    private let container = CKContainer(identifier: "iCloud.com.danadube.FarmTrackr")
    private let privateDatabase: CKDatabase
    
    enum SyncStatus: Equatable {
        case unknown
        case notAvailable
        case available
        case syncing
        case error(String)
        
        static func == (lhs: SyncStatus, rhs: SyncStatus) -> Bool {
            switch (lhs, rhs) {
            case (.unknown, .unknown),
                 (.notAvailable, .notAvailable),
                 (.available, .available),
                 (.syncing, .syncing):
                return true
            case (.error(let lhsMessage), .error(let rhsMessage)):
                return lhsMessage == rhsMessage
            default:
                return false
            }
        }
    }
    
    private init() {
        self.privateDatabase = container.privateCloudDatabase
        // Temporarily disable CloudKit initialization to fix white screen
        // DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        //     self.checkCloudKitStatus()
        //     self.setupCloudKitSubscription()
        // }
    }
    
    // MARK: - CloudKit Status
    func checkCloudKitStatus() {
        Task {
            await checkAccountStatus()
            await checkCloudKitAvailability()
        }
    }
    
    @MainActor
    private func checkAccountStatus() async {
        do {
            let status = try await container.accountStatus()
            isSignedInToiCloud = status == .available
            updateSyncStatus()
        } catch {
            print("Error checking iCloud account status: \(error)")
            isSignedInToiCloud = false
            syncStatus = .error("Failed to check iCloud status")
        }
    }
    
    @MainActor
    private func checkCloudKitAvailability() async {
        do {
            let status = try await container.accountStatus()
            isCloudKitAvailable = status == .available
            updateSyncStatus()
        } catch {
            print("Error checking CloudKit availability: \(error)")
            isCloudKitAvailable = false
            syncStatus = .error("CloudKit not available")
        }
    }
    
    private func updateSyncStatus() {
        if !isSignedInToiCloud {
            syncStatus = .notAvailable
        } else if !isCloudKitAvailable {
            syncStatus = .notAvailable
        } else {
            syncStatus = .available
        }
    }
    
    // MARK: - CloudKit Subscriptions
    private func setupCloudKitSubscription() {
        Task {
            await createSubscriptionIfNeeded()
        }
    }
    
    private func createSubscriptionIfNeeded() async {
        do {
            // Check if subscription already exists
            let existingSubscriptions = try await privateDatabase.allSubscriptions()
            let hasSubscription = existingSubscriptions.contains { subscription in
                subscription.subscriptionID == "FarmContactChanges"
            }
            
            if !hasSubscription {
                // Create subscription for FarmContact changes
                let predicate = NSPredicate(value: true)
                let subscription = CKQuerySubscription(
                    recordType: "FarmContact",
                    predicate: predicate,
                    subscriptionID: "FarmContactChanges",
                    options: [.firesOnRecordCreation, .firesOnRecordUpdate, .firesOnRecordDeletion]
                )
                
                let notificationInfo = CKSubscription.NotificationInfo()
                notificationInfo.shouldSendContentAvailable = true
                subscription.notificationInfo = notificationInfo
                
                try await privateDatabase.save(subscription)
                print("CloudKit subscription created successfully")
            }
        } catch {
            print("Error setting up CloudKit subscription: \(error)")
        }
    }
    
    // MARK: - Sync Operations
    func performManualSync() async {
        await MainActor.run {
            syncStatus = .syncing
        }
        
        do {
            // Trigger a save to force CloudKit sync
            try await saveContext()
            
            await MainActor.run {
                syncStatus = .available
                lastSyncDate = Date()
            }
        } catch {
            await MainActor.run {
                syncStatus = .error("Sync failed: \(error.localizedDescription)")
            }
        }
    }
    
    private func saveContext() async throws {
        let context = PersistenceController.shared.container.viewContext
        
        if context.hasChanges {
            try await context.perform {
                try context.save()
            }
        }
    }
    
    // MARK: - CloudKit Records
    func fetchCloudKitRecords() async throws -> [CKRecord] {
        let query = CKQuery(recordType: "FarmContact", predicate: NSPredicate(value: true))
        query.sortDescriptors = [NSSortDescriptor(key: "dateCreated", ascending: false)]
        
        let result = try await privateDatabase.records(matching: query)
        return result.matchResults.compactMap { try? $0.1.get() }
    }
    
    func deleteCloudKitRecord(withID recordID: CKRecord.ID) async throws {
        try await privateDatabase.deleteRecord(withID: recordID)
    }
    
    // MARK: - Backup and Restore
    func createBackup() async throws -> URL {
        let context = PersistenceController.shared.container.viewContext
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        
        let contacts = try context.fetch(fetchRequest)
        let backupData = try JSONEncoder().encode(contacts.map { ContactBackupData(from: $0) })
        
        let backupURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("FarmTrackr_Backup_\(Date().timeIntervalSince1970)")
            .appendingPathExtension("json")
        
        try backupData.write(to: backupURL)
        return backupURL
    }
    
    func restoreFromBackup(url: URL) async throws {
        let backupData = try Data(contentsOf: url)
        let contacts = try JSONDecoder().decode([ContactBackupData].self, from: backupData)
        
        let context = PersistenceController.shared.container.viewContext
        
        for contactData in contacts {
            let contact = FarmContact(context: context)
            contactData.apply(to: contact)
        }
        
        try context.save()
    }
}

// MARK: - Backup Data Structure
struct ContactBackupData: Codable {
    let firstName: String?
    let lastName: String?
    let mailingAddress: String?
    let city: String?
    let state: String?
    let zipCode: Int32
    let email1: String?
    let email2: String?
    let phoneNumber1: String?
    let phoneNumber2: String?
    let phoneNumber3: String?
    let phoneNumber4: String?
    let phoneNumber5: String?
    let phoneNumber6: String?
    let siteMailingAddress: String?
    let siteCity: String?
    let siteState: String?
    let siteZipCode: Int32
    let notes: String?
    let farm: String?
    let dateCreated: Date
    let dateModified: Date
    
    init(from contact: FarmContact) {
        self.firstName = contact.firstName
        self.lastName = contact.lastName
        self.mailingAddress = contact.mailingAddress
        self.city = contact.city
        self.state = contact.state
        self.zipCode = contact.zipCode
        self.email1 = contact.email1
        self.email2 = contact.email2
        self.phoneNumber1 = contact.phoneNumber1
        self.phoneNumber2 = contact.phoneNumber2
        self.phoneNumber3 = contact.phoneNumber3
        self.phoneNumber4 = contact.phoneNumber4
        self.phoneNumber5 = contact.phoneNumber5
        self.phoneNumber6 = contact.phoneNumber6
        self.siteMailingAddress = contact.siteMailingAddress
        self.siteCity = contact.siteCity
        self.siteState = contact.siteState
        self.siteZipCode = contact.siteZipCode
        self.notes = contact.notes
        self.farm = contact.farm
        self.dateCreated = contact.dateCreated ?? Date()
        self.dateModified = contact.dateModified ?? Date()
    }
    
    func apply(to contact: FarmContact) {
        contact.firstName = firstName ?? ""
        contact.lastName = lastName ?? ""
        contact.mailingAddress = mailingAddress ?? ""
        contact.city = city ?? ""
        contact.state = state ?? ""
        contact.zipCode = zipCode
        contact.email1 = email1
        contact.email2 = email2
        contact.phoneNumber1 = phoneNumber1
        contact.phoneNumber2 = phoneNumber2
        contact.phoneNumber3 = phoneNumber3
        contact.phoneNumber4 = phoneNumber4
        contact.phoneNumber5 = phoneNumber5
        contact.phoneNumber6 = phoneNumber6
        contact.siteMailingAddress = siteMailingAddress
        contact.siteCity = siteCity
        contact.siteState = siteState
        contact.siteZipCode = siteZipCode
        contact.notes = notes
        contact.farm = farm ?? ""
        contact.dateCreated = dateCreated
        contact.dateModified = dateModified
    }
} 