//
//  ImportView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import UniformTypeIdentifiers

struct ImportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var dataImportManager = DataImportManager()
    @StateObject private var excelImportManager = ExcelImportManager()
    @State private var showingFilePicker = false
    @State private var showingImportPreview = false
    @State private var selectedFileURL: URL?
    @State private var importError: String?
    @State private var showingError = false
    @State private var importedContacts: [ContactRecord] = []
    @State private var validationErrors: [ValidationError] = []
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                TabHeader(icon: "square.and.arrow.down", logoName: nil, title: "Import", subtitle: "Import your contacts from CSV or Excel files")
                
                // Import Button
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Button(action: {
                        showingFilePicker = true
                    }) {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                                .font(.title2)
                            Text("Import File")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(themeVM.theme.colors.primary)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Text("Supports CSV and Excel files")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondary)
                }
                
                // Instructions
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                    Text("Supported Formats:")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                        HStack {
                            Image(systemName: "doc.text")
                                .foregroundColor(.blue)
                            Text("CSV files (.csv)")
                        }
                        HStack {
                            Image(systemName: "doc.richtext")
                                .foregroundColor(.green)
                            Text("Excel files (.xlsx, .xls)")
                        }
                    }
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondary)
                }
                .padding(themeVM.theme.spacing.medium)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                
                Spacer()
            }
            .padding(themeVM.theme.spacing.large)
            .background(Color(.systemBackground))
            .navigationTitle("Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(content: {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            })
        }
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [.data],
            allowsMultipleSelection: false
        ) { result in
            Task {
                await handleFileSelection(result)
            }
        }
        .sheet(isPresented: $showingImportPreview) {
            ImportPreviewView(
                contacts: importedContacts,
                errors: validationErrors,
                importManager: dataImportManager
            )
        }
        .alert("Import Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(importError ?? "An unknown error occurred")
        }
    }
    
    private func handleFileSelection(_ result: Result<[URL], Error>) async {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { 
                await MainActor.run {
                    importError = "No file selected"
                    showingError = true
                }
                return 
            }
            
            // Check file extension to determine type
            let fileExtension = url.pathExtension.lowercased()
            
            do {
                let contacts: [ContactRecord]
                
                switch fileExtension {
                case "csv":
                    // Handle CSV import
                    contacts = try await dataImportManager.importCSV(from: url)
                    
                case "xlsx", "xls":
                    // Handle Excel import
                    contacts = try await excelImportManager.importSingleExcelFile(from: url)
                    
                default:
                    await MainActor.run {
                        importError = "Unsupported file format: .\(fileExtension). Please select a CSV (.csv) or Excel (.xlsx, .xls) file."
                        showingError = true
                    }
                    return
                }
                
                await MainActor.run {
                    if contacts.isEmpty {
                        importError = "No contacts found in the file. Please check that your file contains contact data in the expected format."
                        showingError = true
                    } else {
                        importedContacts = contacts
                        validationErrors = dataImportManager.validateData(contacts)
                        selectedFileURL = url
                        showingImportPreview = true
                    }
                }
                
            } catch {
                await MainActor.run {
                    importError = "Failed to import file: \(error.localizedDescription)"
                    showingError = true
                }
            }
            
        case .failure(let error):
            await MainActor.run {
                importError = "File selection failed: \(error.localizedDescription)"
                showingError = true
            }
        }
    }
}

#Preview {
    ImportView()
} 