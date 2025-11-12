//
//  FarmTrackrTests.swift
//  FarmTrackrTests
//
//  Created by Dana Dube on 7/9/25.
//

import Testing
import CoreData
import SwiftUI
@testable import FarmTrackr

struct FarmTrackrTests {
    
    // MARK: - Core Data Tests
    
    @Test("Core Data: Create and save contact")
    func testCreateAndSaveContact() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            // Create a test contact
            let contact = TestHelpers.createTestContact(in: context)
            
            // Save the context
            do {
                try TestHelpers.saveContext(context)
                
                // Verify the contact was saved
                let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
                let savedContacts = try context.fetch(fetchRequest)
                
                #expect(savedContacts.count == 1)
                #expect(savedContacts.first?.firstName == "Test")
                #expect(savedContacts.first?.lastName == "Contact")
                
            } catch {
                #expect(false, "Failed to save context: \(error)")
            }
        }
    }
    
    @Test("Core Data: Fetch contacts")
    func testFetchContacts() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            // Create multiple test contacts
            let contact1 = TestHelpers.createTestContactWithData(firstName: "John", lastName: "Doe", farm: "Farm A", in: context)
            let contact2 = TestHelpers.createTestContactWithData(firstName: "Jane", lastName: "Smith", farm: "Farm B", in: context)
            
            // Save the context
            do {
                try TestHelpers.saveContext(context)
                
                // Fetch all contacts
                let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
                let contacts = try context.fetch(fetchRequest)
                
                #expect(contacts.count == 2)
                #expect(contacts.contains { $0.firstName == "John" && $0.lastName == "Doe" })
                #expect(contacts.contains { $0.firstName == "Jane" && $0.lastName == "Smith" })
                
            } catch {
                #expect(false, "Failed to fetch contacts: \(error)")
            }
        }
    }
    
    @Test("Core Data: Delete contact")
    func testDeleteContact() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            // Create and save a contact
            let contact = TestHelpers.createTestContact(in: context)
            try? TestHelpers.saveContext(context)
            
            // Delete the contact
            context.delete(contact)
            try? TestHelpers.saveContext(context)
            
            // Verify the contact was deleted
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            let contacts = try? context.fetch(fetchRequest)
            
            #expect((contacts?.count ?? 0) == 0)
        }
    }
    
    // MARK: - Theme Tests
    
    @Test("Theme: Default theme selection")
    func testDefaultThemeSelection() async throws {
        await MainActor.run {
            let themeVM = TestHelpers.createMockThemeViewModel()
            #expect(themeVM.selectedTheme == "Modern Green")
            #expect(themeVM.theme != nil)
        }
    }
    
    @Test("Theme: Theme colors")
    func testThemeColors() async throws {
        await MainActor.run {
            let themeVM = TestHelpers.createMockThemeViewModel()
            let theme = themeVM.theme
            
            // Test that theme colors are not nil
            #expect(theme.colors.primary != nil)
            #expect(theme.colors.secondary != nil)
            #expect(theme.colors.accent != nil)
            #expect(theme.colors.background != nil)
            #expect(theme.colors.text != nil)
        }
    }
    
    @Test("Theme: Theme fonts")
    func testThemeFonts() async throws {
        await MainActor.run {
            let themeVM = TestHelpers.createMockThemeViewModel()
            let theme = themeVM.theme
            
            // Test that theme fonts are not nil
            #expect(theme.fonts.headerFont != nil)
            #expect(theme.fonts.titleFont != nil)
            #expect(theme.fonts.bodyFont != nil)
            #expect(theme.fonts.buttonFont != nil)
        }
    }
    
    // MARK: - FarmContact Tests
    
    @Test("FarmContact: Full name computation")
    func testFullNameComputation() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            let contact = TestHelpers.createTestContactWithData(firstName: "John", lastName: "Doe", in: context)
            #expect(contact.fullName == "John Doe")
        }
    }
    
    @Test("FarmContact: Primary email")
    func testPrimaryEmail() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            let contact = TestHelpers.createTestContact(in: context)
            contact.email1 = "test@example.com"
            contact.email2 = "backup@example.com"
            
            #expect(contact.primaryEmail == "test@example.com")
        }
    }
    
    @Test("FarmContact: Primary phone")
    func testPrimaryPhone() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            let contact = TestHelpers.createTestContact(in: context)
            contact.phoneNumber1 = "555-123-4567"
            contact.phoneNumber2 = "555-987-6543"
            
            #expect(contact.primaryPhone == "555-123-4567")
        }
    }
    
    // MARK: - Constants Tests
    
    @Test("Constants: Theme manager")
    func testThemeManager() async throws {
        await MainActor.run {
            // Test that all themes exist
            let themes = ThemeManager.themes
            #expect(themes.count > 0)
            
            // Test that we can get a theme by name
            let classicGreenTheme = ThemeManager.theme(named: "Classic Green")
            #expect(classicGreenTheme.name == "Classic Green")
            
            // Test fallback to default theme
            let nonExistentTheme = ThemeManager.theme(named: "NonExistent")
            #expect(nonExistentTheme != nil)
            #expect(nonExistentTheme.name == "Classic Green") // Should fallback to Classic Green
        }
    }
    
    @Test("Constants: Validation regex")
    func testValidationRegex() async throws {
        await MainActor.run {
            // Test email validation
            let validEmail = "test@example.com"
            let invalidEmail = "invalid-email"
            
            #expect(validEmail.range(of: Constants.Validation.emailRegex, options: .regularExpression) != nil)
            #expect(invalidEmail.range(of: Constants.Validation.emailRegex, options: .regularExpression) == nil)
            
            // Test phone validation
            let validPhone = "5551234567"
            let invalidPhone = "123"
            
            #expect(validPhone.range(of: Constants.Validation.phoneRegex, options: .regularExpression) != nil)
            #expect(invalidPhone.range(of: Constants.Validation.phoneRegex, options: .regularExpression) == nil)
        }
    }
    
    // MARK: - Performance Tests
    
    @Test("Performance: Create multiple contacts")
    func testCreateMultipleContacts() async throws {
        await MainActor.run {
            let persistenceController = TestHelpers.createTestPersistenceController()
            let context = persistenceController.container.viewContext
            
            let startTime = Date()
            
            // Create 100 contacts
            for i in 1...100 {
                let contact = TestHelpers.createTestContactWithData(
                    firstName: "User\(i)",
                    lastName: "Test\(i)",
                    farm: "Farm\(i % 5)",
                    in: context
                )
            }
            
            try? TestHelpers.saveContext(context)
            
            let endTime = Date()
            let duration = endTime.timeIntervalSince(startTime)
            
            // Should complete within 1 second
            #expect(duration < 1.0, "Creating 100 contacts took \(duration)s, expected less than 1.0s")
            
            // Verify all contacts were created
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            let contacts = try? context.fetch(fetchRequest)
            #expect((contacts?.count ?? 0) == 100)
        }
    }
} 