//
//  BackupView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import UniformTypeIdentifiers
import CoreData

struct BackupView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Environment(\.managedObjectContext) private var viewContext
    @State private var isCreatingBackup = false
    @State private var showingShareSheet = false
    @State private var backupURL: URL?
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var alertTitle = "Backup"
    @State private var backupProgress: Double = 0.0
    @State private var backupStatus = ""
    @State private var backupMetadata: BackupMetadata?
    @State private var showingDocumentPicker = false
    @State private var selectedSaveLocation: URL?
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(
                icon: "icloud.and.arrow.up",
                logoName: nil,
                title: "Backup & Restore",
                subtitle: "Create and manage your data backups"
            )
            
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    // Header Section
                    headerSection
                    
                    // Backup Info Section
                    backupInfoSection
                    
                    // Current Data Summary
                    if let metadata = backupMetadata {
                        currentDataSection(metadata: metadata)
                    }
                    
                    // Backup Progress (when creating)
                    if isCreatingBackup {
                        backupProgressSection
                    }
                    
                    // Recent Backups (if any)
                    recentBackupsSection
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
            }
        }
        .safeAreaInset(edge: .bottom) {
            bottomActionSection
        }
        .background(themeVM.theme.colors.background)
        .sheet(isPresented: $showingShareSheet) {
            if let backupURL = backupURL {
                ShareSheet(items: [backupURL])
            }
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPicker(types: [.json]) { url in
                selectedSaveLocation = url
                saveBackupToLocation()
            }
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
        .onAppear {
            loadBackupMetadata()
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "icloud.and.arrow.up")
                .font(.system(size: 60))
                .foregroundColor(themeVM.theme.colors.primary)
                .accessibilityLabel("Backup icon")
            
            Text("Create Backup")
                .font(themeVM.theme.fonts.headerFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("Create a backup of all your farm contacts that you can save locally or restore later")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.center)
                .accessibilityLabel("Backup description")
        }
        .padding(.top, themeVM.theme.spacing.extraLarge)
    }
    
    // MARK: - Backup Info Section
    
    private var backupInfoSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("What's included:")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                BackupInfoRow(icon: "person.2", text: "All farm contacts")
                BackupInfoRow(icon: "envelope", text: "Contact information")
                BackupInfoRow(icon: "location", text: "Addresses and notes")
                BackupInfoRow(icon: "calendar", text: "Creation and modification dates")
                BackupInfoRow(icon: "building.2", text: "Farm associations")
                BackupInfoRow(icon: "phone", text: "Phone numbers and emails")
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Backup contents information")
    }
    
    // MARK: - Current Data Section
    
    private func currentDataSection(metadata: BackupMetadata) -> some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Current Data Summary")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(spacing: themeVM.theme.spacing.small) {
                DataSummaryRow(
                    icon: "person.2",
                    title: "Total Contacts",
                    value: "\(metadata.contactCount)",
                    color: themeVM.theme.colors.primary
                )
                
                DataSummaryRow(
                    icon: "building.2",
                    title: "Unique Farms",
                    value: "\(metadata.uniqueFarms)",
                    color: themeVM.theme.colors.secondary
                )
                
                DataSummaryRow(
                    icon: "calendar",
                    title: "Last Modified",
                    value: metadata.lastModifiedDate,
                    color: themeVM.theme.colors.accent
                )
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Current data summary with \(metadata.contactCount) contacts from \(metadata.uniqueFarms) farms")
    }
    
    // MARK: - Backup Progress Section
    
    private var backupProgressSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Creating Backup...")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(spacing: themeVM.theme.spacing.small) {
                ProgressView(value: backupProgress)
                    .progressViewStyle(LinearProgressViewStyle(tint: themeVM.theme.colors.primary))
                    .accessibilityValue("\(Int(backupProgress * 100))% complete")
                
                Text(backupStatus)
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .accessibilityLabel("Backup status: \(backupStatus)")
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
    
    // MARK: - Recent Backups Section
    
    private var recentBackupsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Recent Backups")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("No recent backups found")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .italic()
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .accessibilityLabel("Recent backups section")
    }
    
    // MARK: - Bottom Action Section
    
    private var bottomActionSection: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            // Primary Backup Button
            Button(action: createBackup) {
                HStack {
                    if isCreatingBackup {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "icloud.and.arrow.up")
                    }
                    Text(isCreatingBackup ? "Creating Backup..." : "Create Backup")
                }
                .font(themeVM.theme.fonts.buttonFont)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(themeVM.theme.spacing.medium)
                .background(themeVM.theme.colors.primary)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
            }
            .disabled(isCreatingBackup)
            .accessibilityLabel("Create backup button")
            .accessibilityHint("Creates a backup of all farm contacts")
            
            // Secondary Actions
            if backupURL != nil {
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Button(action: { showingShareSheet = true }) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share")
                        }
                        .font(themeVM.theme.fonts.buttonFont)
                        .foregroundColor(themeVM.theme.colors.primary)
                        .frame(maxWidth: .infinity)
                        .padding(themeVM.theme.spacing.medium)
                        .background(themeVM.theme.colors.primary.opacity(0.1))
                        .cornerRadius(themeVM.theme.cornerRadius.medium)
                    }
                    .accessibilityLabel("Share backup file")
                    
                    Button(action: { showingDocumentPicker = true }) {
                        HStack {
                            Image(systemName: "folder")
                            Text("Save As...")
                        }
                        .font(themeVM.theme.fonts.buttonFont)
                        .foregroundColor(themeVM.theme.colors.primary)
                        .frame(maxWidth: .infinity)
                        .padding(themeVM.theme.spacing.medium)
                        .background(themeVM.theme.colors.primary.opacity(0.1))
                        .cornerRadius(themeVM.theme.cornerRadius.medium)
                    }
                    .accessibilityLabel("Save backup to specific location")
                }
            }
        }
        .padding(.horizontal, themeVM.theme.spacing.large)
        .padding(.bottom, themeVM.theme.spacing.large)
    }
    
    // MARK: - Private Methods
    
    private func loadBackupMetadata() {
        Task {
            do {
                let metadata = try await getBackupMetadata()
                await MainActor.run {
                    self.backupMetadata = metadata
                }
            } catch {
                print("Error loading backup metadata: \(error)")
            }
        }
    }
    
    private func createBackup() {
        isCreatingBackup = true
        backupProgress = 0.0
        backupStatus = "Preparing backup..."
        
        Task {
            do {
                let url = try await createLocalBackup()
                await MainActor.run {
                    self.backupURL = url
                    self.isCreatingBackup = false
                    self.backupProgress = 1.0
                    self.backupStatus = "Backup completed successfully"
                    self.alertTitle = "Success"
                    self.alertMessage = "Backup created successfully! You can now share or save the backup file."
                    self.showingAlert = true
                }
            } catch {
                await MainActor.run {
                    self.isCreatingBackup = false
                    self.backupProgress = 0.0
                    self.backupStatus = "Backup failed"
                    self.alertTitle = "Backup Failed"
                    self.alertMessage = "Failed to create backup: \(error.localizedDescription)\n\nPlease try again or contact support if the problem persists."
                    self.showingAlert = true
                }
            }
        }
    }
    
    private func createLocalBackup() async throws -> URL {
        // Step 1: Fetch contacts
        await MainActor.run {
            backupProgress = 0.1
            backupStatus = "Fetching contacts..."
        }
        
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        let contacts = try viewContext.fetch(fetchRequest)
        
        await MainActor.run {
            backupProgress = 0.3
            backupStatus = "Processing contact data..."
        }
        
        // Step 2: Create backup data
        let backupData = try JSONEncoder().encode(contacts.map { ContactBackupData(from: $0) })
        
        await MainActor.run {
            backupProgress = 0.6
            backupStatus = "Creating backup file..."
        }
        
        // Step 3: Create backup file
        let timestamp = DateFormatter.backupTimestamp.string(from: Date())
        let backupURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("FarmTrackr_Backup_\(timestamp)")
            .appendingPathExtension("json")
        
        try backupData.write(to: backupURL)
        
        await MainActor.run {
            backupProgress = 0.9
            backupStatus = "Finalizing backup..."
        }
        
        // Step 4: Verify backup
        let verificationData = try Data(contentsOf: backupURL)
        let _ = try JSONDecoder().decode([ContactBackupData].self, from: verificationData)
        
        await MainActor.run {
            backupProgress = 1.0
            backupStatus = "Backup completed successfully"
        }
        
        return backupURL
    }
    
    private func getBackupMetadata() async throws -> BackupMetadata {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        let contacts = try viewContext.fetch(fetchRequest)
        
        let uniqueFarms = Set(contacts.compactMap { $0.farm }).count
        let lastModified = contacts.map { $0.dateModified ?? $0.dateCreated ?? Date() }.max() ?? Date()
        
        return BackupMetadata(
            contactCount: contacts.count,
            uniqueFarms: uniqueFarms,
            lastModifiedDate: DateFormatter.backupDate.string(from: lastModified),
            estimatedSize: "\(contacts.count * 500) bytes" // Rough estimate
        )
    }
    
    private func saveBackupToLocation() {
        guard let backupURL = backupURL,
              let selectedLocation = selectedSaveLocation else { return }
        
        Task {
            do {
                let data = try Data(contentsOf: backupURL)
                try data.write(to: selectedLocation)
                
                await MainActor.run {
                    self.alertTitle = "Success"
                    self.alertMessage = "Backup saved successfully to the selected location."
                    self.showingAlert = true
                }
            } catch {
                await MainActor.run {
                    self.alertTitle = "Save Failed"
                    self.alertMessage = "Failed to save backup: \(error.localizedDescription)"
                    self.showingAlert = true
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct BackupInfoRow: View {
    let icon: String
    let text: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.small) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 20)
                .accessibilityHidden(true)
            
            Text(text)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            Spacer()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(text) included in backup")
    }
}

struct DataSummaryRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
                .accessibilityHidden(true)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                
                Text(value)
                    .font(themeVM.theme.fonts.title3)
                    .foregroundColor(themeVM.theme.colors.text)
                    .fontWeight(.semibold)
            }
            
            Spacer()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(value)")
    }
}

// MARK: - Supporting Types

struct BackupMetadata {
    let contactCount: Int
    let uniqueFarms: Int
    let lastModifiedDate: String
    let estimatedSize: String
}

// MARK: - Date Formatters

extension DateFormatter {
    static let backupTimestamp: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        return formatter
    }()
    
    static let backupDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}

#Preview {
    BackupView()
        .environmentObject(ThemeViewModel())
} 