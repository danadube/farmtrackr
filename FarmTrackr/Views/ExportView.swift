//
//  ExportView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct ExportView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var exportManager = ExportManager()
    @State private var selectedExportType: ExportType = .csv
    @State private var selectedFarm: String = "All Farms"
    @State private var exportedFileURL: URL?
    @State private var showingShareSheet = false
    @State private var showingSaveDialog = false
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    
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
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 36))
                            .foregroundColor(themeVM.theme.colors.primary)
                        
                        Text("Export Contacts")
                            .font(themeVM.theme.fonts.headerFont)
                            .foregroundColor(themeVM.theme.colors.text)
                            .padding(.top, 2)
                        
                        Text("Export your contact data")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .multilineTextAlignment(.center)
                            .padding(.bottom, 2)
                    }
                    .padding(.top, 8)
                    .padding(.horizontal, 16)
                    
                    // Farm Selection
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                        Text("Select Farm")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(.primary)
                        
                        Menu {
                            Button("All Farms") { selectedFarm = "All Farms" }
                                .accessibilityLabel("Export all farms")
                            ForEach(availableFarms, id: \.self) { farm in
                                Button(farm) { selectedFarm = farm }
                                    .accessibilityLabel("Export \(farm) contacts")
                            }
                        } label: {
                            HStack {
                                Text(selectedFarm)
                                    .foregroundColor(themeVM.theme.colors.text)
                                Spacer()
                                Image(systemName: "chevron.down")
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .accessibilityHidden(true)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(themeVM.theme.colors.secondary.opacity(0.2), lineWidth: 0.5)
                            )
                        }
                        .accessibilityLabel("Farm filter")
                        .accessibilityHint("Double tap to choose a farm to export")
                    }
                    .padding(themeVM.theme.spacing.large)
                    .interactiveCardStyle()
                    
                    // Export Type Selection
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                        Text("Export Format")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(.primary)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: themeVM.theme.spacing.medium) {
                            ForEach(ExportType.allCases, id: \.self) { exportType in
                                ExportTypeCard(
                                    type: exportType,
                                    isSelected: selectedExportType == exportType
                                ) {
                                    selectedExportType = exportType
                                }
                            }
                        }
                    }
                    .padding(themeVM.theme.spacing.large)
                    .interactiveCardStyle()
                    
                    // Contact Count
                    VStack(spacing: themeVM.theme.spacing.small) {
                        Text("\(filteredContacts.count) contacts will be exported")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondary)
                        
                        if selectedFarm != "All Farms" {
                            Text("From \(selectedFarm)")
                                .font(themeVM.theme.fonts.captionFont)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        
                        if filteredContacts.isEmpty {
                            Text("No contacts to export")
                                .font(themeVM.theme.fonts.captionFont)
                                .foregroundColor(themeVM.theme.colors.warning)
                        }
                    }
                    
                    // Export Progress
                    if exportManager.isExporting {
                        ExportProgressView(progress: exportManager.exportProgress, status: exportManager.exportStatus)
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Button("Export \(selectedExportType.displayName)") {
                        Task {
                            await exportContacts()
                        }
                    }
                    .primaryButtonStyle()
                    .disabled(filteredContacts.isEmpty || exportManager.isExporting)
                    
                    if exportedFileURL != nil {
                        Button("Share File") {
                            showingShareSheet = true
                        }
                        .secondaryButtonStyle()
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
                .padding(.bottom, themeVM.theme.spacing.large)
            }
            .background(Color(.systemBackground))
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let exportedFileURL {
                ShareSheet(items: [exportedFileURL])
            }
        }
        .alert("Export Complete", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text(successMessage)
        }
    }
    
    private func exportContacts() async {
        do {
            let fileURL: URL
            
            switch selectedExportType {
            case .csv:
                fileURL = try await exportManager.exportToCSV(contacts: filteredContacts)
            case .pdf:
                fileURL = try await exportManager.exportToPDF(contacts: filteredContacts)
            case .json:
                fileURL = try await exportManager.exportToJSON(contacts: filteredContacts)
            case .excel:
                fileURL = try await exportManager.exportToExcel(contacts: filteredContacts)
            }
            
            await MainActor.run {
                exportedFileURL = fileURL
                showingShareSheet = true
            }
        } catch {
            print("Export error: \(error)")
            // Show error alert
            await MainActor.run {
                // You could add an error alert here
            }
        }
    }
}

struct ExportTypeCard: View {
    let type: ExportType
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: themeVM.theme.spacing.medium) {
                Image(systemName: type.iconName)
                    .font(.title)
                    .foregroundColor(isSelected ? .white : themeVM.theme.colors.primary)
                
                Text(type.displayName)
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(type.fileExtension.uppercased())
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(themeVM.theme.spacing.large)
            .background(isSelected ? themeVM.theme.colors.primary : Color(.systemGray6))
            .cornerRadius(themeVM.theme.cornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                    .stroke(isSelected ? themeVM.theme.colors.primary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ExportProgressView: View {
    let progress: Double
    let status: String
    @EnvironmentObject var themeVM: ThemeViewModel
    var body: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: themeVM.theme.colors.primary))
            
            Text(status)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondary)
        }
        .padding(themeVM.theme.spacing.medium)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
    }
}

enum ExportType: CaseIterable {
    case csv, pdf, json, excel
    
    var displayName: String {
        switch self {
        case .csv: return "CSV"
        case .pdf: return "PDF"
        case .json: return "JSON"
        case .excel: return "Excel"
        }
    }
    
    var iconName: String {
        switch self {
        case .csv: return "doc.text"
        case .pdf: return "doc.text.magnifyingglass"
        case .json: return "doc.text"
        case .excel: return "tablecells"
        }
    }
    
    var fileExtension: String {
        switch self {
        case .csv: return "csv"
        case .pdf: return "pdf"
        case .json: return "json"
        case .excel: return "csv"
        }
    }
} 