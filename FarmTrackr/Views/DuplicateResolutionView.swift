//
//  DuplicateResolutionView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct DuplicateResolutionView: View {
    let duplicates: [FarmContact]
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var groupedDuplicates: [[FarmContact]] = []
    @State private var selectedContacts: Set<FarmContact> = []
    @State private var showingMergeSheet = false
    @State private var contactsToMerge: [FarmContact] = []
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Duplicates List
                duplicatesList
            }
            .background(themeVM.theme.colors.background)
        }
        .navigationTitle("Duplicate Resolution")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Merge Selected") {
                    if selectedContacts.count >= 2 {
                        contactsToMerge = Array(selectedContacts)
                        showingMergeSheet = true
                    }
                }
                .disabled(selectedContacts.count < 2)
            }
        }
        .onAppear {
            groupDuplicates()
        }
        .sheet(isPresented: $showingMergeSheet) {
            ContactMergeView(contacts: contactsToMerge)
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            HStack {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.orange)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Duplicate Contacts")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    Text("\(duplicates.count) potential duplicates found")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.secondary)
                    
                    Text("Select contacts to merge")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Text("Review the contacts below and select duplicates to merge. Merging will combine the information from multiple contacts into a single, complete record.")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
        }
        .padding(Constants.Spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.large)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        .padding(.horizontal, Constants.Spacing.large)
        .padding(.top, Constants.Spacing.medium)
    }
    
    private var duplicatesList: some View {
        List {
            ForEach(groupedDuplicates.indices, id: \.self) { index in
                Section(header: Text("Group \(index + 1)")) {
                    ForEach(groupedDuplicates[index], id: \.self) { contact in
                        DuplicateContactRow(
                            contact: contact,
                            isSelected: selectedContacts.contains(contact)
                        ) {
                            toggleSelection(contact)
                        }
                    }
                }
            }
        }
        .listStyle(GroupedListStyle())
        .background(themeVM.theme.colors.background)
    }
    
    private func groupDuplicates() {
        // Group duplicates by email or phone
        var emailGroups: [String: [FarmContact]] = [:]
        var phoneGroups: [String: [FarmContact]] = [:]
        
        for contact in duplicates {
            if let email = contact.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
               !email.isEmpty {
                emailGroups[email, default: []].append(contact)
            }
            
            if let phone = contact.primaryPhone?.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression),
               !phone.isEmpty {
                phoneGroups[phone, default: []].append(contact)
            }
        }
        
        // Combine groups
        var allGroups: [[FarmContact]] = []
        
        for group in emailGroups.values where group.count > 1 {
            allGroups.append(group)
        }
        
        for group in phoneGroups.values where group.count > 1 {
            // Check if this group overlaps with existing groups
            let shouldAdd = !allGroups.contains { existingGroup in
                existingGroup.contains { contact in
                    group.contains { $0 == contact }
                }
            }
            if shouldAdd {
                allGroups.append(group)
            }
        }
        
        groupedDuplicates = allGroups
    }
    
    private func toggleSelection(_ contact: FarmContact) {
        if selectedContacts.contains(contact) {
            selectedContacts.remove(contact)
        } else {
            selectedContacts.insert(contact)
        }
    }
}

struct DuplicateContactRow: View {
    let contact: FarmContact
    let isSelected: Bool
    let onTap: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Constants.Spacing.medium) {
                // Selection indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? themeVM.theme.colors.primary : .secondary)
                    .font(.system(size: 20))
                
                // Avatar
                Circle()
                    .fill(themeVM.theme.colors.primary.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(contact.fullName.prefix(1).uppercased())
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.primary)
                    )
                
                // Contact Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(contact.fullName)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                    
                    if let farm = contact.farm, !farm.isEmpty {
                        Text(farm)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    
                    // Contact details
                    HStack(spacing: 12) {
                        if let email = contact.primaryEmail, !email.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "envelope")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                                Text(email)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }
                        
                        if let phone = contact.primaryPhone, !phone.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "phone")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                                Text(phone)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ContactMergeView: View {
    let contacts: [FarmContact]
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var mergedContact = FarmContact()
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "person.2.fill", logoName: nil, title: "Merge Contacts", subtitle: "Combine information from \(contacts.count) contacts")
                
                // Merge Preview
                mergePreviewSection
                
                // Merge Actions
                mergeActionsSection
            }
            .padding(Constants.Spacing.large)
        }
        .background(themeVM.theme.colors.background)
        .navigationTitle("Merge Contacts")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Merge") {
                    performMerge()
                }
            }
        }
        .onAppear {
            prepareMergeData()
        }
        .alert("Merge Result", isPresented: $showingAlert) {
            Button("OK") {
                if alertMessage.contains("successfully") {
                    dismiss()
                }
            }
        } message: {
            Text(alertMessage)
        }
    }
    
    private var mergePreviewSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Merged Contact Preview")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Text("Name: \(mergedContact.fullName)")
                Text("Email: \(mergedContact.primaryEmail ?? "None")")
                Text("Phone: \(mergedContact.primaryPhone ?? "None")")
                Text("Farm: \(mergedContact.farm ?? "None")")
                Text("Address: \(mergedContact.displayAddress)")
            }
            .font(themeVM.theme.fonts.bodyFont)
            .foregroundColor(.secondary)
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    private var mergeActionsSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Merge Actions")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            Text("This will:")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("• Create a new contact with combined information")
                Text("• Delete the original \(contacts.count) contacts")
                Text("• Preserve the most complete data from all contacts")
            }
            .font(themeVM.theme.fonts.bodyFont)
            .foregroundColor(.secondary)
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    private func prepareMergeData() {
        // Combine data from all contacts, prioritizing non-empty fields
        let firstName = contacts.compactMap { $0.firstName }.first { !$0.isEmpty } ?? ""
        let lastName = contacts.compactMap { $0.lastName }.first { !$0.isEmpty } ?? ""
        let email = contacts.compactMap { $0.primaryEmail }.first { !$0.isEmpty } ?? ""
        let phone = contacts.compactMap { $0.primaryPhone }.first { !$0.isEmpty } ?? ""
        let farm = contacts.compactMap { $0.farm }.first { !$0.isEmpty } ?? ""
        let address = contacts.compactMap { $0.mailingAddress }.first { !$0.isEmpty } ?? ""
        let city = contacts.compactMap { $0.city }.first { !$0.isEmpty } ?? ""
        let state = contacts.compactMap { $0.state }.first { !$0.isEmpty } ?? ""
        let zipString = contacts.compactMap { $0.formattedZipCode }.first { !$0.isEmpty } ?? ""
        let zipCode = Int32(zipString.replacingOccurrences(of: "-", with: "")) ?? 0
        
        mergedContact.firstName = firstName
        mergedContact.lastName = lastName
        mergedContact.email1 = email.isEmpty ? nil : email
        mergedContact.phoneNumber1 = phone.isEmpty ? nil : phone
        mergedContact.farm = farm
        mergedContact.mailingAddress = address
        mergedContact.city = city
        mergedContact.state = state
        mergedContact.zipCode = zipCode
        mergedContact.dateCreated = Date()
        mergedContact.dateModified = Date()
    }
    
    private func performMerge() {
        // Create the merged contact
        let newContact = FarmContact(context: viewContext)
        newContact.firstName = mergedContact.firstName
        newContact.lastName = mergedContact.lastName
        newContact.email1 = mergedContact.email1
        newContact.phoneNumber1 = mergedContact.phoneNumber1
        newContact.farm = mergedContact.farm
        newContact.mailingAddress = mergedContact.mailingAddress
        newContact.city = mergedContact.city
        newContact.state = mergedContact.state
        newContact.zipCode = mergedContact.zipCode
        newContact.dateCreated = Date()
        newContact.dateModified = Date()
        
        // Delete original contacts
        for contact in contacts {
            viewContext.delete(contact)
        }
        
        do {
            try viewContext.save()
            alertMessage = "Contacts merged successfully! The new contact has been created and the original contacts have been removed."
            showingAlert = true
        } catch {
            alertMessage = "Failed to merge contacts: \(error.localizedDescription)"
            showingAlert = true
        }
    }
} 