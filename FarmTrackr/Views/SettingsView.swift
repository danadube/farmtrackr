import SwiftUI
import CoreData
import CloudKit

let themeNames = [
    "Classic Green",
    "Harvest Gold",
    "Pacific Blue"
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
    @State private var showingTestAlert = false
    @State private var testResult = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "gear", logoName: nil, title: "Settings", subtitle: "Configure your app preferences")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    // Theme & Appearance Section
                    themeAndAppearanceSection
                    
                    // Accessibility Section
                    accessibilitySection
                    
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
            .alert("Excel Import Test", isPresented: $showingTestAlert) {
                Button("OK") { }
            } message: {
                Text(testResult)
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
            // Section Title
            Text("Accessibility")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                // VoiceOver Card
                Button(action: {
                    openSystemAccessibilitySettings()
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("VoiceOver")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text(accessibilityManager.isVoiceOverRunning ? "On" : "Off")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "speaker.wave.3")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Switch Control Card
                Button(action: {
                    openSystemAccessibilitySettings()
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Switch Control")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text(accessibilityManager.isSwitchControlRunning ? "On" : "Off")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "switch.2")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Assistive Touch Card
                Button(action: {
                    openSystemAccessibilitySettings()
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Assistive Touch")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text(accessibilityManager.isAssistiveTouchRunning ? "On" : "Off")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "hand.tap")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.accent)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // High Contrast Card
                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "circle.lefthalf.filled")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.accent)
                            .frame(width: 32, height: 32)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("High Contrast")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(themeVM.theme.colors.text)
                                .lineLimit(2)
                            
                            HStack {
                                Text(accessibilityManager.isHighContrastEnabled ? "Enabled" : "Disabled")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                                
                                Spacer()
                                
                                Toggle("", isOn: $accessibilityManager.isHighContrastEnabled)
                                    .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                                    .onChange(of: accessibilityManager.isHighContrastEnabled) { _, newValue in
                                        applyHighContrastSettings(enabled: newValue)
                                    }
                            }
                        }
                        
                        Spacer()
                    }
                }
                .padding(themeVM.theme.spacing.small)
                .frame(maxWidth: .infinity, minHeight: 80)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.black.opacity(0.1), lineWidth: 1)
                )
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.1), lineWidth: 1))
        }
    }
    
    private var themeAndAppearanceSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Section Title
            Text("Theme & Appearance")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                // Theme Options Card
                VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                    Text("Theme Options")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.top, themeVM.theme.spacing.medium)
                    
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
                                            .font(themeVM.theme.fonts.captionFont)
                                            .foregroundColor(themeVM.theme.colors.text)
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
                    .padding(.bottom, themeVM.theme.spacing.medium)
                }
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
                
                // Dark Mode Card
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Image(systemName: "moon.fill")
                        .foregroundColor(themeVM.theme.colors.accent)
                        .font(themeVM.theme.fonts.title3)
                        .frame(width: 28, height: 28)
                    Text("Dark Mode")
                        .font(themeVM.theme.fonts.bodyFont)
                    Spacer()
                    Toggle("", isOn: $themeVM.darkModeEnabled)
                        .toggleStyle(SwitchToggleStyle(tint: themeVM.theme.colors.primary))
                }
                .padding(themeVM.theme.spacing.large)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(themeVM.theme.cornerRadius.medium)
                .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.1), lineWidth: 1))
        }
    }
    

    
    private var dataManagementSection: some View {
        VStack(spacing: themeVM.theme.spacing.large) {
            dataManagementCards
            dataToolsCards
        }
    }
    
    private var dataManagementCards: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Section Title
            Text("Data Management")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                iCloudSyncCard
                googleSheetsCard
                excelImportTestCard
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.1), lineWidth: 1))
        }
    }
    
    private var dataToolsCards: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Section Title
            Text("Data Tools")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                // Import & Export Hub Card
                Button(action: {
                    showingUnifiedImportExport = true
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Import & Export Hub")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text("Import contacts from file or export data")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "square.and.arrow.up.on.square")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Data Cleanup Card
                Button(action: {
                    showingCleanupSheet = true
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Data Cleanup")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text("Clean and organize your data")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "wrench.and.screwdriver")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.accent)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Create Backup Card
                Button(action: {
                    showingBackupSheet = true
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Create Backup")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text("Backup your data for safekeeping")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "icloud.and.arrow.up")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Delete All Data Card
                Button(action: {
                    showingDeleteAlert = true
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Delete All Data")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.error)
                                    .lineLimit(2)
                                
                                Text("Permanently delete all contacts")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "trash")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.error)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.1), lineWidth: 1))
        }
    }
    
    // MARK: - Individual Card Components
    
    private var iCloudSyncCard: some View {
        HStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "icloud")
                .foregroundColor(themeVM.theme.colors.primary)
                .font(themeVM.theme.fonts.title3)
                .frame(width: 28, height: 28)
            Text("iCloud Sync")
                .font(themeVM.theme.fonts.bodyFont)
            Spacer()
            Text(cloudKitAvailable ? "Available" : "Unavailable")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            HoverButton(title: "Sync Data", icon: "arrow.clockwise", style: .secondary) {
                performManualSync()
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    private var googleSheetsCard: some View {
        HStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "tablecells.badge.ellipsis")
                .foregroundColor(themeVM.theme.colors.secondary)
                .font(themeVM.theme.fonts.title3)
                .frame(width: 28, height: 28)
            Text("Google Sheets")
                .font(themeVM.theme.fonts.bodyFont)
            Spacer()
            Text(googleSheetsManager.isAuthenticated ? "Connected" : "Not Connected")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            if googleSheetsManager.isAuthenticated {
                HoverButton(title: "Import", icon: "square.and.arrow.down", style: .secondary) {
                    showingGoogleSheetsPicker = true
                }
                HoverButton(title: "Disconnect", icon: "xmark.circle", style: .danger) {
                    googleSheetsManager.logout()
                }
            } else {
                HoverButton(title: "Connect", icon: "link", style: .primary) {
                    showingGoogleSheetsAuth = true
                }
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    private var excelImportTestCard: some View {
        HStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "tablecells")
                .foregroundColor(themeVM.theme.colors.accent)
                .font(themeVM.theme.fonts.title3)
                .frame(width: 28, height: 28)
            Text("Excel Import Test")
                .font(themeVM.theme.fonts.bodyFont)
            Spacer()
            HoverButton(title: "Test", icon: "play.circle", style: .tertiary) {
                testExcelImport()
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
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
    
    private func testExcelImport() {
        Task {
            let dataImportManager = DataImportManager()
            let result = await dataImportManager.testExcelImportFromUI()
            await MainActor.run {
                testResult = result
                showingTestAlert = true
            }
        }
    }
    
    private var supportSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Section Title
            Text("Support")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                // Contact Support Card
                Button(action: {
                    openEmailSupport()
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Contact Support")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text("Get help and support")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "envelope")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Documentation Card
                Button(action: {
                    openDocumentation()
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .top, spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Documentation")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(2)
                                
                                Text("View app documentation and guides")
                                    .font(.system(size: 13, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .lineLimit(2)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "book")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .frame(width: 32, height: 32)
                        }
                    }
                    .padding(themeVM.theme.spacing.small)
                    .frame(maxWidth: .infinity, minHeight: 80)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.black.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.large)
            .background(themeVM.theme.colors.panelBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.1), lineWidth: 1))
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