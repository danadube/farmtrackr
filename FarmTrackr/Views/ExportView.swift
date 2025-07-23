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
                        GeometryReader { geometry in
                            let cardCount = ExportType.allCases.count
                            let spacing = themeVM.theme.spacing.small
                            let totalSpacing = spacing * CGFloat(cardCount - 1)
                            let cardWidth = (geometry.size.width - totalSpacing) / CGFloat(cardCount)
                            HStack(spacing: spacing) {
                                ForEach(ExportType.allCases, id: \.self) { exportType in
                                    ExportTypeCard(
                                        type: exportType,
                                        isSelected: selectedExportType == exportType
                                    ) {
                                        selectedExportType = exportType
                                    }
                                    .frame(width: cardWidth, height: 64)
                                }
                            }
                        }
                        .frame(height: 64)
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
            VStack(spacing: 6) {
                Image(systemName: type.iconName)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(isSelected ? .white : themeVM.theme.colors.primary)
                Text(type.displayName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isSelected ? .white : .primary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(isSelected ? themeVM.theme.colors.primary : Color(.systemGray6))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.15), radius: 6, x: 0, y: 3)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
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