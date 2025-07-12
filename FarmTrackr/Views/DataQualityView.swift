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
    @StateObject private var dataValidator = DataValidator.shared
    @State private var qualityReports: [ContactQualityReport] = []
    @State private var qualitySummary: QualitySummary?
    @State private var selectedIssue: DataQualityIssue?
    @State private var showingIssueDetails = false
    @State private var showingDuplicateResolution = false
    @State private var duplicates: [FarmContact] = []
    @State private var showingSuccessMessage = false
    @State private var successMessage = ""
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default)
    private var contacts: FetchedResults<FarmContact>
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "checkmark.shield", logoName: nil, title: "Data Quality", subtitle: "Monitor and improve your contact data")
                
                // Quality Overview Cards
                qualityOverviewCards
                
                // Issue Breakdown
                issueBreakdownSection
                
                // Actions Section
                actionsSection
            }
            .padding(Constants.Spacing.large)
        }
        .background(themeVM.theme.colors.background)
        .onAppear {
            refreshQualityData()
        }
        .sheet(isPresented: $showingIssueDetails) {
            if let issue = selectedIssue {
                IssueDetailsView(issue: issue, contacts: getContactsWithIssue(issue))
            }
        }
        .sheet(isPresented: $showingDuplicateResolution) {
            DuplicateResolutionView(duplicates: duplicates)
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
    }
    
    private var qualityOverviewCards: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: Constants.Spacing.medium) {
            QualityCard(
                title: "Data Quality",
                value: "\(Int(qualitySummary?.qualityPercentage ?? 0))%",
                subtitle: "\(qualitySummary?.contactsWithIssues ?? 0) issues found",
                icon: "checkmark.shield.fill",
                color: qualityColor
            )
            
            QualityCard(
                title: "Completeness",
                value: "\(Int(qualitySummary?.completenessPercentage ?? 0))%",
                subtitle: "Average field completion",
                icon: "chart.bar.fill",
                color: completenessColor
            )
            
            QualityCard(
                title: "High Priority",
                value: "\(qualitySummary?.highPriorityIssues ?? 0)",
                subtitle: "Critical issues to fix",
                icon: "exclamationmark.triangle.fill",
                color: .red
            )
            
            QualityCard(
                title: "Duplicates",
                value: "\(duplicates.count)",
                subtitle: "Potential duplicates",
                icon: "person.2.fill",
                color: .orange
            )
        }
    }
    
    private var issueBreakdownSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Issue Breakdown")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            LazyVStack(spacing: Constants.Spacing.small) {
                ForEach(DataQualityIssue.allCases, id: \.self) { issue in
                    IssueRow(
                        issue: issue,
                        count: qualitySummary?.issueBreakdown[issue] ?? 0,
                        onTap: {
                            selectedIssue = issue
                            showingIssueDetails = true
                        }
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
                    title: "Fix Duplicates",
                    subtitle: "Resolve duplicate contacts",
                    icon: "person.2.fill",
                    action: { showingDuplicateResolution = true }
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
            }
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
    
    // MARK: - Helper Methods
    private var qualityColor: Color {
        let percentage = qualitySummary?.qualityPercentage ?? 0
        if percentage >= 90 { return .green }
        if percentage >= 70 { return .orange }
        return .red
    }
    
    private var completenessColor: Color {
        let percentage = qualitySummary?.completenessPercentage ?? 0
        if percentage >= 90 { return .green }
        if percentage >= 70 { return .orange }
        return .red
    }
    
    private func refreshQualityData() {
        let allContacts = Array(contacts)
        print("DataQualityView: Assessing \(allContacts.count) contacts")
        
        qualityReports = dataValidator.assessAllContactsQuality(allContacts)
        qualitySummary = dataValidator.getQualitySummary(qualityReports)
        duplicates = dataValidator.findDuplicateContacts(allContacts)
        
        print("DataQualityView: Found \(qualityReports.filter { !$0.issues.isEmpty }.count) contacts with issues")
        print("DataQualityView: Found \(duplicates.count) potential duplicates")
        
        if let summary = qualitySummary {
            print("DataQualityView: Quality score: \(summary.qualityPercentage)%")
            print("DataQualityView: Completeness: \(summary.completenessPercentage)%")
            
            // Show success message
            successMessage = "Data quality assessment completed! Found \(summary.contactsWithIssues) issues across \(allContacts.count) contacts."
            showingSuccessMessage = true
            
            // Auto-hide success message after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                showingSuccessMessage = false
            }
        }
    }
    
    private func getContactsWithIssue(_ issue: DataQualityIssue) -> [FarmContact] {
        return qualityReports.filter { $0.issues.contains(issue) }.map { $0.contact }
    }
    
    private func exportQualityReport() {
        let report = generateQualityReport()
        
        // Create a temporary file with a unique name
        let timestamp = Date().timeIntervalSince1970
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("quality_report_\(Int(timestamp)).txt")
        
        do {
            try report.write(to: tempURL, atomically: true, encoding: .utf8)
            
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
        } catch {
            print("Error exporting report: \(error)")
            
            // Show error alert
            let errorAlert = UIAlertController(
                title: "Export Failed",
                message: "Failed to create quality report: \(error.localizedDescription)",
                preferredStyle: .alert
            )
            errorAlert.addAction(UIAlertAction(title: "OK", style: .default))
            
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                rootVC.present(errorAlert, animated: true)
            }
        }
    }
    
    private func generateQualityReport() -> String {
        var report = "FarmTrackr Data Quality Report\n"
        report += "Generated: \(Date().formatted())\n"
        report += "=====================================\n\n"
        
        if let summary = qualitySummary {
            report += "Summary:\n"
            report += "- Total Contacts: \(summary.totalContacts)\n"
            report += "- Contacts with Issues: \(summary.contactsWithIssues)\n"
            report += "- High Priority Issues: \(summary.highPriorityIssues)\n"
            report += "- Quality Score: \(Int(summary.qualityPercentage))%\n"
            report += "- Completeness: \(Int(summary.completenessPercentage))%\n\n"
            
            report += "Issue Breakdown:\n"
            for (issue, count) in summary.issueBreakdown.sorted(by: { $0.value > $1.value }) {
                report += "- \(issue.rawValue): \(count) contacts\n"
            }
            report += "\n"
        }
        
        report += "Detailed Issues:\n"
        for contactReport in qualityReports where !contactReport.issues.isEmpty {
            report += "- \(contactReport.contact.fullName) (\(contactReport.contact.farm ?? "No Farm")): "
            report += contactReport.issues.map { $0.rawValue }.joined(separator: ", ")
            report += "\n"
        }
        
        return report
    }
    
    private func bulkEditContacts() {
        // For now, show an alert with available bulk actions
        let alert = UIAlertController(
            title: "Bulk Edit",
            message: "Select contacts with issues to edit in bulk",
            preferredStyle: .actionSheet
        )
        
        alert.addAction(UIAlertAction(title: "Edit Missing Emails", style: .default) { _ in
            // TODO: Implement bulk email editing
            print("Bulk edit missing emails")
        })
        
        alert.addAction(UIAlertAction(title: "Edit Missing Phones", style: .default) { _ in
            // TODO: Implement bulk phone editing
            print("Bulk edit missing phones")
        })
        
        alert.addAction(UIAlertAction(title: "Edit Missing Farms", style: .default) { _ in
            // TODO: Implement bulk farm editing
            print("Bulk edit missing farms")
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

struct IssueRow: View {
    let issue: DataQualityIssue
    let count: Int
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: issue.icon)
                    .foregroundColor(severityColor)
                    .frame(width: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(issue.rawValue)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                    
                    Text("\(count) contacts affected")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(issue.severity.rawValue)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(severityColor)
                    .cornerRadius(8)
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var severityColor: Color {
        switch issue.severity {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
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