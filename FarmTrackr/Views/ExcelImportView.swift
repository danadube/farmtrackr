//
//  ExcelImportView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct ExcelImportView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var excelImportManager = ExcelImportManager()
    @StateObject private var dataImportManager = DataImportManager()
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var importedContacts: [ContactRecord] = []
    @State private var showingPreview = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                TabHeader(icon: "doc.text.magnifyingglass", logoName: nil, title: "Excel Import", subtitle: "Import contacts from Excel files in the Resources folder")
                
                // Excel Files Info
                VStack(alignment: .leading, spacing: 10) {
                    Text("Available Excel Files:")
                        .font(themeVM.theme.fonts.headlineFont)
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("• Farm Tables San Marino.xlsx")
                        Text("• Farm Tables Versailles.xlsx")
                        Text("• Farm Tables Tamarisk CC Ranch.xlsx")
                    }
                    .font(themeVM.theme.fonts.subheadlineFont)
                    .foregroundColor(themeVM.theme.colors.secondary)
                }
                .padding()
                .background(themeVM.theme.colors.backgroundSecondary)
                .cornerRadius(10)
                
                // Import Buttons
                VStack(spacing: 12) {
                    // Direct Import Button
                    Button(action: importAndSaveDirectly) {
                        HStack {
                            Image(systemName: "arrow.down.doc.fill")
                            Text("Import All Files Directly")
                        }
                        .font(themeVM.theme.fonts.headlineFont)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(excelImportManager.isImporting || dataImportManager.isImporting ? themeVM.theme.colors.disabled : themeVM.theme.colors.primary)
                        .cornerRadius(10)
                    }
                    .disabled(excelImportManager.isImporting || dataImportManager.isImporting)
                    
                    // Preview Import Button
                    Button(action: importExcelFiles) {
                        HStack {
                            Image(systemName: "arrow.down.doc")
                            Text("Import & Preview First")
                        }
                        .font(themeVM.theme.fonts.headlineFont)
                        .foregroundColor(themeVM.theme.colors.text)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(excelImportManager.isImporting || dataImportManager.isImporting ? themeVM.theme.colors.disabled : Color(.systemGray5))
                        .cornerRadius(10)
                    }
                    .disabled(excelImportManager.isImporting || dataImportManager.isImporting)
                }
                .padding(.horizontal)
                
                // Progress View
                if excelImportManager.isImporting {
                    VStack(spacing: 10) {
                        ProgressView(value: excelImportManager.importProgress)
                            .progressViewStyle(LinearProgressViewStyle())
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                        
                        Text(excelImportManager.importStatus)
                            .font(themeVM.theme.fonts.captionFont)
                            .foregroundColor(themeVM.theme.colors.secondary)
                    }
                    .padding(.horizontal)
                }
                
                // Preview Button
                if !importedContacts.isEmpty {
                    Button(action: { showingPreview = true }) {
                        HStack {
                            Image(systemName: "eye")
                            Text("Preview \(importedContacts.count) Contacts")
                        }
                        .font(themeVM.theme.fonts.headlineFont)
                        .foregroundColor(themeVM.theme.colors.text)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(themeVM.theme.colors.success)
                        .cornerRadius(10)
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding(themeVM.theme.spacing.large)
            .background(Color(.systemBackground))
            .navigationTitle("Excel Import")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Import Result", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .sheet(isPresented: $showingPreview) {
                ImportPreviewView(
                    contacts: importedContacts,
                    errors: [],
                    importManager: dataImportManager
                )
            }
        }
    }
    
    private func importExcelFiles() {
        Task {
            await MainActor.run {
                excelImportManager.isImporting = true
                excelImportManager.importProgress = 0
                excelImportManager.importStatus = "Starting import..."
            }
            
            do {
                let contacts = try await excelImportManager.importExcelFiles()
                
                await MainActor.run {
                    importedContacts = contacts
                    excelImportManager.isImporting = false
                    
                    if contacts.isEmpty {
                        alertMessage = "No contacts found in the Excel files."
                    } else {
                        alertMessage = "Successfully imported \(contacts.count) contacts from Excel files."
                    }
                    showingAlert = true
                }
            } catch {
                await MainActor.run {
                    excelImportManager.isImporting = false
                    alertMessage = "Import failed: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
        }
    }
    
    private func saveContactsToDatabase() {
        Task {
            await MainActor.run {
                dataImportManager.isImporting = true
                dataImportManager.importProgress = 0
                dataImportManager.importStatus = "Saving to database..."
            }
            
            do {
                try await dataImportManager.saveContactsToCoreData(importedContacts, context: viewContext)
                
                await MainActor.run {
                    dataImportManager.isImporting = false
                    alertMessage = "Successfully saved \(importedContacts.count) contacts to the database!"
                    showingAlert = true
                    importedContacts = []
                }
            } catch {
                await MainActor.run {
                    dataImportManager.isImporting = false
                    alertMessage = "Failed to save contacts: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
        }
    }
    
    private func importAndSaveDirectly() {
        Task {
            await MainActor.run {
                excelImportManager.isImporting = true
                excelImportManager.importProgress = 0
                excelImportManager.importStatus = "Starting import..."
            }
            
            do {
                let contacts = try await excelImportManager.importExcelFiles()
                
                await MainActor.run {
                    excelImportManager.isImporting = false
                    dataImportManager.isImporting = true
                    dataImportManager.importProgress = 0
                    dataImportManager.importStatus = "Saving to database..."
                }
                
                // Save directly to database
                try await dataImportManager.saveContactsToCoreData(contacts, context: viewContext)
                
                await MainActor.run {
                    dataImportManager.isImporting = false
                    if contacts.isEmpty {
                        alertMessage = "No contacts found in the Excel files."
                    } else {
                        alertMessage = "Successfully imported and saved \(contacts.count) contacts to the database!"
                    }
                    showingAlert = true
                }
                
            } catch {
                await MainActor.run {
                    excelImportManager.isImporting = false
                    dataImportManager.isImporting = false
                    alertMessage = "Import failed: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
        }
    }
}

#Preview {
    ExcelImportView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 