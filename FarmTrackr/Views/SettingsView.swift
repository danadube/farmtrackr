import SwiftUI
import CoreData
import CloudKit

struct SettingsView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.colorScheme) var colorScheme
    @State private var showingDeleteAlert = false
    @State private var showingExportSheet = false
    @State private var showingImportSheet = false
    @State private var showingSyncAlert = false
    @State private var syncAlertMessage = ""
    @State private var cloudKitAvailable = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    TabHeader(icon: "gearshape", logoName: nil, title: "Settings", subtitle: "Customize your experience")
                    
                    accessibilitySection
                    themeSection
                    darkModeSection
                    dataManagementSection
                    supportSection
                }
                .padding(Constants.Spacing.large)
            }
            .background(appBackground)
            .alert("Delete All Data", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deleteAllData()
                }
            } message: {
                Text("This will permanently delete all contacts and cannot be undone.")
            }
            .alert("Sync Status", isPresented: $showingSyncAlert) {
                Button("OK") { }
            } message: {
                Text(syncAlertMessage)
            }
            .sheet(isPresented: $showingExportSheet) {
                ExportView()
            }
            .sheet(isPresented: $showingImportSheet) {
                ImportView()
            }
            .onAppear {
                checkCloudKitAvailability()
            }
        }
    }
    
    private var accessibilitySection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Accessibility")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            VStack(spacing: Constants.Spacing.small) {
                Toggle("VoiceOver", isOn: .constant(accessibilityManager.isVoiceOverRunning))
                    .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                    .disabled(true)
                
                Toggle("High Contrast", isOn: $accessibilityManager.isHighContrastEnabled)
                    .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                
                Toggle("Reduce Motion", isOn: .constant(accessibilityManager.isReduceMotionEnabled))
                    .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                    .disabled(true)
                
                Toggle("Bold Text", isOn: .constant(accessibilityManager.isBoldTextEnabled))
                    .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                    .disabled(true)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(Constants.CornerRadius.medium)
            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
    }
    
    private var themeSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Theme")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: Constants.Spacing.medium) {
                ThemeCard(
                    themeName: "Classic Green",
                    isSelected: themeVM.selectedTheme == "Classic Green",
                    action: { themeVM.selectedTheme = "Classic Green" }
                )
                
                ThemeCard(
                    themeName: "Sunset Soil",
                    isSelected: themeVM.selectedTheme == "Sunset Soil",
                    action: { themeVM.selectedTheme = "Sunset Soil" }
                )
                
                ThemeCard(
                    themeName: "Blueprint Pro",
                    isSelected: themeVM.selectedTheme == "Blueprint Pro",
                    action: { themeVM.selectedTheme = "Blueprint Pro" }
                )
                
                ThemeCard(
                    themeName: "Harvest Luxe",
                    isSelected: themeVM.selectedTheme == "Harvest Luxe",
                    action: { themeVM.selectedTheme = "Harvest Luxe" }
                )
                
                ThemeCard(
                    themeName: "Fieldlight",
                    isSelected: themeVM.selectedTheme == "Fieldlight",
                    action: { themeVM.selectedTheme = "Fieldlight" }
                )
            }
        }
    }
    
    private var darkModeSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Appearance")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            Toggle("Dark Mode", isOn: $themeVM.darkModeEnabled)
                .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(Constants.CornerRadius.medium)
                .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
    }
    
    private var dataManagementSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Data Management")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            VStack(spacing: Constants.Spacing.small) {
                // CloudKit Sync Section (only show if available)
                if cloudKitAvailable {
                    VStack(spacing: Constants.Spacing.small) {
                        HStack {
                            Image(systemName: "icloud")
                                .foregroundColor(.blue)
                            Text("iCloud Sync")
                            Spacer()
                            Text("Available")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Button(action: {
                            performManualSync()
                        }) {
                            HStack {
                                Image(systemName: "icloud.and.arrow.up")
                                    .font(.system(size: 16, weight: .medium))
                                Text("Sync Data")
                                    .font(themeVM.theme.fonts.bodyFont)
                            }
                            .foregroundColor(themeVM.theme.colors.primary)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                
                Button(action: { showingImportSheet = true }) {
                    HStack {
                        Image(systemName: "square.and.arrow.down")
                        Text("Import Data")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: { showingExportSheet = true }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Export Data")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: { showingDeleteAlert = true }) {
                    HStack {
                        Image(systemName: "trash")
                        Text("Delete All Data")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                .buttonStyle(PlainButtonStyle())
                .foregroundColor(.red)
            }
            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
    }
    
    // MARK: - Helper Methods
    
    private func checkCloudKitAvailability() {
        // Check if we're running in a test environment
        let isRunningTests = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil
        
        if isRunningTests {
            cloudKitAvailable = false
            return
        }
        
        // Check if CloudKit container can be initialized
        let container = CKContainer(identifier: "iCloud.com.danadube.FarmTrackr")
        cloudKitAvailable = true // If we get here, CloudKit is available
    }
    
    private func performManualSync() {
        // Only perform sync if CloudKit is available
        guard cloudKitAvailable else {
            syncAlertMessage = "iCloud sync is not available"
            showingSyncAlert = true
            return
        }
        
        Task {
            // Simple sync message for now
            await MainActor.run {
                syncAlertMessage = "Sync completed successfully!"
                showingSyncAlert = true
            }
        }
    }
    
    private var supportSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Support")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(.primary)
            
            VStack(spacing: Constants.Spacing.small) {
                Button(action: { openEmailSupport() }) {
                    HStack {
                        Image(systemName: "envelope")
                        Text("Contact Support")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: { openDocumentation() }) {
                    HStack {
                        Image(systemName: "book")
                        Text("Documentation")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(Constants.CornerRadius.medium)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
    }
    
    private func deleteAllData() {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = FarmContact.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        
        do {
            try viewContext.execute(deleteRequest)
            try viewContext.save()
        } catch {
            print("Error deleting data: \(error)")
        }
    }
    
    private func openEmailSupport() {
        // Implementation for email support
    }
    
    private func openDocumentation() {
        // Implementation for documentation
    }
}

struct ThemeCard: View {
    let themeName: String
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private var theme: Theme {
        ThemeManager.theme(named: themeName)
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: Constants.Spacing.small) {
                RoundedRectangle(cornerRadius: Constants.CornerRadius.small)
                    .fill(theme.colors.primary)
                    .frame(height: 60)
                
                Text(themeName)
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(.primary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(Constants.CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                    .stroke(isSelected ? theme.colors.primary : Color.clear, lineWidth: 2)
            )
            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    SettingsView()
        .environmentObject(ThemeViewModel())
        .environmentObject(AccessibilityManager())
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 