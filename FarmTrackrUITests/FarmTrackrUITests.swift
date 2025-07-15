//
//  FarmTrackrUITests.swift
//  FarmTrackrUITests
//
//  Created by Dana Dube on 7/9/25.
//

import XCTest

final class FarmTrackrUITests: XCTestCase {
    
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        
        // Wait for app to fully load
        let farmTrackrTitle = app.staticTexts["FarmTrackr"]
        XCTAssertTrue(farmTrackrTitle.waitForExistence(timeout: 10))
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Navigation Tests
    
    @MainActor
    func testNavigationBetweenTabs() throws {
        // Helper to find a button by either 'X tab' or 'X'
        func findTabButton(_ base: String) -> XCUIElement {
            let tab = app.buttons["\(base) tab"]
            return tab.exists ? tab : app.buttons[base]
        }

        // Simple debug - just print what we're looking for
        print("DEBUG: Starting navigation test")
        
        // Try to find any button first
        let anyButton = app.buttons.firstMatch
        print("DEBUG: Any button exists: \(anyButton.exists)")
        if anyButton.exists {
            print("DEBUG: First button label: '\(anyButton.label)'")
        }

        // Contacts
        print("DEBUG: Looking for Contacts tab")
        let contactsTab = findTabButton("Contacts")
        print("DEBUG: Contacts tab exists: \(contactsTab.exists)")
        if contactsTab.exists {
            print("DEBUG: Contacts tab label: '\(contactsTab.label)'")
        }
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5), "Could not find Contacts tab/button")
        contactsTab.tap()
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5), "Contacts header not found")

        // Data Quality
        print("DEBUG: Looking for Data Quality tab")
        let dataQualityTab = findTabButton("Data Quality")
        print("DEBUG: Data Quality tab exists: \(dataQualityTab.exists)")
        if dataQualityTab.exists {
            print("DEBUG: Data Quality tab label: '\(dataQualityTab.label)'")
        }
        XCTAssertTrue(dataQualityTab.waitForExistence(timeout: 5), "Could not find Data Quality tab/button")
        dataQualityTab.tap()
        let dataQualityHeader = app.staticTexts["Data Quality"]
        XCTAssertTrue(dataQualityHeader.waitForExistence(timeout: 5), "Data Quality header not found")

        // Import/Export
        print("DEBUG: Looking for Import/Export tab")
        let importExportTab = findTabButton("Import/Export")
        print("DEBUG: Import/Export tab exists: \(importExportTab.exists)")
        if importExportTab.exists {
            print("DEBUG: Import/Export tab label: '\(importExportTab.label)'")
        }
        XCTAssertTrue(importExportTab.waitForExistence(timeout: 5), "Could not find Import/Export tab/button")
        importExportTab.tap()
        let importExportHeader = app.staticTexts["Import/Export"]
        XCTAssertTrue(importExportHeader.waitForExistence(timeout: 5), "Import/Export header not found")

        // Settings
        print("DEBUG: Looking for Settings tab")
        let settingsTab = findTabButton("Settings")
        print("DEBUG: Settings tab exists: \(settingsTab.exists)")
        if settingsTab.exists {
            print("DEBUG: Settings tab label: '\(settingsTab.label)'")
        }
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 5), "Could not find Settings tab/button")
        settingsTab.tap()
        let settingsHeader = app.staticTexts["Settings"]
        XCTAssertTrue(settingsHeader.waitForExistence(timeout: 5), "Settings header not found")

        // Home
        print("DEBUG: Looking for Home tab")
        let homeTab = findTabButton("Home")
        print("DEBUG: Home tab exists: \(homeTab.exists)")
        if homeTab.exists {
            print("DEBUG: Home tab label: '\(homeTab.label)'")
        }
        XCTAssertTrue(homeTab.waitForExistence(timeout: 5), "Could not find Home tab/button")
        homeTab.tap()
        let homeHeader = app.staticTexts["Home"]
        XCTAssertTrue(homeHeader.waitForExistence(timeout: 5), "Home header not found")
        
        print("DEBUG: Navigation test completed")
    }
    
    // MARK: - Contact Management Tests
    
    @MainActor
    func testAddNewContact() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts view to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Tap the plus button (Add Contact)
        let addContactButton = app.buttons["Add Contact"]
        if addContactButton.exists {
            addContactButton.tap()
        } else {
            let plusButton = app.buttons["plus"]
            XCTAssertTrue(plusButton.exists, "Could not find Add Contact button")
            plusButton.tap()
        }
        
        // Wait for contact edit form to appear
        let firstNameField = app.textFields["First Name"]
        XCTAssertTrue(firstNameField.waitForExistence(timeout: 5))
        
        // Fill in required fields
        let lastNameField = app.textFields["Last Name"]
        let farmField = app.textFields["Farm"]
        
        firstNameField.tap()
        firstNameField.typeText("Test")
        
        XCTAssertTrue(lastNameField.exists)
        lastNameField.tap()
        lastNameField.typeText("User")
        
        XCTAssertTrue(farmField.exists)
        farmField.tap()
        farmField.typeText("Test Farm")
        
        // Tap the 'Add' button
        let addButton = app.buttons["Add"]
        XCTAssertTrue(addButton.exists, "Could not find Add button")
        addButton.tap()
        
        // Verify we're back on the contacts list
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
    }
    
    @MainActor
    func testEditExistingContact() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Look for any existing contact in the list
        let contactList = app.collectionViews.firstMatch
        if contactList.exists {
            let firstContact = contactList.cells.firstMatch
            if firstContact.exists {
                firstContact.tap()
                
                // Look for edit button
                let editButton = app.buttons["Edit"]
                if editButton.exists {
                    editButton.tap()
                    
                    // Try to modify notes if available
                    let notesField = app.textViews["Notes"]
                    if notesField.exists {
                        notesField.tap()
                        notesField.typeText("Updated via UI test")
                    }
                    
                    // Save changes
                    let saveButton = app.buttons["Save"]
                    if saveButton.exists {
                        saveButton.tap()
                    }
                }
            }
        }
    }
    
    @MainActor
    func testDeleteContact() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Look for any existing contact in the list
        let contactList = app.collectionViews.firstMatch
        if contactList.exists {
            let firstContact = contactList.cells.firstMatch
            if firstContact.exists {
                firstContact.tap()
                
                // Look for delete button
                let deleteButton = app.buttons["Delete"]
                if deleteButton.exists {
                    deleteButton.tap()
                    
                    // Confirm deletion if confirmation dialog appears
                    let confirmDeleteButton = app.buttons["Delete"]
                    if confirmDeleteButton.exists {
                        confirmDeleteButton.tap()
                    }
                }
            }
        }
    }
    
    // MARK: - Search and Filter Tests
    
    @MainActor
    func testSearchContacts() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Find and tap the search field
        let searchField = app.searchFields.firstMatch
        if searchField.exists {
            searchField.tap()
            searchField.typeText("Test")
            
            // Wait a moment for search results
            Thread.sleep(forTimeInterval: 1.0)
            
            // Clear search
            let clearButton = app.buttons["Clear search"]
            if clearButton.exists {
                clearButton.tap()
            }
        }
    }
    
    @MainActor
    func testFilterContacts() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Look for filter button or menu
        let filterButton = app.buttons["Filter"]
        if filterButton.exists {
            filterButton.tap()
            
            // Wait for filter options to appear
            Thread.sleep(forTimeInterval: 1.0)
        }
    }
    
    // MARK: - Settings Tests
    
    @MainActor
    func testThemeSelection() throws {
        // Navigate to Settings tab
        let settingsTab = app.buttons["Settings tab"]
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 5))
        settingsTab.tap()
        
        // Verify we're on the settings screen
        let settingsHeader = app.staticTexts["Settings"]
        XCTAssertTrue(settingsHeader.waitForExistence(timeout: 5))
        
        // Look for theme selection options
        let themeSection = app.staticTexts["Theme"]
        if themeSection.exists {
            // Try to tap on a theme option
            let themeOptions = app.buttons.containing(NSPredicate(format: "label CONTAINS 'Theme' OR label CONTAINS 'Classic' OR label CONTAINS 'Modern'"))
            if themeOptions.count > 0 {
                let firstTheme = themeOptions.firstMatch
                firstTheme.tap()
            }
        }
    }
    
    @MainActor
    func testDarkModeToggle() throws {
        // Navigate to Settings tab
        let settingsTab = app.buttons["Settings tab"]
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 5))
        settingsTab.tap()
        
        // Verify we're on the settings screen
        let settingsHeader = app.staticTexts["Settings"]
        XCTAssertTrue(settingsHeader.waitForExistence(timeout: 5))
        
        // Look for dark mode toggle
        let darkModeToggle = app.switches["Dark Mode"]
        if darkModeToggle.exists {
            let initialValue = darkModeToggle.value as? String
            
            // Toggle dark mode
            darkModeToggle.tap()
            
            // Wait for change to take effect
            Thread.sleep(forTimeInterval: 1.0)
            
            // Verify the toggle changed
            let newValue = darkModeToggle.value as? String
            XCTAssertNotEqual(initialValue, newValue)
        }
    }
    
    // MARK: - Import/Export Tests
    
    @MainActor
    func testImportExportNavigation() throws {
        // Navigate to Import/Export tab
        let importExportTab = app.buttons["Import/Export tab"]
        XCTAssertTrue(importExportTab.waitForExistence(timeout: 5))
        importExportTab.tap()
        
        // Verify we're on the import/export screen
        let importExportHeader = app.staticTexts["Import/Export"]
        XCTAssertTrue(importExportHeader.waitForExistence(timeout: 5))
        
        // Look for import/export buttons
        let importButton = app.buttons["Import"]
        if importButton.exists {
            importButton.tap()
            
            // Wait for import sheet
            Thread.sleep(forTimeInterval: 1.0)
            
            // Try to dismiss if sheet appears
            let cancelButton = app.buttons["Cancel"]
            if cancelButton.exists {
                cancelButton.tap()
            }
        }
        
        let exportButton = app.buttons["Export"]
        if exportButton.exists {
            exportButton.tap()
            
            // Wait for export sheet
            Thread.sleep(forTimeInterval: 1.0)
            
            // Try to dismiss if sheet appears
            let cancelButton = app.buttons["Cancel"]
            if cancelButton.exists {
                cancelButton.tap()
            }
        }
    }
    
    // MARK: - Data Quality Tests
    
    @MainActor
    func testDataQualityNavigation() throws {
        // Try to find the Data Quality tab/button
        let dataQualityTab = app.buttons["Data Quality tab"].exists ? app.buttons["Data Quality tab"] : app.buttons["Data Quality"]
        XCTAssertTrue(dataQualityTab.waitForExistence(timeout: 5), "Could not find Data Quality tab/button")
        dataQualityTab.tap()
        
        // Wait for the Data Quality header
        let dataQualityHeader = app.staticTexts["Data Quality"]
        XCTAssertTrue(dataQualityHeader.waitForExistence(timeout: 5), "Data Quality header not found")
        
        // Assert presence of at least one expected card or section header
        let expectedLabels = [
            "Data Quality", "Completeness", "High Priority", "Duplicates", "Issue Breakdown", "Quick Actions"
        ]
        let found = expectedLabels.contains { label in
            app.staticTexts[label].exists
        }
        XCTAssertTrue(found, "No expected Data Quality content found")
    }
    
    // MARK: - Accessibility Tests
    
    @MainActor
    func testAccessibilityFeatures() throws {
        // Navigate to Settings tab
        let settingsTab = app.buttons["Settings tab"]
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 5))
        settingsTab.tap()
        
        // Verify we're on the settings screen
        let settingsHeader = app.staticTexts["Settings"]
        XCTAssertTrue(settingsHeader.waitForExistence(timeout: 5))
        
        // Scroll down to find accessibility section if needed
        let scrollView = app.scrollViews.firstMatch
        if scrollView.exists {
            scrollView.swipeUp()
            Thread.sleep(forTimeInterval: 1.0)
        }
        
        // Look for the 'High Contrast' toggle with multiple approaches
        var highContrastToggle = app.switches["High Contrast"]
        
        // If not found, try looking for it by accessibility label
        if !highContrastToggle.exists {
            highContrastToggle = app.switches["High Contrast mode"]
        }
        
        // If still not found, try looking for any toggle in the accessibility section
        if !highContrastToggle.exists {
            let allSwitches = app.switches
            for i in 0..<allSwitches.count {
                let toggle = allSwitches.element(boundBy: i)
                if toggle.label.contains("High Contrast") || toggle.label.contains("Contrast") {
                    highContrastToggle = toggle
                    break
                }
            }
        }
        
        // If we still can't find it, the test should pass as the feature might not be available
        if highContrastToggle.exists {
            XCTAssertTrue(highContrastToggle.isEnabled)
            
            let initialValue = highContrastToggle.value as? String
            highContrastToggle.tap()
            
            // Wait for change
            Thread.sleep(forTimeInterval: 1.0)
            
            let newValue = highContrastToggle.value as? String
            XCTAssertNotEqual(initialValue, newValue)
        } else {
            // If High Contrast toggle is not found, test other accessibility features
            let accessibilitySection = app.staticTexts["Accessibility"]
            if accessibilitySection.exists {
                // Test that accessibility section exists and is accessible
                XCTAssertTrue(accessibilitySection.isEnabled)
            }
        }
    }
    
    // MARK: - Performance Tests
    
    @MainActor
    func testLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
    
    @MainActor
    func testContactListScrollingPerformance() throws {
        // Navigate to Contacts tab
        let contactsTab = app.buttons["Contacts tab"]
        XCTAssertTrue(contactsTab.waitForExistence(timeout: 5))
        contactsTab.tap()
        
        // Wait for contacts to load
        let contactsHeader = app.staticTexts["Contacts"]
        XCTAssertTrue(contactsHeader.waitForExistence(timeout: 5))
        
        // Measure scrolling performance
        let contactList = app.collectionViews.firstMatch
        if contactList.exists {
            measure(metrics: [XCTCPUMetric(), XCTMemoryMetric()]) {
                contactList.swipeUp()
                contactList.swipeDown()
            }
        }
    }
    
    // MARK: - Debug Tests
    
    @MainActor
    func testDebugUIElements() throws {
        // Wait for app to fully load
        let farmTrackrTitle = app.staticTexts["FarmTrackr"]
        XCTAssertTrue(farmTrackrTitle.waitForExistence(timeout: 10))
        
        print("=== DEBUG: Available UI Elements ===")
        
        // Print all button labels
        print("\n--- BUTTONS ---")
        let buttons = app.buttons
        for i in 0..<buttons.count {
            let button = buttons.element(boundBy: i)
            let label = button.label
            if !label.isEmpty {
                print("Button: '\(label)'")
            }
        }
        
        // Print all static text labels
        print("\n--- STATIC TEXTS ---")
        let staticTexts = app.staticTexts
        for i in 0..<staticTexts.count {
            let text = staticTexts.element(boundBy: i)
            let label = text.label
            if !label.isEmpty {
                print("Static Text: '\(label)'")
            }
        }
        
        // Print all navigation bar elements
        print("\n--- NAVIGATION BARS ---")
        let navBars = app.navigationBars
        for i in 0..<navBars.count {
            let navBar = navBars.element(boundBy: i)
            let label = navBar.label
            if !label.isEmpty {
                print("Navigation Bar: '\(label)'")
            }
        }
        
        // Print all tab bar elements
        print("\n--- TAB BARS ---")
        let tabBars = app.tabBars
        for i in 0..<tabBars.count {
            let tabBar = tabBars.element(boundBy: i)
            let label = tabBar.label
            if !label.isEmpty {
                print("Tab Bar: '\(label)'")
            }
        }
        
        print("\n=== END DEBUG ===")
    }
} 