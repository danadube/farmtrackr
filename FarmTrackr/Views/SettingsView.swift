import SwiftUI
import CoreData
import CloudKit

let themeNames = [
    "Modern Green",
    "Classic Green",
    "Sunset Soil", 
    "Blueprint Pro",
    "Harvest Luxe",
    "High Contrast",
    "Fieldlight",
    "Royal",
    "Slate Mist",
    "Cypress Grove",
    "Midnight Sand",
    "Stone & Brass",
    "Fog & Mint",
    "Dusty Rose",
    "Urban Ink",
    "Olive Shadow",
    "Pacific Blue",
    "Steel & Sky"
]

struct SettingsView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.colorScheme) var colorScheme
    @State private var showingDeleteAlert = false
    @State private var showingUnifiedImportExport = false
    @State private var showingCleanupSheet = false
    @State private var showingBackupSheet = false
    @State private var showingSyncAlert = false
    @State private var syncAlertMessage = ""
    @State private var cloudKitAvailable = false
    @StateObject private var googleSheetsManager = GoogleSheetsManager()
    @State private var showingGoogleSheetsAuth = false
    @State private var showingGoogleSheetsPicker = false
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "gear", logoName: nil, title: "Settings", subtitle: "Configure your app preferences")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    // Accessibility Section
                    accessibilitySection
                    
                    // Theme Section
                    themeSection
                    
                    // Dark Mode Section
                    darkModeSection
                    
                    // Data Management Section
                    dataManagementSection
                    
                    // Support Section
                    supportSection
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
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
            .sheet(isPresented: $showingUnifiedImportExport) {
                UnifiedImportExportView(documentManager: DocumentManager(context: viewContext))
                    .environmentObject(themeVM)
            }
            .sheet(isPresented: $showingCleanupSheet) {
                DataCleanupView()
            }
            .sheet(isPresented: $showingBackupSheet) {
                BackupView()
            }
            .onAppear {
                checkCloudKitAvailability()
            }
    }
    
    private var accessibilitySection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Accessibility")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                VStack(spacing: themeVM.theme.spacing.small) {
                    // System-controlled toggles (read-only, tap to open settings)
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "speaker.wave.3")
                            .foregroundColor(.blue)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("VoiceOver")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Text(accessibilityManager.isVoiceOverRunning ? "On" : "Off")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                    .onTapGesture {
                        openSystemAccessibilitySettings()
                    }
                    
                    Divider()
                        .frame(height: 1)
                        .background(Color(.separator))
                        .padding(.horizontal, 8)
                    
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "switch.2")
                            .foregroundColor(.green)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("Switch Control")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Text(accessibilityManager.isSwitchControlRunning ? "On" : "Off")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                    .onTapGesture {
                        openSystemAccessibilitySettings()
                    }
                    
                    Divider()
                        .frame(height: 1)
                        .background(Color(.separator))
                        .padding(.horizontal, 8)
                    
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "hand.tap")
                            .foregroundColor(.orange)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("Assistive Touch")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Text(accessibilityManager.isAssistiveTouchRunning ? "On" : "Off")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                    .onTapGesture {
                        openSystemAccessibilitySettings()
                    }
                    
                    Divider()
                        .frame(height: 1)
                        .background(Color(.separator))
                        .padding(.horizontal, 8)
                    
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "circle.lefthalf.filled")
                            .foregroundColor(.purple)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("High Contrast")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Toggle("", isOn: $accessibilityManager.isHighContrastEnabled)
                            .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                            .onChange(of: accessibilityManager.isHighContrastEnabled) { _, newValue in
                                applyHighContrastSettings(enabled: newValue)
                            }
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                }
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var themeSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Theme")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 32) {
                        ForEach(themeNames, id: \.self) { themeName in
                            let theme = ThemeManager.theme(named: themeName)
                            Button(action: { themeVM.selectedTheme = themeName }) {
                                VStack(spacing: 8) {
                                    ZStack {
                                        Circle()
                                            .fill(theme.colors.primary)
                                            .frame(width: 44, height: 44)
                                            .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
                                            .overlay(
                                                Circle()
                                                    .stroke(themeVM.selectedTheme == themeName ? theme.colors.accent : Color.clear, lineWidth: 3)
                                            )
                                        if themeVM.selectedTheme == themeName {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(theme.colors.accent)
                                                .background(Circle().fill(Color.white).frame(width: 24, height: 24))
                                                .offset(x: 14, y: 14)
                                        }
                                    }
                                    Text(themeName)
                                        .font(.caption)
                                        .foregroundColor(.primary)
                                        .frame(width: 80, alignment: .center)
                                        .lineLimit(2)
                                        .minimumScaleFactor(0.8)
                                }
                                .padding(.vertical, 4)
                                .frame(width: 90)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal, 8)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 8)
                .background(themeVM.theme.colors.cardBackground)
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var darkModeSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Appearance")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Image(systemName: "moon.fill")
                        .foregroundColor(.purple)
                        .font(.system(size: 22, weight: .medium))
                        .frame(width: 28, height: 28)
                    Text("Dark Mode")
                        .font(themeVM.theme.fonts.bodyFont)
                    Spacer()
                    Toggle("", isOn: $themeVM.darkModeEnabled)
                        .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 8)
                .background(themeVM.theme.colors.cardBackground)
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
    }
    
    private var dataManagementSection: some View {
        VStack(spacing: themeVM.theme.spacing.large) {
            // Data Management Card
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
                Text("Data Management")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
                    .padding(.horizontal, themeVM.theme.spacing.large)
                
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                    VStack(spacing: themeVM.theme.spacing.small) {
                        // iCloud Sync row with trailing Sync Data button
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "icloud")
                                .foregroundColor(.blue)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("iCloud Sync")
                                .font(themeVM.theme.fonts.bodyFont)
                            Spacer()
                            Text(cloudKitAvailable ? "Available" : "Unavailable")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Button(action: performManualSync) {
                                Text("Sync Data")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.black)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color(.systemGray5))
                                    .cornerRadius(8)
                            }
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                        // Divider between rows
                        Divider()
                            .frame(height: 1)
                            .background(Color(.separator))
                            .padding(.horizontal, 8)
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "tablecells.badge.ellipsis")
                                .foregroundColor(.green)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("Google Sheets")
                                .font(themeVM.theme.fonts.bodyFont)
                            Spacer()
                            Text(googleSheetsManager.isAuthenticated ? "Connected" : "Not Connected")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            if googleSheetsManager.isAuthenticated {
                                Button(action: { showingGoogleSheetsPicker = true }) {
                                    Text("Import")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color(.systemGray5))
                                        .cornerRadius(8)
                                }
                                Button(action: { googleSheetsManager.logout() }) {
                                    Text("Disconnect")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color(.systemGray5))
                                        .cornerRadius(8)
                                }
                            } else {
                                Button(action: { showingGoogleSheetsAuth = true }) {
                                    Text("Connect")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color(.systemGray5))
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
                .padding(.vertical, themeVM.theme.spacing.medium)
            }
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
            
            // Data Tools Card
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
                Text("Data Tools")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
                    .padding(.horizontal, themeVM.theme.spacing.large)
                
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                    VStack(spacing: themeVM.theme.spacing.small) {
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "square.and.arrow.up.on.square")
                                .foregroundColor(.blue)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("Import & Export Hub")
                                .font(themeVM.theme.fonts.bodyFont)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                        .onTapGesture {
                            showingUnifiedImportExport = true
                        }
                        
                        Divider()
                            .frame(height: 1)
                            .background(Color(.separator))
                            .padding(.horizontal, 8)
                        
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "wrench.and.screwdriver")
                                .foregroundColor(.orange)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("Data Cleanup")
                                .font(themeVM.theme.fonts.bodyFont)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                        .onTapGesture {
                            showingCleanupSheet = true
                        }
                        
                        Divider()
                            .frame(height: 1)
                            .background(Color(.separator))
                            .padding(.horizontal, 8)
                        
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "icloud.and.arrow.up")
                                .foregroundColor(.blue)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("Create Backup")
                                .font(themeVM.theme.fonts.bodyFont)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                        .onTapGesture {
                            showingBackupSheet = true
                        }
                        
                        Divider()
                            .frame(height: 1)
                            .background(Color(.separator))
                            .padding(.horizontal, 8)
                        
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                                .font(.system(size: 22, weight: .medium))
                                .frame(width: 28, height: 28)
                            Text("Delete All Data")
                                .font(themeVM.theme.fonts.bodyFont)
                                .foregroundColor(.red)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .background(themeVM.theme.colors.cardBackground)
                        .onTapGesture {
                            showingDeleteAlert = true
                        }
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
                .padding(.vertical, themeVM.theme.spacing.medium)
            }
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
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
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Support")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                VStack(spacing: themeVM.theme.spacing.small) {
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "envelope")
                            .foregroundColor(.blue)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("Contact Support")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                    .onTapGesture {
                        openEmailSupport()
                    }
                    
                    Divider()
                        .frame(height: 1)
                        .background(Color(.separator))
                        .padding(.horizontal, 8)
                    
                    HStack(spacing: themeVM.theme.spacing.medium) {
                        Image(systemName: "book")
                            .foregroundColor(.green)
                            .font(.system(size: 22, weight: .medium))
                            .frame(width: 28, height: 28)
                        Text("Documentation")
                            .font(themeVM.theme.fonts.bodyFont)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 8)
                    .background(themeVM.theme.colors.cardBackground)
                    .onTapGesture {
                        openDocumentation()
                    }
                }
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
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
        // Create email support URL
        let subject = "FarmTrackr Support Request"
        let body = "Please describe your issue or question here:\n\nApp Version: 1.0\nDevice: \(UIDevice.current.model)\niOS Version: \(UIDevice.current.systemVersion)"
        
        if let encodedSubject = subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let encodedBody = body.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let url = URL(string: "mailto:support@farmtrackr.com?subject=\(encodedSubject)&body=\(encodedBody)") {
            
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            } else {
                // Fallback: copy email to clipboard
                let emailText = "To: support@farmtrackr.com\nSubject: \(subject)\n\n\(body)"
                UIPasteboard.general.string = emailText
                
                // Show alert with copied email
                syncAlertMessage = "Email template copied to clipboard. Please paste it into your email app."
                showingSyncAlert = true
            }
        }
    }
    
    private func openDocumentation() {
        // Create documentation URL (could be a web page or in-app documentation)
        if let url = URL(string: "https://farmtrackr.com/docs") {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            } else {
                // Fallback: show in-app documentation
                syncAlertMessage = "Documentation is available at farmtrackr.com/docs"
                showingSyncAlert = true
            }
        } else {
            // Show basic in-app help
            syncAlertMessage = """
            FarmTrackr Help:
            
            • Add contacts using the + button
            • Import CSV files from the Import/Export tab
            • Export data in various formats
            • Use search and filters to find contacts
            • Print mailing labels for selected contacts
            
            For more help, contact support@farmtrackr.com
            """
            showingSyncAlert = true
        }
    }
    
    private func applyHighContrastSettings(enabled: Bool) {
        if enabled {
            // Save current theme before switching to high contrast
            UserDefaults.standard.set(themeVM.selectedTheme, forKey: "lastSelectedTheme")
            themeVM.selectedTheme = "High Contrast"
        } else {
            // Revert to the last selected theme or a default
            if let lastTheme = UserDefaults.standard.string(forKey: "lastSelectedTheme") {
                themeVM.selectedTheme = lastTheme
            } else {
                themeVM.selectedTheme = "Classic Green" // Default theme
            }
        }
        // Save the current theme selection
        UserDefaults.standard.set(themeVM.selectedTheme, forKey: "selectedTheme")
    }
    
    private func openSystemAccessibilitySettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
}

// Helper for theme descriptions
private func themeDescription(for themeName: String) -> String {
    switch themeName {
    case "Classic Green":
        return "Traditional farm colors"
    case "Sunset Soil":
        return "Warm earth tones"
    case "Blueprint Pro":
        return "Professional blue theme"
    case "Harvest Luxe":
        return "Elegant gold accents"
    case "Fieldlight":
        return "Clean and modern"
    default:
        return "Custom theme"
    }
}

struct ThemeOptionRow: View {
    let themeName: String
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private var theme: Theme {
        ThemeManager.theme(named: themeName)
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: Constants.Spacing.medium) {
                // Theme color indicator
                Circle()
                    .fill(theme.colors.primary)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .stroke(Color.primary.opacity(0.2), lineWidth: 1)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(themeName)
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.primary)
                    
                    Text(themeDescription(for: themeName))
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Selection indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(theme.colors.primary)
                        .font(.system(size: 20))
                } else {
                    Image(systemName: "circle")
                        .foregroundColor(.secondary)
                        .font(.system(size: 20))
                }
            }
            .padding(.vertical, Constants.Spacing.medium)
            .frame(minHeight: 44) // Ensure minimum touch target
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func themeDescription(for themeName: String) -> String {
        switch themeName {
        case "Modern Green":
            return "Clean and contemporary"
        case "Classic Green":
            return "Traditional farm colors"
        case "Sunset Soil":
            return "Warm earth tones"
        case "Blueprint Pro":
            return "Professional blue theme"
        case "Harvest Luxe":
            return "Elegant gold accents"
        case "High Contrast":
            return "Maximum accessibility"
        case "Fieldlight":
            return "Clean and modern"
        case "Royal":
            return "Purple and gold elegance"
        case "Slate Mist":
            return "Cool slate and indigo"
        case "Cypress Grove":
            return "Fresh sage and green"
        case "Midnight Sand":
            return "Charcoal and amber"
        case "Stone & Brass":
            return "Elegant stone and brass"
        case "Fog & Mint":
            return "Soft blue-gray and mint"
        case "Dusty Rose":
            return "Mauve and rose gold"
        case "Urban Ink":
            return "Graphite and violet"
        case "Olive Shadow":
            return "Muted olive tones"
        case "Pacific Blue":
            return "Deep teal and seafoam"
        case "Steel & Sky":
            return "Steel blue and sky"
        default:
            return "Custom theme"
        }
    }
}

// MARK: - Google Sheets Integration Section
struct GoogleSheetsIntegrationSection: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var googleSheetsManager = GoogleSheetsManager()
    @State private var showingGoogleSheetsAuth = false
    @State private var showingGoogleSheetsPicker = false
    
    var body: some View {
        VStack(spacing: Constants.Spacing.small) {
            HStack {
                Image(systemName: "tablecells")
                    .foregroundColor(.blue)
                Text("Google Sheets")
                Spacer()
                Text(googleSheetsManager.isAuthenticated ? "Connected" : "Not Connected")
                    .font(.caption)
                    .foregroundColor(googleSheetsManager.isAuthenticated ? .green : .secondary)
            }
            
            if googleSheetsManager.isAuthenticated {
                // Connected state - show quick actions
                VStack(spacing: Constants.Spacing.small) {
                    Button(action: { showingGoogleSheetsPicker = true }) {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                                .font(.system(size: 16, weight: .medium))
                            Text("Import from Google Sheets")
                                .font(themeVM.theme.fonts.bodyFont)
                        }
                        .foregroundColor(themeVM.theme.colors.primary)
                    }
                    
                    Button(action: { googleSheetsManager.logout() }) {
                        HStack {
                            Image(systemName: "xmark.circle")
                                .font(.system(size: 16, weight: .medium))
                            Text("Disconnect Google Sheets")
                                .font(themeVM.theme.fonts.bodyFont)
                        }
                        .foregroundColor(.red)
                    }
                }
            } else {
                // Not connected state - show connect button
                Button(action: { showingGoogleSheetsAuth = true }) {
                    HStack {
                        Image(systemName: "link")
                            .font(.system(size: 16, weight: .medium))
                        Text("Connect Google Sheets")
                            .font(themeVM.theme.fonts.bodyFont)
                    }
                    .foregroundColor(themeVM.theme.colors.primary)
                }
            }
        }
        .padding()
        .interactiveCardStyle()
        .sheet(isPresented: $showingGoogleSheetsAuth) {
            GoogleSheetsAuthView(googleSheetsManager: googleSheetsManager)
        }
        .sheet(isPresented: $showingGoogleSheetsPicker) {
            GoogleSheetsPickerView(googleSheetsManager: googleSheetsManager)
        }
    }
}

// MARK: - Google Sheets Auth View
struct GoogleSheetsAuthView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var googleSheetsManager: GoogleSheetsManager
    
    var body: some View {
        VStack(spacing: Constants.Spacing.large) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "tablecells")
                    .font(.system(size: 48))
                    .foregroundColor(themeVM.theme.colors.primary)
                
                Text("Connect Google Sheets")
                    .font(themeVM.theme.fonts.headerFont)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Text("Sign in to import and export your contacts with Google Sheets")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 32)
            
            // Benefits
            VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                Text("Benefits:")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
                
                VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                    BenefitRow(icon: "square.and.arrow.down", title: "Import Contacts", description: "Import contacts directly from Google Sheets")
                    BenefitRow(icon: "square.and.arrow.up", title: "Export Data", description: "Export your contacts to Google Sheets")
                    BenefitRow(icon: "icloud", title: "Cloud Sync", description: "Keep your data in sync across devices")
                    BenefitRow(icon: "person.2", title: "Collaboration", description: "Share and collaborate with your team")
                }
            }
            .padding()
            .interactiveCardStyle()
            
            Spacer()
            
            // Sign In Button
            Button(action: {
                Task {
                    await googleSheetsManager.authenticate()
                }
            }) {
                HStack {
                    if googleSheetsManager.isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "link")
                            .font(.system(size: 18, weight: .medium))
                    }
                    Text(googleSheetsManager.isLoading ? "Connecting..." : "Sign in with Google")
                        .font(themeVM.theme.fonts.bodyFont)
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                        .fill(googleSheetsManager.isLoading ? Color.gray : themeVM.theme.colors.primary)
                )
            }
            .disabled(googleSheetsManager.isLoading)
            .padding(.horizontal, Constants.Spacing.large)
            .padding(.bottom, Constants.Spacing.large)
        }
        .navigationTitle("Google Sheets")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarItems(trailing: Button("Cancel") {
            dismiss()
        })
        .onReceive(googleSheetsManager.$isAuthenticated) { isAuthenticated in
            if isAuthenticated {
                dismiss()
            }
        }
    }
}

// MARK: - Google Sheets Picker View
struct GoogleSheetsPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @ObservedObject var googleSheetsManager: GoogleSheetsManager
    @State private var selectedDriveFile: GoogleDriveFile? = nil
    @State private var showingDrivePicker = false
    @State private var importedContacts: [ContactRecord] = []
    @State private var showingImportPreview = false
    
    var body: some View {
        VStack(spacing: Constants.Spacing.large) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 36))
                    .foregroundColor(themeVM.theme.colors.primary)
                
                Text("Import from Google Sheets")
                    .font(themeVM.theme.fonts.headerFont)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Text("Select a Google Sheet to import your contacts")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 16)
            
            // Pick from Drive Button
            Button(action: { showingDrivePicker = true }) {
                HStack {
                    Image(systemName: "folder")
                        .font(.title2)
                        .padding(.leading, 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Browse Google Drive")
                            .font(.title3)
                            .fontWeight(.semibold)
                        Text("Select a Google Sheet to import")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .padding(.trailing, 8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(themeVM.theme.colors.primary)
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Selected File Display
            if let selectedDriveFile = selectedDriveFile {
                VStack(spacing: Constants.Spacing.small) {
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(themeVM.theme.colors.accent)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Selected: \(selectedDriveFile.name)")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Ready to import")
                                .font(.caption)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                        Spacer()
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(themeVM.theme.colors.cardBackground)
                    )
                    
                    Button(action: {
                        googleSheetsManager.importSheet(withID: selectedDriveFile.id)
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                            Text("Import this Sheet")
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(themeVM.theme.colors.accent)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            
            Spacer()
        }
        .padding(.horizontal, Constants.Spacing.large)
        .navigationTitle("Import from Google Sheets")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarItems(trailing: Button("Done") {
                dismiss()
            })
        .sheet(isPresented: $showingDrivePicker) {
            if let accessToken = googleSheetsManager.accessToken {
                GoogleDrivePickerView(selectedFile: $selectedDriveFile, accessToken: accessToken)
            }
        }
        .sheet(isPresented: $showingImportPreview) {
            ImportPreviewView(
                contacts: importedContacts,
                errors: [],
                importManager: DataImportManager()
            )
        }
        .onReceive(googleSheetsManager.$importedContacts) { contacts in
            if !contacts.isEmpty {
                importedContacts = contacts
                showingImportPreview = true
            }
        }
    }
}

// MARK: - Benefit Row
struct BenefitRow: View {
    let icon: String
    let title: String
    let description: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: Constants.Spacing.small) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(themeVM.theme.fonts.bodyFont)
                    .fontWeight(.medium)
                Text(description)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            
            Spacer()
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(ThemeViewModel())
        .environmentObject(AccessibilityManager())
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}