//
//  ExportView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct ExportView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    
    @StateObject private var exportManager = ExportManager()
    @State private var selectedExportType: ExportType = .csv
    @State private var showingShareSheet = false
    @State private var exportedFileURL: URL?
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.lastName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    var body: some View {
        NavigationView {
            VStack(spacing: themeVM.theme.spacing.large) {
                TabHeader(icon: "square.and.arrow.up", logoName: nil, title: "Export", subtitle: "Export your contacts in various formats")
                
                // Export Options
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Text("Export Format")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Picker("Export Type", selection: $selectedExportType) {
                        ForEach(ExportType.allCases, id: \.self) { type in
                            Text(type.displayName).tag(type)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal, themeVM.theme.spacing.medium)
                }
                
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
            }
        } catch {
            print("Export error: \(error)")
        }
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

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

enum ExportType: CaseIterable {
    case csv, pdf
    
    var displayName: String {
        switch self {
        case .csv: return "CSV"
        case .pdf: return "PDF"
        }
    }
} 