//
//  ContentView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

class ThemeViewModel: ObservableObject {
    @Published var selectedTheme: String {
        didSet { UserDefaults.standard.set(selectedTheme, forKey: "selectedTheme") }
    }
    var theme: Theme { ThemeManager.theme(named: selectedTheme) }
    @AppStorage("darkModeEnabled") var darkModeEnabled: Bool = false
    init() {
        self.selectedTheme = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Classic Green"
    }
}

struct ContentView: View {
    @State private var selectedTab: NavigationTab? = .home
    @State private var searchText = ""
    @State private var sortOrder: SortOrder = .firstName
    @State private var showingAddContact = false
    @State private var showingContactDetail = false
    @State private var selectedContact: FarmContact?
    @State private var showingAddDocument = false
    @State private var showingUnifiedImportExport = false
    @State private var showingPrintLabelsSheet = false
    @State private var hasSeenWelcome = true
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject private var documentManager = DocumentManager(context: PersistenceController.shared.container.viewContext)
    
    private var contacts: [FarmContact] {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.dateCreated, ascending: false)]
        fetchRequest.fetchLimit = 10
        
        do {
            return try viewContext.fetch(fetchRequest)
        } catch {
            print("Error fetching contacts: \(error)")
            return []
        }
    }
    
    var body: some View {
        if !hasSeenWelcome {
            WelcomeScreen(onGetStarted: {
                withAnimation(.easeInOut(duration: 0.5)) {
                    hasSeenWelcome = true
                }
            })
        } else {
            ZStack {
                themeVM.theme.colors.background.ignoresSafeArea()
                
                NavigationSplitView(columnVisibility: .constant(.all)) {
                    SidebarView(selectedTab: $selectedTab)
                        .padding(.horizontal, themeVM.theme.spacing.large) // Added horizontal padding on both sides
                        .padding(.top, themeVM.theme.spacing.small)
                        .padding(.bottom, themeVM.theme.spacing.small)
                        .frame(minWidth: 280, idealWidth: 320, maxWidth: 360)
                } detail: {
                    switch selectedTab {
                    case .home:
                        HomeView(
                            contacts: contacts,
                            selectedContact: $selectedContact,
                            showingAddContact: $showingAddContact,
                            showingAddDocument: $showingAddDocument,
                            showingUnifiedImportExport: $showingUnifiedImportExport,
                            showingPrintLabelsSheet: $showingPrintLabelsSheet,
                            selectedTab: $selectedTab
                        )
                        .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    case .contacts:
                        if let contact = selectedContact {
                            ContactDetailView(contact: contact, selectedContact: $selectedContact)
                                .padding(.trailing, themeVM.theme.spacing.extraLarge)
                        } else {
                            ContactsMasterView(
                                selectedContact: $selectedContact,
                                searchText: $searchText,
                                sortOrder: $sortOrder,
                                showingAddContact: $showingAddContact,
                                showingContactDetail: $showingContactDetail
                            )
                            .padding(.trailing, themeVM.theme.spacing.extraLarge)
                        }
                    case .documents:
                        DocumentsView(context: viewContext)
                            .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    case .dataQuality:
                        DataQualityView()
                            .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    case .importExport:
                        ImportExportView(
                            showingUnifiedImportExport: $showingUnifiedImportExport,
                            showingPrintLabelsSheet: $showingPrintLabelsSheet,
                            selectedTab: $selectedTab
                        )
                        .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    case .settings:
                        SettingsView()
                            .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    case .none:
                        HomeView(
                            contacts: contacts,
                            selectedContact: $selectedContact,
                            showingAddContact: $showingAddContact,
                            showingAddDocument: $showingAddDocument,
                            showingUnifiedImportExport: $showingUnifiedImportExport,
                            showingPrintLabelsSheet: $showingPrintLabelsSheet,
                            selectedTab: $selectedTab
                        )
                        .padding(.trailing, themeVM.theme.spacing.extraLarge)
                    }
                }
                .navigationSplitViewStyle(.balanced)
            }
            .sheet(isPresented: $showingAddContact) {
                ContactEditView(contact: nil)
            }
            .sheet(isPresented: $showingAddDocument) {
                DocumentEditorView(documentManager: documentManager)
                    .environmentObject(themeVM)
            }
            .sheet(isPresented: $showingUnifiedImportExport) {
                UnifiedImportExportView(documentManager: documentManager)
                    .environmentObject(themeVM)
            }
            .sheet(isPresented: $showingPrintLabelsSheet) {
                PrintLabelsView(templateManager: LabelTemplateManager())
            }
        }
    }
}

// MARK: - Welcome Screen
struct WelcomeScreen: View {
    let onGetStarted: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            // Main Content - Moved further toward top
            VStack(spacing: themeVM.theme.spacing.extraLarge) {
                // App Icon
                Image("farmtrackr_logo_TB 1024")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 180, height: 180)
                
                // Title
                Text("Welcome to FarmTrackr")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(themeVM.theme.colors.text)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, themeVM.theme.spacing.large)
                
                // Subtitle
                Text("Your farm CRM for managing contacts, documents, and more.")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, themeVM.theme.spacing.large)
                
                // Features
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Text("Key Features")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(themeVM.theme.colors.text)
                        .padding(.bottom, themeVM.theme.spacing.small)
                    
                    VStack(spacing: themeVM.theme.spacing.medium) {
                        FeatureRow(icon: "person.2", title: "Manage Contacts", description: "Organize all your farm contacts in one place")
                        FeatureRow(icon: "doc.text", title: "Document Management", description: "Store and organize important documents")
                        FeatureRow(icon: "checkmark.shield", title: "Data Quality", description: "Ensure your data is clean and accurate")
                        FeatureRow(icon: "square.and.arrow.up", title: "Import & Export", description: "Easily import and export your data")
                    }
                }
                .padding(themeVM.theme.spacing.large)
                .background(
                    RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(.systemBackground),
                                    Color(.systemBackground).opacity(0.8)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.black.opacity(0.1),
                                            Color.black.opacity(0.05)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )
                )
                .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
                .shadow(color: Color.black.opacity(0.05), radius: 20, x: 0, y: 10)
                .frame(maxWidth: 500) // Limit width for better appearance
            }
            .padding(.top, themeVM.theme.spacing.extraLarge * 3) // Increased top padding for more separation
            
            Spacer()
            
            // Get Started Button
            Button(action: onGetStarted) {
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Text("Get Started")
                        .font(themeVM.theme.fonts.buttonFont)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18, weight: .semibold))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                        .fill(themeVM.theme.colors.primary)
                )
                .shadow(color: themeVM.theme.colors.primary.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.bottom, themeVM.theme.spacing.extraLarge)
        }
        .background(themeVM.theme.colors.background)
    }
}

// MARK: - Feature Row
struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(themeVM.theme.colors.text)
                
                Text(description)
                    .font(.system(size: 13))
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .lineLimit(2)
            }
            
            Spacer()
        }
        .padding(.horizontal, themeVM.theme.spacing.medium)
        .padding(.vertical, themeVM.theme.spacing.small)
    }
}

// MARK: - Welcome Detail View
struct WelcomeDetailView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(spacing: themeVM.theme.spacing.large) {
            Spacer()
            
            VStack(spacing: themeVM.theme.spacing.medium) {
                Image(systemName: "person.2.circle")
                    .font(.system(size: 80))
                    .foregroundColor(themeVM.theme.colors.primary)
                
                Text("Welcome to FarmTrackr")
                    .font(themeVM.theme.fonts.headerFont)
                    .fontWeight(.bold)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Text("Select a contact from the list to view details, or use the sidebar to navigate between different sections of the app.")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, themeVM.theme.spacing.large)
            }
            
            Spacer()
        }
        .background(themeVM.theme.colors.background)
    }
}

// MARK: - Navigation Tab
enum NavigationTab: String, CaseIterable {
    case home = "Home"
    case contacts = "Contacts"
    case documents = "Documents"
    case dataQuality = "Data Quality"
    case importExport = "Import & Export"
    case settings = "Settings"
    
    var icon: String {
        switch self {
        case .home: return "house"
        case .contacts: return "person.2"
        case .documents: return "doc.text"
        case .dataQuality: return "checkmark.shield"
        case .importExport: return "square.and.arrow.up.on.square"
        case .settings: return "gear"
        }
    }
}

// MARK: - Navigation Item View
struct NavigationItemView: View {
    let tab: NavigationTab
    let isSelected: Bool
    let onTap: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: themeVM.theme.spacing.medium) {
                Image(systemName: tab.icon)
                    .foregroundColor(isSelected ? themeVM.theme.colors.primary : themeVM.theme.colors.secondaryLabel)
                    .frame(width: 20)
                    .accessibilityHidden(true)
                Text(tab.rawValue)
                    .foregroundColor(isSelected ? themeVM.theme.colors.primary : .primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
            .cornerRadius(themeVM.theme.cornerRadius.medium)
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("\(tab.rawValue) tab")
        .accessibilityHint("Double tap to navigate to \(tab.rawValue)")
    }
}

// MARK: - Sidebar View
struct SidebarView: View {
    @Binding var selectedTab: NavigationTab?
    @Environment(\.colorScheme) var colorScheme
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var isCollapsed = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Logo and App Name Section
            VStack(spacing: themeVM.theme.spacing.large) {
                // Logo and App Name Section
                VStack(spacing: themeVM.theme.spacing.medium) {
                    Image("farmtrackr_logo_TB 1024")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 160, height: 160) // Larger logo for wider space
                        .shadow(color: themeVM.theme.colors.primary.opacity(0.4), radius: 12, x: 0, y: 6)
                        .shadow(color: .black.opacity(0.15), radius: 6, x: 0, y: 3)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            themeVM.theme.colors.primary.opacity(0.4),
                                            themeVM.theme.colors.secondary.opacity(0.3),
                                            Color.black.opacity(0.1)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 2.5
                                )
                        )
                    
                    if !isCollapsed {
                        VStack(alignment: .center, spacing: 6) {
                            Text("FarmTrackr")
                                .font(.system(size: 26, weight: .bold)) // Larger title for wider space
                                .foregroundColor(themeVM.theme.colors.text)
                                .shadow(color: themeVM.theme.colors.primary.opacity(0.3), radius: 3, x: 0, y: 2)
                                .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: 1)
                            Text("Farm CRM")
                                .font(.system(size: 16, weight: .medium)) // Larger subtitle
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                .shadow(color: themeVM.theme.colors.primary.opacity(0.2), radius: 2, x: 0, y: 1)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(themeVM.theme.spacing.large) // More padding for wider space
                .background(
                    RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    themeVM.theme.colors.cardBackground,
                                    themeVM.theme.colors.primary.opacity(0.1),
                                    themeVM.theme.colors.secondary.opacity(0.05)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            themeVM.theme.colors.primary.opacity(0.3),
                                            themeVM.theme.colors.secondary.opacity(0.2),
                                            themeVM.theme.colors.border
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                )
                .shadow(color: themeVM.theme.colors.primary.opacity(0.2), radius: 8, x: 0, y: 4)
                .shadow(color: .black.opacity(0.1), radius: 3, x: 0, y: 2)
            }
            .padding(.bottom, themeVM.theme.spacing.large) // More bottom padding
            
            Divider()
                .background(Color(.separator))
            
            // Navigation List with Sections
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.small) { // Reduced from 0 to small for closer sections
                    // MAIN Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "MAIN")
                    }
                    
                    // Navigation Items
                    VStack(spacing: themeVM.theme.spacing.small) { // Reduced spacing from medium to small
                        SidebarTab(
                            icon: "house",
                            title: "Home",
                            isSelected: selectedTab == .home,
                            action: { selectedTab = .home }
                        )
                        
                        SidebarTab(
                            icon: "person.2",
                            title: "Contacts",
                            isSelected: selectedTab == .contacts,
                            action: { selectedTab = .contacts }
                        )
                        
                        SidebarTab(
                            icon: "doc.text",
                            title: "Documents",
                            isSelected: selectedTab == .documents,
                            action: { selectedTab = .documents }
                        )
                    }
                    .padding(.horizontal, themeVM.theme.spacing.medium)
                    .padding(.vertical, themeVM.theme.spacing.small) // Reduced from medium to small
                    
                    // TOOLS Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "TOOLS")
                    }
                    
                    VStack(spacing: themeVM.theme.spacing.small) { // Added VStack with small spacing
                        SidebarTab(
                            icon: "checkmark.shield",
                            title: "Data Quality",
                            isSelected: selectedTab == .dataQuality,
                            action: { selectedTab = .dataQuality }
                        )
                        
                        SidebarTab(
                            icon: "square.and.arrow.up.on.square",
                            title: "Import & Export",
                            isSelected: selectedTab == .importExport,
                            action: { selectedTab = .importExport }
                        )
                    }
                    .padding(.horizontal, themeVM.theme.spacing.medium)
                    .padding(.vertical, themeVM.theme.spacing.small) // Reduced from medium to small
                    
                    // SETTINGS Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "SETTINGS")
                    }
                    
                    VStack(spacing: themeVM.theme.spacing.small) { // Added VStack with small spacing
                        SidebarTab(
                            icon: "gear",
                            title: "Settings",
                            isSelected: selectedTab == .settings,
                            action: { selectedTab = .settings }
                        )
                    }
                    .padding(.horizontal, themeVM.theme.spacing.medium)
                    .padding(.vertical, themeVM.theme.spacing.small) // Reduced from medium to small
                }
                .padding(.vertical, themeVM.theme.spacing.small)
            }
            
            Spacer()
        }
        .padding(.horizontal, themeVM.theme.spacing.medium)
        .padding(.vertical, themeVM.theme.spacing.medium)
        .background(
            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                .fill(themeVM.theme.colors.cardBackground)
                .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                        .stroke(Color.black.opacity(0.1), lineWidth: 1)
                )
        )
        .animation(.easeInOut(duration: 0.3), value: isCollapsed)
    }
}

// MARK: - Sidebar Section Header
struct SidebarSectionHeader: View {
    let title: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .textCase(.uppercase)
                .tracking(0.5)
            Spacer()
        }
        .padding(.horizontal, themeVM.theme.spacing.medium)
        .padding(.top, themeVM.theme.spacing.medium)
        .padding(.bottom, 4) // Reduced from small to 4 points for closer proximity
    }
}

// MARK: - Home View
struct HomeView: View {
    let contacts: [FarmContact]
    @Binding var selectedContact: FarmContact?
    @Binding var showingAddContact: Bool
    @Binding var showingAddDocument: Bool
    @Binding var showingUnifiedImportExport: Bool
    @Binding var showingPrintLabelsSheet: Bool
    @Binding var selectedTab: NavigationTab?
    @State private var showingImportTemplates = false
    @State private var showingExportReports = false
    @EnvironmentObject var themeVM: ThemeViewModel
    @Environment(\.managedObjectContext) private var viewContext
    
    private var totalContacts: Int {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        do {
            return try viewContext.count(for: fetchRequest)
        } catch {
            print("Error fetching total contacts: \(error)")
            return 0
        }
    }
    
    private var uniqueFarms: Int {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        do {
            let contacts = try viewContext.fetch(fetchRequest)
            let farms = contacts.compactMap { $0.farm }.filter { !$0.isEmpty }
            return Set(farms).count
        } catch {
            print("Error fetching unique farms: \(error)")
            return 0
        }
    }
    
    private var farmNames: [String] {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        do {
            let contacts = try viewContext.fetch(fetchRequest)
            let farms = contacts.compactMap { $0.farm }.filter { !$0.isEmpty }
            return Array(Set(farms)).sorted()
        } catch {
            print("Error fetching farm names: \(error)")
            return []
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "house", logoName: nil, title: "Home", subtitle: "Welcome to your farm dashboard")
            
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    quickActionsSection
                    statisticsSection
                    recentContactsSection
                }
                .padding(themeVM.theme.spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
        .sheet(isPresented: $showingImportTemplates) {
            CSVImportTemplatesView()
        }
        .sheet(isPresented: $showingExportReports) {
            ExportReportsView()
        }
    }
    
    private var quickActionsSection: some View {
        ActionPanelView(
            title: "Quick Actions",
            actions: [
                ActionCardData(icon: "person.badge.plus", title: "Add Contact", subtitle: "Create a new farm contact") {
                    showingAddContact = true
                },
                ActionCardData(icon: "doc.text", title: "Import & Export", subtitle: "Import contacts from file or export data") {
                    showingUnifiedImportExport = true
                },
                ActionCardData(icon: "printer", title: "Print Labels", subtitle: "Print address labels") {
                    showingPrintLabelsSheet = true
                },
                ActionCardData(icon: "doc.on.doc", title: "Documents", subtitle: "Manage documents") {
                    selectedTab = .documents
                }
            ]
        )
    }
    
    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Panel Title
            Text("Statistics")
                .font(themeVM.theme.fonts.titleFont)
                .fontWeight(.bold)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            // Card Container
            VStack(spacing: themeVM.theme.spacing.medium) {
                HStack(spacing: themeVM.theme.spacing.medium) {
                    // Total Contacts Card
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                        HStack(alignment: .center) {
                            Image(systemName: "person.2")
                                .foregroundColor(themeVM.theme.colors.primary)
                                .font(.system(size: 20, weight: .medium))
                            Text("Total Contacts")
                                .font(themeVM.theme.fonts.bodyFont)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            
                            Spacer()
                            
                            Text("\(totalContacts)")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(themeVM.theme.colors.text)
                        }
                        
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, minHeight: 120, alignment: .leading)
                    .padding(themeVM.theme.spacing.large)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
                    
                    // Unique Farms Card
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                        HStack(alignment: .center) {
                            Image(systemName: "building.2")
                                .foregroundColor(themeVM.theme.colors.secondary)
                                .font(.system(size: 20, weight: .medium))
                            Text("Unique Farms")
                                .font(themeVM.theme.fonts.bodyFont)
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            
                            Spacer()
                            
                            Text("\(uniqueFarms)")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(themeVM.theme.colors.text)
                        }
                        
                        VStack(alignment: .trailing, spacing: 2) {
                            if farmNames.isEmpty {
                                Text("No farms assigned")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                    .italic()
                            } else {
                                VStack(alignment: .trailing, spacing: 2) {
                                    ForEach(farmNames.prefix(3), id: \.self) { farmName in
                                        Text(farmName)
                                            .font(.system(size: 16, weight: .medium))
                                            .foregroundColor(themeVM.theme.colors.text)
                                            .lineLimit(1)
                                    }
                                    
                                    if farmNames.count > 3 {
                                        Text("+ \(farmNames.count - 3) more")
                                            .font(.system(size: 14, weight: .regular))
                                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                            .italic()
                                    }
                                }
                            }
                        }
                        
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, minHeight: 120, alignment: .leading)
                    .padding(themeVM.theme.spacing.large)
                    .background(themeVM.theme.colors.cardBackground)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
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
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Statistics panel")
    }
    
    private var recentContactsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Recent Contacts")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                if contacts.isEmpty {
                    VStack(spacing: themeVM.theme.spacing.small) {
                        Image(systemName: "person.2")
                            .font(.system(size: 40))
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        Text("No contacts yet")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        Text("Add your first farm contact to get started")
                            .font(themeVM.theme.fonts.captionFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(themeVM.theme.spacing.large)
                } else {
                    ForEach(contacts.prefix(5), id: \.self) { contact in
                        Button(action: {
                            selectedContact = contact
                            selectedTab = .contacts
                        }) {
                            HStack(spacing: themeVM.theme.spacing.medium) {
                                // Contact Avatar
                                Circle()
                                    .fill(themeVM.theme.colors.primary.opacity(0.2))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Text(contact.initials)
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(themeVM.theme.colors.primary)
                                    )
                                
                                // Contact Info
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(contact.fullName)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(themeVM.theme.colors.text)
                                        .lineLimit(1)
                                    
                                    if let farm = contact.farm, !farm.isEmpty {
                                        Text(farm)
                                            .font(.system(size: 14, weight: .regular))
                                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                            .lineLimit(1)
                                    }
                                }
                                
                                Spacer()
                                
                                // Date
                                Text(contact.dateModified?.formatted(date: .abbreviated, time: .omitted) ?? 
                                     contact.dateCreated?.formatted(date: .abbreviated, time: .omitted) ?? "")
                                    .font(.system(size: 14, weight: .regular))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                
                                // Chevron indicator
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            }
                            .padding(.vertical, themeVM.theme.spacing.small)
                            .padding(.horizontal, themeVM.theme.spacing.medium)
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
    
    private var emptyContactsView: some View {
        VStack(spacing: themeVM.theme.spacing.medium) {
            Image(systemName: "person.2")
                .font(.system(size: 40))
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Text("No contacts yet")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            
            Button("Add Your First Contact") {
                showingAddContact = true
            }
            .font(themeVM.theme.fonts.buttonFont)
            .foregroundColor(.white)
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
            .background(themeVM.theme.colors.accent)
            .cornerRadius(themeVM.theme.cornerRadius.medium)
        }
        .padding(themeVM.theme.spacing.large)
    }
    
    private var contactsListView: some View {
        LazyVStack(spacing: themeVM.theme.spacing.small) {
            ForEach(Array(contacts.prefix(5)), id: \.self) { contact in
                ContactRowView(
                    contact: contact,
                    isSelected: false,
                    isSelectionMode: false
                ) {
                    // Handle contact selection
                }
            }
        }
    }
}



// MARK: - Contacts Master View
struct ContactsMasterView: View {
    @Binding var selectedContact: FarmContact?
    @Binding var searchText: String
    @Binding var sortOrder: SortOrder
    @Binding var showingAddContact: Bool
    @Binding var showingContactDetail: Bool
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Environment(\.managedObjectContext) private var viewContext
    
    private var filteredContacts: [FarmContact] {
        let fetchRequest: NSFetchRequest<FarmContact> = FarmContact.fetchRequest()
        
        // Add search filter if searchText is not empty
        if !searchText.isEmpty {
            fetchRequest.predicate = NSPredicate(format: "firstName CONTAINS[cd] %@ OR lastName CONTAINS[cd] %@ OR farm CONTAINS[cd] %@ OR email1 CONTAINS[cd] %@ OR phoneNumber1 CONTAINS[cd] %@", searchText, searchText, searchText, searchText, searchText)
        }
        
        // Add sort descriptor
        switch sortOrder {
        case .firstName:
            fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)]
        case .lastName:
            fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.lastName, ascending: true)]
        case .farm:
            fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.farm, ascending: true)]
        case .dateCreated:
            fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.dateCreated, ascending: false)]
        case .dateModified:
            fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \FarmContact.dateModified, ascending: false)]
        }
        
        do {
            return try viewContext.fetch(fetchRequest)
        } catch {
            print("Error fetching contacts: \(error)")
            return []
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "person.2", logoName: nil, title: "Contacts", subtitle: "Manage your farm contacts")
            
            // Sticky Search & Sort Section
            searchAndSortSection
                .padding(.horizontal, Constants.Spacing.large)
                .padding(.top, Constants.Spacing.large)
                .background(themeVM.theme.colors.background)
            
            // Scrollable Contacts List
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    contactsListSection
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
    }
    
    private var searchAndSortSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            Text("Search & Sort")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            VStack(spacing: themeVM.theme.spacing.medium) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    TextField("Search contacts...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                    
                    if !searchText.isEmpty {
                        Button(action: { searchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                    }
                }
                .padding(themeVM.theme.spacing.medium)
                .background(themeVM.theme.colors.cardBackground)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.black.opacity(0.1), lineWidth: 1)
                )
                
                // Sort options
                HStack(spacing: themeVM.theme.spacing.medium) {
                    Button(action: { sortOrder = .firstName }) {
                        HStack {
                            Image(systemName: "textformat.abc")
                            Text("First Name")
                        }
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(sortOrder == .firstName ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .background(sortOrder == .firstName ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                        .cornerRadius(themeVM.theme.cornerRadius.small)
                    }
                    
                    Button(action: { sortOrder = .lastName }) {
                        HStack {
                            Image(systemName: "textformat.abc")
                            Text("Last Name")
                        }
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(sortOrder == .lastName ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .background(sortOrder == .lastName ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                        .cornerRadius(themeVM.theme.cornerRadius.small)
                    }
                    
                    Button(action: { sortOrder = .farm }) {
                        HStack {
                            Image(systemName: "building.2")
                            Text("Farm")
                        }
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(sortOrder == .farm ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .background(sortOrder == .farm ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                        .cornerRadius(themeVM.theme.cornerRadius.small)
                    }
                    
                    Button(action: { sortOrder = .dateCreated }) {
                        HStack {
                            Image(systemName: "calendar")
                            Text("Date Created")
                        }
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(sortOrder == .dateCreated ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .background(sortOrder == .dateCreated ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                        .cornerRadius(themeVM.theme.cornerRadius.small)
                    }
                    
                    Button(action: { sortOrder = .dateModified }) {
                        HStack {
                            Image(systemName: "clock")
                            Text("Date Modified")
                        }
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(sortOrder == .dateModified ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .background(sortOrder == .dateModified ? themeVM.theme.colors.accent.opacity(0.1) : Color.clear)
                        .cornerRadius(themeVM.theme.cornerRadius.small)
                    }
                    
                    Spacer()
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
    
    private var contactsListSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            if filteredContacts.isEmpty {
                VStack(spacing: themeVM.theme.spacing.small) {
                    Image(systemName: "person.2")
                        .font(.system(size: 40))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    Text("No contacts found")
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    Text("Try adjusting your search or add a new contact")
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(themeVM.theme.spacing.large)
            } else {
                ForEach(filteredContacts, id: \.self) { contact in
                    Button(action: { selectedContact = contact }) {
                        HStack(spacing: themeVM.theme.spacing.medium) {
                            // Contact Avatar
                            Circle()
                                .fill(themeVM.theme.colors.primary.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Text(contact.initials)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(themeVM.theme.colors.primary)
                                )
                            
                            // Contact Info
                            VStack(alignment: .leading, spacing: 4) {
                                Text(contact.fullName)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(themeVM.theme.colors.text)
                                    .lineLimit(1)
                                
                                if let farm = contact.farm, !farm.isEmpty {
                                    Text(farm)
                                        .font(.system(size: 14, weight: .regular))
                                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                        .lineLimit(1)
                                }
                            }
                            
                            Spacer()
                            
                            // Chevron indicator
                            Image(systemName: "chevron.right")
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                .font(.system(size: 16, weight: .medium))
                        }
                        .padding(.vertical, themeVM.theme.spacing.small)
                        .padding(.horizontal, themeVM.theme.spacing.medium)
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
            }
        }
    }
}



// MARK: - Import Export View
struct ImportExportView: View {
    @Binding var showingUnifiedImportExport: Bool
    @Binding var showingPrintLabelsSheet: Bool
    @Binding var selectedTab: NavigationTab?
    @State private var showingImportTemplates = false
    @State private var showingExportReports = false
    @State private var showingGoogleSheets = false
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "square.and.arrow.up.on.square", logoName: nil, title: "Import & Export", subtitle: "Import contacts from files or export your data")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    ActionPanelView(
                        title: "Import & Export Tools",
                        actions: [
                            ActionCardData(icon: "square.and.arrow.down", title: "Import & Export", subtitle: "Import from CSV/Excel or export to CSV") {
                                showingUnifiedImportExport = true
                            },
                            ActionCardData(icon: "tablecells", title: "Google Sheets", subtitle: "Import/export from Google Sheets") {
                                showingGoogleSheets = true
                            },
                            ActionCardData(icon: "doc.text", title: "Import Documents", subtitle: "Import PDFs and files") {
                                selectedTab = .documents
                            },
                            ActionCardData(icon: "printer", title: "Print Labels", subtitle: "Print address labels") {
                                showingPrintLabelsSheet = true
                            },
                            ActionCardData(icon: "icloud.and.arrow.up", title: "Backup & Restore", subtitle: "Create and restore data backups") {
                                // TODO: Add backup/restore functionality
                            },
                            ActionCardData(icon: "doc.on.doc", title: "Import Templates", subtitle: "Manage import configurations") {
                                showingImportTemplates = true
                            },
                            ActionCardData(icon: "square.and.arrow.up", title: "Export Reports", subtitle: "Export data quality reports") {
                                showingExportReports = true
                            },
                            ActionCardData(icon: "externaldrive", title: "Cloud Sync", subtitle: "Sync with iCloud and other services") {
                                selectedTab = .settings
                            }
                        ]
                    )
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
        .sheet(isPresented: $showingImportTemplates) {
            CSVImportTemplatesView()
        }
        .sheet(isPresented: $showingExportReports) {
            ExportReportsView()
        }
        .sheet(isPresented: $showingGoogleSheets) {
            GoogleSheetsView()
        }
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    @EnvironmentObject var themeVM: ThemeViewModel
    
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
                    .foregroundColor(Color.textColor)
                
                Text(title)
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(Color.textColor.opacity(0.7))
            }
            
            Spacer(minLength: 0)
        }
        .frame(minHeight: 120)
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
    }
}

struct FarmsCard: View {
    let contacts: [FarmContact]
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private var uniqueFarms: [String] {
        let farms = contacts.compactMap { $0.farm?.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return Array(Set(farms)).sorted()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            HStack {
                Image(systemName: "building.2.fill")
                    .foregroundColor(Color.textColor.opacity(0.6))
                    .font(.title2)
                
                Spacer()
            }
            
            HStack(alignment: .top, spacing: Constants.Spacing.medium) {
                // Left side - Count
                VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                    Text("\(uniqueFarms.count)")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(Color.textColor)
                    
                    Text("Unique Farms")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(Color.textColor.opacity(0.7))
                }
                
                Spacer()
                
                // Right side - Farm list
                VStack(alignment: .trailing, spacing: Constants.Spacing.small) {
                    ForEach(uniqueFarms.prefix(3), id: \.self) { farm in
                        Text(farm)
                            .font(Constants.Typography.captionFont)
                            .foregroundColor(Color.textColor.opacity(0.8))
                            .lineLimit(1)
                    }
                    
                    if uniqueFarms.count > 3 {
                        Text("+\(uniqueFarms.count - 3) more")
                            .font(Constants.Typography.captionFont)
                            .foregroundColor(Color.textColor.opacity(0.6))
                    }
                }
            }
        }
        .frame(minHeight: 120)
        .padding(Constants.Spacing.large)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(12)
        .shadow(color: Color.adaptiveShadowColor.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.adaptiveShadowColor.opacity(0.1), lineWidth: 1)
        )
    }
}



#Preview {
    ContentView()
        .environmentObject(ThemeViewModel())
        .environmentObject(AccessibilityManager())
        .environment(\.managedObjectContext, PersistenceController.shared.container.viewContext)
}


