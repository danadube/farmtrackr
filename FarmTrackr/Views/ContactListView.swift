//
//  ContactListView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

// MARK: - Enums
enum FilterType: String, CaseIterable {
    case farm = "Farm"
    case firstName = "First Name"
    case lastName = "Last Name"
    case dateRange = "Date Range"
    
    var displayName: String {
        return self.rawValue
    }
}

enum DateRange: String, CaseIterable {
    case allTime = "All Time"
    case lastWeek = "Last Week"
    case lastMonth = "Last Month"
    case lastYear = "Last Year"
}

struct ContactListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @EnvironmentObject var accessibilityManager: AccessibilityManager
    @Binding var selectedContact: FarmContact?
    @Binding var searchText: String
    @Binding var sortOrder: SortOrder
    @Binding var showingAddContact: Bool
    @State private var filterFarm: String = "All Farms"
    @State private var firstNameFilter: String = ""
    @State private var lastNameFilter: String = ""
    @State private var showingAdvancedFilters = false
    @State private var searchSuggestions: [String] = []
    @State private var showingSearchSuggestions = false
    @State private var activeFilters: Set<FilterType> = []
    @State private var dateRange: DateRange = .allTime
    @StateObject private var batchManager: BatchActionManager
    @State private var showingRefreshAlert = false
    @State private var refreshMessage = ""
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.firstName, ascending: true)],
        animation: .default)
    private var contacts: FetchedResults<FarmContact>
    
    init(selectedContact: Binding<FarmContact?>, searchText: Binding<String>, sortOrder: Binding<SortOrder>, showingAddContact: Binding<Bool>, context: NSManagedObjectContext) {
        self._selectedContact = selectedContact
        self._searchText = searchText
        self._sortOrder = sortOrder
        self._showingAddContact = showingAddContact
        self._batchManager = StateObject(wrappedValue: BatchActionManager(context: context))
    }
    
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea(.all, edges: .all)
            
            VStack(spacing: 0) {
                // Batch action view
                if batchManager.isSelectionMode {
                    BatchActionView(contacts: filteredContacts)
                        .environmentObject(batchManager)
                }
                
                searchHeader
                contactList
            }
        }
        .background(Color.appBackground)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                if !batchManager.isSelectionMode {
                    Button(action: { batchManager.enterSelectionMode() }) {
                        Image(systemName: "checkmark.circle")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color.textColor)
                    }
                    .accessibilityLabel("Batch actions")
                    .accessibilityHint("Double tap to enter batch selection mode")
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: Constants.Spacing.medium) {
                    if !batchManager.isSelectionMode {
                        Button(action: refreshData) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(Color.textColor)
                        }
                        .accessibilityLabel("Refresh data")
                        .accessibilityHint("Double tap to refresh contact data")
                    }
                    
                    if !batchManager.isSelectionMode {
                        Button(action: { showingAddContact = true }) {
                            Image(systemName: "plus")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(themeVM.theme.colors.primary)
                        }
                        .accessibilityLabel(Accessibility.Labels.addContact)
                        .accessibilityHint(Accessibility.Hints.addContact)
                    }
                }
            }
        }
        .sheet(isPresented: $showingAdvancedFilters) {
            advancedFilterView
        }
        .alert("Refresh Complete", isPresented: $showingRefreshAlert) {
            Button("OK") { }
        } message: {
            Text(refreshMessage)
        }
        .onChange(of: searchText) { _, _ in
            updateSearchSuggestions()
        }
    }
    
    private var searchHeader: some View {
        VStack(spacing: Constants.Spacing.medium) {
            searchBar
            filterControls
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
        .padding(.horizontal, Constants.Spacing.large)
        .padding(.top, Constants.Spacing.medium)
        .padding(.bottom, Constants.Spacing.large) // Add bottom padding for proper separation
    }
    
    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(Color.textColor.opacity(0.6))
                .accessibilityHidden(true)
            
            TextField("Search contacts...", text: $searchText)
                .textFieldStyle(PlainTextFieldStyle())
                .foregroundColor(Color.textColor)
                .accentColor(themeVM.theme.colors.accent)
                .accessibilityLabel(Accessibility.Labels.searchContacts)
                .accessibilityHint(Accessibility.Hints.searchContacts)
            
            if !searchText.isEmpty {
                Button(action: { 
                    searchText = ""
                    showingSearchSuggestions = false
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
                .accessibilityLabel("Clear search")
                .accessibilityHint("Double tap to clear the search field")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(themeVM.theme.colors.secondary.opacity(0.2), lineWidth: 0.5)
        )
        .shadow(color: themeVM.theme.colors.secondary.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    private var filterControls: some View {
        HStack {
            Menu {
                Button("All Farms") { filterFarm = "All Farms" }
                    .accessibilityLabel("Show all farms")
                ForEach(Array(Set(contacts.compactMap { $0.farm })).sorted(), id: \.self) { farm in
                    Button(farm) { filterFarm = farm }
                        .accessibilityLabel("Filter by \(farm)")
                }
            } label: {
                HStack {
                    Text(filterFarm)
                        .foregroundColor(Color.textColor)
                    Image(systemName: "chevron.down")
                        .foregroundColor(Color.textColor.opacity(0.6))
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.cardBackgroundAdaptive)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.borderColor.opacity(0.2), lineWidth: 0.5)
                )
            }
            .accessibilityLabel("Farm filter")
            .accessibilityHint("Double tap to choose a farm to filter by")
            
            Spacer()
            
            Button(action: { showingAdvancedFilters = true }) {
                HStack(spacing: 4) {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                        .foregroundColor(Color.textColor.opacity(0.6))
                        .accessibilityHidden(true)
                    Text("Filters")
                        .foregroundColor(Color.textColor)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.cardBackgroundAdaptive)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.borderColor.opacity(0.2), lineWidth: 0.5)
                )
            }
            .accessibilityLabel(Accessibility.Labels.filterContacts)
            .accessibilityHint(Accessibility.Hints.filterContacts)
        }
    }
    
    private var contactList: some View {
        ScrollView {
            LazyVStack(spacing: themeVM.theme.spacing.cardSpacing) {
                ForEach(filteredContacts, id: \.self) { contact in
                    ContactRowView(
                        contact: contact,
                        isSelected: batchManager.selectedContacts.contains(contact),
                        isSelectionMode: batchManager.isSelectionMode
                    ) {
                        if batchManager.isSelectionMode {
                            batchManager.toggleSelection(for: contact)
                        } else {
                            selectedContact = contact
                        }
                    }
                    .padding(.horizontal, themeVM.theme.spacing.large)
                }
            }
            .padding(.vertical, themeVM.theme.spacing.large)
        }
        .background(Color.appBackground)
        .scrollContentBackground(.hidden)
        .padding(.top, Constants.Spacing.medium) // Add top padding for proper separation from search header
    }
    
    private func simpleContactRow(_ contact: FarmContact) -> some View {
        HStack(alignment: .center, spacing: 8) {
            // Selection indicator
            if batchManager.isSelectionMode {
                Button(action: {
                    batchManager.toggleSelection(for: contact)
                }) {
                    Image(systemName: batchManager.selectedContacts.contains(contact) ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundColor(batchManager.selectedContacts.contains(contact) ? themeVM.theme.colors.primary : .secondary)
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel(batchManager.selectedContacts.contains(contact) ? "Deselect contact" : "Select contact")
                .accessibilityHint("Double tap to \(batchManager.selectedContacts.contains(contact) ? "deselect" : "select") this contact")
            }
            Circle()
                .fill(themeVM.theme.colors.primary.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(contact.fullName.prefix(1).uppercased())
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.primary)
                )
                .accessibilityHidden(true)
            // Compact info row
            VStack(alignment: .center, spacing: 2) {
                HStack(spacing: 6) {
                    Text(contact.fullName)
                        .font(.system(size: 16, weight: .medium))
                    if let farm = contact.farm, !farm.isEmpty {
                        Text(farm)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    if !contact.displayAddress.isEmpty {
                        Text("•")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        Text(contact.displayAddress)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            Spacer()
            // Quality indicators
            qualityIndicators(for: contact)
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .accessibilityHidden(true)
        }
        .padding(.vertical, 8)
    }
    
    private func qualityIndicators(for contact: FarmContact) -> some View {
        let validator = DataValidator()
        let emailResult = contact.primaryEmail.map { validator.validateEmail($0) } ?? ValidationResult(id: UUID(), field: "Email", isValid: true, score: 100, suggestions: [], errors: [], warnings: [])
        let phoneResult = contact.primaryPhone.map { validator.validatePhoneNumber($0) } ?? ValidationResult(id: UUID(), field: "Phone", isValid: true, score: 100, suggestions: [], errors: [], warnings: [])
        
        let hasErrors = !emailResult.errors.isEmpty || !phoneResult.errors.isEmpty
        let hasWarnings = !emailResult.warnings.isEmpty || !phoneResult.warnings.isEmpty
        
        return HStack(spacing: 4) {
            if hasErrors {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.red)
            }
            
            if hasWarnings {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.orange)
            }
        }
    }
    
    var filteredContacts: [FarmContact] {
        var arrayContacts: [FarmContact] = []
        for contact in contacts {
            arrayContacts.append(contact)
        }
        var filtered: [FarmContact] = []
        for contact in arrayContacts {
            if !searchText.isEmpty {
                let matchesSearch = contact.fullName.localizedCaseInsensitiveContains(searchText) ||
                    (contact.firstName ?? "").localizedCaseInsensitiveContains(searchText) ||
                    (contact.lastName ?? "").localizedCaseInsensitiveContains(searchText) ||
                    (contact.farm ?? "").localizedCaseInsensitiveContains(searchText) ||
                    (contact.city ?? "").localizedCaseInsensitiveContains(searchText) ||
                    (contact.primaryEmail ?? "").localizedCaseInsensitiveContains(searchText) ||
                    (contact.primaryPhone ?? "").localizedCaseInsensitiveContains(searchText)
                if !matchesSearch { continue }
            }
            
            if filterFarm != "All Farms" && (contact.farm ?? "") != filterFarm {
                continue
            }
            
            if !firstNameFilter.isEmpty && contact.firstName?.localizedCaseInsensitiveContains(firstNameFilter) == false {
                continue
            }
            
            if !lastNameFilter.isEmpty && contact.lastName?.localizedCaseInsensitiveContains(lastNameFilter) == false {
                continue
            }
            
            if let dateCreated = contact.dateCreated {
                switch dateRange {
                case .lastWeek:
                    if dateCreated < Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date() {
                        continue
                    }
                case .lastMonth:
                    if dateCreated < Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date() {
                        continue
                    }
                case .lastYear:
                    if dateCreated < Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date() {
                        continue
                    }
                case .allTime:
                    break
                }
            }
            
            filtered.append(contact)
        }
        
        return filtered.sorted { first, second in
            switch sortOrder {
            case .firstName:
                return (first.firstName ?? "") < (second.firstName ?? "")
            case .lastName:
                return (first.lastName ?? "") < (second.lastName ?? "")
            case .farm:
                return (first.farm ?? "") < (second.farm ?? "")
            case .dateCreated:
                return (first.dateCreated ?? .distantPast) > (second.dateCreated ?? .distantPast)
            case .dateModified:
                return (first.dateModified ?? .distantPast) > (second.dateModified ?? .distantPast)
            }
        }
    }
    
    private func updateSearchSuggestions() {
        guard !searchText.isEmpty else {
            searchSuggestions = []
            return
        }
        
        let allContacts = Array(contacts)
        var suggestions: Set<String> = []
        
        for contact in allContacts {
            if contact.fullName.localizedCaseInsensitiveContains(searchText) {
                suggestions.insert(contact.fullName)
            }
            
            if let firstName = contact.firstName, firstName.localizedCaseInsensitiveContains(searchText) {
                suggestions.insert(firstName)
            }
            
            if let lastName = contact.lastName, lastName.localizedCaseInsensitiveContains(searchText) {
                suggestions.insert(lastName)
            }
            
            if let farm = contact.farm, farm.localizedCaseInsensitiveContains(searchText) {
                suggestions.insert(farm)
            }
            
            if let city = contact.city, city.localizedCaseInsensitiveContains(searchText) {
                suggestions.insert(city)
            }
        }
        
        searchSuggestions = Array(suggestions.prefix(5))
        showingSearchSuggestions = !searchSuggestions.isEmpty
    }
    
    private func refreshData() {
        // Refresh the Core Data context to ensure we have the latest data
        viewContext.refreshAllObjects()
        
        // Force a UI update by triggering a small delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            // This will trigger the FetchRequest to refresh
            withAnimation(.easeInOut(duration: 0.3)) {
                // The animation will make the refresh visible to the user
            }
            
            // Show success message
            refreshMessage = "Successfully refreshed \(filteredContacts.count) contacts"
            showingRefreshAlert = true
        }
    }
    
    private var advancedFilterView: some View {
        NavigationView {
            Form {
                Section("Farm Filter") {
                    Picker("Farm", selection: $filterFarm) {
                        Text("All Farms").tag("All Farms")
                        ForEach(Array(Set(contacts.compactMap { $0.farm })).sorted(), id: \.self) { farm in
                            Text(farm).tag(farm)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("First Name Filter") {
                    TextField("First Name", text: $firstNameFilter)
                }
                
                Section("Last Name Filter") {
                    TextField("Last Name", text: $lastNameFilter)
                }
                
                Section("Date Range") {
                    Picker("Date Range", selection: $dateRange) {
                        Text("All Time").tag(DateRange.allTime)
                        Text("Last Week").tag(DateRange.lastWeek)
                        Text("Last Month").tag(DateRange.lastMonth)
                        Text("Last Year").tag(DateRange.lastYear)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle("Advanced Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showingAdvancedFilters = false
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        applyAdvancedFilters()
                        showingAdvancedFilters = false
                    }
                }
            }
        }
    }
    
    private func applyAdvancedFilters() {
        activeFilters.removeAll()
        
        if filterFarm != "All Farms" {
            activeFilters.insert(.farm)
        }
        
        if !firstNameFilter.isEmpty {
            activeFilters.insert(.firstName)
        }
        
        if !lastNameFilter.isEmpty {
            activeFilters.insert(.lastName)
        }
        
        if dateRange != .allTime {
            activeFilters.insert(.dateRange)
        }
    }
}

// MARK: - Contact Row View
struct ContactRowView: View {
    let contact: FarmContact
    let isSelected: Bool
    let isSelectionMode: Bool
    let onTap: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(alignment: .center, spacing: Constants.Spacing.medium) {
            // Selection checkbox
            if isSelectionMode {
                Button(action: onTap) {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(isSelected ? themeVM.theme.colors.primary : .gray)
                        .font(.system(size: 20))
                }
                .buttonStyle(PlainButtonStyle())
            }
            // Contact avatar
            Circle()
                .fill(themeVM.theme.colors.primary.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(contact.fullName.prefix(1).uppercased())
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(themeVM.theme.colors.primary)
                )
                .accessibilityHidden(true)
            // Name and farm (vertical)
            VStack(alignment: .leading, spacing: 2) {
                Text(contact.fullName)
                    .font(themeVM.theme.fonts.titleFont)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                if let farm = contact.farm, !farm.isEmpty {
                    Text(farm)
                        .font(themeVM.theme.fonts.bodyFont)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, Constants.Spacing.small)
                        .padding(.vertical, 2)
                        .background(Color(.systemGray6))
                        .cornerRadius(Constants.CornerRadius.small)
                }
            }
            // Address (vertical, but in same HStack)
            if !contact.displayAddress.isEmpty {
                VStack(alignment: .center, spacing: 2) {
                    Text(contact.mailingAddress ?? "")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    if let city = contact.city, let state = contact.state {
                        Text("\(city), \(state) \(contact.zipCode.formattedZipCode)")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            Spacer()
            // Quality indicators
            qualityIndicators(for: contact)
            // Chevron indicator
            if !isSelectionMode {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .accessibilityHidden(true)
            }
        }
        .padding(Constants.Spacing.large)
        .interactiveCardStyle()
        .overlay(
            RoundedRectangle(cornerRadius: Constants.CornerRadius.large)
                .stroke(isSelected ? themeVM.theme.colors.primary : Color.clear, lineWidth: 2)
        )
        .onTapGesture {
            onTap()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(contact.fullName), \(contact.farm ?? "No farm"), \(contact.displayAddress.isEmpty ? "No address" : contact.displayAddress)")
        .accessibilityHint(isSelectionMode ? 
            "Double tap to \(isSelected ? "deselect" : "select") this contact" :
            "Double tap to view contact details")
    }
    
    private func qualityIndicators(for contact: FarmContact) -> some View {
        let validator = DataValidator()
        let emailResult = contact.primaryEmail.map { validator.validateEmail($0) } ?? ValidationResult(id: UUID(), field: "Email", isValid: true, score: 100, suggestions: [], errors: [], warnings: [])
        let phoneResult = contact.primaryPhone.map { validator.validatePhoneNumber($0) } ?? ValidationResult(id: UUID(), field: "Phone", isValid: true, score: 100, suggestions: [], errors: [], warnings: [])
        
        let hasErrors = !emailResult.errors.isEmpty || !phoneResult.errors.isEmpty
        let hasWarnings = !emailResult.warnings.isEmpty || !phoneResult.warnings.isEmpty
        
        return HStack(spacing: 4) {
            if hasErrors {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.red)
            }
            
            if hasWarnings {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.orange)
            }
        }
    }
}




