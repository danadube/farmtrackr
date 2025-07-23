//
//  ImportView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import UniformTypeIdentifiers
import CoreData
import CoreXLSX

struct ImportView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var currentStep: Int = 1
    private let totalSteps = 4
    
    // Step 1
    @State private var selectedMethod: ImportMethod? = nil
    @StateObject private var googleSheetsManager = GoogleSheetsManager()
    // Step 2
    @State private var selectedFileURL: URL? = nil
    @State private var selectedSheetID: String = ""
    @State private var showingFileImporter: Bool = false
    @State private var selectedFileType: ImportMethod? = nil
    // Step 3
    @State private var fieldMapping: [String: String] = [:]
    @State private var previewHeaders: [String] = []
    @State private var previewRows: [[String]] = []
    @State private var isFetchingGoogleSheet: Bool = false
    @State private var googleSheetsError: String? = nil
    // Step 4
    @State private var isImporting: Bool = false
    @State private var importResult: String? = nil
    @State private var showImportCompletePrompt: Bool = false
    
    @StateObject private var excelImportManager = ExcelImportManager()
    
    // App fields for mapping
    let appFields = [
        "firstName", "lastName", "mailingAddress", "city", "state", "zipCode",
        "email1", "email2", "phoneNumber1", "phoneNumber2", "phoneNumber3", "phoneNumber4", "phoneNumber5", "phoneNumber6",
        "siteMailingAddress", "siteCity", "siteState", "siteZipCode", "notes", "farm"
    ]
    
    var body: some View {
        VStack(spacing: 24) {
            // Add supported formats and Numbers note at the top
            VStack(alignment: .leading, spacing: 8) {
                Text("Supported file formats:")
                    .font(.headline)
                HStack(spacing: 16) {
                    Label("CSV (.csv)", systemImage: "doc.text")
                    Label("Excel (.xlsx)", systemImage: "doc.text.magnifyingglass")
                    Label("Google Sheets", systemImage: "link")
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
            }
            .padding(.top, 8)
            // Apple Numbers warning, less prominent
            Text("Apple Numbers (.numbers) files are not supported. Please export as Excel or CSV before importing.")
                .font(.footnote)
                .foregroundColor(.secondary)
                .padding(.bottom, 8)
            // Stepper indicator
            HStack(spacing: 8) {
                ForEach(1...totalSteps, id: \.self) { step in
                    Circle()
                        .fill(step == currentStep ? Color.accentColor : Color.gray.opacity(0.3))
                        .frame(width: 14, height: 14)
                }
            }
            .padding(.top)
            
            // Step content
            Group {
                if currentStep == 1 {
                    step1_chooseMethod
                } else if currentStep == 2 {
                    step2_selectFileOrSource
                } else if currentStep == 3 {
                    step3_mapFieldsPreview
                } else if currentStep == 4 {
                    step4_confirmAndImport
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding()
            
            // Navigation buttons
            HStack {
                if currentStep > 1 {
                    Button("Back") { currentStep -= 1 }
                        .buttonStyle(.bordered)
                }
                Spacer()
                if currentStep < totalSteps {
                    Button("Next") {
                        if currentStep == 1 && selectedMethod != nil {
                            currentStep += 1
                        } else if currentStep == 2 && (selectedFileURL != nil || !selectedSheetID.isEmpty) {
                            currentStep += 1
                        } else if currentStep == 3 {
                            currentStep += 1
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled((currentStep == 1 && selectedMethod == nil) || (currentStep == 2 && selectedFileURL == nil && selectedSheetID.isEmpty))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .frame(minWidth: 400, maxWidth: 600)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 20)
        .padding()
        .fileImporter(
            isPresented: $showingFileImporter,
            allowedContentTypes: [.commaSeparatedText, .spreadsheet],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first {
                    selectedFileURL = url
                    selectedFileType = selectedMethod
                    parseFileForPreview(url: url, type: selectedMethod ?? .csv)
                    currentStep = 3
                }
            case .failure:
                break
            }
        }
    }
    
    // MARK: - Step 1
    var step1_chooseMethod: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Step 1: Choose Import Method")
                .font(.title2.bold())
            Text("Select how you want to import your data. Each method supports different file types or sources.")
                .font(.body)
                .foregroundColor(.secondary)
            ForEach(ImportMethod.allCases, id: \.self) { method in
                ImportMethodButton(method: method, selectedMethod: $selectedMethod)
            }
        }
    }
    
    // MARK: - Step 2
    var step2_selectFileOrSource: some View {
        let step2Content = VStack(alignment: .leading, spacing: 16) {
            Text("Step 2: Select File or Source")
                .font(.title2.bold())
            if selectedMethod == .csv || selectedMethod == .excel {
                Text("Choose a file from your device to import.")
                    .font(.body)
                    .foregroundColor(.secondary)
                HoverButton(label: "Select File") {
                    showingFileImporter = true
                }
                if let url = selectedFileURL {
                    Text(url.lastPathComponent)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if selectedMethod == .googleSheets {
                Text("Connect to Google Sheets and select a sheet to import.")
                    .font(.body)
                    .foregroundColor(.secondary)
                HoverButton(label: "Pick Google Sheet") {
                    // Google Sheets picker logic here
                }
                if !selectedSheetID.isEmpty {
                    Text("Sheet ID: \(selectedSheetID)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if selectedMethod == .template {
                Text("Choose a saved import template.")
                    .font(.body)
                    .foregroundColor(.secondary)
                HoverButton(label: "Select Template") {
                    // Template picker logic here
                }
            }
        }
#if targetEnvironment(macCatalyst)
        return step2Content.modifier(FileDropModifier(selectedMethod: selectedMethod, onFileDropped: { url, type in
            selectedFileURL = url
            selectedFileType = type
            parseFileForPreview(url: url, type: type)
            currentStep = 3
        }))
#else
        return step2Content
#endif
    }
    
    // MARK: - Step 3
    var step3_mapFieldsPreview: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Step 3: Map Fields & Preview")
                .font(.title2.bold())
            Text("Review your data and map columns to the correct fields.")
                .font(.body)
                .foregroundColor(.secondary)
            if isFetchingGoogleSheet {
                ProgressView("Fetching Google Sheet...")
            } else if let error = googleSheetsError {
                Text(error)
                    .foregroundColor(.red)
            } else if !previewHeaders.isEmpty && previewHeaders[0].hasPrefix("[") {
                Text(previewHeaders[0])
                    .foregroundColor(.secondary)
            } else if !previewHeaders.isEmpty {
                ScrollView([.horizontal, .vertical]) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Column")
                                .font(.caption.bold())
                            Text("Map to Field")
                                .font(.caption.bold())
                        }
                        ForEach(Array(previewHeaders.enumerated()), id: \.offset) { idx, header in
                            HStack(spacing: 8) {
                                Text(header)
                                    .font(.caption)
                                    .frame(width: 140, alignment: .leading)
                                Picker("Map to", selection: Binding(
                                    get: { fieldMapping[header] ?? "" },
                                    set: { fieldMapping[header] = $0 }
                                )) {
                                    Text("(Ignore)").tag("")
                                    ForEach(Array(appFields.enumerated()), id: \.offset) { fieldIdx, field in
                                        Text(field).tag(field)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .frame(width: 140)
                            }
                        }
                        if !previewRows.isEmpty {
                            Divider()
                            VStack(alignment: .leading, spacing: 4) {
                                ForEach(Array(previewRows.enumerated()), id: \.offset) { rowIdx, row in
                                    HStack(spacing: 8) {
                                        ForEach(row, id: \.self) { cell in
                                            Text(cell)
                                                .font(.caption2)
                                                .frame(width: 140, alignment: .leading)
                                        }
                                    }
#if targetEnvironment(macCatalyst)
                                    .contextMenu {
                                        Button("Copy Row") {
                                            let rowString = row.joined(separator: ", ")
                                            NSPasteboard.general.clearContents()
                                            NSPasteboard.general.setString(rowString, forType: .string)
                                        }
                                    }
#endif
                                }
                            }
                        }
                        Button("Map All") {
                            autoMapFields()
                        }
                        .font(.footnote)
                        .padding(.top, 4)
                    }
                }
                .frame(maxHeight: 220)
            } else {
                Text("No preview available.")
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - File Parsing (Unified)
    private func parseFileForPreview(url: URL, type: ImportMethod) {
        switch type {
        case .csv:
            parseCSVPreview(url: url)
        case .excel:
            parseExcelPreview(url: url)
        case .googleSheets:
            // For Google Sheets, use the selectedSheetID
            guard !selectedSheetID.isEmpty else {
                previewHeaders = ["[No Google Sheet selected]"]
                previewRows = []
                return
            }
            isFetchingGoogleSheet = true
            googleSheetsError = nil
            Task {
                do {
                    let contacts = try await googleSheetsManager.importFromGoogleSheets(spreadsheetID: selectedSheetID)
                    await MainActor.run {
                        isFetchingGoogleSheet = false
                        if contacts.isEmpty {
                            previewHeaders = ["[No data found in Google Sheet]"]
                            previewRows = []
                        } else {
                            // Define headers based on ContactRecord structure
                            previewHeaders = [
                                "First Name", "Last Name", "Mailing Address", "City", "State", "ZIP Code",
                                "Email 1", "Email 2", "Phone 1", "Phone 2", "Phone 3", "Phone 4", "Phone 5", "Phone 6",
                                "Site Address", "Site City", "Site State", "Site ZIP", "Notes", "Farm"
                            ]
                            // Map ContactRecord to [String] for preview
                            previewRows = Array(contacts.prefix(5)).map { contact in
                                [
                                    contact.firstName,
                                    contact.lastName,
                                    contact.mailingAddress,
                                    contact.city,
                                    contact.state,
                                    String(contact.zipCode),
                                    contact.email1 ?? "",
                                    contact.email2 ?? "",
                                    contact.phoneNumber1 ?? "",
                                    contact.phoneNumber2 ?? "",
                                    contact.phoneNumber3 ?? "",
                                    contact.phoneNumber4 ?? "",
                                    contact.phoneNumber5 ?? "",
                                    contact.phoneNumber6 ?? "",
                                    contact.siteMailingAddress ?? "",
                                    contact.siteCity ?? "",
                                    contact.siteState ?? "",
                                    String(contact.siteZipCode),
                                    contact.notes ?? "",
                                    contact.farm
                                ]
                            }
                        }
                    }
                } catch {
                    await MainActor.run {
                        isFetchingGoogleSheet = false
                        googleSheetsError = error.localizedDescription
                        previewHeaders = ["[Failed to fetch Google Sheet: \(error.localizedDescription)]"]
                        previewRows = []
                    }
                }
            }
        case .template:
            previewHeaders = ["[Template preview not implemented]"]
            previewRows = []
        }
    }
    
    // MARK: - CSV preview parser
    private func parseCSVPreview(url: URL) {
        guard let data = try? Data(contentsOf: url),
              let content = String(data: data, encoding: .utf8) else {
            previewHeaders = []
            previewRows = []
            return
        }
        let lines = content.components(separatedBy: .newlines).filter { !$0.isEmpty }
        guard let headerLine = lines.first else {
            previewHeaders = []
            previewRows = []
            return
        }
        previewHeaders = headerLine.components(separatedBy: ",")
        previewRows = Array(lines.dropFirst().prefix(5)).map { $0.components(separatedBy: ",") }
        autoMapFields()
    }
    
    // MARK: - Excel preview parser
    private func parseExcelPreview(url: URL) {
        guard let file = XLSXFile(filepath: url.path) else {
            previewHeaders = ["[Failed to open Excel file]"]
            previewRows = []
            return
        }
        do {
            guard let sharedStrings = try? file.parseSharedStrings() else {
                previewHeaders = ["[Failed to parse shared strings]"]
                previewRows = []
                return
            }
            let workbooks = try file.parseWorkbooks()
            guard let firstSheet = workbooks.first?.sheets.items.first else {
                previewHeaders = ["[No sheets found]"]
                previewRows = []
                return
            }
            let worksheetPaths = try file.parseWorksheetPathsAndNames(workbook: workbooks.first!)
            guard let worksheetPath = worksheetPaths.first(where: { $0.name == firstSheet.name })?.path else {
                previewHeaders = ["[No worksheet path found]"]
                previewRows = []
                return
            }
            let worksheet = try file.parseWorksheet(at: worksheetPath)
            let rows = worksheet.data?.rows ?? []
            guard rows.count > 1 else {
                previewHeaders = ["[No data rows found]"]
                previewRows = []
                return
            }
            // Parse header
            let header = rows[0].cells.map { $0.stringValue(sharedStrings) ?? "" }
            previewHeaders = header
            // Parse up to 5 preview rows
            previewRows = Array(rows.dropFirst().prefix(5)).map { row in
                header.indices.map { idx in
                    if idx < row.cells.count {
                        return row.cells[idx].stringValue(sharedStrings) ?? ""
                    } else {
                        return ""
                    }
                }
            }
            autoMapFields()
        } catch {
            previewHeaders = ["[Failed to parse Excel file: \(error.localizedDescription)]"]
            previewRows = []
        }
    }
    
    // MARK: - Step 4
    var step4_confirmAndImport: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Step 4: Confirm & Import")
                .font(.title2.bold())
            Text("Review your selections and start the import process.")
                .font(.body)
                .foregroundColor(.secondary)
            if isImporting {
                ProgressView("Importing...")
            } else if let result = importResult {
                Text(result)
                    .foregroundColor(result.contains("success") ? .green : .red)
                if showImportCompletePrompt {
                    HStack(spacing: 16) {
                        Button("Import Another") {
                            // Reset all state for new import
                            currentStep = 1
                            selectedMethod = nil
                            selectedFileURL = nil
                            selectedSheetID = ""
                            fieldMapping = [:]
                            previewHeaders = []
                            previewRows = []
                            importResult = nil
                            showImportCompletePrompt = false
                        }
                        .buttonStyle(.bordered)
                        Button("Done") {
                            presentationMode.wrappedValue.dismiss()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            } else {
                Button("Start Import") {
                    isImporting = true
                    importResult = nil
                    showImportCompletePrompt = false
                    Task {
                        let result = await importCSVToCoreData()
                        isImporting = false
                        importResult = result
                        showImportCompletePrompt = result.contains("success")
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
    
    // MARK: - CSV Import Logic (now unified for all types)
    private func importCSVToCoreData() async -> String {
        guard let type = selectedFileType else { return "No file selected." }
        var headers: [String] = []
        var rows: [[String]] = []
        switch type {
        case .csv:
            guard let url = selectedFileURL,
                  let data = try? Data(contentsOf: url),
                  let content = String(data: data, encoding: .utf8) else {
                return "Failed to read file."
            }
            let lines = content.components(separatedBy: .newlines).filter { !$0.isEmpty }
            guard let headerLine = lines.first else { return "File is empty." }
            headers = headerLine.components(separatedBy: ",")
            rows = Array(lines.dropFirst()).map { $0.components(separatedBy: ",") }
            // Skip empty rows
            rows = rows.filter { row in
                row.enumerated().contains { (idx, val) in
                    let mapped = (headers.indices.contains(idx) ? fieldMapping[headers[idx]] : "") ?? ""
                    return !mapped.isEmpty && !val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                }
            }
        case .excel:
            guard let url = selectedFileURL else { return "No Excel file selected." }
            do {
                let contacts = try await excelImportManager.importSingleExcelFile(from: url)
                let context = PersistenceController.shared.container.viewContext
                for record in contacts {
                    await MainActor.run {
                        let contact = FarmContact(context: context)
                        contact.firstName = record.firstName
                        contact.lastName = record.lastName
                        contact.mailingAddress = record.mailingAddress
                        contact.city = record.city
                        contact.state = record.state
                        contact.zipCode = record.zipCode
                        contact.email1 = record.email1
                        contact.email2 = record.email2
                        contact.phoneNumber1 = record.phoneNumber1
                        contact.phoneNumber2 = record.phoneNumber2
                        contact.phoneNumber3 = record.phoneNumber3
                        contact.phoneNumber4 = record.phoneNumber4
                        contact.phoneNumber5 = record.phoneNumber5
                        contact.phoneNumber6 = record.phoneNumber6
                        contact.siteMailingAddress = record.siteMailingAddress
                        contact.siteCity = record.siteCity
                        contact.siteState = record.siteState
                        contact.siteZipCode = record.siteZipCode
                        contact.notes = record.notes
                        contact.farm = record.farm
                        contact.dateCreated = Date()
                        contact.dateModified = Date()
                    }
                }
                try? context.save()
                return "Imported \(contacts.count) contacts from Excel file successfully."
            } catch {
                return "Failed to import Excel file: \(error.localizedDescription)"
            }
        case .googleSheets:
            // Use previewHeaders/previewRows already fetched
            if previewHeaders.isEmpty || previewRows.isEmpty {
                return "No Google Sheets data loaded."
            }
            headers = previewHeaders
            // Use all rows, not just preview
            if !googleSheetsManager.importedContacts.isEmpty {
                rows = googleSheetsManager.importedContacts.map { c in
                    [
                        c.firstName,
                        c.lastName,
                        c.mailingAddress,
                        c.city,
                        c.state,
                        String(c.zipCode),
                        c.email1 ?? "",
                        c.email2 ?? "",
                        c.phoneNumber1 ?? "",
                        c.phoneNumber2 ?? "",
                        c.phoneNumber3 ?? "",
                        c.phoneNumber4 ?? "",
                        c.phoneNumber5 ?? "",
                        c.phoneNumber6 ?? "",
                        c.siteMailingAddress ?? "",
                        c.siteCity ?? "",
                        c.siteState ?? "",
                        String(c.siteZipCode),
                        c.notes ?? "",
                        c.farm
                    ]
                }
                // Skip empty rows
                rows = rows.filter { row in
                    row.enumerated().contains { (idx, val) in
                        let mapped = (headers.indices.contains(idx) ? fieldMapping[headers[idx]] : "") ?? ""
                        return !mapped.isEmpty && !val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    }
                }
            }
        case .template:
            return "Template import not implemented yet."
        }
        if rows.isEmpty { return "No data rows found." }
        // Auto-map fields based on header similarity
        let knownFields = [
            "First Name": "firstName",
            "Last Name": "lastName",
            "Mailing Address": "mailingAddress",
            "City": "city",
            "State": "state",
            "ZIP Code": "zipCode",
            "Email 1": "email1",
            "Email 2": "email2",
            "Phone 1": "phoneNumber1",
            "Phone 2": "phoneNumber2",
            "Phone 3": "phoneNumber3",
            "Phone 4": "phoneNumber4",
            "Phone 5": "phoneNumber5",
            "Phone 6": "phoneNumber6",
            "Site Address": "siteMailingAddress",
            "Site City": "siteCity",
            "Site State": "siteState",
            "Site ZIP": "siteZipCode",
            "Notes": "notes",
            "Farm": "farm"
        ]
        // For each header, try to match to a known field
        fieldMapping = [:]
        for header in previewHeaders {
            let normalized = header.lowercased().replacingOccurrences(of: " ", with: "")
            if let match = knownFields.first(where: { $0.key.lowercased().replacingOccurrences(of: " ", with: "") == normalized }) {
                fieldMapping[header] = match.value
            } else {
                fieldMapping[header] = "unmapped"
            }
        }
        // Build mapping: column index -> app field
        var colToField: [Int: String] = [:]
        for (i, header) in headers.enumerated() {
            if let mapped = fieldMapping[header], !mapped.isEmpty {
                colToField[i] = mapped
            }
        }
        if colToField.isEmpty { return "No fields mapped. Please map at least one field." }
        // Parse rows into ContactRecord
        var importedCount = 0
        let context = PersistenceController.shared.container.viewContext
        for values in rows {
            var recordDict: [String: String] = [:]
            for (colIdx, field) in colToField {
                if colIdx < values.count {
                    recordDict[field] = values[colIdx]
                }
            }
            // Build ContactRecord
            let record = ContactRecord(
                firstName: recordDict["firstName"] ?? "",
                lastName: recordDict["lastName"] ?? "",
                mailingAddress: recordDict["mailingAddress"] ?? "",
                city: recordDict["city"] ?? "",
                state: recordDict["state"] ?? "",
                zipCode: Int32(recordDict["zipCode"] ?? "0") ?? 0,
                email1: recordDict["email1"],
                email2: recordDict["email2"],
                phoneNumber1: recordDict["phoneNumber1"],
                phoneNumber2: recordDict["phoneNumber2"],
                phoneNumber3: recordDict["phoneNumber3"],
                phoneNumber4: recordDict["phoneNumber4"],
                phoneNumber5: recordDict["phoneNumber5"],
                phoneNumber6: recordDict["phoneNumber6"],
                siteMailingAddress: recordDict["siteMailingAddress"],
                siteCity: recordDict["siteCity"],
                siteState: recordDict["siteState"],
                siteZipCode: Int32(recordDict["siteZipCode"] ?? "0") ?? 0,
                notes: recordDict["notes"],
                farm: recordDict["farm"] ?? ""
            )
            // Save to Core Data
            await MainActor.run {
                let contact = FarmContact(context: context)
                contact.firstName = record.firstName
                contact.lastName = record.lastName
                contact.mailingAddress = record.mailingAddress
                contact.city = record.city
                contact.state = record.state
                contact.zipCode = record.zipCode
                contact.email1 = record.email1
                contact.email2 = record.email2
                contact.phoneNumber1 = record.phoneNumber1
                contact.phoneNumber2 = record.phoneNumber2
                contact.phoneNumber3 = record.phoneNumber3
                contact.phoneNumber4 = record.phoneNumber4
                contact.phoneNumber5 = record.phoneNumber5
                contact.phoneNumber6 = record.phoneNumber6
                contact.siteMailingAddress = record.siteMailingAddress
                contact.siteCity = record.siteCity
                contact.siteState = record.siteState
                contact.siteZipCode = record.siteZipCode
                contact.notes = record.notes
                contact.farm = record.farm
                contact.dateCreated = Date()
                contact.dateModified = Date()
            }
            importedCount += 1
        }
        do {
            try context.save()
        } catch {
            return "Failed to save contacts: \(error.localizedDescription)"
        }
        return "Import completed successfully. Imported \(importedCount) contacts."
    }
    
    private func autoMapFields() {
        let normalizedAppFields = appFields.map { $0.lowercased().replacingOccurrences(of: "[ _]", with: "", options: .regularExpression) }
        var phoneMapped = false
        for header in previewHeaders {
            let normalizedHeader = header.lowercased().replacingOccurrences(of: "[ _]", with: "", options: .regularExpression)
            // Map exact matches
            if let idx = normalizedAppFields.firstIndex(of: normalizedHeader) {
                fieldMapping[header] = appFields[idx]
                if appFields[idx].hasPrefix("phoneNumber") { phoneMapped = true }
                continue
            }
            // Fuzzy phone mapping
            if !phoneMapped && (normalizedHeader.contains("phone") || normalizedHeader.contains("mobile") || normalizedHeader.contains("cell")) {
                // If header is like 'phone1', 'phone 1', 'phone_1', map to phoneNumber1, etc.
                if let match = normalizedHeader.range(of: "phone(\\d+)", options: .regularExpression),
                   let numStr = Int(normalizedHeader[match].replacingOccurrences(of: "phone", with: "")),
                   numStr >= 1 && numStr <= 6 {
                    fieldMapping[header] = "phoneNumber\(numStr)"
                    phoneMapped = true
                    continue
                }
                // Otherwise, map first phone-like header to phoneNumber1
                fieldMapping[header] = "phoneNumber1"
                phoneMapped = true
                continue
            }
            fieldMapping[header] = ""
        }
    }
}

// MARK: - Supporting Types

enum ImportMethod: CaseIterable, Equatable {
    case csv, excel, googleSheets, template
    
    var displayName: String {
        switch self {
        case .csv: return "CSV File"
        case .excel: return "Excel File"
        case .googleSheets: return "Google Sheets"
        case .template: return "Import Template"
        }
    }
    var iconName: String {
        switch self {
        case .csv: return "doc.text"
        case .excel: return "tablecells"
        case .googleSheets: return "link"
        case .template: return "square.grid.2x2"
        }
    }
    var description: String {
        switch self {
        case .csv: return "Import from a comma-separated values file."
        case .excel: return "Import from an Excel spreadsheet."
        case .googleSheets: return "Import directly from a Google Sheet."
        case .template: return "Use a saved import template."
        }
    }
}

// MARK: - Mac Catalyst Pointer/Hover/ContextMenu Support
struct ImportMethodButton: View {
    let method: ImportMethod
    @Binding var selectedMethod: ImportMethod?
    @State private var isHovered = false
    var body: some View {
        Button(action: { selectedMethod = method }) {
            HStack {
                Image(systemName: method.iconName)
                VStack(alignment: .leading) {
                    Text(method.displayName)
                        .font(.headline)
                    Text(method.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                if selectedMethod == method {
                    Image(systemName: "checkmark.circle.fill").foregroundColor(.accentColor)
                }
            }
            .padding(8)
#if targetEnvironment(macCatalyst)
            .background(isHovered ? Color.accentColor.opacity(0.18) : (selectedMethod == method ? Color.accentColor.opacity(0.1) : Color.clear))
#else
            .background(selectedMethod == method ? Color.accentColor.opacity(0.1) : Color.clear)
#endif
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
#if targetEnvironment(macCatalyst)
        .onHover { hovering in
            isHovered = hovering
        }
#endif
    }
}

struct HoverButton: View {
    let label: String
    let action: () -> Void
    @State private var isHovered = false
    var body: some View {
        Button(action: action) {
            Text(label)
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
#if targetEnvironment(macCatalyst)
                .background(isHovered ? Color.accentColor.opacity(0.18) : Color.accentColor.opacity(0.1))
#else
                .background(Color.accentColor.opacity(0.1))
#endif
                .cornerRadius(8)
        }
        .buttonStyle(.plain)
#if targetEnvironment(macCatalyst)
        .onHover { hovering in
            isHovered = hovering
        }
#endif
    }
}

// MARK: - Mac Catalyst File Drop Modifier
#if targetEnvironment(macCatalyst)
struct FileDropModifier: ViewModifier {
    let selectedMethod: ImportMethod?
    let onFileDropped: (URL, ImportMethod) -> Void
    func body(content: Content) -> some View {
        content.onDrop(of: [UTType.fileURL], isTargeted: nil) { providers in
            guard let provider = providers.first else { return false }
            _ = provider.loadObject(ofClass: URL.self) { url, _ in
                guard let url = url else { return }
                let ext = url.pathExtension.lowercased()
                var type: ImportMethod? = nil
                if ext == "csv" { type = .csv }
                else if ext == "xlsx" { type = .excel }
                // Only accept if matches selected method or is a supported type
                if let type = type, selectedMethod == nil || selectedMethod == type {
                    DispatchQueue.main.async {
                        onFileDropped(url, type)
                    }
                }
            }
            return true
        }
    }
}
#endif

#Preview {
    ImportView()
        .environmentObject(ThemeViewModel())
} 