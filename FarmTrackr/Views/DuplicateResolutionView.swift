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
    @ObservedObject var themeVM: ThemeViewModel
    @State private var groupedDuplicates: [[FarmContact]] = []
    @State private var currentDuplicates: [FarmContact] = []
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Duplicates List
                duplicatesList
                Spacer()
                mergeButtonSection
            }
            .background(themeVM.theme.colors.background)
        }
        .navigationTitle("Duplicate Resolution")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarItems(
            leading: Button("Cancel") { dismiss() },
            trailing: Button("Refresh") { refreshDuplicates() }
        )
        .onAppear {
            currentDuplicates = duplicates
            groupDuplicates()
        }
    }
    
    private func refreshDuplicates() {
        // Fetch all contacts from the current context
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        
        do {
            let allContacts = try viewContext.fetch(fetchRequest)
            currentDuplicates = allContacts
            groupDuplicates()
        } catch {
            print("Failed to fetch contacts: \(error)")
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            HStack {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 40))
                    .foregroundColor(themeVM.theme.colors.primary)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Duplicate Contacts")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text("\(currentDuplicates.count) potential duplicates found")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Text("Select contacts to merge")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                
                Spacer()
            }
            
            Text("Review the contacts below and select duplicates to merge. Merging will combine the information from multiple contacts into a single, complete record.")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.leading)
        }
        .padding(Constants.Spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.large)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        .padding(.horizontal, Constants.Spacing.large)
        .padding(.top, Constants.Spacing.medium)
        .padding(.bottom, Constants.Spacing.small) // Ensure bottom is visible
    }
    
    private var duplicatesList: some View {
        Group {
            if groupedDuplicates.isEmpty {
                VStack(spacing: Constants.Spacing.large) {
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 48))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    Text("No duplicate groups found")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    Text("No potential duplicates were detected. If you believe there should be duplicates, try adding test data or adjusting your import.")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Constants.Spacing.large)
                    Button(action: {
                        // Add test duplicates for debugging
                        TestDataHelper.addTestDuplicates(context: viewContext)
                        refreshDuplicates()
                    }) {
                        Text("Add Test Duplicates")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(.white)
                            .padding()
                            .background(themeVM.theme.colors.primary)
                            .cornerRadius(Constants.CornerRadius.medium)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(themeVM.theme.colors.background)
            } else {
                List {
                    ForEach(groupedDuplicates.indices, id: \.self) { index in
                        Section(header: Text("Group \(index + 1)").foregroundColor(themeVM.theme.colors.text)) {
                            ForEach(groupedDuplicates[index], id: \.self) { contact in
                                DuplicateContactRow(
                                    contact: contact
                                )
                                .listRowBackground(themeVM.theme.colors.cardBackground)
                            }
                        }
                    }
                }
                .listStyle(GroupedListStyle())
                .scrollContentBackground(.hidden)
                .background(themeVM.theme.colors.background)
            }
        }
    }
    
    private func groupDuplicates() {
        // Improved grouping algorithm that ensures all related duplicates are grouped together
        var groups: [[FarmContact]] = []
        var contactToGroup: [FarmContact: Int] = [:] // Maps contact to group index
        var groupIndex = 0
        
        print("DuplicateResolutionView: Starting duplicate grouping for \(currentDuplicates.count) contacts")
        
        for contact in currentDuplicates {
            // Check if this contact is already in a group
            if contactToGroup[contact] != nil { continue }
            
            // Start a new group
            var currentGroup: [FarmContact] = [contact]
            contactToGroup[contact] = groupIndex
            
            // Find ALL contacts that are similar to this one (including transitive relationships)
            var toProcess = [contact]
            var processed = Set<FarmContact>()
            
            while !toProcess.isEmpty {
                let currentContact = toProcess.removeFirst()
                if processed.contains(currentContact) { continue }
                processed.insert(currentContact)
                
                // Find all contacts similar to currentContact
                for otherContact in currentDuplicates {
                    if processed.contains(otherContact) || contactToGroup[otherContact] != nil { continue }
                    
                    if areContactsSimilar(currentContact, otherContact) {
                        print("DuplicateResolutionView: Found similar contact: \(currentContact.fullName) matches \(otherContact.fullName)")
                        currentGroup.append(otherContact)
                        contactToGroup[otherContact] = groupIndex
                        toProcess.append(otherContact)
                    }
                }
            }
            
            // Only add groups with more than one contact
            if currentGroup.count > 1 {
                groups.append(currentGroup)
                print("DuplicateResolutionView: Created group \(groupIndex) with \(currentGroup.count) contacts: \(currentGroup.map { $0.fullName }.joined(separator: ", "))")
                groupIndex += 1
            }
        }
        
        groupedDuplicates = groups
        print("DuplicateResolutionView: Created \(groups.count) duplicate groups")
    }
    
    private func areContactsSimilar(_ contact1: FarmContact, _ contact2: FarmContact) -> Bool {
        // Check if names are similar (case-insensitive)
        let name1 = contact1.fullName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let name2 = contact2.fullName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        if name1 == name2 && !name1.isEmpty {
            return true
        }
        
        // Check if emails match
        if let email1 = contact1.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
           let email2 = contact2.primaryEmail?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
           email1 == email2 && !email1.isEmpty {
            return true
        }
        
        // Check if phones match (normalized)
        if let phone1 = contact1.primaryPhone?.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression),
           let phone2 = contact2.primaryPhone?.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression),
           phone1 == phone2 && !phone1.isEmpty {
            return true
        }
        
        return false
    }
    
    private var mergeButtonSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
            // Merge all duplicates button
            Button(action: {
                mergeAllDuplicates()
            }) {
                Text("Merge All Duplicates")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(groupedDuplicates.isEmpty ? Color.gray : themeVM.theme.colors.accent)
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    .opacity(groupedDuplicates.isEmpty ? 0.6 : 1.0)
            }
            .disabled(groupedDuplicates.isEmpty)
        }
        .padding([.horizontal, .bottom], Constants.Spacing.large)
    }
    
    private func mergeAllDuplicates() {
        print("DuplicateResolutionView: Starting merge all duplicates")
        
        for (index, group) in groupedDuplicates.enumerated() {
            print("DuplicateResolutionView: Processing group \(index + 1) with \(group.count) contacts")
            
            // Create the merged contact
            let newContact = FarmContact(context: viewContext)
            
            // Combine all the best data from the contacts in this group
            let allFirstNames = group.compactMap { $0.firstName }.filter { !$0.isEmpty }
            let allLastNames = group.compactMap { $0.lastName }.filter { !$0.isEmpty }
            let allFarms = group.compactMap { $0.farm }.filter { !$0.isEmpty }
            let allAddresses = group.compactMap { $0.mailingAddress }.filter { !$0.isEmpty }
            let allCities = group.compactMap { $0.city }.filter { !$0.isEmpty }
            let allStates = group.compactMap { $0.state }.filter { !$0.isEmpty }
            let allZipCodes = group.compactMap { $0.zipCode }.filter { $0 > 0 }
            let allEmails = group.compactMap { $0.email1 }.filter { !$0.isEmpty }
            let allPhones = group.compactMap { $0.phoneNumber1 }.filter { !$0.isEmpty }
            let allNotes = group.compactMap { $0.notes }.filter { !$0.isEmpty }
            
            // Use the actual contact data
            newContact.firstName = allFirstNames.first ?? group.first?.firstName ?? ""
            newContact.lastName = allLastNames.first ?? group.first?.lastName ?? ""
            newContact.farm = allFarms.first ?? group.first?.farm ?? ""
            newContact.mailingAddress = allAddresses.first ?? group.first?.mailingAddress ?? ""
            newContact.city = allCities.first ?? group.first?.city ?? ""
            newContact.state = allStates.first ?? group.first?.state ?? ""
            newContact.zipCode = allZipCodes.first ?? group.first?.zipCode ?? 0
            newContact.email1 = allEmails.first ?? group.first?.email1 ?? ""
            newContact.phoneNumber1 = allPhones.first ?? group.first?.phoneNumber1 ?? ""
            
            // Combine notes
            if allNotes.count > 1 {
                newContact.notes = allNotes.joined(separator: "\n---\n")
            } else {
                newContact.notes = allNotes.first ?? group.first?.notes ?? ""
            }
            
            // Set additional fields
            let allEmail2s = group.compactMap { $0.email2 }.filter { !$0.isEmpty }
            let allPhone2s = group.compactMap { $0.phoneNumber2 }.filter { !$0.isEmpty }
            let allPhone3s = group.compactMap { $0.phoneNumber3 }.filter { !$0.isEmpty }
            let allPhone4s = group.compactMap { $0.phoneNumber4 }.filter { !$0.isEmpty }
            let allPhone5s = group.compactMap { $0.phoneNumber5 }.filter { !$0.isEmpty }
            let allPhone6s = group.compactMap { $0.phoneNumber6 }.filter { !$0.isEmpty }
            
            newContact.email2 = allEmail2s.first ?? group.first?.email2 ?? ""
            newContact.phoneNumber2 = allPhone2s.first ?? group.first?.phoneNumber2 ?? ""
            newContact.phoneNumber3 = allPhone3s.first ?? group.first?.phoneNumber3 ?? ""
            newContact.phoneNumber4 = allPhone4s.first ?? group.first?.phoneNumber4 ?? ""
            newContact.phoneNumber5 = allPhone5s.first ?? group.first?.phoneNumber5 ?? ""
            newContact.phoneNumber6 = allPhone6s.first ?? group.first?.phoneNumber6 ?? ""
            
            // Set site information
            let allSiteAddresses = group.compactMap { $0.siteMailingAddress }.filter { !$0.isEmpty }
            let allSiteCities = group.compactMap { $0.siteCity }.filter { !$0.isEmpty }
            let allSiteStates = group.compactMap { $0.siteState }.filter { !$0.isEmpty }
            let allSiteZipCodes = group.compactMap { $0.siteZipCode }.filter { $0 > 0 }
            
            newContact.siteMailingAddress = allSiteAddresses.first ?? group.first?.siteMailingAddress ?? ""
            newContact.siteCity = allSiteCities.first ?? group.first?.siteCity ?? ""
            newContact.siteState = allSiteStates.first ?? group.first?.siteState ?? ""
            newContact.siteZipCode = allSiteZipCodes.first ?? group.first?.siteZipCode ?? 0
            
            // Set timestamps
            newContact.dateCreated = Date()
            newContact.dateModified = Date()
            
            print("DuplicateResolutionView: Created merged contact: \(newContact.fullName)")
            
            // Delete the original contacts in this group
            for contact in group {
                print("DuplicateResolutionView: Deleting contact: \(contact.fullName)")
                viewContext.delete(contact)
            }
        }
        
        // Save all changes
        do {
            try viewContext.save()
            print("DuplicateResolutionView: Merge all successful - saved to Core Data")
            refreshDuplicates()
        } catch {
            print("DuplicateResolutionView: Merge all failed with error: \(error.localizedDescription)")
        }
    }
}

struct DuplicateContactRow: View {
    let contact: FarmContact
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: Constants.Spacing.medium) {
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
}