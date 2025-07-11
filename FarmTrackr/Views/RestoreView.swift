//
//  RestoreView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import UniformTypeIdentifiers

struct RestoreView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Environment(\.managedObjectContext) private var viewContext
    @State private var showingDocumentPicker = false
    @State private var selectedBackupURL: URL?
    @State private var isRestoring = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var showingConfirmation = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                headerSection
                warningSection
                selectedFileSection
                actionButtons
                Spacer()
            }
            .padding(themeVM.theme.spacing.large)
            .background(Color(.systemBackground))
            .navigationTitle("Restore")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .fileImporter(
            isPresented: $showingDocumentPicker,
            allowedContentTypes: [UTType.json],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first {
                    selectedBackupURL = url
                }
            case .failure(let error):
                alertMessage = "Failed to select file: \(error.localizedDescription)"
                showingAlert = true
            }
        }
        .alert("Restore Backup", isPresented: $showingConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Restore", role: .destructive) {
                restoreFromBackup()
            }
        } message: {
            Text("This will replace all existing contacts with the backup data. This action cannot be undone.")
        }
        .alert("Restore", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    // MARK: - View Components
    
    private var headerSection: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "icloud.and.arrow.down")
                .font(.system(size: 60))
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Restore from Backup")
                .font(themeVM.theme.fonts.headerFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            Text("Restore your farm contacts from a previously created backup file")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.center)
        }
        .padding(.top, themeVM.theme.spacing.extraLarge)
    }
    
    private var warningSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            HStack {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(themeVM.theme.colors.warning)
                Text("Important")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
            }
            
            Text("Restoring from a backup will replace all existing contacts. Make sure you have a current backup before proceeding.")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.warning.opacity(0.1))
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
    
    private var selectedFileSection: some View {
        Group {
            if let selectedBackupURL = selectedBackupURL {
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                    Text("Selected Backup:")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(themeVM.theme.colors.primary)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(selectedBackupURL.lastPathComponent)
                                .font(themeVM.theme.fonts.bodyFont)
                                .foregroundColor(themeVM.theme.colors.text)
                            
                            Text("Size: \(fileSizeString(for: selectedBackupURL))")
                                .font(themeVM.theme.fonts.captionFont)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        
                        Spacer()
                        
                        Button(action: { self.selectedBackupURL = nil }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(themeVM.theme.colors.error)
                        }
                    }
                    .padding(themeVM.theme.spacing.medium)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(themeVM.theme.cornerRadius.small)
                }
            }
        }
    }
    
    private var actionButtons: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            // Select Backup Button
            if selectedBackupURL == nil {
                Button(action: { showingDocumentPicker = true }) {
                    HStack {
                        Image(systemName: "doc.badge.plus")
                        Text("Select Backup File")
                    }
                    .font(themeVM.theme.fonts.buttonFont)
                    .foregroundColor(themeVM.theme.colors.primary)
                    .frame(maxWidth: .infinity)
                    .padding(themeVM.theme.spacing.medium)
                    .background(themeVM.theme.colors.primary.opacity(0.1))
                    .cornerRadius(themeVM.theme.cornerRadius.medium)
                }
            }
            
            // Restore Button
            if selectedBackupURL != nil {
                Button(action: { showingConfirmation = true }) {
                    HStack {
                        if isRestoring {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "icloud.and.arrow.down")
                        }
                        Text(isRestoring ? "Restoring..." : "Restore from Backup")
                    }
                    .font(themeVM.theme.fonts.buttonFont)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(themeVM.theme.spacing.medium)
                    .background(themeVM.theme.colors.primary)
                    .cornerRadius(themeVM.theme.cornerRadius.medium)
                }
                .disabled(isRestoring)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func restoreFromBackup() {
        guard let backupURL = selectedBackupURL else { return }
        isRestoring = true
        Task {
            do {
                try await restoreLocalBackup(url: backupURL)
                await MainActor.run {
                    self.isRestoring = false
                    self.alertMessage = "Backup restored successfully!"
                    self.showingAlert = true
                    self.selectedBackupURL = nil
                }
            } catch {
                await MainActor.run {
                    self.isRestoring = false
                    self.alertMessage = "Failed to restore backup: \(error.localizedDescription)"
                    self.showingAlert = true
                }
            }
        }
    }
    
    private func restoreLocalBackup(url: URL) async throws {
        let backupData = try Data(contentsOf: url)
        let contacts = try JSONDecoder().decode([ContactBackupData].self, from: backupData)
        for contactData in contacts {
            let contact = FarmContact(context: viewContext)
            contactData.apply(to: contact)
        }
        try viewContext.save()
    }
    
    private func fileSizeString(for url: URL) -> String {
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            if let fileSize = attributes[.size] as? Int64 {
                let formatter = ByteCountFormatter()
                formatter.allowedUnits = [.useKB, .useMB]
                formatter.countStyle = .file
                return formatter.string(fromByteCount: fileSize)
            }
        } catch {
            print("Error getting file size: \(error)")
        }
        return "Unknown size"
    }
}

#Preview {
    RestoreView()
        .environmentObject(ThemeViewModel())
} 