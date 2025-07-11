//
//  ImportPreviewView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct ImportPreviewView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    
    let contacts: [ContactRecord]
    let errors: [ValidationError]
    let importManager: DataImportManager
    
    @State private var selectedTab = 0
    @State private var isSaving = false
    @State private var saveError: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("Preview", selection: $selectedTab) {
                    Text("Contacts (\(contacts.count))").tag(0)
                    if !errors.isEmpty {
                        Text("Errors (\(errors.count))").tag(1)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(Constants.Spacing.medium)
                
                // Content
                if selectedTab == 0 {
                    contactsPreview
                } else {
                    errorsPreview
                }
                
                // Save Button
                if errors.isEmpty && !contacts.isEmpty {
                    VStack(spacing: Constants.Spacing.medium) {
                        if isSaving {
                            ImportProgressView(progress: importManager.importProgress, status: importManager.importStatus)
                        }
                        
                        if let error = saveError {
                            Text(error)
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(Constants.Colors.error)
                                .padding(.horizontal, Constants.Spacing.medium)
                        }
                        
                        Button(isSaving ? "Saving..." : "Save to Database (\(contacts.count) contacts)") {
                            Task {
                                await saveContacts()
                            }
                        }
                        .primaryButtonStyle()
                        .disabled(isSaving)
                        .padding(.horizontal, Constants.Spacing.medium)
                        .padding(.bottom, Constants.Spacing.medium)
                    }
                }
            }
            .navigationTitle("Import Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var contactsPreview: some View {
        List {
            ForEach(Array(contacts.enumerated()), id: \.offset) { index, contact in
                ContactPreviewRow(contact: contact, rowNumber: index + 1)
            }
        }
        .listStyle(PlainListStyle())
    }
    
    private var errorsPreview: some View {
        List {
            ForEach(errors) { error in
                ValidationErrorRow(error: error)
            }
        }
        .listStyle(PlainListStyle())
    }
    
    private func saveContacts() async {
        isSaving = true
        saveError = nil
        importManager.isImporting = true
        importManager.importStatus = "Saving contacts..."
        importManager.importProgress = 0.0
        
        do {
            try await importManager.saveContactsToCoreData(contacts, context: viewContext)
            importManager.importStatus = "Import completed successfully!"
            importManager.importProgress = 1.0
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                dismiss()
            }
        } catch {
            saveError = "Import failed: \(error.localizedDescription)"
            importManager.importStatus = "Import failed"
        }
        
        isSaving = false
        importManager.isImporting = false
    }
}

struct ContactPreviewRow: View {
    let contact: ContactRecord
    let rowNumber: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            HStack {
                Text("Row \(rowNumber)")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                    .padding(.horizontal, Constants.Spacing.small)
                    .padding(.vertical, 2)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(Constants.CornerRadius.small)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Text("\(contact.firstName) \(contact.lastName)")
                    .font(Constants.Typography.titleFont)
                    .foregroundColor(Constants.Colors.text)
                
                Text(contact.farm)
                    .font(Constants.Typography.bodyFont)
                    .foregroundColor(.secondaryLabel)
                
                if !contact.mailingAddress.isEmpty {
                    Text(contact.mailingAddress)
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(Constants.Colors.text)
                    
                    Text("\(contact.city), \(contact.state) \(contact.zipCode > 0 ? String(contact.zipCode) : "")")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(.secondaryLabel)
                }
                
                // Contact Information
                HStack(spacing: Constants.Spacing.medium) {
                    if let email = contact.email1, !email.isEmpty {
                        ContactInfoBadge(icon: "envelope", text: email)
                    }
                    
                    if let phone = contact.phoneNumber1, !phone.isEmpty {
                        ContactInfoBadge(icon: "phone", text: phone)
                    }
                }
            }
        }
        .padding(Constants.Spacing.medium)
        .background(Constants.Colors.cardBackground)
        .cornerRadius(Constants.CornerRadius.medium)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: Constants.Spacing.small, leading: Constants.Spacing.medium, bottom: Constants.Spacing.small, trailing: Constants.Spacing.medium))
    }
}

struct ValidationErrorRow: View {
    let error: ValidationError
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            HStack {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(Constants.Colors.warning)
                
                Text("Row \(error.row)")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                    .padding(.horizontal, Constants.Spacing.small)
                    .padding(.vertical, 2)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(Constants.CornerRadius.small)
                
                Spacer()
            }
            
            Text(error.message)
                .font(Constants.Typography.bodyFont)
                .foregroundColor(Constants.Colors.text)
            
            Text("Field: \(error.field)")
                .font(Constants.Typography.captionFont)
                .foregroundColor(.secondaryLabel)
        }
        .padding(Constants.Spacing.medium)
        .background(Constants.Colors.cardBackground)
        .cornerRadius(Constants.CornerRadius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                .stroke(Constants.Colors.warning, lineWidth: 1)
        )
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: Constants.Spacing.small, leading: Constants.Spacing.medium, bottom: Constants.Spacing.small, trailing: Constants.Spacing.medium))
    }
}

struct ContactInfoBadge: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(Constants.Colors.primary)
            
            Text(text)
                .font(Constants.Typography.captionFont)
                .foregroundColor(Constants.Colors.text)
        }
        .padding(.horizontal, Constants.Spacing.small)
        .padding(.vertical, 2)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(Constants.CornerRadius.small)
    }
}

struct ImportProgressView: View {
    let progress: Double
    let status: String
    
    var body: some View {
        VStack(spacing: Constants.Spacing.medium) {
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: Constants.Colors.primary))
            
            Text(status)
                .font(Constants.Typography.bodyFont)
                .foregroundColor(Constants.Colors.secondary)
        }
        .padding(Constants.Spacing.medium)
        .background(Constants.Colors.cardBackground)
        .cornerRadius(Constants.CornerRadius.medium)
    }
} 