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
    @State private var selectedTab: NavigationTab? = .overview
    @State private var selectedContact: FarmContact?
    @State private var searchText: String = ""
    @State private var sortOrder: SortOrder = .lastName
    @State private var showingAddContact: Bool = false
    
    private var customFont: Font {
        Font.custom(themeVM.theme.font, size: 16)
    }
    
    enum NavigationTab: String, CaseIterable {
        case overview = "Overview"
        case contacts = "Contacts"
        case dataQuality = "Data Quality"
        case importExport = "Import/Export"
        case settings = "Settings"
        
        var icon: String {
            switch self {
            case .overview: return "house"
            case .contacts: return "person.2"
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
                showingAddContact: $showingAddContact
            )
            .environmentObject(accessibilityManager)
            .environmentObject(themeVM) // <-- Ensure themeVM is injected here
        }
        .environment(\.managedObjectContext, viewContext)
        .font(customFont)
        .background(appBackground)
        .accentColor(themeVM.theme.colors.accent)
        .preferredColorScheme(themeVM.darkModeEnabled ? .dark : .light)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("FarmTrackr main navigation")
        .accessibilityHint("Use the tabs at the bottom to navigate between different sections of the app")
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
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @EnvironmentObject var themeVM: ThemeViewModel

    @ViewBuilder
    private var selectedView: some View {
        switch selectedTab {
        case .overview:
            OverviewView(selectedContact: $selectedContact, selectedTab: $selectedTab)
        case .contacts:
            ContactsMasterView(selectedContact: $selectedContact, searchText: $searchText, sortOrder: $sortOrder, showingAddContact: $showingAddContact)
        case .dataQuality:
            DataQualityView()
        case .importExport:
            ImportExportView()
        case .settings:
            SettingsView()
        case .none:
            OverviewView(selectedContact: $selectedContact, selectedTab: $selectedTab)
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
        .padding(.top, Constants.Spacing.extraLarge)
    }
}

struct OverviewView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.dateCreated, ascending: false)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    @Binding var selectedContact: FarmContact?
    @Binding var selectedTab: ContentView.NavigationTab?
    @State private var showingAddContact = false
    @State private var showingImportSheet = false
    @State private var showingExportSheet = false
    @State private var showingPrintLabelsSheet = false
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "house", logoName: nil, title: "Overview", subtitle: "Manage your farm contacts efficiently")
                
                // Stats Cards
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: Constants.Spacing.medium) {
                    StatCard(
                        title: "Total Contacts",
                        value: "\(contacts.count)",
                        icon: "person.2.fill",
                        color: Constants.Colors.primary
                    )
                    
                    StatCard(
                        title: "Recent Contacts",
                        value: "\(contacts.prefix(5).count)",
                        icon: "clock.fill",
                        color: Constants.Colors.secondary
                    )
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
                            title: "Import Data",
                            subtitle: "CSV & Excel files",
                            icon: "square.and.arrow.down",
                            action: { showingImportSheet = true }
                        )
                        
                        QuickActionCard(
                            title: "Export Data",
                            subtitle: "Export contacts",
                            icon: "square.and.arrow.up",
                            action: { showingExportSheet = true }
                        )
                        
                        QuickActionCard(
                            title: "Print Labels",
                            subtitle: "Mailing labels",
                            icon: "printer",
                            action: { showingPrintLabelsSheet = true }
                        )
                    }
                }
                
                // Recent Contacts
                if !contacts.isEmpty {
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Recent Contacts")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(.primary)
                        
                        ForEach(contacts.prefix(5), id: \.self) { contact in
                            RecentContactRow(contact: contact) {
                                selectedContact = contact
                                selectedTab = .contacts
                            }
                        }
                    }
                }
            }
            .padding(Constants.Spacing.large)
        }
        .background(appBackground)
        .sheet(isPresented: $showingAddContact) {
            ContactEditView(contact: nil)
        }
        .sheet(isPresented: $showingImportSheet) {
            ImportView()
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportView()
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
    @State private var showingContactDetail = false
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
            .background(appBackground)
            .sheet(isPresented: $showingAddContact) {
                ContactEditView(contact: nil)
            }
            .sheet(isPresented: $showingContactDetail) {
                if let contact = selectedContact {
                    ContactDetailView(contact: contact)
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
    @State private var showingImportSheet = false
    @State private var showingExportSheet = false
    @State private var showingPrintLabelsSheet = false
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.Spacing.large) {
                TabHeader(icon: "square.and.arrow.up.on.square", logoName: nil, title: "Import & Export", subtitle: "Manage your data import and export operations")
                
                // Import & Export Section
                VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                    Text("Data Operations")
                        .font(themeVM.theme.fonts.titleFont)
                        .foregroundColor(.primary)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: Constants.Spacing.medium) {
                        ActionCard(
                            title: "Import Data",
                            subtitle: "CSV & Excel files",
                            icon: "square.and.arrow.down",
                            action: { showingImportSheet = true }
                        )
                        
                        ActionCard(
                            title: "Export Data",
                            subtitle: "Export to CSV or PDF",
                            icon: "square.and.arrow.up",
                            action: { showingExportSheet = true }
                        )
                    }
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
        .background(appBackground)
        .sheet(isPresented: $showingImportSheet) {
            ImportView()
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportView()
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
                    .foregroundColor(.primary)
                
                Text(title)
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondary)
            }
        }
        .padding(Constants.Spacing.large)
        .cardStyle()
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
                    .foregroundColor(Constants.Colors.primary)
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
                    .foregroundColor(Constants.Colors.primary)
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
                    .fill(Constants.Colors.primary)
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
        .background(Constants.Colors.background)
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

