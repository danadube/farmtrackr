//
//  ContactListView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct ContactListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedContact: FarmContact?
    @Binding var searchText: String
    @Binding var sortOrder: SortOrder
    @Binding var showingAddContact: Bool
    @State private var filterFarm: String = "All Farms"
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.lastName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    var filteredContacts: [FarmContact] {
        var filtered = contacts.filter { contact in
            if searchText.isEmpty { return true }
            return contact.fullName.localizedCaseInsensitiveContains(searchText) ||
            (contact.farm ?? "").localizedCaseInsensitiveContains(searchText) ||
            (contact.city ?? "").localizedCaseInsensitiveContains(searchText) ||
            (contact.state ?? "").localizedCaseInsensitiveContains(searchText)
        }
        
        if filterFarm != "All Farms" {
            filtered = filtered.filter { ($0.farm ?? "") == filterFarm }
        }
        
        return filtered.sorted { first, second in
            switch sortOrder {
            case .firstName:
                return (first.firstName ?? "") < (second.firstName ?? "")
            case .lastName:
                return (first.lastName ?? "") < (second.lastName ?? "")
            case .farm:
                return (first.farm ?? "") < (second.farm ?? "")
            case .dateCreated:
                return (first.dateCreated ?? .distantPast) > (second.dateCreated ?? .distantPast)
            case .dateModified:
                return (first.dateModified ?? .distantPast) > (second.dateModified ?? .distantPast)
            }
        }
    }
    
    var uniqueFarms: [String] {
        Array(Set(contacts.compactMap { $0.farm ?? nil })).sorted()
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "person.2", logoName: nil, title: "Contacts", subtitle: "View and manage all your farm contacts")
                
                // Add Contact Button
                HStack {
                    Spacer()
                    Button(action: { showingAddContact = true }) {
                        HStack(spacing: 8) {
                            Image(systemName: "person.badge.plus")
                            Text("Add Contact")
                        }
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(themeVM.theme.colors.primary)
                        .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 16)
                
                // Top iPadOS-style Search Bar
                HStack(spacing: 12) {
                    SearchBar(text: $searchText)
                        .frame(maxWidth: .infinity)
                    // Modern Sort/Filter Controls
                    SortButton(sortOrder: $sortOrder)
                    // Optionally, add a FilterButton for farm filter
                    FilterButton(title: filterFarm) {
                        // Show filter popover (to be implemented)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .interactiveCardStyle()
                .padding(.horizontal, 20)
                
                // Contact List
                VStack(spacing: 0) {
                    ForEach(filteredContacts, id: \.self) { contact in
                        ContactRowView(contact: contact, selectedContact: $selectedContact)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                    }
                }
            }
            .padding(Constants.Spacing.large)
        }
        .background(appBackground)
    }
}

struct ContactRowView: View {
    let contact: FarmContact
    @Binding var selectedContact: FarmContact?
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: {
            selectedContact = contact
        }) {
            VStack(alignment: .leading, spacing: 12) {
                // Header with Avatar, Name, Farm, and Chevron
                HStack(alignment: .center, spacing: 12) {
                    // Avatar
                    Circle()
                        .fill(themeVM.theme.colors.primary.opacity(0.1))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Text(contact.fullName.prefix(2).uppercased())
                                .font(themeVM.theme.fonts.semiboldFont(16))
                                .foregroundColor(themeVM.theme.colors.primary)
                        )
                    VStack(alignment: .leading, spacing: 2) {
                        Text(contact.fullName)
                            .font(themeVM.theme.fonts.semiboldFont(18))
                            .foregroundColor(.primary)
                        if let farm = contact.farm, !farm.isEmpty {
                            Text(farm)
                                .font(themeVM.theme.fonts.mediumFont(14))
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    // Chevron
                    Image(systemName: "chevron.right")
                        .font(themeVM.theme.fonts.mediumFont(12))
                        .foregroundColor(.tertiaryLabel)
                }

                // Separator line between header and content
                Rectangle()
                    .fill(themeVM.theme.colors.separator)
                    .frame(height: 1)
                    .padding(.vertical, 8)
                
                // Contact Information - 3 Column Layout
                HStack(alignment: .top, spacing: 32) {
                    // Column 1: Invisible avatar + Phone/Email (side by side)
                    HStack(alignment: .top, spacing: 12) {
                        // Invisible avatar for alignment
                        Circle()
                            .fill(themeVM.theme.colors.primary.opacity(0.1))
                            .frame(width: 44, height: 44)
                            .opacity(0)
                        VStack(alignment: .leading, spacing: 8) {
                            if !contact.allPhoneNumbers.isEmpty {
                                HStack(spacing: 8) {
                                    Image(systemName: "phone")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                    ForEach(contact.allPhoneNumbers, id: \.self) { phone in
                                        Text(phone)
                                            .font(themeVM.theme.fonts.mediumFont(13))
                                            .foregroundColor(.primary)
                                    }
                                }
                            }
                            if !contact.allEmails.isEmpty {
                                HStack(spacing: 8) {
                                    Image(systemName: "envelope")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                    ForEach(contact.allEmails, id: \.self) { email in
                                        Text(email)
                                            .font(themeVM.theme.fonts.mediumFont(13))
                                            .foregroundColor(.primary)
                                            .lineLimit(1)
                                    }
                                }
                            }
                        }
                    }
                    .frame(minWidth: 200, maxWidth: .infinity, alignment: .topLeading)
                    .fixedSize(horizontal: false, vertical: true)
                    
                    // Column 2: Mailing & Site Address
                    VStack(alignment: .leading, spacing: 12) {
                        if !contact.displayAddress.isEmpty {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 4) {
                                    Image(systemName: "house")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                    Text("Mailing")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                }
                                Text(contact.displayAddress)
                                    .font(themeVM.theme.fonts.mediumFont(13))
                                    .foregroundColor(.primary)
                                    .lineLimit(3)
                            }
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 4) {
                                Image(systemName: "location")
                                    .font(themeVM.theme.fonts.mediumFont(12))
                                    .foregroundColor(.secondary)
                                Text("Site")
                                    .font(themeVM.theme.fonts.mediumFont(12))
                                    .foregroundColor(.secondary)
                            }
                            Text(contact.displaySiteAddress.isEmpty ? "No Site Address" : contact.displaySiteAddress)
                                .font(themeVM.theme.fonts.mediumFont(13))
                                .foregroundColor(contact.displaySiteAddress.isEmpty ? .tertiaryLabel : .primary)
                                .lineLimit(3)
                        }
                    }
                    .frame(minWidth: 220, maxWidth: .infinity, alignment: .topLeading)
                    .fixedSize(horizontal: false, vertical: true)
                    
                    // Column 3: Notes
                    VStack(alignment: .leading, spacing: 8) {
                        if let notes = contact.notes, !notes.isEmpty {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 4) {
                                    Image(systemName: "note.text")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                    Text("Notes")
                                        .font(themeVM.theme.fonts.mediumFont(12))
                                        .foregroundColor(.secondary)
                                }
                                Text(notes)
                                    .font(themeVM.theme.fonts.mediumFont(13))
                                    .foregroundColor(.primary)
                                    .lineLimit(6)
                            }
                        }
                    }
                    .frame(minWidth: 180, maxWidth: .infinity, alignment: .topLeading)
                    .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 20) // Match search bar horizontal padding
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(themeVM.theme.colors.separator, lineWidth: 0.5)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SearchBar: View {
    @Binding var text: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(themeVM.theme.fonts.mediumFont(16))
                .foregroundColor(.secondaryLabel)
            
            TextField("Search contacts...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .font(themeVM.theme.fonts.mediumFont(16))
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(themeVM.theme.fonts.mediumFont(16))
                        .foregroundColor(.secondaryLabel)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(themeVM.theme.colors.systemGray6)
        .cornerRadius(8)
    }
}

struct FilterButton: View {
    let title: String
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(themeVM.theme.fonts.semiboldFont(14))
                    .foregroundColor(themeVM.theme.colors.primary)
                Image(systemName: "chevron.down")
                    .font(themeVM.theme.fonts.captionFont)
            }
            .padding(.horizontal, themeVM.theme.spacing.medium)
            .padding(.vertical, themeVM.theme.spacing.small)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(themeVM.theme.cornerRadius.small)
        }
    }
}

struct SortButton: View {
    @Binding var sortOrder: SortOrder
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Menu {
            ForEach(SortOrder.allCases, id: \.self) { order in
                Button(order.displayName) {
                    sortOrder = order
                }
            }
        } label: {
            HStack {
                Text("Sort: \(sortOrder.displayName)")
                    .font(themeVM.theme.fonts.semiboldFont(14))
                    .foregroundColor(themeVM.theme.colors.primary)
                Image(systemName: "chevron.down")
                    .font(themeVM.theme.fonts.captionFont)
            }
            .padding(.horizontal, themeVM.theme.spacing.medium)
            .padding(.vertical, themeVM.theme.spacing.small)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(themeVM.theme.cornerRadius.small)
        }
    }
}


