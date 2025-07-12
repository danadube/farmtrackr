//
//  ImportPreviewView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

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

struct ImportPreviewView: View {
    let contacts: [ContactRecord]
    let errors: [ValidationError]
    let importManager: DataImportManager
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @State private var showingImportProgress = false
    @State private var importProgress: Double = 0.0
    @State private var importStatus = ""
    @State private var showingImportComplete = false
    @State private var importError: String?
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                // Header
                VStack(spacing: Constants.Spacing.medium) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 36))
                        .foregroundColor(Constants.Colors.primary)
                    
                    Text("Import Preview")
                        .font(Constants.Typography.headerFont)
                        .foregroundColor(Constants.Colors.text)
                    
                    Text("Review your data before importing")
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, Constants.Spacing.large)
                
                // Summary
                VStack(spacing: Constants.Spacing.medium) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(contacts.count)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(Constants.Colors.primary)
                            Text("Contacts")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.secondaryLabel)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text("\(errors.count)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(errors.isEmpty ? .green : Constants.Colors.warning)
                            Text("Issues")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.secondaryLabel)
                        }
                    }
                    .padding(Constants.Spacing.medium)
                    .background(Constants.Colors.cardBackground)
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                
                // Content
                if errors.isEmpty {
                    // Show contacts preview
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Preview")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        
                        ScrollView {
                            LazyVStack(spacing: Constants.Spacing.small) {
                                ForEach(Array(contacts.prefix(5).enumerated()), id: \.offset) { index, contact in
                                    ContactPreviewRow(contact: contact, rowNumber: index + 1)
                                }
                                
                                if contacts.count > 5 {
                                    Text("... and \(contacts.count - 5) more contacts")
                                        .font(Constants.Typography.captionFont)
                                        .foregroundColor(.secondaryLabel)
                                        .frame(maxWidth: .infinity)
                                        .padding(Constants.Spacing.medium)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                } else {
                    // Show validation errors
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Validation Issues")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        
                        ScrollView {
                            LazyVStack(spacing: Constants.Spacing.small) {
                                ForEach(Array(errors.prefix(10).enumerated()), id: \.offset) { index, error in
                                    ValidationErrorRow(error: error)
                                }
                                
                                if errors.count > 10 {
                                    Text("... and \(errors.count - 10) more issues")
                                        .font(Constants.Typography.captionFont)
                                        .foregroundColor(.secondaryLabel)
                                        .frame(maxWidth: .infinity)
                                        .padding(Constants.Spacing.medium)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                }
                
                Spacer()
                
                // Action Buttons
                VStack(spacing: Constants.Spacing.medium) {
                    Button(action: {
                        Task {
                            await importContacts()
                        }
                    }) {
                        HStack {
                            Image(systemName: "checkmark.circle")
                            Text("Import \(contacts.count) Contacts")
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .fill(Constants.Colors.primary)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(Constants.Colors.secondary)
                }
            }
            .padding(Constants.Spacing.large)
            .background(Color(.systemBackground))
            .navigationTitle("Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingImportProgress) {
            ImportProgressView(progress: importProgress, status: importStatus)
        }
        .alert("Import Complete", isPresented: $showingImportComplete) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Successfully imported \(contacts.count) contacts")
        }
        .alert("Import Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(importError ?? "An unknown error occurred")
        }
    }
    
    private func importContacts() async {
        await MainActor.run {
            showingImportProgress = true
            importProgress = 0.0
            importStatus = "Starting import..."
        }
        
        do {
            let totalContacts = contacts.count
            var importedCount = 0
            
            for contact in contacts {
                try await importManager.importContact(contact, into: viewContext)
                importedCount += 1
                
                await MainActor.run {
                    importProgress = Double(importedCount) / Double(totalContacts)
                    importStatus = "Imported \(importedCount) of \(totalContacts) contacts..."
                }
            }
            
            try viewContext.save()
            
            await MainActor.run {
                showingImportProgress = false
                showingImportComplete = true
            }
            
        } catch {
            await MainActor.run {
                showingImportProgress = false
                importError = "Failed to import contacts: \(error.localizedDescription)"
                showingError = true
            }
        }
    }
} 