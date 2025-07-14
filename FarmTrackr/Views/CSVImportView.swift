//
//  CSVImportView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 1/15/25.
//

import SwiftUI
import UniformTypeIdentifiers

struct CSVImportView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var themeVM: ThemeViewModel
    
    @StateObject private var csvImportManager = CSVImportManager()
    @State private var showingFilePicker = false
    @State private var showingImportPreview = false
    @State private var selectedFileURL: URL?
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                // Header
                headerSection
                
                // File Selection
                fileSelectionSection
                
                // Import Progress
                if csvImportManager.isImporting {
                    importProgressSection
                }
                
                // Field Mapping
                if !csvImportManager.availableFields.isEmpty {
                    fieldMappingSection
                }
                
                // Preview
                if !csvImportManager.previewData.isEmpty {
                    previewSection
                }
                
                Spacer()
                
                // Action Buttons
                actionButtonsSection
            }
            .padding()
            .background(themeVM.theme.colors.background)
            .navigationTitle("CSV Import")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                },
                trailing: Button("Import") {
                    importContacts()
                }
                .disabled(csvImportManager.previewData.isEmpty)
            )
        }
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [UTType.commaSeparatedText, UTType.plainText],
            allowsMultipleSelection: false
        ) { result in
            handleFileSelection(result)
        }
        .alert("Import Error", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            Image(systemName: "doc.text")
                .font(.system(size: 48))
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Import Contacts from CSV")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Select a CSV file to import your contacts. The app will automatically detect field mappings and show you a preview.")
                .font(.body)
                .foregroundColor(themeVM.theme.colors.secondary)
                .multilineTextAlignment(.center)
        }
    }
    
    private var fileSelectionSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            if let fileURL = selectedFileURL {
                // Selected file info
                VStack(spacing: Constants.Spacing.small) {
                    HStack {
                        Image(systemName: "doc.text.fill")
                            .foregroundColor(themeVM.theme.colors.accent)
                        Text(fileURL.lastPathComponent)
                            .font(.headline)
                        Spacer()
                    }
                    
                    HStack {
                        Text("Delimiter: \(csvImportManager.detectedDelimiter)")
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.secondary)
                        Spacer()
                        Button("Change File") {
                            showingFilePicker = true
                        }
                        .font(.caption)
                    }
                }
                .padding()
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
            } else {
                // File selection button
                Button(action: {
                    showingFilePicker = true
                }) {
                    VStack(spacing: Constants.Spacing.medium) {
                        Image(systemName: "doc.badge.plus")
                            .font(.system(size: 32))
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Select CSV File")
                            .font(.headline)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Text("Choose a CSV file to import")
                            .font(.caption)
                            .foregroundColor(themeVM.theme.colors.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(themeVM.theme.colors.accent, style: StrokeStyle(lineWidth: 2, dash: [5]))
                    )
                }
            }
        }
    }
    
    private var importProgressSection: some View {
        VStack(spacing: Constants.Spacing.small) {
            ProgressView(value: csvImportManager.importProgress)
                .progressViewStyle(LinearProgressViewStyle(tint: themeVM.theme.colors.accent))
            
            Text(csvImportManager.importStatus)
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.secondary)
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var fieldMappingSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Field Mapping")
                .font(.headline)
                .foregroundColor(themeVM.theme.colors.primary)
            
            Text("Map CSV columns to contact fields")
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.secondary)
            
            LazyVStack(spacing: Constants.Spacing.small) {
                ForEach(csvImportManager.availableFields, id: \.self) { field in
                    FieldMappingRow(
                        csvField: field,
                        mappedField: csvImportManager.fieldMapping[field],
                        availableMappings: getAvailableMappings(for: field),
                        onMappingChanged: { newMapping in
                            csvImportManager.updateFieldMapping(field: field, mappedTo: newMapping)
                        },
                        themeVM: themeVM
                    )
                }
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var previewSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            HStack {
                Text("Preview (\(csvImportManager.previewData.count) contacts)")
                    .font(.headline)
                    .foregroundColor(themeVM.theme.colors.primary)
                
                Spacer()
                
                Button("View All") {
                    showingImportPreview = true
                }
                .font(.caption)
                .foregroundColor(themeVM.theme.colors.accent)
            }
            
            // Show first 3 contacts as preview
            LazyVStack(spacing: Constants.Spacing.small) {
                let previewContacts = Array(csvImportManager.previewData.prefix(3))
                ForEach(previewContacts.indices, id: \.self) { idx in
                    CSVContactPreviewRow(contact: previewContacts[idx], themeVM: themeVM)
                }
                if csvImportManager.previewData.count > 3 {
                    Text("... and \(csvImportManager.previewData.count - 3) more")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
        }
        .padding()
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(12)
    }
    
    private var actionButtonsSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            if !csvImportManager.previewData.isEmpty {
                Button(action: importContacts) {
                    Text("Import \(csvImportManager.previewData.count) Contacts")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(themeVM.theme.colors.accent)
                        .cornerRadius(12)
                }
            }
        }
    }
    
    private func handleFileSelection(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            selectedFileURL = url
            
            Task {
                do {
                    _ = try await csvImportManager.importCSVFile(from: url)
                } catch {
                    await MainActor.run {
                        alertMessage = error.localizedDescription
                        showingAlert = true
                    }
                }
            }
            
        case .failure(let error):
            alertMessage = error.localizedDescription
            showingAlert = true
        }
    }
    
    private func getAvailableMappings(for field: String) -> [String] {
        let normalizedField = field.lowercased()
        
        // Return relevant mappings based on the field name
        if normalizedField.contains("name") {
            return ["firstName", "lastName"]
        } else if normalizedField.contains("email") {
            return ["email1", "email2"]
        } else if normalizedField.contains("phone") || normalizedField.contains("tel") {
            return ["phoneNumber1", "phoneNumber2", "phoneNumber3", "phoneNumber4", "phoneNumber5", "phoneNumber6"]
        } else if normalizedField.contains("address") {
            return ["mailingAddress", "siteMailingAddress"]
        } else if normalizedField.contains("city") {
            return ["city", "siteCity"]
        } else if normalizedField.contains("state") {
            return ["state", "siteState"]
        } else if normalizedField.contains("zip") {
            return ["zipCode", "siteZipCode"]
        } else {
            return [
                "firstName", "lastName", "farm", "mailingAddress", "city", "state", 
                "zipCode", "email1", "phoneNumber1", "notes", "email2", "phoneNumber2",
                "phoneNumber3", "phoneNumber4", "phoneNumber5", "phoneNumber6",
                "siteMailingAddress", "siteCity", "siteState", "siteZipCode"
            ]
        }
    }
    
    private func importContacts() {
        guard !csvImportManager.previewData.isEmpty else { return }
        
        Task {
            do {
                // Save contacts to Core Data
                for contactRecord in csvImportManager.previewData {
                    let contact = FarmContact(context: viewContext)
                    contact.firstName = contactRecord.firstName
                    contact.lastName = contactRecord.lastName
                    contact.farm = contactRecord.farm
                    contact.mailingAddress = contactRecord.mailingAddress
                    contact.city = contactRecord.city
                    contact.state = contactRecord.state
                    contact.zipCode = contactRecord.zipCode
                    contact.email1 = contactRecord.email1
                    contact.phoneNumber1 = contactRecord.phoneNumber1
                    contact.notes = contactRecord.notes
                    contact.email2 = contactRecord.email2
                    contact.phoneNumber2 = contactRecord.phoneNumber2
                    contact.phoneNumber3 = contactRecord.phoneNumber3
                    contact.phoneNumber4 = contactRecord.phoneNumber4
                    contact.phoneNumber5 = contactRecord.phoneNumber5
                    contact.phoneNumber6 = contactRecord.phoneNumber6
                    contact.siteMailingAddress = contactRecord.siteMailingAddress
                    contact.siteCity = contactRecord.siteCity
                    contact.siteState = contactRecord.siteState
                    contact.siteZipCode = contactRecord.siteZipCode
                }
                
                try viewContext.save()
                
                await MainActor.run {
                    dismiss()
                }
                
            } catch {
                await MainActor.run {
                    alertMessage = "Failed to import contacts: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
        }
    }
}

struct FieldMappingRow: View {
    let csvField: String
    let mappedField: String?
    let availableMappings: [String]
    let onMappingChanged: (String?) -> Void
    @ObservedObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack {
            Text(csvField)
                .font(.body)
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 120, alignment: .leading)
            
            Image(systemName: "arrow.right")
                .foregroundColor(themeVM.theme.colors.secondary)
            
            Menu {
                Button("Don't Import") {
                    onMappingChanged(nil)
                }
                
                Divider()
                
                ForEach(availableMappings, id: \.self) { mapping in
                    Button(mapping) {
                        onMappingChanged(mapping)
                    }
                }
            } label: {
                HStack {
                    Text(mappedField ?? "Don't Import")
                        .foregroundColor(mappedField != nil ? themeVM.theme.colors.primary : themeVM.theme.colors.secondary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(themeVM.theme.colors.background)
                .cornerRadius(8)
            }
        }
    }
}

struct CSVContactPreviewRow: View {
    let contact: ContactRecord
    @ObservedObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: Constants.Spacing.medium) {
            // Avatar
            Circle()
                .fill(themeVM.theme.colors.primary.opacity(0.2))
                .frame(width: 32, height: 32)
                .overlay(
                    Text(contact.fullName.prefix(1).uppercased())
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.primary)
                )
            
            // Contact Info
            VStack(alignment: .leading, spacing: 2) {
                Text(contact.fullName)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(themeVM.theme.colors.primary)
                
                if !contact.farm.isEmpty {
                    Text(contact.farm)
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.secondary)
                }
                
                if (contact.email1 ?? "").isEmpty == false || (contact.phoneNumber1 ?? "").isEmpty == false {
                    HStack(spacing: Constants.Spacing.small) {
                        if let email = contact.email1, !email.isEmpty {
                            Text(email)
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        if let phone = contact.phoneNumber1, !phone.isEmpty {
                            Text(phone)
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

extension ContactRecord {
    var fullName: String {
        let firstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let lastName = lastName.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if !firstName.isEmpty && !lastName.isEmpty {
            return "\(firstName) \(lastName)"
        } else if !firstName.isEmpty {
            return firstName
        } else if !lastName.isEmpty {
            return lastName
        } else {
            return "Unknown"
        }
    }
} 