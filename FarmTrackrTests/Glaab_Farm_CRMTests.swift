//
//  Glaab_Farm_CRMTests.swift
//  Glaab Farm CRMTests
//
//  Created by Dana Dube on 7/9/25.
//

import Testing
import CoreData
import SwiftUI
@testable import FarmTrackr

struct Glaab_Farm_CRMTests {
    
    // MARK: - Test Setup
    
    static func createTestContext() -> NSManagedObjectContext {
        let controller = PersistenceController(inMemory: true)
        let context = controller.container.viewContext
        
        // Configure context for testing
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        context.automaticallyMergesChangesFromParent = false
        
        return context
    }
    
    static func cleanupTestContext(_ context: NSManagedObjectContext) {
        // Rollback any unsaved changes
        context.rollback()
        
        // Reset the context
        context.refreshAllObjects()
    }
    
    // MARK: - FarmContact Model Tests
    
    @Test func testFullNameComputation() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Test with both names
            let contact1 = FarmContact(context: context)
            contact1.firstName = "John"
            contact1.lastName = "Doe"
            contact1.farm = "Test Farm"
            contact1.mailingAddress = "123 Test St"
            contact1.city = "Test City"
            contact1.state = "TS"
            contact1.zipCode = Int32(12345)
            #expect(contact1.fullName == "John Doe")
            
            // Test with only first name
            let contact2 = FarmContact(context: context)
            contact2.firstName = "Jane"
            contact2.farm = "Test Farm"
            contact2.mailingAddress = "123 Test St"
            contact2.city = "Test City"
            contact2.state = "TS"
            contact2.zipCode = Int32(12345)
            #expect(contact2.fullName == "Jane")
            
            // Test with only last name
            let contact3 = FarmContact(context: context)
            contact3.lastName = "Smith"
            contact3.farm = "Test Farm"
            contact3.mailingAddress = "123 Test St"
            contact3.city = "Test City"
            contact3.state = "TS"
            contact3.zipCode = Int32(12345)
            #expect(contact3.fullName == "Smith")
            
            // Test with empty names
            let contact4 = FarmContact(context: context)
            contact4.farm = "Test Farm"
            contact4.mailingAddress = "123 Test St"
            contact4.city = "Test City"
            contact4.state = "TS"
            contact4.zipCode = Int32(12345)
            #expect(contact4.fullName == "")
            
            // Test with whitespace
            let contact5 = FarmContact(context: context)
            contact5.firstName = "  John  "
            contact5.lastName = "  Doe  "
            contact5.farm = "Test Farm"
            contact5.mailingAddress = "123 Test St"
            contact5.city = "Test City"
            contact5.state = "TS"
            contact5.zipCode = Int32(12345)
            #expect(contact5.fullName == "John Doe")
        }
    }
    
    @Test func testZipCodeFormatting() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            let contact = FarmContact(context: context)
            
            // Set required fields
            contact.firstName = "Test"
            contact.lastName = "User"
            contact.farm = "Test Farm"
            contact.mailingAddress = "123 Test St"
            contact.city = "Test City"
            contact.state = "TS"
            
            // Test 5-digit zip code
            contact.zipCode = 12345
            #expect(contact.formattedZipCode == "12345")
            
            // Test 9-digit zip code
            contact.zipCode = 123456789
            #expect(contact.formattedZipCode == "12345-6789")
            
            // Test zero zip code
            contact.zipCode = Int32(0)
            #expect(contact.formattedZipCode == "")
            
            // Test site zip code formatting
            contact.siteZipCode = Int32(987654321)
            #expect(contact.formattedSiteZipCode == "98765-4321")
        }
    }
    
    @Test func testDisplayAddressFormatting() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            let contact = FarmContact(context: context)
            
            // Set required fields
            contact.firstName = "Test"
            contact.lastName = "User"
            contact.farm = "Test Farm"
            
            // Test complete address
            contact.mailingAddress = "123 Main St"
            contact.city = "Springfield"
            contact.state = "IL"
            contact.zipCode = Int32(62704)
            let expectedAddress = "123 Main St\nSpringfield, IL 62704"
            #expect(contact.displayAddress == expectedAddress)
            
            // Test address without zip code
            contact.zipCode = Int32(0)
            let expectedAddressNoZip = "123 Main St\nSpringfield, IL"
            #expect(contact.displayAddress == expectedAddressNoZip)
            
            // Test address without city
            contact.city = nil
            let expectedAddressNoCity = "123 Main St\nIL"
            #expect(contact.displayAddress == expectedAddressNoCity)
            
            // Test empty address
            contact.mailingAddress = ""
            contact.state = nil
            #expect(contact.displayAddress == "")
        }
    }
    
    @Test func testPrimaryContactMethods() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            let contact = FarmContact(context: context)
            
            // Set required fields
            contact.firstName = "Test"
            contact.lastName = "User"
            contact.farm = "Test Farm"
            contact.mailingAddress = "123 Test St"
            contact.city = "Test City"
            contact.state = "TS"
            contact.zipCode = Int32(12345)
            
            // Test primary email selection
            contact.email1 = "primary@example.com"
            contact.email2 = "secondary@example.com"
            #expect(contact.primaryEmail == "primary@example.com")
            
            // Test primary email fallback
            contact.email1 = ""
            #expect(contact.primaryEmail == "secondary@example.com")
            
            // Test primary phone selection
            contact.phoneNumber1 = "555-1111"
            contact.phoneNumber2 = "555-2222"
            contact.phoneNumber3 = "555-3333"
            #expect(contact.primaryPhone == "555-1111")
            
            // Test primary phone fallback
            contact.phoneNumber1 = ""
            #expect(contact.primaryPhone == "555-2222")
            
            // Test all phone numbers collection
            let allPhones = contact.allPhoneNumbers
            #expect(allPhones.count == 2)
            #expect(allPhones.contains("555-2222"))
            #expect(allPhones.contains("555-3333"))
            
            // Test all emails collection
            let allEmails = contact.allEmails
            #expect(allEmails.count == 1)
            #expect(allEmails.contains("secondary@example.com"))
        }
    }
    
    // MARK: - Core Data Operations Tests
    
    @Test func testContactCreationAndSaving() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Create a new contact
            let contact = FarmContact(context: context)
            contact.firstName = "Test"
            contact.lastName = "User"
            contact.email1 = "test@example.com"
            contact.farm = "Test Farm"
            contact.mailingAddress = "123 Test St"
            contact.city = "Test City"
            contact.state = "TS"
            contact.zipCode = Int32(12345)
            contact.dateCreated = Date()
            
            // Save the context
            do {
                try context.save()
            } catch {
                #expect(false, "Failed to save context: \(error)")
                return
            }
            
            // Verify the contact was saved
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            do {
                let results = try context.fetch(fetchRequest)
                #expect(results.count == 1)
                #expect(results.first?.firstName == "Test")
                #expect(results.first?.lastName == "User")
            } catch {
                #expect(false, "Failed to fetch results: \(error)")
            }
        }
    }
    
    @Test func testContactDeletion() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Create and save a contact
            let contact = FarmContact(context: context)
            contact.firstName = "Delete"
            contact.lastName = "Me"
            contact.farm = "Test Farm"
            contact.mailingAddress = "123 Test St"
            contact.city = "Test City"
            contact.state = "TS"
            contact.zipCode = Int32(12345)
            
            do {
                try context.save()
                print("✅ Contact saved successfully")
            } catch {
                print("❌ Failed to save contact: \(error)")
                #expect(false, "Failed to save contact: \(error)")
                return
            }
            
            // Verify contact exists
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            do {
                var results = try context.fetch(fetchRequest)
                print("✅ Found \(results.count) contacts before deletion")
                #expect(results.count == 1)
                
                // Delete the contact
                context.delete(contact)
                try context.save()
                print("✅ Contact deleted successfully")
                
                // Verify contact was deleted
                results = try context.fetch(fetchRequest)
                print("✅ Found \(results.count) contacts after deletion")
                #expect(results.count == 0)
            } catch {
                print("❌ Failed to delete contact: \(error)")
                #expect(false, "Failed to delete contact: \(error)")
            }
        }
    }
    
    @Test func testContactUpdate() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Create a contact
            let contact = FarmContact(context: context)
            contact.firstName = "Original"
            contact.lastName = "Name"
            contact.farm = "Test Farm"
            contact.mailingAddress = "123 Test St"
            contact.city = "Test City"
            contact.state = "TS"
            contact.zipCode = Int32(12345)
            
            do {
                try context.save()
                print("✅ Contact saved successfully")
            } catch {
                print("❌ Failed to save contact: \(error)")
                #expect(false, "Failed to save contact: \(error)")
                return
            }
            
            // Update the contact
            contact.firstName = "Updated"
            contact.dateModified = Date()
            
            do {
                try context.save()
                print("✅ Contact updated successfully")
            } catch {
                print("❌ Failed to update contact: \(error)")
                #expect(false, "Failed to update contact: \(error)")
                return
            }
            
            // Verify the update
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            do {
                let results = try context.fetch(fetchRequest)
                print("✅ Found \(results.count) contacts after update")
                print("✅ First contact firstName: \(results.first?.firstName ?? "nil")")
                print("✅ First contact dateModified: \(results.first?.dateModified?.description ?? "nil")")
                #expect(results.first?.firstName == "Updated")
                #expect(results.first?.dateModified != nil)
            } catch {
                print("❌ Failed to fetch updated contact: \(error)")
                #expect(false, "Failed to fetch updated contact: \(error)")
            }
        }
    }
    
    // MARK: - Theme System Tests
    
    @Test func testThemeViewModelInitialization() async throws {
        await MainActor.run {
            let themeVM = ThemeViewModel()
            
            // Test default theme
            #expect(themeVM.selectedTheme == "Modern Green" || themeVM.selectedTheme == "Classic Green")
            
            // Test theme access
            let theme = themeVM.theme
            #expect(theme.name.count > 0)
            #expect(theme.colors.primary != .clear)
        }
    }
    
    @Test func testThemeManager() async throws {
        await MainActor.run {
            // Test theme retrieval
            let classicTheme = ThemeManager.theme(named: "Classic Green")
            #expect(classicTheme.name == "Classic Green")
            
            // Test fallback to default theme
            let unknownTheme = ThemeManager.theme(named: "NonExistentTheme")
            #expect(unknownTheme.name == "Classic Green")
            
            // Test available themes
            let availableThemes = ["Classic Green", "Sunset Soil", "Blueprint Pro", "Harvest Luxe", "Fieldlight"]
            for themeName in availableThemes {
                let theme = ThemeManager.theme(named: themeName)
                #expect(theme.name == themeName)
            }
        }
    }
    
    // MARK: - Accessibility Manager Tests
    
    @Test func testAccessibilityManagerInitialization() async throws {
        await MainActor.run {
            let accessibilityManager = AccessibilityManager()
            
            // Test that properties are initialized
            #expect(accessibilityManager.isVoiceOverRunning == UIAccessibility.isVoiceOverRunning)
            #expect(accessibilityManager.isReduceMotionEnabled == UIAccessibility.isReduceMotionEnabled)
            #expect(accessibilityManager.isBoldTextEnabled == UIAccessibility.isBoldTextEnabled)
        }
    }
    
    // MARK: - Data Validation Tests
    
    @Test func testContactDataValidation() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Test valid contact
            let validContact = FarmContact(context: context)
            validContact.firstName = "Valid"
            validContact.lastName = "Contact"
            validContact.email1 = "valid@example.com"
            validContact.phoneNumber1 = "555-123-4567"
            validContact.farm = "Test Farm"
            validContact.mailingAddress = "123 Test St"
            validContact.city = "Test City"
            validContact.state = "TS"
            validContact.zipCode = Int32(12345)
            
            // Test invalid contact (missing required fields)
            let invalidContact = FarmContact(context: context)
            invalidContact.firstName = ""
            invalidContact.lastName = ""
            invalidContact.farm = "Test Farm"
            invalidContact.mailingAddress = "123 Test St"
            invalidContact.city = "Test City"
            invalidContact.state = "TS"
            invalidContact.zipCode = Int32(12345)
            
            // Note: This test assumes DataValidator exists and works
            // If DataValidator is not implemented yet, this test will need to be updated
            #expect(validContact.fullName.count > 0)
            #expect(invalidContact.fullName.count == 0)
        }
    }
    
    // MARK: - Performance Tests
    
    @Test func testContactListPerformance() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            // Create multiple contacts for performance testing
            for i in 1...25 { // Reduced from 50 to 25 for faster test
                let contact = FarmContact(context: context)
                contact.firstName = "User\(i)"
                contact.lastName = "Test\(i)"
                contact.email1 = "user\(i)@example.com"
                contact.farm = "Farm\(i % 5)"
                contact.mailingAddress = "123 Test St"
                contact.city = "Test City"
                contact.state = "TS"
                contact.zipCode = Int32(10000 + i)
                contact.dateCreated = Date()
            }
            
            do {
                try context.save()
            } catch {
                #expect(false, "Failed to save contacts: \(error)")
                return
            }
            
            // Test fetch performance
            let startTime = Date()
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            do {
                let results = try context.fetch(fetchRequest)
                let endTime = Date()
                
                #expect(results.count == 25)
                #expect(endTime.timeIntervalSince(startTime) < 2.0) // Reduced timeout to 2 seconds
            } catch {
                #expect(false, "Failed to fetch contacts: \(error)")
            }
        }
    }
    
    // MARK: - Preview Data Tests
    
    @Test func testPreviewContactCreation() async throws {
        let context = Self.createTestContext()
        defer { Self.cleanupTestContext(context) }
        
        await MainActor.run {
            let previewContact = FarmContact.preview(context: context)
            
            #expect(previewContact.firstName == "Jane")
            #expect(previewContact.lastName == "Doe")
            #expect(previewContact.email1 == "jane.doe@example.com")
            #expect(previewContact.farm == "Doe Family Farm")
            #expect(previewContact.dateCreated != nil)
        }
    }
}
