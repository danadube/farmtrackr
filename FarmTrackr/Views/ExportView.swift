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
    @State private var exportedFileURL: URL?
    @State private var showingShareSheet = false
    @State private var showingSaveDialog = false
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                TabHeader(
                    icon: "square.and.arrow.up",
                    logoName: nil,
                    title: "Export Contacts",
                    subtitle: "Export your contact data"
                )
                
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
                    Text("\(contacts.count) contacts will be exported")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondary)
                    
                    if contacts.isEmpty {
                        Text("No contacts to export")
                            .font(themeVM.theme.fonts.captionFont)
                            .foregroundColor(themeVM.theme.colors.warning)
                    }
                }
                
                // Export Progress
                if exportManager.isExporting {
                    ExportProgressView(progress: exportManager.exportProgress, status: exportManager.exportStatus)
                }
                
                // Action Buttons
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Button("Export \(selectedExportType.displayName)") {
                        Task {
                            await exportContacts()
                        }
                    }
                    .primaryButtonStyle()
                    .disabled(contacts.isEmpty || exportManager.isExporting)
                    
                    if exportedFileURL != nil {
                        Button("Share File") {
                            showingShareSheet = true
                        }
                        .secondaryButtonStyle()
                    }
                }
                
                Spacer()
            }
            .padding(themeVM.theme.spacing.large)
            .background(Color(.systemBackground))
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
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
            let contactsArray = Array(contacts)
            let fileURL: URL
            
            switch selectedExportType {
            case .csv:
                fileURL = try await exportManager.exportToCSV(contacts: contactsArray)
            case .pdf:
                fileURL = try await exportManager.exportToPDF(contacts: contactsArray)
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
    case csv, pdf
    
    var displayName: String {
        switch self {
        case .csv: return "CSV"
        case .pdf: return "PDF"
        }
    }
    
    var iconName: String {
        switch self {
        case .csv: return "doc.text"
        case .pdf: return "doc.text.magnifyingglass"
        }
    }
    
    var fileExtension: String {
        switch self {
        case .csv: return "csv"
        case .pdf: return "pdf"
        }
    }
} 