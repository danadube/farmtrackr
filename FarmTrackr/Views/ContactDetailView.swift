//
//  ContactDetailView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct ContactDetailView: View {
    let contact: FarmContact
    @Binding var selectedContact: FarmContact?
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack {
                // Main Card
                VStack(alignment: .leading, spacing: 0) {
                    HeaderSection(contact: contact, selectedContact: $selectedContact, showingEditSheet: $showingEditSheet, showingDeleteAlert: $showingDeleteAlert)
                    Divider()
                    // Mailing and Site Address side by side
                    HStack(alignment: .top, spacing: 0) {
                        MailingAddressSection(contact: contact)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Rectangle()
                            .fill(themeVM.theme.colors.secondary.opacity(0.3))
                            .frame(width: 1)
                            .frame(maxHeight: .infinity)
                        Spacer()
                        Spacer()
                        SiteAddressSection(contact: contact)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.vertical, themeVM.theme.spacing.large)
                    Divider()
                    // Contact Info and Notes side by side
                    HStack(alignment: .top, spacing: 0) {
                        ContactInfoSection(contact: contact)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Rectangle()
                            .fill(themeVM.theme.colors.secondary.opacity(0.3))
                            .frame(width: 1)
                            .frame(maxHeight: .infinity)
                        Spacer()
                        Spacer()
                        NotesSection(notes: contact.notes ?? "")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.vertical, themeVM.theme.spacing.large)
                    Divider()
                    // Record Info
                    RecordInfoSection(contact: contact)
                }
                .padding(.vertical, themeVM.theme.spacing.large)
                .padding(.horizontal, themeVM.theme.spacing.large)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.black.opacity(0.1), lineWidth: 1)
                )
            }
            .padding(.bottom, 32)
            .padding(.horizontal, themeVM.theme.spacing.large)
        }
        .background(themeVM.theme.colors.background.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingEditSheet) {
            ContactEditView(contact: contact)
        }
        .alert("Delete Contact", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                deleteContact()
            }
        } message: {
            Text("Are you sure you want to delete \(contact.fullName)? This action cannot be undone.")
        }
    }
    
    // MARK: - Subviews
    
    private struct HeaderSection: View {
        let contact: FarmContact
        @Binding var selectedContact: FarmContact?
        @Binding var showingEditSheet: Bool
        @Binding var showingDeleteAlert: Bool
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                // Back button and title row
                HStack {
                    Button(action: { selectedContact = nil }) {
                        HStack(spacing: 8) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 16, weight: .medium))
                            Text("Back to Contacts")
                                .font(.system(size: 16, weight: .medium))
                        }
                        .foregroundColor(themeVM.theme.colors.primary)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Spacer()
                    
                    HStack(spacing: 16) {
                        Button(action: { showingEditSheet = true }) {
                            Image(systemName: "square.and.pencil")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: { showingDeleteAlert = true }) {
                            Image(systemName: "trash")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.red)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                // Contact info row
                HStack(alignment: .center, spacing: themeVM.theme.spacing.large) {
                    Circle()
                        .fill(themeVM.theme.colors.primary.opacity(0.2))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(contact.initials)
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(themeVM.theme.colors.primary)
                        )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(contact.fullName)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(themeVM.theme.colors.text)
                        if let farm = contact.farm, !farm.isEmpty {
                            Text(farm)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                    }
                    
                    Spacer()
                }
            }
            .padding(.bottom, themeVM.theme.spacing.large)
        }
    }
    
    private struct MailingAddressSection: View {
        let contact: FarmContact
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
                SectionHeader(title: "Mailing Address", icon: "location.circle")
                VStack(alignment: .leading, spacing: 2) {
                    if let addr = contact.mailingAddress, !addr.isEmpty {
                        Text(addr)
                            .font(themeVM.theme.fonts.bodyFont)
                    }
                    if let city = contact.city, let state = contact.state {
                        Text("\(city), \(state) \(contact.zipCode.formattedZipCode)")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(.black)
                    }
                }
            }
        }
    }
    
    private struct SiteAddressSection: View {
        let contact: FarmContact
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
                SectionHeader(title: "Site Address", icon: "house.circle")
                if !contact.displaySiteAddress.isEmpty {
                    Text(contact.displaySiteAddress)
                    .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.black)
                } else {
                    Text("No site address")
                    .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.black)
                        .italic()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
    
    private struct ContactInfoSection: View {
        let contact: FarmContact
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                SectionHeader(title: "Contact Info", icon: "person.circle")
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(contact.allPhoneNumbers.enumerated()), id: \ .offset) { idx, phone in
                        InfoRow(title: "Phone \(idx + 1)", value: FarmContact.formatPhone(phone))
                    }
                }
                if let email = contact.primaryEmail, !email.isEmpty {
                    InfoRow(title: "Email", value: email)
                }
            }
        }
    }
    
    private struct NotesSection: View {
        let notes: String
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            SectionHeader(title: "Notes", icon: "note.text")
            Text(notes)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.text)
            }
        }
    }
    
    private struct RecordInfoSection: View {
        let contact: FarmContact
        @EnvironmentObject var themeVM: ThemeViewModel
        
        var body: some View {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                SectionHeader(title: "Record Info", icon: "info.circle")
                InfoRow(title: "Created", value: contact.dateCreated?.formattedDateTime ?? "")
                InfoRow(title: "Modified", value: contact.dateModified?.formattedDateTime ?? "")
            }
            .padding(.top, themeVM.theme.spacing.large)
        }
    }
    
    private func deleteContact() {
        viewContext.delete(contact)
        try? viewContext.save()
        dismiss()
    }
}

struct SectionHeader: View {
    let title: String
    let icon: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.small) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.primary)
                .font(themeVM.theme.fonts.title2)
            
            Text(title)
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
        }
    }
}

struct ContactInfoRow: View {
    let icon: String
    let title: String
    let value: String
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: themeVM.theme.spacing.medium) {
                Image(systemName: icon)
                    .foregroundColor(themeVM.theme.colors.primary)
                    .frame(width: 20)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Text(value)
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.text)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct InfoRow: View {
    let title: String
    let value: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Text(value)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.text)
        }
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: themeVM.theme.spacing.small) {
                Image(systemName: icon)
                    .font(themeVM.theme.fonts.title2)
                    .foregroundColor(themeVM.theme.colors.primary)
                
                Text(title)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.text)
            }
            .frame(maxWidth: .infinity)
            .padding(themeVM.theme.spacing.medium)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(themeVM.theme.cornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                    .stroke(themeVM.theme.colors.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
} 