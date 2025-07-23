//
//  DataQualityView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct DataQualityView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var dataValidator = DataValidator()
    @State private var qualityReports: [ValidationResult] = []
    @State private var qualitySummary: DataQualityScore?
    @State private var showingIssueDetails = false
    @State private var showingDuplicateResolution = false
    @State private var duplicates: [FarmContact] = []
    @State private var showingSuccessMessage = false
    @State private var successMessage = ""
    @State private var farmDuplicateAnalyses: [FarmDuplicateAnalysis] = []
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default)
    private var contacts: FetchedResults<FarmContact>
    
    @State private var filterFarm: String = "All Farms"
    @State private var filterName: String = ""
    @State private var showingBulkEditSheet = false
    @State private var selectableContacts: [FarmContact] = []
    @State private var selectedContacts: Set<NSManagedObjectID> = []
    @State private var pendingBulkEditField: BulkEditFieldType? = nil
    @State private var pendingBulkEditValue: String = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "checkmark.shield", logoName: nil, title: "Data Quality", subtitle: "Monitor and improve your contact data")
                
                // Quality Overview Cards
                qualityOverviewCards
                
                // Quick Actions (moved to top for better accessibility)
                actionsSection
                
                // Issue Breakdown
                issueBreakdownSection
                
                // Farm Duplicate Analysis
                farmDuplicateAnalysisSection
            }
            .padding(Constants.Spacing.large)
        }
        .background(Color.appBackground)
        .onAppear {
            refreshQualityData()
        }
        .sheet(isPresented: $showingIssueDetails) {
            IssueDetailsView(issues: qualityReports.filter { !$0.errors.isEmpty || !$0.warnings.isEmpty })
        }
        .sheet(isPresented: $showingDuplicateResolution) {
            DuplicateResolutionView(duplicates: duplicates, themeVM: themeVM)
        }
        .overlay(
            // Success message overlay
            Group {
                if showingSuccessMessage {
                    VStack {
                        Spacer()
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.title2)
                            
                            Text(successMessage)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.primary)
                                .multilineTextAlignment(.leading)
                            
                            Spacer()
                        }
                        .padding(Constants.Spacing.large)
                        .background(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .fill(themeVM.theme.colors.cardBackground)
                                .shadow(radius: 4)
                        )
                        .padding(.horizontal, Constants.Spacing.large)
                        .padding(.bottom, Constants.Spacing.large)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .animation(.easeInOut(duration: 0.3), value: showingSuccessMessage)
                    }
                }
            }
        )
        .sheet(isPresented: $showingBulkEditSheet) {
            NavigationView {
                VStack(spacing: 0) {
                    // Filter controls
                    HStack {
                        TextField("Filter by name", text: $filterName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal)
                        Menu {
                            Button("All Farms") { filterFarm = "All Farms" }
                            ForEach(Array(Set(contacts.compactMap { $0.farm ?? "" }).filter { !$0.isEmpty }), id: \.self) { farm in
                                Button(farm) { filterFarm = farm }
                            }
                        } label: {
                            HStack {
                                Text(filterFarm)
                                Image(systemName: "chevron.down")
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                        .padding(.trailing)
                    }
                    .padding(.vertical)
                    Divider()
                    // Selection list
                    List(selectableContacts, id: \.objectID, selection: $selectedContacts) { contact in
                        HStack {
                            VStack(alignment: .leading) {
                                Text("\(contact.firstName ?? "") \(contact.lastName ?? "")")
                                    .font(.body)
                                if let farm = contact.farm, !farm.isEmpty {
                                    Text(farm).font(.caption).foregroundColor(.secondary)
                                }
                            }
                            Spacer()
                            if selectedContacts.contains(contact.objectID) {
                                Image(systemName: "checkmark.circle.fill").foregroundColor(.accentColor)
                            } else {
                                Image(systemName: "circle").foregroundColor(.secondary)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedContacts.contains(contact.objectID) {
                                selectedContacts.remove(contact.objectID)
                            } else {
                                selectedContacts.insert(contact.objectID)
                            }
                        }
                    }
                    .environment(\.editMode, .constant(.active))
                    Divider()
                    // Value entry and action
                    VStack(spacing: 12) {
                        if let field = pendingBulkEditField {
                            TextField("New value for all selected", text: $pendingBulkEditValue)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal)
                            Button("Apply to Selected") {
                                applyBulkEdit(field: field, value: pendingBulkEditValue)
                            }
                            .disabled(pendingBulkEditValue.isEmpty || selectedContacts.isEmpty)
                            .buttonStyle(.borderedProminent)
                            .padding(.bottom)
                        }
                    }
                }
                .navigationTitle("Bulk Edit Contacts")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { showingBulkEditSheet = false }
                    }
                }
            }
        }
    }
    
    private var qualityOverviewCards: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: Constants.Spacing.medium) {
            QualityCard(
                title: "Data Quality",
                value: "\(qualitySummary?.overallScore ?? 0)/100",
                subtitle: "\(qualitySummary?.criticalIssues.count ?? 0) critical, \(qualitySummary?.minorIssues.count ?? 0) minor",
                icon: "checkmark.shield.fill",
                color: qualityColor
            )
            QualityCard(
                title: "Recommendations",
                value: "\(qualitySummary?.recommendations.count ?? 0)",
                subtitle: "Suggestions to improve",
                icon: "lightbulb.fill",
                color: .yellow
            )
        }
    }

    private var issueBreakdownSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Issue Breakdown")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            if let summary = qualitySummary {
                if !summary.criticalIssues.isEmpty {
                    Text("Critical Issues:")
                        .font(.headline)
                        .foregroundColor(.red)
                    ForEach(summary.criticalIssues, id: \.self) { issue in
                        Text("• \(issue)")
                            .foregroundColor(.red)
                    }
                }
                if !summary.minorIssues.isEmpty {
                    Text("Minor Issues:")
                        .font(.headline)
                        .foregroundColor(.orange)
                    ForEach(summary.minorIssues, id: \.self) { issue in
                        Text("• \(issue)")
                            .foregroundColor(.orange)
                    }
                }
                if !summary.recommendations.isEmpty {
                    Text("Recommendations:")
                        .font(.headline)
                        .foregroundColor(.blue)
                    ForEach(summary.recommendations, id: \.self) { rec in
                        Text("• \(rec)")
                            .foregroundColor(.blue)
                    }
                }
            } else {
                Text("No data quality summary available.")
                    .foregroundColor(.secondary)
            }
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    private var farmDuplicateAnalysisSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Farm Duplicate Analysis")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            if farmDuplicateAnalyses.isEmpty {
                Text("No duplicate analysis data available.")
                    .foregroundColor(.secondary)
            } else {
                ForEach(farmDuplicateAnalyses, id: \.farmName) { analysis in
                    VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                        HStack {
                            Text("Farm: \(analysis.farmName)")
                                .font(.headline)
                                .foregroundColor(analysis.duplicatePercentage > 20 ? .red : .primary)
                            
                            Spacer()
                            
                            if analysis.duplicatePercentage > 20 {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                        
                        Text("Total Contacts: \(analysis.totalContacts)")
                            .font(Constants.Typography.captionFont)
                            .foregroundColor(.secondary)
                        
                        Text("Duplicate Groups: \(analysis.duplicateGroups)")
                            .font(Constants.Typography.captionFont)
                            .foregroundColor(.orange)
                        
                        Text("Duplicate Percentage: \(String(format: "%.1f", analysis.duplicatePercentage))%")
                            .font(Constants.Typography.captionFont)
                            .foregroundColor(analysis.duplicatePercentage > 20 ? .red : .orange)
                        
                        if !analysis.duplicatePatterns.isEmpty {
                            Text("Duplicate Patterns:")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                            
                            ForEach(analysis.duplicatePatterns, id: \.type) { pattern in
                                if pattern.count > 0 {
                                    Text("• \(pattern.type): \(pattern.count)")
                                        .font(Constants.Typography.captionFont)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        
                        if !analysis.recommendations.isEmpty {
                            Text("Recommendations:")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.blue)
                                .padding(.top, 4)
                            
                            ForEach(analysis.recommendations, id: \.self) { recommendation in
                                Text("• \(recommendation)")
                                    .font(Constants.Typography.captionFont)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding(Constants.Spacing.medium)
                    .cardStyle()
                    .overlay(
                        RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                            .stroke(analysis.duplicatePercentage > 20 ? Color.red : Color.clear, lineWidth: 2)
                    )
                }
            }
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    private var actionsSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Quick Actions")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: Constants.Spacing.medium) {
                QualityActionButton(
                    title: "View Details",
                    subtitle: "See validation issues",
                    icon: "list.bullet",
                    action: { showingIssueDetails = true }
                )
                
                QualityActionButton(
                    title: "Fix Duplicates",
                    subtitle: "Resolve duplicate contacts",
                    icon: "person.2.fill",
                    action: { showingDuplicateResolution = true }
                )
                
                QualityActionButton(
                    title: "Add Test Data",
                    subtitle: "Add sample duplicates",
                    icon: "plus.circle",
                    action: {
                        TestDataHelper.addTestDuplicates(context: viewContext)
                        refreshQualityData()
                    }
                )
                
                QualityActionButton(
                    title: "Export Report",
                    subtitle: "Download quality report",
                    icon: "square.and.arrow.up",
                    action: exportQualityReport
                )
                
                QualityActionButton(
                    title: "Bulk Edit",
                    subtitle: "Fix multiple issues",
                    icon: "pencil.and.outline",
                    action: bulkEditContacts
                )
                
                QualityActionButton(
                    title: "Refresh Data",
                    subtitle: "Reassess quality",
                    icon: "arrow.clockwise",
                    action: refreshQualityData
                )
                
                QualityActionButton(
                    title: "Cleanup Bad Data",
                    subtitle: "Remove incorrect merges",
                    icon: "trash",
                    action: cleanupBadMergedContacts
                )
            }
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    // MARK: - Helper Methods
    private var qualityColor: Color {
        let score = qualitySummary?.overallScore ?? 0
        if score >= 90 { return .green }
        if score >= 70 { return .orange }
        return .red
    }
    
    private func refreshQualityData() {
        let allContacts = Array(contacts)
        print("DataQualityView: Assessing \(allContacts.count) contacts")
        
        // Convert FarmContact to ContactRecord for validation
        let contactRecords = allContacts.map { contact in
            ContactRecord(
                firstName: contact.firstName ?? "",
                lastName: contact.lastName ?? "",
                mailingAddress: contact.mailingAddress ?? "",
                city: contact.city ?? "",
                state: contact.state ?? "",
                zipCode: Int32(contact.zipCode),
                email1: contact.email1,
                email2: contact.email2,
                phoneNumber1: contact.phoneNumber1,
                phoneNumber2: contact.phoneNumber2,
                phoneNumber3: contact.phoneNumber3,
                phoneNumber4: contact.phoneNumber4,
                phoneNumber5: contact.phoneNumber5,
                phoneNumber6: contact.phoneNumber6,
                siteMailingAddress: contact.siteMailingAddress,
                siteCity: contact.siteCity,
                siteState: contact.siteState,
                siteZipCode: Int32(contact.siteZipCode),
                notes: contact.notes,
                farm: contact.farm ?? ""
            )
        }
        
        qualitySummary = dataValidator.calculateDataQualityScore(contactRecords)
        
        // Generate validation results for each contact
        qualityReports = []
        for contact in allContacts {
            if let email = contact.primaryEmail {
                qualityReports.append(dataValidator.validateEmail(email))
            }
            if let phone = contact.primaryPhone {
                qualityReports.append(dataValidator.validatePhoneNumber(phone))
            }
        }
        
        // Find duplicates using the new method
        let duplicateGroups = dataValidator.detectDuplicates(contactRecords, context: viewContext)
        
        // Also try a direct approach for debugging
        let directDuplicates = findDirectDuplicates(allContacts)
        print("DataQualityView: Direct duplicate detection found \(directDuplicates.count) duplicates")
        
        // Perform farm-specific duplicate analysis
        farmDuplicateAnalyses = dataValidator.analyzeDuplicatesByFarm(contactRecords, context: viewContext)
        
        // Convert duplicate groups to FarmContact objects - IMPROVED LOGIC
        duplicates = []
        print("DataQualityView: Processing \(duplicateGroups.count) duplicate groups")
        
        // Create a set to track which contacts have been added to avoid duplicates
        var addedContacts: Set<NSManagedObjectID> = []
        
        for (groupIndex, group) in duplicateGroups.enumerated() {
            print("DataQualityView: Processing group \(groupIndex + 1) with \(group.contacts.count) contacts")
            
            // Find all FarmContact objects that match this group
            var groupContacts: [FarmContact] = []
            
            for record in group.contacts {
                // Find all contacts that match this record (could be multiple)
                let matchingContacts = allContacts.filter { contact in
                    let nameMatch = contact.firstName == record.firstName && contact.lastName == record.lastName
                    let farmMatch = contact.farm == record.farm
                    return nameMatch && farmMatch && !addedContacts.contains(contact.objectID)
                }
                
                for contact in matchingContacts {
                    groupContacts.append(contact)
                    addedContacts.insert(contact.objectID)
                    print("DataQualityView: Added to group: \(contact.fullName)")
                }
            }
            
            // Add all contacts from this group to the duplicates array
            if groupContacts.count > 1 {
                duplicates.append(contentsOf: groupContacts)
                print("DataQualityView: Added group with \(groupContacts.count) contacts")
            }
        }
        
        // Add direct duplicates if the validator didn't find them
        for duplicate in directDuplicates {
            if !addedContacts.contains(duplicate.objectID) {
                print("DataQualityView: Adding direct duplicate: \(duplicate.fullName)")
                duplicates.append(duplicate)
                addedContacts.insert(duplicate.objectID)
            }
        }
        
        print("DataQualityView: Found \(qualityReports.filter { !$0.errors.isEmpty || !$0.warnings.isEmpty }.count) validation issues")
        print("DataQualityView: Found \(duplicates.count) potential duplicates")
        
        if let summary = qualitySummary {
            print("DataQualityView: Quality score: \(summary.overallScore)/100")
            
            // Show success message
            let issueCount = summary.criticalIssues.count + summary.minorIssues.count
            successMessage = "Data quality assessment completed! Found \(issueCount) issues across \(allContacts.count) contacts."
            showingSuccessMessage = true
            
            // Auto-hide success message after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                showingSuccessMessage = false
            }
        }
    }
    
    private func cleanupBadMergedContacts() {
        TestDataHelper.cleanupAllBadMergedContacts(context: viewContext)
        refreshQualityData()
        
        successMessage = "Cleaned up all bad merged contacts!"
        showingSuccessMessage = true
        
        // Auto-hide success message after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            showingSuccessMessage = false
        }
    }
    
    private func findDirectDuplicates(_ contacts: [FarmContact]) -> [FarmContact] {
        var allDuplicates: [FarmContact] = []
        var processedIndices: Set<Int> = []
        
        print("DataQualityView: Direct duplicate detection for \(contacts.count) contacts")
        
        for i in 0..<contacts.count {
            if processedIndices.contains(i) { continue }
            
            let contact1 = contacts[i]
            var groupDuplicates: [FarmContact] = [contact1]
            
            // Find ALL contacts that match this one (not just pairs)
            for j in (i+1)..<contacts.count {
                if processedIndices.contains(j) { continue }
                
                let contact2 = contacts[j]
                
                // Check for exact name match
                let nameMatch = contact1.firstName == contact2.firstName && 
                               contact1.lastName == contact2.lastName &&
                               !(contact1.firstName?.isEmpty ?? true) &&
                               !(contact1.lastName?.isEmpty ?? true)
                
                // Check for email match
                let emailMatch = contact1.email1 == contact2.email1 &&
                                !(contact1.email1?.isEmpty ?? true)
                
                // Check for phone match
                let phoneMatch = contact1.phoneNumber1 == contact2.phoneNumber1 &&
                                !(contact1.phoneNumber1?.isEmpty ?? true)
                
                if nameMatch || emailMatch || phoneMatch {
                    print("DataQualityView: Direct duplicate found - \(contact1.fullName) matches \(contact2.fullName)")
                    groupDuplicates.append(contact2)
                    processedIndices.insert(j)
                }
            }
            
            // If we found duplicates, add ALL of them to the result
            if groupDuplicates.count > 1 {
                allDuplicates.append(contentsOf: groupDuplicates)
                processedIndices.insert(i)
                print("DataQualityView: Direct duplicate group with \(groupDuplicates.count) contacts: \(groupDuplicates.map { $0.fullName }.joined(separator: ", "))")
            }
        }
        
        return allDuplicates
    }
    
    private func generateQualityReport() -> String {
        var report = "FarmTrackr Data Quality Report\n"
        report += "Generated: \(Date().formatted())\n"
        report += "=====================================\n\n"
        
        if let summary = qualitySummary {
            report += "Summary:\n"
            report += "- Total Contacts: \(contacts.count)\n"
            report += "- Overall Quality Score: \(summary.overallScore)/100\n"
            report += "- Critical Issues: \(summary.criticalIssues.count)\n"
            report += "- Minor Issues: \(summary.minorIssues.count)\n"
            report += "- Recommendations: \(summary.recommendations.count)\n\n"
            
            if !summary.criticalIssues.isEmpty {
                report += "Critical Issues:\n"
                for issue in summary.criticalIssues {
                    report += "- \(issue)\n"
                }
                report += "\n"
            }
            
            if !summary.minorIssues.isEmpty {
                report += "Minor Issues:\n"
                for issue in summary.minorIssues {
                    report += "- \(issue)\n"
                }
                report += "\n"
            }
            
            if !summary.recommendations.isEmpty {
                report += "Recommendations:\n"
                for rec in summary.recommendations {
                    report += "- \(rec)\n"
                }
                report += "\n"
            }
        }
        
        report += "Detailed Validation Results:\n"
        for result in qualityReports where !result.errors.isEmpty || !result.warnings.isEmpty {
            report += "- \(result.field): "
            if !result.errors.isEmpty {
                report += "Errors: \(result.errors.joined(separator: ", "))"
            }
            if !result.warnings.isEmpty {
                if !result.errors.isEmpty { report += "; " }
                report += "Warnings: \(result.warnings.joined(separator: ", "))"
            }
            report += "\n"
        }
        
        return report
    }
    
    private func exportQualityReport() {
        let report = generateQualityReport()
        
        // Share the file content as text instead of file URL to avoid simulator issues
        let activityVC = UIActivityViewController(activityItems: [report], applicationActivities: nil)
        
        // Configure popover for iPad
        if let popover = activityVC.popoverPresentationController {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                popover.sourceView = rootVC.view
                popover.sourceRect = CGRect(x: rootVC.view.bounds.midX, y: rootVC.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
        }
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootVC = window.rootViewController {
            rootVC.present(activityVC, animated: true)
            
            // Show success message
            successMessage = "Quality report ready for sharing!"
            showingSuccessMessage = true
            
            // Auto-hide success message after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                showingSuccessMessage = false
            }
        }
    }
    
    private func bulkEditContacts() {
        // For now, show an alert with available bulk actions
        let alert = UIAlertController(
            title: "Bulk Edit",
            message: "Select contacts with issues to edit in bulk",
            preferredStyle: .actionSheet
        )
        
        alert.addAction(UIAlertAction(title: "Edit Missing Emails", style: .default) { _ in
            // Present a sheet or modal to allow the user to enter a new email address for all selected contacts with missing emails
            self.presentBulkEditField(field: .email)
        })
        
        alert.addAction(UIAlertAction(title: "Edit Missing Phones", style: .default) { _ in
            // Present a sheet or modal to allow the user to enter a new phone number for all selected contacts with missing phones
            self.presentBulkEditField(field: .phone)
        })
        
        alert.addAction(UIAlertAction(title: "Edit Missing Farms", style: .default) { _ in
            // Present a sheet or modal to allow the user to enter a new farm name for all selected contacts with missing farms
            self.presentBulkEditField(field: .farm)
        })
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        // Present the alert safely on iPad
        DispatchQueue.main.async {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                
                // Configure popover for iPad
                if let popover = alert.popoverPresentationController {
                    popover.sourceView = rootVC.view
                    popover.sourceRect = CGRect(x: rootVC.view.bounds.midX, y: rootVC.view.bounds.midY, width: 0, height: 0)
                    popover.permittedArrowDirections = []
                }
                
                rootVC.present(alert, animated: true)
            } else {
                // Fallback: use alert style instead of action sheet
                let fallbackAlert = UIAlertController(
                    title: "Bulk Edit",
                    message: "Select contacts with issues to edit in bulk",
                    preferredStyle: .alert
                )
                
                fallbackAlert.addAction(UIAlertAction(title: "Edit Missing Emails", style: .default) { _ in
                    print("Bulk edit missing emails")
                })
                
                fallbackAlert.addAction(UIAlertAction(title: "Edit Missing Phones", style: .default) { _ in
                    print("Bulk edit missing phones")
                })
                
                fallbackAlert.addAction(UIAlertAction(title: "Edit Missing Farms", style: .default) { _ in
                    print("Bulk edit missing farms")
                })
                
                fallbackAlert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
                
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let window = windowScene.windows.first,
                   let rootVC = window.rootViewController {
                    rootVC.present(fallbackAlert, animated: true)
                }
            }
        }
    }
    
    enum BulkEditFieldType {
        case email, phone, farm
    }
    
    private func presentBulkEditField(field: BulkEditFieldType) {
        // Gather contacts with missing data for the selected field
        var candidates: [FarmContact] = []
        switch field {
        case .email:
            candidates = contacts.filter { $0.email1 == nil || $0.email1?.isEmpty == true }
        case .phone:
            candidates = contacts.filter { $0.phoneNumber1 == nil || $0.phoneNumber1?.isEmpty == true }
        case .farm:
            candidates = contacts.filter { $0.farm == nil || $0.farm?.isEmpty == true }
        }
        // Apply filters
        if filterFarm != "All Farms" {
            candidates = candidates.filter { $0.farm == filterFarm }
        }
        if !filterName.isEmpty {
            let nameLower = filterName.lowercased()
            candidates = candidates.filter { ($0.firstName?.lowercased().contains(nameLower) ?? false) || ($0.lastName?.lowercased().contains(nameLower) ?? false) }
        }
        selectableContacts = candidates
        selectedContacts = Set(candidates.map { $0.objectID }) // default: all selected
        pendingBulkEditField = field
        pendingBulkEditValue = ""
        showingBulkEditSheet = true
    }
    
    private func applyBulkEdit(field: BulkEditFieldType, value: String) {
        // Only update selected contacts
        var updatedCount = 0
        for contact in selectableContacts where selectedContacts.contains(contact.objectID) {
            switch field {
            case .email:
                contact.email1 = value
            case .phone:
                contact.phoneNumber1 = value
            case .farm:
                contact.farm = value
            }
            updatedCount += 1
        }
        do {
            try viewContext.save()
            successMessage = "Updated \(updatedCount) contacts."
            showingSuccessMessage = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                showingSuccessMessage = false
            }
        } catch {
            successMessage = "Failed to update contacts: \(error.localizedDescription)"
            showingSuccessMessage = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                showingSuccessMessage = false
            }
        }
        showingBulkEditSheet = false
    }
}

// MARK: - Supporting Views
struct QualityCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title2)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Text(value)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text(title)
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondary)
                
                Text(subtitle)
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondary)
            }
        }
        .padding(Constants.Spacing.large)
        .cardStyle()
    }
}

struct QualityActionButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Image(systemName: icon)
                    .foregroundColor(Constants.Colors.primary)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(Constants.Typography.bodyFont)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Constants.Spacing.medium)
            .interactiveCardStyle()
        }
        .buttonStyle(PlainButtonStyle())
    }
} 