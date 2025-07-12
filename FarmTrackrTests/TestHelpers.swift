//
//  TestHelpers.swift
//  Glaab Farm CRMTests
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData
import Testing
@testable import FarmTrackr

// MARK: - Test Helpers

struct TestHelpers {
    
    /// Creates an in-memory Core Data context for testing
    static func createTestContext() -> NSManagedObjectContext {
        return PersistenceController(inMemory: true).container.viewContext
    }
    
    /// Creates a sample contact for testing
    static func createSampleContact(in context: NSManagedObjectContext) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = "Test"
        contact.lastName = "User"
        contact.email1 = "test@example.com"
        contact.phoneNumber1 = "555-123-4567"
        contact.farm = "Test Farm"
        contact.mailingAddress = "123 Test St"
        contact.city = "Test City"
        contact.state = "TS"
        contact.zipCode = 12345
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
    
    /// Creates multiple sample contacts for testing
    static func createSampleContacts(count: Int, in context: NSManagedObjectContext) -> [FarmContact] {
        var contacts: [FarmContact] = []
        
        for i in 1...count {
            let contact = FarmContact(context: context)
            contact.firstName = "User\(i)"
            contact.lastName = "Test\(i)"
            contact.email1 = "user\(i)@example.com"
            contact.phoneNumber1 = "555-\(String(format: "%03d", i))-4567"
            contact.farm = "Farm\(i % 5)"
            contact.mailingAddress = "\(i) Test St"
            contact.city = "City\(i)"
            contact.state = "ST"
            contact.zipCode = Int32(10000 + i)
            contact.dateCreated = Date()
            contact.dateModified = Date()
            contacts.append(contact)
        }
        
        return contacts
    }
    
    /// Saves the context and handles errors
    static func saveContext(_ context: NSManagedObjectContext) throws {
        if context.hasChanges {
            try context.save()
        }
    }
    
    /// Clears all contacts from the context
    static func clearAllContacts(in context: NSManagedObjectContext) throws {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = FarmContact.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        try context.execute(deleteRequest)
        try context.save()
    }
    
    /// Waits for a condition to be true with timeout
    static func waitForCondition(
        timeout: TimeInterval = 5.0,
        condition: @escaping () -> Bool
    ) async throws {
        let startTime = Date()
        
        while !condition() {
            if Date().timeIntervalSince(startTime) > timeout {
                throw TestError.timeout
            }
            try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
        }
    }
    
    /// Validates that a contact has the expected properties
    static func validateContact(
        _ contact: FarmContact,
        firstName: String? = nil,
        lastName: String? = nil,
        email: String? = nil,
        farm: String? = nil
    ) {
        if let expectedFirstName = firstName {
            XCTAssertEqual(contact.firstName, expectedFirstName)
        }
        
        if let expectedLastName = lastName {
            XCTAssertEqual(contact.lastName, expectedLastName)
        }
        
        if let expectedEmail = email {
            XCTAssertEqual(contact.primaryEmail, expectedEmail)
        }
        
        if let expectedFarm = farm {
            XCTAssertEqual(contact.farm, expectedFarm)
        }
    }
}

// MARK: - Test Errors

enum TestError: Error {
    case timeout
    case invalidData
    case saveFailed
}

// MARK: - XCTest Extensions

extension XCTestCase {
    
    /// Creates a test context and provides cleanup
    func createTestContext() -> NSManagedObjectContext {
        return TestHelpers.createTestContext()
    }
    
    /// Creates a sample contact in the test context
    func createSampleContact(in context: NSManagedObjectContext) -> FarmContact {
        return TestHelpers.createSampleContact(in: context)
    }
    
    /// Waits for a condition with timeout
    func waitForCondition(
        timeout: TimeInterval = 5.0,
        condition: @escaping () -> Bool
    ) async throws {
        try await TestHelpers.waitForCondition(timeout: timeout, condition: condition)
    }
    
    /// Validates contact properties
    func validateContact(
        _ contact: FarmContact,
        firstName: String? = nil,
        lastName: String? = nil,
        email: String? = nil,
        farm: String? = nil
    ) {
        TestHelpers.validateContact(contact, firstName: firstName, lastName: lastName, email: email, farm: farm)
    }
}

// MARK: - FarmContact Test Extensions

extension FarmContact {
    
    /// Creates a test contact with minimal required data
    static func createTestContact(
        firstName: String = "Test",
        lastName: String = "User",
        in context: NSManagedObjectContext
    ) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = firstName
        contact.lastName = lastName
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
    
    /// Creates a complete test contact with all fields
    static func createCompleteTestContact(in context: NSManagedObjectContext) -> FarmContact {
        let contact = FarmContact(context: context)
        contact.firstName = "Complete"
        contact.lastName = "Test"
        contact.email1 = "complete@test.com"
        contact.email2 = "backup@test.com"
        contact.phoneNumber1 = "555-111-1111"
        contact.phoneNumber2 = "555-222-2222"
        contact.farm = "Complete Test Farm"
        contact.mailingAddress = "123 Complete St"
        contact.city = "Complete City"
        contact.state = "CT"
        contact.zipCode = 12345
        contact.siteMailingAddress = "456 Site St"
        contact.siteCity = "Site City"
        contact.siteState = "SC"
        contact.siteZipCode = Int32(67890)
        contact.notes = "This is a complete test contact"
        contact.dateCreated = Date()
        contact.dateModified = Date()
        return contact
    }
}

// MARK: - Theme Test Extensions

extension ThemeViewModel {
    
    /// Creates a test theme view model with specific theme
    static func createTestThemeViewModel(themeName: String = "Classic Green") -> ThemeViewModel {
        let themeVM = ThemeViewModel()
        themeVM.selectedTheme = themeName
        return themeVM
    }
}

// MARK: - Performance Test Helpers

struct PerformanceTestHelpers {
    
    /// Measures the time taken to execute a block
    static func measureTime<T>(_ block: () throws -> T) rethrows -> (T, TimeInterval) {
        let startTime = Date()
        let result = try block()
        let endTime = Date()
        return (result, endTime.timeIntervalSince(startTime))
    }
    
    /// Asserts that an operation completes within a specified time
    static func assertPerformance<T>(
        maxTime: TimeInterval,
        operation: () throws -> T
    ) throws -> T {
        let (result, time) = try measureTime(operation)
        XCTAssertLessThan(time, maxTime, "Operation took \(time)s, expected less than \(maxTime)s")
        return result
    }
}

// MARK: - UI Test Helpers

#if canImport(XCTest)
import XCTest

extension XCUIApplication {
    
    /// Waits for an element to appear with timeout
    func waitForElement(_ element: XCUIElement, timeout: TimeInterval = 5.0) -> Bool {
        return element.waitForExistence(timeout: timeout)
    }
    
    /// Taps an element if it exists
    func tapIfExists(_ element: XCUIElement) {
        if element.exists {
            element.tap()
        }
    }
    
    /// Types text into a text field if it exists
    func typeTextIfExists(_ text: String, into element: XCUIElement) {
        if element.exists {
            element.tap()
            element.typeText(text)
        }
    }
    
    /// Clears and types text into a text field
    func clearAndTypeText(_ text: String, into element: XCUIElement) {
        if element.exists {
            element.tap()
            element.doubleTap() // Select all text
            element.typeText(text)
        }
    }
}

#endif 