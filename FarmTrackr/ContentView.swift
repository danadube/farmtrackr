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
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject private var themeVM = ThemeViewModel()
    @StateObject private var accessibilityManager = AccessibilityManager()
    @State private var selectedTab: NavigationTab? = .home
    @State private var selectedContact: FarmContact?
    @State private var searchText: String = ""
    @State private var sortOrder: SortOrder = .lastName
    @State private var showingAddContact: Bool = false
    @State private var showingContactDetail: Bool = false
    // Add these for menu actions
    @State private var showingUnifiedImportExport: Bool = false
    @State private var showingPrintLabelsSheet: Bool = false
    
    private var customFont: Font {
        Font.custom(themeVM.theme.font, size: 16)
    }
    
    enum NavigationTab: String, CaseIterable {
        case home = "Home"
        case contacts = "Contacts"
        case documents = "Documents"
        case dataQuality = "Data Quality"
        case importExport = "Import/Export"
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
    
    var body: some View {
        HStack(spacing: 0) {
            SidebarView(selectedTab: $selectedTab)
                .frame(width: 240) // Increased from 200
                .environmentObject(themeVM) // Ensure sidebar also gets themeVM
            Divider()
            DetailContentView(
                selectedTab: $selectedTab,
                selectedContact: $selectedContact,
                searchText: $searchText,
                sortOrder: $sortOrder,
                showingAddContact: $showingAddContact,
                showingContactDetail: $showingContactDetail
            )
            .environmentObject(accessibilityManager)
            .environmentObject(themeVM) // <-- Ensure themeVM is injected here
        }
        .environment(\.managedObjectContext, viewContext)
        .font(customFont)
        .background(Color.appBackground)
        .accentColor(themeVM.theme.colors.accent)
        .preferredColorScheme(themeVM.darkModeEnabled ? .dark : .light)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("FarmTrackr main navigation")
        .accessibilityHint("Use the tabs at the bottom to navigate between different sections of the app")
        // Menu action sheets
        .sheet(isPresented: $showingAddContact) {
            ContactEditView(contact: nil)
        }
        .sheet(isPresented: $showingUnifiedImportExport) {
            UnifiedImportExportView(documentManager: DocumentManager(context: viewContext))
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingPrintLabelsSheet) {
            PrintLabelsView(templateManager: LabelTemplateManager())
        }
        .onAppear {
#if targetEnvironment(macCatalyst)
            NotificationCenter.default.addObserver(forName: NSNotification.Name("NewContact"), object: nil, queue: .main) { _ in
                showingAddContact = true
            }
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowImport"), object: nil, queue: .main) { _ in
                showingUnifiedImportExport = true
            }
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowExport"), object: nil, queue: .main) { _ in
                showingUnifiedImportExport = true
            }
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowPrintLabels"), object: nil, queue: .main) { _ in
                showingPrintLabelsSheet = true
            }
#endif
        }
        .onDisappear {
#if targetEnvironment(macCatalyst)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("NewContact"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowImport"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowExport"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowPrintLabels"), object: nil)
#endif
        }
    }
}

// MARK: - Navigation Item View
struct NavigationItemView: View {
    let tab: ContentView.NavigationTab
    let isSelected: Bool
    let onTap: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Constants.Spacing.medium) {
                Image(systemName: tab.icon)
                    .foregroundColor(isSelected ? themeVM.theme.colors.primary : .secondaryLabel)
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

struct SidebarView: View {
    @Binding var selectedTab: ContentView.NavigationTab?
    @Environment(\.colorScheme) var colorScheme
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private var logoImageName: String {
        colorScheme == .dark ? "farmtrackr_logo_dark_TB 1024" : "farmtrackr_logo_TB 1024"
    }
    
    private var titleFont: Font {
        .system(size: 28, weight: .heavy, design: .rounded)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Logo Section
            VStack(spacing: Constants.Spacing.small) {
                Image(logoImageName)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 110)
                    .padding(.horizontal, Constants.Spacing.medium)
                
                Text("FarmTrackr")
                    .font(titleFont)
                    .foregroundColor(themeVM.theme.colors.primary)
                    .padding(.horizontal, Constants.Spacing.medium)
            }
            .padding(.top, Constants.Spacing.large)
            .padding(.bottom, Constants.Spacing.large)
            
            // Divider between logo and navigation
            Divider()
                .background(Color(.separator))
            
            // Navigation List
            List {
                ForEach(ContentView.NavigationTab.allCases, id: \.self) { tab in
                    NavigationItemView(
                        tab: tab,
                        isSelected: selectedTab == tab,
                        onTap: { selectedTab = tab }
                    )
                }
            }
            .listStyle(SidebarListStyle())
        }
        .background(Color(.systemBackground))
        .navigationTitle("FarmTrackr")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {}) {
                    Image(systemName: "person.circle")
                }
            }
        }
    }
}

struct DetailContentView: View {
    @Binding var selectedTab: ContentView.NavigationTab?
    @Binding var selectedContact: FarmContact?
    @Binding var searchText: String
    @Binding var sortOrder: SortOrder
    @Binding var showingAddContact: Bool
    @Binding var showingContactDetail: Bool
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @EnvironmentObject var themeVM: ThemeViewModel
    @Environment(\.managedObjectContext) private var viewContext

    @ViewBuilder
    private var selectedView: some View {
        switch selectedTab {
        case .home:
            HomeView(selectedContact: $selectedContact, selectedTab: $selectedTab, showingContactDetail: $showingContactDetail)
        case .contacts:
            ContactsMasterView(selectedContact: $selectedContact, searchText: $searchText, sortOrder: $sortOrder, showingAddContact: $showingAddContact, showingContactDetail: $showingContactDetail)
        case .documents:
            DocumentsView(context: viewContext)
                .environmentObject(themeVM)
        case .dataQuality:
            DataQualityView().environmentObject(themeVM)
        case .importExport:
            ImportExportView()
        case .settings:
            SettingsView()
        case .none:
            HomeView(selectedContact: $selectedContact, selectedTab: $selectedTab, showingContactDetail: $showingContactDetail)
        }
    }

    var body: some View {
        ZStack {
            themeVM.theme.colors.background.ignoresSafeArea()
            selectedView
        }
    }
}

// MARK: - Tab Header
struct TabHeader: View {
    let icon: String? // SF Symbol or nil for logo
    let logoName: String?
    let title: String
    let subtitle: String?
    @EnvironmentObject var themeVM: ThemeViewModel
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(spacing: Constants.Spacing.medium) {
            if let logoName = logoName {
                Image(logoName)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
            } else if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 60))
                    .foregroundColor(themeVM.theme.colors.primary)
            }
            Text(title)
                .font(themeVM.theme.fonts.headerFont)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(.secondaryLabel)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, Constants.Spacing.medium)
    }
}

struct HomeView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.dateModified, ascending: false)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    @Binding var selectedContact: FarmContact?
    @Binding var selectedTab: ContentView.NavigationTab?
    @Binding var showingContactDetail: Bool
    @State private var showingAddContact = false
    @State private var showingUnifiedImportExport = false
    @State private var showingPrintLabelsSheet = false
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "house", logoName: nil, title: "Home", subtitle: "Manage your farm contacts efficiently")
                
                // Stats Cards
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: Constants.Spacing.medium) {
                    StatCard(
                        title: "Total Contacts",
                        value: "\(contacts.count)",
                        icon: "person.2.fill",
                        color: Color.accentColor
                    )
                    .environmentObject(themeVM)
                    
                    FarmsCard(contacts: Array(contacts))
                        .environmentObject(themeVM)
                }
                
                // Quick Actions
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Quick Actions")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: Constants.Spacing.medium) {
                        QuickActionCard(
                            title: "Add Contact",
                            subtitle: "Create new contact",
                            icon: "person.badge.plus",
                            action: { showingAddContact = true }
                        )
                        
                        QuickActionCard(
                            title: "Import & Export",
                            subtitle: "Unified data management",
                            icon: "square.and.arrow.up.on.square",
                            action: { showingUnifiedImportExport = true }
                        )
                        
                        QuickActionCard(
                            title: "Print Labels",
                            subtitle: "Mailing labels",
                            icon: "printer",
                            action: { showingPrintLabelsSheet = true }
                        )
                    }
                }
                
                // Recently Changed Contacts
                if !contacts.isEmpty {
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Recently Changed Contacts")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(.primary)
                        
                        ForEach(contacts.prefix(5), id: \.self) { contact in
                            RecentContactRow(contact: contact) {
                                selectedContact = contact
                                selectedTab = .contacts
                                showingContactDetail = true
                            }
                        }
                    }
                }
            }
            .padding(Constants.Spacing.large)
        }
        .background(Color.appBackground)
        .sheet(isPresented: $showingAddContact) {
            ContactEditView(contact: nil)
        }
        .sheet(isPresented: $showingUnifiedImportExport) {
            UnifiedImportExportView(documentManager: DocumentManager(context: viewContext))
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingPrintLabelsSheet) {
            PrintLabelsView(templateManager: LabelTemplateManager())
        }
    }
}

struct ContactsMasterView: View {
    @Binding var selectedContact: FarmContact?
    @Binding var searchText: String
    @Binding var sortOrder: SortOrder
    @Binding var showingAddContact: Bool
    @Binding var showingContactDetail: Bool
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Environment(\.managedObjectContext) private var viewContext
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                TabHeader(icon: "person.2", logoName: nil, title: "Contacts", subtitle: "Manage your farm contacts")
                    .padding(.horizontal, Constants.Spacing.large)
                    .padding(.top, Constants.Spacing.large)
                
                // Contact List
                ContactListView(
                    selectedContact: $selectedContact,
                    searchText: $searchText,
                    sortOrder: $sortOrder,
                    showingAddContact: $showingAddContact,
                    context: viewContext
                )
            }
            .background(Color.appBackground)
            .sheet(isPresented: $showingAddContact) {
                ContactEditView(contact: nil)
            }
            .sheet(isPresented: $showingContactDetail, onDismiss: {
                // Reset selectedContact when sheet is dismissed
                selectedContact = nil
            }) {
                if let contact = selectedContact {
                    ContactDetailView(contact: contact)
                        .environmentObject(themeVM)
                }
            }
            .onChange(of: selectedContact) { _, contact in
                if contact != nil {
                    showingContactDetail = true
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationTitle("")
        }
    }
}

struct ImportExportView: View {
    @State private var showingUnifiedImportExport = false
    @State private var showingPrintLabelsSheet = false
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var documentManager = DocumentManager(context: PersistenceController.shared.container.viewContext)
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "square.and.arrow.up.on.square", logoName: nil, title: "Import & Export", subtitle: "Unified data and document management")
                
                // Unified Import & Export Section
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Unified Operations")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    ActionCard(
                        title: "Import & Export Hub",
                        subtitle: "Contacts, documents, and mail merge",
                        icon: "square.and.arrow.up.on.square",
                        action: { showingUnifiedImportExport = true }
                    )
                }
                
                // Print Labels Section
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Printing")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    ActionCard(
                        title: "Print Labels",
                        subtitle: "Generate mailing labels",
                        icon: "printer",
                        action: { showingPrintLabelsSheet = true }
                    )
                }
            }
            .padding(Constants.Spacing.large)
        }
        .background(Color.appBackground)
        .sheet(isPresented: $showingUnifiedImportExport) {
            UnifiedImportExportView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingPrintLabelsSheet) {
            PrintLabelsView(templateManager: LabelTemplateManager())
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
                    
                    Text("Farms")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(Color.textColor.opacity(0.7))
                }
                
                Spacer()
                
                // Right side - Farm names list
                if !uniqueFarms.isEmpty {
                    VStack(alignment: .trailing, spacing: 4) {
                        ForEach(uniqueFarms.prefix(3), id: \.self) { farm in
                            Text(farm)
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(Color.textColor.opacity(0.7))
                                .lineLimit(1)
                                .multilineTextAlignment(.trailing)
                        }
                        
                        if uniqueFarms.count > 3 {
                            Text("+ \(uniqueFarms.count - 3) more")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(Color.textColor.opacity(0.5))
                        }
                    }
                }
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

struct QuickActionCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Image(systemName: icon)
                    .foregroundColor(Color.accentColor)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(Constants.Typography.bodyFont)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Constants.Spacing.medium)
            .interactiveCardStyle()
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ActionCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                Image(systemName: icon)
                    .foregroundColor(Color.accentColor)
                    .font(.title)
                
                VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                    Text(title)
                        .font(Constants.Typography.titleFont)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Constants.Spacing.large)
            .interactiveCardStyle()
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct RecentContactRow: View {
    let contact: FarmContact
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Constants.Spacing.medium) {
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(contact.fullName.prefix(2).uppercased())
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(contact.fullName)
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(.primary)
                    
                    Text(contact.farm ?? "")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(contact.dateCreated?.relativeTime ?? "")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.tertiaryLabel)
            }
            .padding(Constants.Spacing.medium)
            .interactiveCardStyle()
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct PlaceholderView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: Constants.Spacing.large) {
            Image(systemName: icon)
                .font(.system(size: 80))
                .foregroundColor(.secondaryLabel)
            
            Text(title)
                .font(Constants.Typography.titleFont)
                .foregroundColor(.secondaryLabel)
            
            Text(message)
                .font(Constants.Typography.bodyFont)
                .foregroundColor(.tertiaryLabel)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Constants.Spacing.large)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.appBackground)
    }
}

// MARK: - Theme Button
struct ThemeButton: View {
    let themeName: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        let theme = ThemeManager.themes[themeName]!
        
        Button(action: action) {
            Text(themeName)
                .font(.system(size: 12, weight: isSelected ? .bold : .regular))
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.vertical, 6)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(isSelected ? theme.colors.primary : Color(.systemGray5))
                )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isSelected ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

#Preview {
    ContentView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}

