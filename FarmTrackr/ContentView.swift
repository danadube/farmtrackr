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
        self.selectedTheme = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
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
    @State private var hasSeenWelcome = false
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
            NavigationSplitView {
                SidebarView(selectedTab: $selectedTab)
            } detail: {
                switch selectedTab {
                case .home:
                    HomeView(
                        contacts: contacts,
                        showingAddContact: $showingAddContact,
                        showingAddDocument: $showingAddDocument,
                        showingUnifiedImportExport: $showingUnifiedImportExport,
                        showingPrintLabelsSheet: $showingPrintLabelsSheet,
                        selectedTab: $selectedTab
                    )
                case .contacts:
                    if let contact = selectedContact {
                        ContactDetailView(contact: contact)
                    } else {
                        ContactsMasterView(
                            selectedContact: $selectedContact,
                            searchText: $searchText,
                            sortOrder: $sortOrder,
                            showingAddContact: $showingAddContact,
                            showingContactDetail: $showingContactDetail
                        )
                    }
                case .documents:
                    DocumentsView(context: viewContext)
                case .dataQuality:
                    DataQualityView()
                case .importExport:
                    ImportExportView(
                        showingUnifiedImportExport: $showingUnifiedImportExport,
                        showingPrintLabelsSheet: $showingPrintLabelsSheet
                    )
                case .settings:
                    SettingsView()
                case .none:
                    HomeView(
                        contacts: contacts,
                        showingAddContact: $showingAddContact,
                        showingAddDocument: $showingAddDocument,
                        showingUnifiedImportExport: $showingUnifiedImportExport,
                        showingPrintLabelsSheet: $showingPrintLabelsSheet,
                        selectedTab: $selectedTab
                    )
                }
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
                
                // Subtitle
                Text("Your farm CRM for managing contacts, documents, and more.")
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
                
                // Features
                VStack(spacing: themeVM.theme.spacing.medium) {
                    FeatureRow(icon: "person.2", title: "Manage Contacts", description: "Organize all your farm contacts in one place")
                    FeatureRow(icon: "doc.text", title: "Document Management", description: "Store and organize important documents")
                    FeatureRow(icon: "checkmark.shield", title: "Data Quality", description: "Ensure your data is clean and accurate")
                    FeatureRow(icon: "square.and.arrow.up", title: "Import & Export", description: "Easily import and export your data")
                }
                .padding(.horizontal, themeVM.theme.spacing.large)
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
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 32)
            
            VStack(alignment: .center, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(themeVM.theme.colors.text)
                    .multilineTextAlignment(.center)
                
                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, themeVM.theme.spacing.medium)
        .padding(.vertical, themeVM.theme.spacing.small)
        .background(
            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.medium)
                .fill(themeVM.theme.colors.cardBackground)
        )
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
            VStack(spacing: themeVM.theme.spacing.small) {
                // Logo above title
                VStack(spacing: themeVM.theme.spacing.small) {
                    Image("farmtrackr_logo_TB 1024")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100) // Double the size
                    
                    if !isCollapsed {
                        VStack(alignment: .center, spacing: 2) {
                            Text("FarmTrackr")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(themeVM.theme.colors.text)
                            Text("Farm CRM")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        }
                    }
                }
                .padding(.horizontal, themeVM.theme.spacing.medium)
                .padding(.top, themeVM.theme.spacing.small)
                .padding(.bottom, themeVM.theme.spacing.small)
            }
            .background(themeVM.theme.colors.cardBackground)
            
            Divider()
                .background(themeVM.theme.colors.separator)
            
            // Navigation List with Sections
            ScrollView {
                VStack(spacing: 0) {
                    // MAIN Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "MAIN")
                    }
                    
                    SidebarTab(icon: "house", title: "Home", isSelected: selectedTab == .home) {
                        selectedTab = .home
                    }
                    SidebarTab(icon: "person.2", title: "Contacts", isSelected: selectedTab == .contacts) {
                        selectedTab = .contacts
                    }
                    SidebarTab(icon: "doc.text", title: "Documents", isSelected: selectedTab == .documents) {
                        selectedTab = .documents
                    }
                    
                    // TOOLS Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "TOOLS")
                    }
                    
                    SidebarTab(icon: "checkmark.shield", title: "Data Quality", isSelected: selectedTab == .dataQuality) {
                        selectedTab = .dataQuality
                    }
                    SidebarTab(icon: "square.and.arrow.up.on.square", title: "Import & Export", isSelected: selectedTab == .importExport) {
                        selectedTab = .importExport
                    }
                    
                    // SETTINGS Section
                    if !isCollapsed {
                        SidebarSectionHeader(title: "SETTINGS")
                    }
                    
                    SidebarTab(icon: "gear", title: "Settings", isSelected: selectedTab == .settings) {
                        selectedTab = .settings
                    }
                }
                .padding(.vertical, themeVM.theme.spacing.small)
            }
            .background(themeVM.theme.colors.background)
            
            Spacer()
        }
        .background(themeVM.theme.colors.background)
        .frame(width: isCollapsed ? 60 : 220)
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
        .padding(.bottom, themeVM.theme.spacing.small)
    }
}

// MARK: - Home View
struct HomeView: View {
    let contacts: [FarmContact]
    @Binding var showingAddContact: Bool
    @Binding var showingAddDocument: Bool
    @Binding var showingUnifiedImportExport: Bool
    @Binding var showingPrintLabelsSheet: Bool
    @Binding var selectedTab: NavigationTab?
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "house", logoName: nil, title: "Home", subtitle: "Welcome to your farm dashboard")
            
            ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    quickActionsSection
                    recentContactsSection
                }
                .padding(themeVM.theme.spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            Text("Quick Actions")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: themeVM.theme.spacing.medium) {
                QuickActionCard(
                    icon: "person.badge.plus",
                    title: "Add Contact",
                    subtitle: "Create a new farm contact",
                    color: .blue
                ) {
                    showingAddContact = true
                }
                
                QuickActionCard(
                    icon: "doc.badge.plus",
                    title: "Add Document",
                    subtitle: "Create a new document",
                    color: .green
                ) {
                    showingAddDocument = true
                }
                
                QuickActionCard(
                    icon: "square.and.arrow.up.on.square",
                    title: "Import/Export",
                    subtitle: "Manage your data",
                    color: .orange
                ) {
                    showingUnifiedImportExport = true
                }
                
                QuickActionCard(
                    icon: "printer",
                    title: "Print Labels",
                    subtitle: "Print address labels",
                    color: .purple
                ) {
                    showingPrintLabelsSheet = true
                }
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    private var recentContactsSection: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
            HStack {
                Text("Recent Contacts")
                    .font(themeVM.theme.fonts.titleFont)
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                Button("View All") {
                    selectedTab = .contacts
                }
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.accent)
            }
            
            if contacts.isEmpty {
                emptyContactsView
            } else {
                contactsListView
            }
        }
        .padding(themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(themeVM.theme.cornerRadius.medium)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
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

// MARK: - Quick Action Card
struct QuickActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                HStack {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(color)
                    
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(themeVM.theme.fonts.headlineFont)
                        .fontWeight(.semibold)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Text(subtitle)
                        .font(themeVM.theme.fonts.captionFont)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                
                Spacer(minLength: 0)
            }
            .frame(minHeight: 100)
            .padding(Constants.Spacing.medium)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(Constants.CornerRadius.medium)
            .shadow(color: .black.opacity(0.1), radius: 3, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
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
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    searchAndSortSection
                    contactsListSection
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
    }
    
    private var searchAndSortSection: some View {
        VStack(spacing: Constants.Spacing.medium) {
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
            .padding(Constants.Spacing.medium)
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(Constants.CornerRadius.medium)
            
            // Sort and Add Contact
            HStack {
                Menu {
                    ForEach(SortOrder.allCases, id: \.self) { order in
                        Button(order.displayName) {
                            sortOrder = order
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "arrow.up.arrow.down")
                        Text("Sort by: \(sortOrder.displayName)")
                    }
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.text)
                }
                
                Spacer()
                
                Button(action: { showingAddContact = true }) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Contact")
                    }
                    .font(themeVM.theme.fonts.buttonFont)
                    .foregroundColor(.white)
                    .padding(.horizontal, Constants.Spacing.medium)
                    .padding(.vertical, Constants.Spacing.small)
                    .background(themeVM.theme.colors.accent)
                    .cornerRadius(Constants.CornerRadius.medium)
                }
            }
        }
        .padding(Constants.Spacing.large)
        .background(themeVM.theme.colors.cardBackground)
        .cornerRadius(Constants.CornerRadius.medium)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    private var contactsListSection: some View {
        LazyVStack(spacing: Constants.Spacing.small) {
            ForEach(filteredContacts, id: \.self) { contact in
                ContactRowView(
                    contact: contact,
                    isSelected: false,
                    isSelectionMode: false
                ) {
                    selectedContact = contact
                    showingContactDetail = true
                }
            }
        }
    }
}



// MARK: - Import Export View
struct ImportExportView: View {
    @Binding var showingUnifiedImportExport: Bool
    @Binding var showingPrintLabelsSheet: Bool
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "square.and.arrow.up.on.square", logoName: nil, title: "Import & Export", subtitle: "Import contacts from files or export your data")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    // Quick Actions
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: Constants.Spacing.medium) {
                        QuickActionCard(
                            icon: "square.and.arrow.down",
                            title: "Import Data",
                            subtitle: "Import contacts from CSV or Excel",
                            color: .blue
                        ) {
                            showingUnifiedImportExport = true
                        }
                        
                        QuickActionCard(
                            icon: "square.and.arrow.up",
                            title: "Export Data",
                            subtitle: "Export contacts to various formats",
                            color: .green
                        ) {
                            showingUnifiedImportExport = true
                        }
                        
                        QuickActionCard(
                            icon: "printer",
                            title: "Print Labels",
                            subtitle: "Print address labels for contacts",
                            color: .orange
                        ) {
                            showingPrintLabelsSheet = true
                        }
                        
                        QuickActionCard(
                            icon: "doc.text",
                            title: "Documents",
                            subtitle: "Create and manage documents",
                            color: .purple
                        ) {
                            // Navigate to documents
                        }
                    }
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
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
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(12)
        .shadow(color: Color.adaptiveShadowColor.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.adaptiveShadowColor.opacity(0.1), lineWidth: 1)
        )
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

