//
//  GoogleSheetsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct GoogleSheetsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var googleSheetsManager = GoogleSheetsManager()
    
    @State private var showingImportSheet = false
    @State private var showingExportSheet = false
    @State private var spreadsheetID = ""
    @State private var spreadsheetTitle = ""
    @State private var selectedContacts: [FarmContact] = []
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var importedContacts: [ContactRecord] = []
    @State private var showingImportPreview = false
    @State private var showDrivePicker = false
    @State private var selectedDriveFile: GoogleDriveFile? = nil
    
    var body: some View {
        NavigationView {
            ScrollView(.vertical, showsIndicators: true) {
                VStack(spacing: themeVM.theme.spacing.large) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "tablecells")
                            .font(.system(size: 36))
                            .foregroundColor(themeVM.theme.colors.primary)
                        
                        Text("Google Sheets")
                            .font(themeVM.theme.fonts.headerFont)
                            .foregroundColor(themeVM.theme.colors.text)
                            .padding(.top, 2)
                        
                        Text("Import and export your contacts with Google Sheets")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .multilineTextAlignment(.center)
                            .padding(.bottom, 2)
                    }
                    .padding(.top, 8)
                    .padding(.horizontal, 16)
                    
                    // Authentication Status
                    authenticationStatusView
                    
                    // Main Actions
                    if googleSheetsManager.isAuthenticated {
                        authenticatedActionsView
                    } else {
                        authenticationPromptView
                    }
                    
                    // Instructions
                    instructionsView
                }
                .padding(.horizontal, 16)
            }
            .navigationTitle("Google Sheets")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .navigationBarItems(leading: Button("Done") {
                dismiss()
            })
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .sheet(isPresented: $showingImportSheet) {
            GoogleSheetsImportView(
                googleSheetsManager: googleSheetsManager,
                onImportComplete: { contacts in
                    importedContacts = contacts
                    showingImportPreview = true
                }
            )
        }
        .sheet(isPresented: $showingExportSheet) {
            GoogleSheetsExportView(
                googleSheetsManager: googleSheetsManager,
                context: viewContext
            )
        }
        .sheet(isPresented: $showingImportPreview) {
            ImportPreviewView(
                contacts: importedContacts,
                errors: [],
                importManager: DataImportManager()
            )
        }
        .sheet(isPresented: $showDrivePicker) {
            if let accessToken = googleSheetsManager.accessToken {
                GoogleDrivePickerView(selectedFile: $selectedDriveFile, accessToken: accessToken)
            } else {
                Text("Missing access token.")
            }
        }
        .onReceive(googleSheetsManager.$importedContacts) { contacts in
            if !contacts.isEmpty {
                importedContacts = contacts
                showingImportPreview = true
            }
        }
    }
    
    // MARK: - Subviews
    
    private var authenticationStatusView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            HStack {
                Image(systemName: googleSheetsManager.isAuthenticated ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(googleSheetsManager.isAuthenticated ? .green : .red)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(googleSheetsManager.isAuthenticated ? "Connected to Google" : "Not Connected")
                        .font(themeVM.theme.fonts.subheadlineFont)
                        .fontWeight(.medium)
                    Text(googleSheetsManager.isAuthenticated ? "You can import and export data" : "Sign in to access Google Sheets")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                
                Spacer()
                
                if googleSheetsManager.isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(themeVM.theme.colors.cardBackground)
            )
        }
    }
    
    private var authenticatedActionsView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            // Import Button
            Button(action: { showingImportSheet = true }) {
                HStack {
                    Image(systemName: "square.and.arrow.down")
                        .font(.title2)
                        .padding(.leading, 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Import from Google Sheets")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text("Import contacts from a Google Sheets")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .padding(.trailing, 8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(themeVM.theme.colors.primary)
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Pick from Drive Button
            Button(action: { showDrivePicker = true }) {
                HStack {
                    Image(systemName: "folder")
                        .font(.title2)
                        .padding(.leading, 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Pick from Google Drive")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text("Browse and select a Google Sheet")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .padding(.trailing, 8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(themeVM.theme.colors.secondary)
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Selected File Display
            if let selectedDriveFile = selectedDriveFile {
                VStack(spacing: themeVM.theme.spacing.small) {
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(themeVM.theme.colors.accent)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Selected: \(selectedDriveFile.name)")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Ready to import")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        Spacer()
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(themeVM.theme.colors.cardBackground)
                    )
                    
                    Button(action: {
                        googleSheetsManager.importSheet(withID: selectedDriveFile.id)
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                            Text("Import this Sheet")
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(themeVM.theme.colors.accent)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            
            // Export Button
            Button(action: { showingExportSheet = true }) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title2)
                        .padding(.leading, 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Export to Google Sheets")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text("Export contacts to a new Google Sheets")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .padding(.trailing, 8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(themeVM.theme.colors.accent)
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Disconnect Button
            Button(action: {
                googleSheetsManager.logout()
            }) {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.title2)
                        .padding(.leading, 8)
                    Text("Disconnect Google Account")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Spacer(minLength: 8)
                }
                .foregroundColor(themeVM.theme.colors.error)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(themeVM.theme.colors.error, lineWidth: 1)
                )
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    private var authenticationPromptView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            Button(action: {
                Task {
                    await googleSheetsManager.authenticate()
                }
            }) {
                HStack {
                    Image(systemName: "person.crop.circle.badge.plus")
                        .font(.title2)
                        .padding(.leading, 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Connect Google Account")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text("Sign in to access Google Sheets")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer(minLength: 8)
                    if googleSheetsManager.isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .padding(.trailing, 8)
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(themeVM.theme.colors.primary)
                )
            }
            .buttonStyle(PlainButtonStyle())
            .disabled(googleSheetsManager.isLoading)
        }
    }
    
    private var instructionsView: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("How to use Google Sheets:")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                HStack {
                    Image(systemName: "1.circle.fill")
                        .foregroundColor(themeVM.theme.colors.primary)
                    Text("Connect your Google account")
                        .font(themeVM.theme.fonts.subheadlineFont)
                        .fontWeight(.medium)
                }
                
                HStack {
                    Image(systemName: "2.circle.fill")
                        .foregroundColor(themeVM.theme.colors.primary)
                    Text("Import from existing Google Sheets")
                        .font(themeVM.theme.fonts.subheadlineFont)
                        .fontWeight(.medium)
                }
                
                HStack {
                    Image(systemName: "3.circle.fill")
                        .foregroundColor(themeVM.theme.colors.primary)
                    Text("Export contacts to new Google Sheets")
                        .font(themeVM.theme.fonts.subheadlineFont)
                        .fontWeight(.medium)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(themeVM.theme.colors.cardBackground)
            )
        }
    }
    
    // MARK: - Helper Methods
    
    private func importContacts(_ contacts: [ContactRecord]) async {
        do {
            let dataImportManager = DataImportManager()
            try await dataImportManager.saveContactsToCoreData(contacts, context: viewContext) { progress, status in
                // Progress updates
            }
            
            await MainActor.run {
                showingImportPreview = false
                dismiss()
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Google Sheets Import View

struct GoogleSheetsImportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var googleSheetsManager: GoogleSheetsManager
    
    @State private var spreadsheetID = ""
    @State private var range = "A:Z"
    @State private var showingError = false
    @State private var errorMessage = ""
    
    let onImportComplete: ([ContactRecord]) -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.down")
                        .font(.system(size: 36))
                        .foregroundColor(themeVM.theme.colors.primary)
                    
                    Text("Import from Google Sheets")
                        .font(themeVM.theme.fonts.headerFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text("Enter your Google Sheets details")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 8)
                
                // Form
                VStack(spacing: themeVM.theme.spacing.medium) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Spreadsheet ID")
                            .font(themeVM.theme.fonts.subheadlineFont)
                            .fontWeight(.medium)
                        
                        TextField("Enter spreadsheet ID", text: $spreadsheetID)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Range (optional)")
                            .font(themeVM.theme.fonts.subheadlineFont)
                            .fontWeight(.medium)
                        
                        TextField("A:Z", text: $range)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    
                    // Help text
                    VStack(alignment: .leading, spacing: 4) {
                        Text("How to find your Spreadsheet ID:")
                            .font(themeVM.theme.fonts.captionFont)
                            .fontWeight(.medium)
                        
                        Text("1. Open your Google Sheets")
                            .font(themeVM.theme.fonts.captionFont)
                        Text("2. Look at the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit")
                            .font(themeVM.theme.fonts.captionFont)
                        Text("3. Copy the ID between /d/ and /edit")
                            .font(themeVM.theme.fonts.captionFont)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(themeVM.theme.colors.cardBackground)
                    )
                }
                
                Spacer()
                
                // Import Button
                Button(action: {
                    Task {
                        await importFromGoogleSheets()
                    }
                }) {
                    HStack {
                        if googleSheetsManager.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "square.and.arrow.down")
                                .font(.title2)
                        }
                        Text(googleSheetsManager.isLoading ? "Importing..." : "Import")
                            .font(.title3)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(themeVM.theme.colors.primary)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(spreadsheetID.isEmpty || googleSheetsManager.isLoading)
            }
            .padding(.horizontal, 16)
            .navigationTitle("Import from Google Sheets")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func importFromGoogleSheets() async {
        do {
            let contacts = try await googleSheetsManager.importFromGoogleSheets(
                spreadsheetID: spreadsheetID,
                range: range
            )
            
            await MainActor.run {
                onImportComplete(contacts)
                dismiss()
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Google Sheets Export View

struct GoogleSheetsExportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var googleSheetsManager: GoogleSheetsManager
    var context: NSManagedObjectContext
    
    @State private var spreadsheetTitle = ""
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var exportSuccess = false
    @State private var exportedSpreadsheetID = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 36))
                        .foregroundColor(themeVM.theme.colors.primary)
                    
                    Text("Export to Google Sheets")
                        .font(themeVM.theme.fonts.headerFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text("Create a new Google Sheets with your contacts")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 8)
                
                if exportSuccess {
                    successView
                } else {
                    exportFormView
                }
                
                Spacer()
                
                // Export Button
                if !exportSuccess {
                    Button(action: {
                        Task {
                            await exportToGoogleSheets()
                        }
                    }) {
                        HStack {
                            if googleSheetsManager.isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "square.and.arrow.up")
                                    .font(.title2)
                            }
                            Text(googleSheetsManager.isLoading ? "Exporting..." : "Export")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(themeVM.theme.colors.primary)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(spreadsheetTitle.isEmpty || googleSheetsManager.isLoading)
                }
            }
            .padding(.horizontal, 16)
            .navigationTitle("Export to Google Sheets")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private var exportFormView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Spreadsheet Title")
                    .font(themeVM.theme.fonts.subheadlineFont)
                    .fontWeight(.medium)
                
                TextField("Enter spreadsheet title", text: $spreadsheetTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Progress indicator
            if googleSheetsManager.isLoading {
                VStack(spacing: 8) {
                    ProgressView(value: googleSheetsManager.importProgress)
                        .progressViewStyle(LinearProgressViewStyle())
                    
                    Text(googleSheetsManager.importStatus)
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
            }
        }
    }
    
    private var successView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundColor(.green)
            
            Text("Export Successful!")
                .font(themeVM.theme.fonts.titleFont)
                .fontWeight(.semibold)
            
            Text("Your contacts have been exported to Google Sheets")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.center)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Spreadsheet ID:")
                    .font(themeVM.theme.fonts.subheadlineFont)
                    .fontWeight(.medium)
                
                Text(exportedSpreadsheetID)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(themeVM.theme.colors.cardBackground)
                    )
            }
        }
    }
    
    private func exportToGoogleSheets() async {
        do {
            // Fetch all contacts from Core Data
            let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
            let contacts = try context.fetch(fetchRequest)
            
            // Convert to ContactRecord
            let contactRecords = contacts.map { contact in
                ContactRecord(
                    firstName: contact.firstName ?? "",
                    lastName: contact.lastName ?? "",
                    mailingAddress: contact.mailingAddress ?? "",
                    city: contact.city ?? "",
                    state: contact.state ?? "",
                    zipCode: contact.zipCode,
                    email1: contact.email1,
                    email2: contact.email2,
                    phoneNumber1: contact.phoneNumber1,
                    phoneNumber2: contact.phoneNumber2,
                    phoneNumber3: contact.phoneNumber3,
                    phoneNumber4: contact.phoneNumber4,
                    phoneNumber5: contact.phoneNumber5,
                    phoneNumber6: contact.phoneNumber6,
                    siteMailingAddress: contact.siteMailingAddress,
                    siteCity: contact.siteCity,
                    siteState: contact.siteState,
                    siteZipCode: contact.siteZipCode,
                    notes: contact.notes,
                    farm: contact.farm ?? ""
                )
            }
            
            let spreadsheetID = try await googleSheetsManager.exportToGoogleSheets(
                contacts: contactRecords,
                spreadsheetTitle: spreadsheetTitle
            )
            
            await MainActor.run {
                exportedSpreadsheetID = spreadsheetID
                exportSuccess = true
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
} 