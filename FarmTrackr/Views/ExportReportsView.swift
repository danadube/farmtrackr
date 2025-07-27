//
//  ExportReportsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct ExportReportsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var dataValidator = DataValidator()
    
    @State private var selectedReportType: ReportType = .dataQuality
    @State private var selectedFormat: ExportFormat = .csv
    @State private var selectedFarm: String = "All Farms"
    @State private var isExporting = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    @State private var showingErrorAlert = false
    @State private var errorMessage = ""
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    var availableFarms: [String] {
        Array(Set(contacts.compactMap { $0.farm }.filter { !$0.isEmpty })).sorted()
    }
    
    var filteredContacts: [FarmContact] {
        if selectedFarm == "All Farms" {
            return Array(contacts)
        } else {
            return Array(contacts.filter { $0.farm == selectedFarm })
        }
    }
    
    enum ReportType: String, CaseIterable {
        case dataQuality = "Data Quality"
        case contactSummary = "Contact Summary"
        case farmAnalysis = "Farm Analysis"
        case duplicateReport = "Duplicate Report"
        
        var description: String {
            switch self {
            case .dataQuality:
                return "Export data quality scores and validation results"
            case .contactSummary:
                return "Export contact statistics and summaries"
            case .farmAnalysis:
                return "Export farm-specific contact analysis"
            case .duplicateReport:
                return "Export duplicate contact detection results"
            }
        }
        
        var icon: String {
            switch self {
            case .dataQuality:
                return "checkmark.shield"
            case .contactSummary:
                return "person.2"
            case .farmAnalysis:
                return "building.2"
            case .duplicateReport:
                return "doc.on.doc"
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(
                icon: "square.and.arrow.up",
                logoName: nil,
                title: "Export Reports",
                subtitle: "Generate and export data reports"
            )
            
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    // Report Type Selection
                    reportTypeSection
                    
                    // Export Options
                    exportOptionsSection
                    
                    // Export Button
                    exportButtonSection
                    
                    // Progress Indicator
                    if isExporting {
                        progressSection
                    }
                }
                .padding(themeVM.theme.spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
        .alert("Export Complete", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text(successMessage)
        }
        .alert("Export Error", isPresented: $showingErrorAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
    }
    
    // MARK: - Report Type Section
    
    private var reportTypeSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Report Type")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: themeVM.theme.spacing.medium) {
                ForEach(ReportType.allCases, id: \.self) { reportType in
                    ReportTypeCard(
                        reportType: reportType,
                        isSelected: selectedReportType == reportType
                    ) {
                        selectedReportType = reportType
                    }
                }
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
    
    // MARK: - Export Options Section
    
    private var exportOptionsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Export Options")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            VStack(spacing: themeVM.theme.spacing.medium) {
                // Format Selection
                HStack {
                    Text("Format:")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Picker("Export Format", selection: $selectedFormat) {
                        ForEach(ExportFormat.allCases, id: \.self) { format in
                            Text(format.rawValue).tag(format)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    
                    Spacer()
                }
                
                // Farm Filter (if applicable)
                if selectedReportType == .farmAnalysis || selectedReportType == .contactSummary {
                    HStack {
                        Text("Farm:")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Picker("Farm", selection: $selectedFarm) {
                            Text("All Farms").tag("All Farms")
                            ForEach(availableFarms, id: \.self) { farm in
                                Text(farm).tag(farm)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        
                        Spacer()
                    }
                }
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
    
    // MARK: - Export Button Section
    
    private var exportButtonSection: some View {
        Button(action: {
            Task {
                await exportReport()
            }
        }) {
            HStack {
                if isExporting {
                    ProgressView()
                        .scaleEffect(0.8)
                        .foregroundColor(.white)
                } else {
                    Image(systemName: "square.and.arrow.up")
                }
                Text(isExporting ? "Exporting..." : "Export Report")
            }
            .font(themeVM.theme.fonts.buttonFont)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(themeVM.theme.spacing.medium)
            .background(themeVM.theme.colors.primary)
            .cornerRadius(themeVM.theme.cornerRadius.medium)
        }
        .disabled(isExporting || filteredContacts.isEmpty)
    }
    
    // MARK: - Progress Section
    
    private var progressSection: some View {
        VStack(spacing: themeVM.theme.spacing.small) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Generating report...")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
    
    // MARK: - Export Function
    
    private func exportReport() async {
        isExporting = true
        
        do {
            let url = try await generateReport()
            await MainActor.run {
                exportURL = url
                successMessage = "Report exported successfully"
                showingSuccessAlert = true
                showingShareSheet = true
                isExporting = false
            }
        } catch {
            await MainActor.run {
                errorMessage = "Failed to export report: \(error.localizedDescription)"
                showingErrorAlert = true
                isExporting = false
            }
        }
    }
    
    private func generateReport() async throws -> URL {
        let timestamp = DateFormatter.backupTimestamp.string(from: Date())
        let fileName = "FarmTrackr_\(selectedReportType.rawValue.replacingOccurrences(of: " ", with: "_"))_\(timestamp)"
        
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(fileName)
            .appendingPathExtension(selectedFormat.fileExtension)
        
        switch selectedReportType {
        case .dataQuality:
            try await generateDataQualityReport(to: url)
        case .contactSummary:
            try await generateContactSummaryReport(to: url)
        case .farmAnalysis:
            try await generateFarmAnalysisReport(to: url)
        case .duplicateReport:
            try await generateDuplicateReport(to: url)
        }
        
        return url
    }
    
    private func generateDataQualityReport(to url: URL) async throws {
        let contactRecords = filteredContacts.map { contact in
            ContactRecord(
                firstName: contact.firstName ?? "",
                lastName: contact.lastName ?? "",
                mailingAddress: contact.mailingAddress ?? "",
                city: contact.city ?? "",
                state: contact.state ?? "",
                zipCode: contact.zipCode,
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
                siteZipCode: contact.siteZipCode,
                notes: contact.notes,
                farm: contact.farm ?? ""
            )
        }
        
        // Create a simple data quality report
        let reportData: [String: Any] = [
            "totalContacts": contactRecords.count,
            "contactsWithEmail": contactRecords.filter { $0.email1 != nil || $0.email2 != nil }.count,
            "contactsWithPhone": contactRecords.filter { $0.phoneNumber1 != nil }.count,
            "contactsWithAddress": contactRecords.filter { !$0.mailingAddress.isEmpty }.count,
            "contacts": contactRecords.map { contact in
                [
                    "name": "\(contact.firstName) \(contact.lastName)",
                    "farm": contact.farm,
                    "hasEmail": (contact.email1 != nil || contact.email2 != nil),
                    "hasPhone": contact.phoneNumber1 != nil,
                    "hasAddress": !contact.mailingAddress.isEmpty
                ] as [String: Any]
            }
        ]
        
        let data = try JSONSerialization.data(withJSONObject: reportData, options: .prettyPrinted)
        try data.write(to: url)
    }
    
    private func generateContactSummaryReport(to url: URL) async throws {
        let contactsByFarm = Dictionary(grouping: filteredContacts, by: { $0.farm ?? "Unknown" })
        let contactsByState = Dictionary(grouping: filteredContacts, by: { $0.state ?? "Unknown" })
        
        let reportData: [String: Any] = [
            "totalContacts": filteredContacts.count,
            "contactsWithEmail": filteredContacts.filter { $0.email1 != nil || $0.email2 != nil }.count,
            "contactsWithPhone": filteredContacts.filter { $0.phoneNumber1 != nil }.count,
            "contactsByFarm": contactsByFarm.mapValues { $0.count },
            "contactsByState": contactsByState.mapValues { $0.count },
            "farms": Array(Set(filteredContacts.compactMap { $0.farm }.filter { !$0.isEmpty })).sorted(),
            "states": Array(Set(filteredContacts.compactMap { $0.state }.filter { !$0.isEmpty })).sorted()
        ]
        
        let data = try JSONSerialization.data(withJSONObject: reportData, options: .prettyPrinted)
        try data.write(to: url)
    }
    
    private func generateFarmAnalysisReport(to url: URL) async throws {
        let contactsByFarm = Dictionary(grouping: filteredContacts, by: { $0.farm ?? "Unknown" })
        
        let farmStatistics = availableFarms.map { farm in
            let farmContacts = filteredContacts.filter { $0.farm == farm }
            return [
                "name": farm,
                "contactCount": farmContacts.count,
                "hasEmailCount": farmContacts.filter { $0.email1 != nil || $0.email2 != nil }.count,
                "hasPhoneCount": farmContacts.filter { $0.phoneNumber1 != nil }.count,
                "hasAddressCount": farmContacts.filter { !($0.mailingAddress?.isEmpty ?? true) }.count
            ] as [String: Any]
        }
        
        let reportData: [String: Any] = [
            "farms": availableFarms,
            "totalFarms": availableFarms.count,
            "farmStatistics": farmStatistics,
            "contactsByFarm": contactsByFarm.mapValues { $0.count }
        ]
        
        let data = try JSONSerialization.data(withJSONObject: reportData, options: .prettyPrinted)
        try data.write(to: url)
    }
    
    private func generateDuplicateReport(to url: URL) async throws {
        // Simple duplicate detection based on name and farm
        var duplicateGroups: [[String]] = []
        var processedContacts: Set<String> = []
        
        for contact in filteredContacts {
            let key = "\(contact.firstName ?? "") \(contact.lastName ?? "")|\(contact.farm ?? "")"
            if !processedContacts.contains(key) {
                let duplicates = filteredContacts.filter { otherContact in
                    let otherKey = "\(otherContact.firstName ?? "") \(otherContact.lastName ?? "")|\(otherContact.farm ?? "")"
                    return key == otherKey
                }
                
                if duplicates.count > 1 {
                    duplicateGroups.append(duplicates.map { "\($0.firstName ?? "") \($0.lastName ?? "") (\($0.farm ?? ""))" })
                }
                
                processedContacts.insert(key)
            }
        }
        
        let reportData: [String: Any] = [
            "totalDuplicateGroups": duplicateGroups.count,
            "totalDuplicates": duplicateGroups.reduce(0) { $0 + $1.count },
            "duplicateGroups": duplicateGroups
        ]
        
        let data = try JSONSerialization.data(withJSONObject: reportData, options: .prettyPrinted)
        try data.write(to: url)
    }
}

// MARK: - Supporting Views

struct ReportTypeCard: View {
    let reportType: ExportReportsView.ReportType
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: themeVM.theme.spacing.medium) {
                Image(systemName: reportType.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? themeVM.theme.colors.primary : themeVM.theme.colors.secondaryLabel)
                
                VStack(spacing: 4) {
                    Text(reportType.rawValue)
                        .font(themeVM.theme.fonts.bodyFont)
                        .fontWeight(.medium)
                        .foregroundColor(isSelected ? themeVM.theme.colors.primary : themeVM.theme.colors.text)
                    
                    Text(reportType.description)
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(themeVM.theme.spacing.medium)
            .background(isSelected ? themeVM.theme.colors.primary.opacity(0.1) : themeVM.theme.colors.cardBackground)
            .cornerRadius(themeVM.theme.cornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                    .stroke(isSelected ? themeVM.theme.colors.primary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Report Data Structures
// Reports are now generated as JSON dictionaries for simplicity

#Preview {
    ExportReportsView()
        .environmentObject(ThemeViewModel())
} 