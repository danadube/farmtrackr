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
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    // Header
                    VStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "icloud.and.arrow.up")
                            .font(.system(size: 60))
                            .foregroundColor(themeVM.theme.colors.primary)
                        
                        Text("Create Backup")
                            .font(themeVM.theme.fonts.headerFont)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Text("Create a backup of all your farm contacts that you can save locally or restore later")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, themeVM.theme.spacing.extraLarge)
                    
                    // Backup Info
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                        Text("What's included:")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                            BackupInfoRow(icon: "person.2", text: "All farm contacts")
                            BackupInfoRow(icon: "envelope", text: "Contact information")
                            BackupInfoRow(icon: "location", text: "Addresses and notes")
                            BackupInfoRow(icon: "calendar", text: "Creation and modification dates")
                        }
                    }
                    .padding(themeVM.theme.spacing.large)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(themeVM.theme.cornerRadius.medium)
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: themeVM.theme.spacing.medium) {
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
                    if backupURL != nil {
                        Button(action: { showingShareSheet = true }) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share Backup File")
                            }
                            .font(themeVM.theme.fonts.buttonFont)
                            .foregroundColor(themeVM.theme.colors.primary)
                            .frame(maxWidth: .infinity)
                            .padding(themeVM.theme.spacing.medium)
                            .background(themeVM.theme.colors.primary.opacity(0.1))
                            .cornerRadius(themeVM.theme.cornerRadius.medium)
                        }
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
                .padding(.bottom, themeVM.theme.spacing.large)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Backup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let backupURL = backupURL {
                ShareSheet(items: [backupURL])
            }
        }
        .alert("Backup", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func createBackup() {
        isCreatingBackup = true
        Task {
            do {
                let url = try await createLocalBackup()
                await MainActor.run {
                    self.backupURL = url
                    self.isCreatingBackup = false
                    self.alertMessage = "Backup created successfully!"
                    self.showingAlert = true
                }
            } catch {
                await MainActor.run {
                    self.isCreatingBackup = false
                    self.alertMessage = "Failed to create backup: \(error.localizedDescription)"
                    self.showingAlert = true
                }
            }
        }
    }
    
    private func createLocalBackup() async throws -> URL {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        let contacts = try viewContext.fetch(fetchRequest)
        let backupData = try JSONEncoder().encode(contacts.map { ContactBackupData(from: $0) })
        let backupURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("FarmTrackr_Backup_\(Date().timeIntervalSince1970)")
            .appendingPathExtension("json")
        try backupData.write(to: backupURL)
        return backupURL
    }
}

struct BackupInfoRow: View {
    let icon: String
    let text: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.small) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 20)
            
            Text(text)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            Spacer()
        }
    }
}



#Preview {
    BackupView()
        .environmentObject(ThemeViewModel())
} 