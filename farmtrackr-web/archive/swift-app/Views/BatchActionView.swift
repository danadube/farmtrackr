//
//  BatchActionView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/11/25.
//

import SwiftUI
import CoreData

struct BatchActionView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var batchManager: BatchActionManager
    @State private var showingDeleteConfirmation = false
    @State private var showingExportSheet = false
    @State private var showingTagSheet = false
    @State private var showingBulkEditSheet = false
    @State private var selectedExportFormat: ExportFormat = .csv
    @State private var tagText = ""
    @State private var bulkEditFarm = ""
    @State private var bulkEditState = ""
    @State private var bulkEditNotes = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var alertTitle = ""
    
    let contacts: [FarmContact]
    
    var body: some View {
        VStack(spacing: 0) {
            if batchManager.isSelectionMode {
                selectionToolbar
            }
            
            if batchManager.isProcessing {
                progressView
            }
        }
        .background(Color.appBackground)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
        .confirmationDialog("Delete Selected Contacts", isPresented: $showingDeleteConfirmation) {
            Button("Delete \(batchManager.selectedCount) Contacts", role: .destructive) {
                Task {
                    await deleteSelectedContacts()
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This action cannot be undone. Are you sure you want to delete \(batchManager.selectedCount) contacts?")
        }
        .sheet(isPresented: $showingExportSheet) {
            exportSheet
        }
        .sheet(isPresented: $showingTagSheet) {
            tagSheet
        }
        .sheet(isPresented: $showingBulkEditSheet) {
            bulkEditSheet
        }
    }
    
    private var selectionToolbar: some View {
        VStack(spacing: 0) {
            // Selection info bar
            HStack {
                Text("\(batchManager.selectedCount) selected")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button("Done") {
                    batchManager.exitSelectionMode()
                }
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.primary)
            }
            .padding(.horizontal, Constants.Spacing.large)
            .padding(.vertical, Constants.Spacing.medium)
            .background(themeVM.theme.colors.cardBackground)
            
            Divider()
                .background(Color.gray.opacity(0.3))
            
            // Selection controls
            HStack(spacing: Constants.Spacing.medium) {
                Button("Select All") {
                    batchManager.selectAll(contacts: contacts)
                }
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.primary)
                
                Button("Deselect All") {
                    batchManager.deselectAll()
                }
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.primary)
                
                Button("Invert") {
                    batchManager.invertSelection(contacts: contacts)
                }
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.primary)
                
                Spacer()
            }
            .padding(.horizontal, Constants.Spacing.large)
            .padding(.vertical, Constants.Spacing.small)
            .background(themeVM.theme.colors.cardBackground)
            
            Divider()
                .background(Color.gray.opacity(0.3))
            
            // Action buttons
            if batchManager.hasSelection {
                actionButtons
            }
        }
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(8)
        .padding(.horizontal, Constants.Spacing.large)
        .padding(.vertical, Constants.Spacing.small)
    }
    
    private var actionButtons: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Constants.Spacing.medium) {
                BatchActionButton(
                    title: "Delete",
                    icon: "trash",
                    color: .red
                ) {
                    showingDeleteConfirmation = true
                }
                
                BatchActionButton(
                    title: "Export",
                    icon: "square.and.arrow.up",
                    color: .blue
                ) {
                    showingExportSheet = true
                }
                
                BatchActionButton(
                    title: "Bulk Edit",
                    icon: "pencil.and.outline",
                    color: .purple
                ) {
                    showingBulkEditSheet = true
                }
                
                BatchActionButton(
                    title: "Print Labels",
                    icon: "printer",
                    color: .green
                ) {
                    Task {
                        await printLabels()
                    }
                }
                
                BatchActionButton(
                    title: "Add Tag",
                    icon: "tag",
                    color: .orange
                ) {
                    showingTagSheet = true
                }
            }
            .padding(.horizontal, Constants.Spacing.large)
            .padding(.vertical, Constants.Spacing.medium)
        }
        .background(themeVM.theme.colors.cardBackground)
    }
    
    private var progressView: some View {
        VStack(spacing: Constants.Spacing.medium) {
            ProgressView(value: batchManager.progress)
                .progressViewStyle(LinearProgressViewStyle())
                .scaleEffect(x: 1, y: 2, anchor: .center)
            
            Text(batchManager.currentOperation)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(.secondary)
            
            Text("\(Int(batchManager.progress * 100))%")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(.secondary)
        }
        .padding(Constants.Spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .padding(Constants.Spacing.large)
    }
    
    private var exportSheet: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(
                    icon: "square.and.arrow.up",
                    logoName: nil,
                    title: "Export Contacts",
                    subtitle: "Export \(batchManager.selectedCount) selected contacts"
                )
                
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Export Format")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: Constants.Spacing.medium) {
                        ForEach(ExportFormat.allCases, id: \.self) { format in
                            ExportFormatCard(
                                format: format,
                                isSelected: selectedExportFormat == format
                            ) {
                                selectedExportFormat = format
                            }
                        }
                    }
                }
                .padding(Constants.Spacing.large)
                .interactiveCardStyle()
                
                Spacer()
                
                Button("Export \(batchManager.selectedCount) Contacts") {
                    Task {
                        await exportContacts()
                    }
                }
                .font(themeVM.theme.fonts.bodyFont)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(Constants.Spacing.medium)
                .background(themeVM.theme.colors.primary)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                .padding(.horizontal, Constants.Spacing.large)
            }
            .padding(Constants.Spacing.large)
        }
        .background(themeVM.theme.colors.background)
        .navigationTitle("Export")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Cancel") {
                    showingExportSheet = false
                }
            }
        }
    }
    
    private var tagSheet: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(
                    icon: "tag",
                    logoName: nil,
                    title: "Add Tag",
                    subtitle: "Add tag to \(batchManager.selectedCount) contacts"
                )
                
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Tag Name")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    TextField("Enter tag name", text: $tagText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(themeVM.theme.fonts.bodyFont)
                }
                .padding(Constants.Spacing.large)
                .interactiveCardStyle()
                
                Spacer()
                
                Button("Add Tag to \(batchManager.selectedCount) Contacts") {
                    Task {
                        await addTag()
                    }
                }
                .font(themeVM.theme.fonts.bodyFont)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(Constants.Spacing.medium)
                .background(tagText.isEmpty ? Color.gray : themeVM.theme.colors.primary)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                .disabled(tagText.isEmpty)
                .padding(.horizontal, Constants.Spacing.large)
            }
            .padding(Constants.Spacing.large)
        }
        .background(themeVM.theme.colors.background)
        .navigationTitle("Add Tag")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Cancel") {
                    showingTagSheet = false
                }
            }
        }
    }
    
    private var bulkEditSheet: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(
                    icon: "pencil.and.outline",
                    logoName: nil,
                    title: "Bulk Edit",
                    subtitle: "Edit \(batchManager.selectedCount) contacts"
                )
                
                ScrollView {
                    VStack(spacing: Constants.Spacing.large) {
                        // Farm field
                        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                            Text("Farm")
                                .font(themeVM.theme.fonts.titleFont)
                                .foregroundColor(.primary)
                            
                            TextField("Enter farm name", text: $bulkEditFarm)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .font(themeVM.theme.fonts.bodyFont)
                        }
                        .padding(Constants.Spacing.large)
                        .interactiveCardStyle()
                        
                        // State field
                        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                            Text("State")
                                .font(themeVM.theme.fonts.titleFont)
                                .foregroundColor(.primary)
                            
                            TextField("Enter state", text: $bulkEditState)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .font(themeVM.theme.fonts.bodyFont)
                        }
                        .padding(Constants.Spacing.large)
                        .interactiveCardStyle()
                        
                        // Notes field
                        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                            Text("Notes")
                                .font(themeVM.theme.fonts.titleFont)
                                .foregroundColor(.primary)
                            
                            TextField("Enter notes", text: $bulkEditNotes, axis: .vertical)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .font(themeVM.theme.fonts.bodyFont)
                                .lineLimit(3...6)
                        }
                        .padding(Constants.Spacing.large)
                        .interactiveCardStyle()
                    }
                    .padding(.horizontal, Constants.Spacing.large)
                }
                
                Button("Update \(batchManager.selectedCount) Contacts") {
                    Task {
                        await bulkEditContacts()
                    }
                }
                .font(themeVM.theme.fonts.bodyFont)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(Constants.Spacing.medium)
                .background(themeVM.theme.colors.primary)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                .padding(.horizontal, Constants.Spacing.large)
            }
            .padding(Constants.Spacing.large)
        }
        .background(themeVM.theme.colors.background)
        .navigationTitle("Bulk Edit")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Cancel") {
                    showingBulkEditSheet = false
                }
            }
        }
    }
    
    // MARK: - Action Methods
    
    private func deleteSelectedContacts() async {
        do {
            try await batchManager.deleteSelectedContacts()
            alertTitle = "Success"
            alertMessage = "Successfully deleted \(batchManager.selectedCount) contacts."
            showingAlert = true
        } catch {
            alertTitle = "Error"
            alertMessage = "Failed to delete contacts: \(error.localizedDescription)"
            showingAlert = true
        }
    }
    
    private func exportContacts() async {
        do {
            let url = try await batchManager.exportSelectedContacts(format: selectedExportFormat)
            showingExportSheet = false
            alertTitle = "Export Complete"
            alertMessage = "Contacts exported successfully to \(url.lastPathComponent)"
            showingAlert = true
        } catch {
            alertTitle = "Export Error"
            alertMessage = "Failed to export contacts: \(error.localizedDescription)"
            showingAlert = true
        }
    }
    
    private func printLabels() async {
        do {
            try await batchManager.printLabelsForSelectedContacts()
            alertTitle = "Print Complete"
            alertMessage = "Labels prepared for \(batchManager.selectedCount) contacts"
            showingAlert = true
        } catch {
            alertTitle = "Print Error"
            alertMessage = "Failed to prepare labels: \(error.localizedDescription)"
            showingAlert = true
        }
    }
    
    private func addTag() async {
        do {
            try await batchManager.addTagToSelectedContacts(tag: tagText)
            showingTagSheet = false
            tagText = ""
            alertTitle = "Tag Added"
            alertMessage = "Successfully added tag '\(tagText)' to \(batchManager.selectedCount) contacts"
            showingAlert = true
        } catch {
            alertTitle = "Tag Error"
            alertMessage = "Failed to add tag: \(error.localizedDescription)"
            showingAlert = true
        }
    }
    
    private func bulkEditContacts() async {
        do {
            try await batchManager.bulkEditSelectedContacts(
                farm: bulkEditFarm.isEmpty ? nil : bulkEditFarm,
                state: bulkEditState.isEmpty ? nil : bulkEditState,
                notes: bulkEditNotes.isEmpty ? nil : bulkEditNotes
            )
            showingBulkEditSheet = false
            bulkEditFarm = ""
            bulkEditState = ""
            bulkEditNotes = ""
            alertTitle = "Bulk Edit Complete"
            alertMessage = "Successfully updated \(batchManager.selectedCount) contacts"
            showingAlert = true
        } catch {
            alertTitle = "Bulk Edit Error"
            alertMessage = "Failed to update contacts: \(error.localizedDescription)"
            showingAlert = true
        }
    }
}

// MARK: - Supporting Views

struct BatchActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: Constants.Spacing.small) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.primary)
            }
            .frame(width: 80, height: 60)
            .background(Color(.systemGray6))
            .cornerRadius(Constants.CornerRadius.medium)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ExportFormatCard: View {
    let format: ExportFormat
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: Constants.Spacing.medium) {
                Image(systemName: formatIcon)
                    .font(.title)
                    .foregroundColor(isSelected ? .white : themeVM.theme.colors.primary)
                
                Text(format.rawValue)
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(format.fileExtension.uppercased())
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(Constants.Spacing.large)
            .background(isSelected ? themeVM.theme.colors.primary : Color(.systemGray6))
            .cornerRadius(themeVM.theme.cornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                    .stroke(isSelected ? themeVM.theme.colors.primary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var formatIcon: String {
        switch format {
        case .csv: return "doc.text"
        case .json: return "doc.text"
        case .excel: return "tablecells"
        }
    }
} 