//
//  IssueDetailsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct IssueDetailsView: View {
    let issue: DataQualityIssue
    let contacts: [FarmContact]
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var selectedContact: FarmContact?
    @State private var showingContactEdit = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Issue Header
                issueHeader
                
                // Affected Contacts List
                contactsList
            }
            .background(themeVM.theme.colors.background)
        }
        .navigationTitle(issue.rawValue)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Done") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Fix All") {
                    // TODO: Implement bulk fix
                }
                .disabled(contacts.isEmpty)
            }
        }
        .sheet(isPresented: $showingContactEdit) {
            if let contact = selectedContact {
                ContactEditView(contact: contact)
            }
        }
    }
    
    private var issueHeader: some View {
        VStack(spacing: Constants.Spacing.medium) {
            HStack {
                Image(systemName: issue.icon)
                    .font(.system(size: 40))
                    .foregroundColor(severityColor)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(issue.rawValue)
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    Text("\(contacts.count) contacts affected")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.secondary)
                    
                    Text(issue.severity.rawValue + " Priority")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(severityColor)
                        .cornerRadius(8)
                }
                
                Spacer()
            }
            
            Text(issueDescription)
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
    
    private var contactsList: some View {
        List {
            ForEach(contacts, id: \.self) { contact in
                ContactIssueRow(contact: contact, issue: issue) {
                    selectedContact = contact
                    showingContactEdit = true
                }
            }
        }
        .listStyle(PlainListStyle())
        .background(themeVM.theme.colors.background)
    }
    
    private var severityColor: Color {
        switch issue.severity {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }
    
    private var issueDescription: String {
        switch issue {
        case .missingEmail:
            return "These contacts are missing email addresses. Adding emails will improve communication capabilities."
        case .invalidEmail:
            return "These contacts have email addresses that don't follow the standard email format. Please verify and correct them."
        case .missingPhone:
            return "These contacts are missing phone numbers. Adding phone numbers will improve contact options."
        case .invalidPhone:
            return "These contacts have phone numbers that don't follow the standard format. Please verify and correct them."
        case .missingAddress:
            return "These contacts are missing complete address information. Adding addresses will improve mailing capabilities."
        case .missingFarm:
            return "These contacts are not associated with any farm. Adding farm information will improve organization."
        case .duplicateContact:
            return "These contacts appear to be duplicates based on email or phone number. Please review and merge if necessary."
        case .incompleteName:
            return "These contacts are missing first or last names. Complete names will improve contact identification."
        }
    }
}

struct ContactIssueRow: View {
    let contact: FarmContact
    let issue: DataQualityIssue
    let onTap: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: onTap) {
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
                    
                    // Issue-specific info
                    Text(issueSpecificInfo)
                        .font(.system(size: 12))
                        .foregroundColor(.red)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var issueSpecificInfo: String {
        switch issue {
        case .missingEmail:
            return "No email address"
        case .invalidEmail:
            return "Invalid email: \(contact.primaryEmail ?? "")"
        case .missingPhone:
            return "No phone number"
        case .invalidPhone:
            return "Invalid phone: \(contact.primaryPhone ?? "")"
        case .missingAddress:
            return "Incomplete address"
        case .missingFarm:
            return "No farm assigned"
        case .duplicateContact:
            return "Potential duplicate"
        case .incompleteName:
            return "Incomplete name"
        }
    }
} 