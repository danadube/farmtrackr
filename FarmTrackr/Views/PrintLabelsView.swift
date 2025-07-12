//
//  PrintLabelsView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData
import UIKit

// 1. Add AddressType enum
enum AddressType: String, CaseIterable, Identifiable {
    case mailing = "Mailing Address"
    case site = "Site Address"
    var id: String { self.rawValue }
}

struct PrintLabelsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @ObservedObject var templateManager: LabelTemplateManager
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FarmContact.lastName, ascending: true)],
        animation: .default
    ) private var contacts: FetchedResults<FarmContact>
    
    @State private var selectedFarm: String = ""
    @State private var labelFormat: AveryLabelFormat = .avery5160
    @State private var showingPreview = false
    @State private var showingPrintSheet = false
    @State private var addressType: AddressType = .mailing
    @State private var selectedTemplate: LabelTemplate?
    @State private var showingTemplateSelector = false
    
    enum AveryLabelFormat: String, CaseIterable {
        case avery5160 = "Avery 5160 (1\" x 2.625\")"
        case avery5161 = "Avery 5161 (1\" x 4\")"
        case avery5162 = "Avery 5162 (1.33\" x 4\")"
        case avery5163 = "Avery 5163 (2\" x 4\")"
        case avery5164 = "Avery 5164 (3.33\" x 4\")"
        case avery5167 = "Avery 5167 (0.5\" x 1.75\")"
        
        // Label size in inches
        var labelSize: (width: Double, height: Double) {
            switch self {
            case .avery5160: return (2.625, 1.0)
            case .avery5161: return (4.0, 1.0)
            case .avery5162: return (4.0, 1.33)
            case .avery5163: return (4.0, 2.0)
            case .avery5164: return (4.0, 3.33)
            case .avery5167: return (1.75, 0.5)
            }
        }
        // Number of columns and rows
        var columns: Int {
            switch self {
            case .avery5160: return 3
            case .avery5161: return 2
            case .avery5162: return 2
            case .avery5163: return 2
            case .avery5164: return 2
            case .avery5167: return 4
            }
        }
        var rows: Int {
            switch self {
            case .avery5160: return 10
            case .avery5161: return 10
            case .avery5162: return 7
            case .avery5163: return 5
            case .avery5164: return 3
            case .avery5167: return 20
            }
        }
        // Margins and gaps in inches
        var topMargin: Double {
            switch self {
            case .avery5160: return 0.5
            default: return 0.5
            }
        }
        var sideMargin: Double {
            switch self {
            case .avery5160: return 0.1875
            default: return 0.1875
            }
        }
        var horizontalGap: Double {
            switch self {
            case .avery5160: return 0.125
            default: return 0.125
            }
        }
        var verticalGap: Double {
            switch self {
            case .avery5160: return 0.0
            default: return 0.0
            }
        }
        // Sheet size in inches
        var sheetSize: (width: Double, height: Double) { (8.5, 11.0) }
    }
    
    var availableFarms: [String] {
        Array(Set(contacts.compactMap { $0.farm }.filter { !$0.isEmpty })).sorted()
    }
    
    var selectedFarmContacts: [FarmContact] {
        if selectedFarm.isEmpty {
            return []
        }
        return contacts.filter { $0.farm == selectedFarm }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "printer")
                        .font(.system(size: 36))
                        .foregroundColor(Constants.Colors.primary)
                    
                    Text("Print Labels")
                        .font(Constants.Typography.headerFont)
                        .foregroundColor(Constants.Colors.text)
                        .padding(.top, 2)
                    
                    Text("Select a farm and template to print labels")
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(.secondaryLabel)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 2)
                }
                .padding(.top, 8)
                .padding(.horizontal, 16)
                
                VStack(spacing: 12) {
                    // Farm Selection
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Select Farm")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        Picker("Farm", selection: $selectedFarm) {
                            Text("Choose a farm...").tag("")
                            ForEach(availableFarms, id: \.self) { farm in
                                Text(farm).tag(farm)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity)
                        .padding(6)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                    // Template Selection
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Label Template")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        Button(action: { showingTemplateSelector = true }) {
                            HStack {
                                Text(selectedTemplate?.name ?? "Select Template")
                                    .foregroundColor(selectedTemplate == nil ? .secondary : .primary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                    }
                    
                    // Label Format Selection
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Label Format")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        Picker("Label Format", selection: $labelFormat) {
                            ForEach(AveryLabelFormat.allCases, id: \.self) { format in
                                Text(format.rawValue).tag(format)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity)
                        .padding(6)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                    
                    // Address Type Picker (only show if template supports it)
                    if selectedTemplate == nil || selectedTemplate?.fields.contains(where: { $0.type == .mailingAddress || $0.type == .siteAddress }) == true {
                        Picker("Address Type", selection: $addressType) {
                            ForEach(AddressType.allCases) { type in
                                Text(type.rawValue).tag(type)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    // Contact Count
                    if !selectedFarm.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Contacts in \(selectedFarm)")
                                .font(Constants.Typography.titleFont)
                                .foregroundColor(Constants.Colors.text)
                            Text("\(selectedFarmContacts.count) contacts will be printed")
                                .font(Constants.Typography.bodyFont)
                                .foregroundColor(.secondaryLabel)
                        }
                    }
                    // Action Buttons
                    VStack(spacing: 8) {
                        if !selectedFarm.isEmpty && !selectedFarmContacts.isEmpty && selectedTemplate != nil {
                            Button(action: { showingPreview = true }) {
                                Text("Preview Labels (\(selectedFarmContacts.count))")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                            }
                            .primaryButtonStyle()
                            .padding(.vertical, 2)
                        }
                        if !selectedFarm.isEmpty && !selectedFarmContacts.isEmpty && selectedTemplate != nil {
                            Button(action: {
                                let printInfo = UIPrintInfo(dictionary: nil)
                                printInfo.outputType = .photo
                                printInfo.jobName = "Labels"
                                
                                let controller = UIPrintInteractionController.shared
                                controller.printInfo = printInfo
                                
                                let sheetImages = renderAllSheetImages()
                                if sheetImages.count == 1 {
                                    controller.printingItem = sheetImages[0]
                                } else {
                                    controller.printingItems = sheetImages
                                }
                                
                                controller.present(animated: true) { _, _, _ in
                                    // Print dialog dismissed
                                }
                            }) {
                                Text("Print Labels")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                            }
                            .secondaryButtonStyle()
                            .padding(.vertical, 2)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .sheet(isPresented: $showingPreview) {
            LabelPreviewView(
                contacts: selectedFarmContacts,
                labelFormat: labelFormat,
                addressType: addressType,
                template: selectedTemplate,
                templateManager: templateManager
            )
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showingTemplateSelector) {
            TemplateSelectorView(
                templateManager: templateManager,
                selectedTemplate: $selectedTemplate
            )
        }

    }
    
    // Helper: Paginate contacts into pages of N labels
    private var pages: [[FarmContact]] {
        let labelsPerPage = labelFormat.columns * labelFormat.rows
        var result: [[FarmContact]] = []
        let farmContacts = selectedFarmContacts
        var idx = 0
        while idx < farmContacts.count {
            let end = min(idx + labelsPerPage, farmContacts.count)
            result.append(Array(farmContacts[idx..<end]))
            idx = end
        }
        // Always show at least one page
        if result.isEmpty { result = [[]] }
        return result
    }
    
    // Helper to render all pages as images for printing
    func renderAllSheetImages() -> [UIImage] {
        let farmContacts = selectedFarmContacts
        let labelsPerPage = labelFormat.columns * labelFormat.rows
        var images: [UIImage] = []
        var idx = 0
        while idx < farmContacts.count || (farmContacts.isEmpty && idx == 0) {
            let end = min(idx + labelsPerPage, farmContacts.count)
            let pageContacts = farmContacts.isEmpty ? [] : Array(farmContacts[idx..<end])
            let size = CGSize(width: labelFormat.sheetSize.width * 72, height: labelFormat.sheetSize.height * 72)
            let controller = UIHostingController(rootView:
                ZStack {
                    Color.white // Ensure white background
                    PrintLabelSheetView(
                        contacts: pageContacts,
                        labelFormat: labelFormat,
                        addressType: addressType,
                        template: selectedTemplate,
                        templateManager: templateManager
                    )
                }
                .frame(width: size.width, height: size.height)
            )
            // Force layout before rendering
            let view = controller.view
            view?.bounds = CGRect(origin: .zero, size: size)
            view?.backgroundColor = .white
            let window = UIWindow(frame: CGRect(origin: .zero, size: size))
            window.rootViewController = controller
            window.makeKeyAndVisible()
            controller.view.setNeedsLayout()
            controller.view.layoutIfNeeded()
            let renderer = UIGraphicsImageRenderer(size: size)
            let image = renderer.image { ctx in
                view?.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
            }
            images.append(image)
            idx += labelsPerPage
            if farmContacts.isEmpty { break }
        }
        return images
    }
}

// Update LabelPreviewView and PrintSheetView to accept addressType
struct LabelPreviewView: View {
    let contacts: [FarmContact]
    let labelFormat: PrintLabelsView.AveryLabelFormat
    let addressType: AddressType
    let template: LabelTemplate?
    let templateManager: LabelTemplateManager
    @Environment(\.dismiss) private var dismiss
    @State private var zoomScale: CGFloat = 1.0
    @State private var showPrintSheet = false
    
    // Helper: Paginate contacts into pages of N labels
    private var pages: [[FarmContact]] {
        let labelsPerPage = labelFormat.columns * labelFormat.rows
        var result: [[FarmContact]] = []
        var idx = 0
        while idx < contacts.count {
            let end = min(idx + labelsPerPage, contacts.count)
            result.append(Array(contacts[idx..<end]))
            idx = end
        }
        // Always show at least one page
        if result.isEmpty { result = [[]] }
        return result
    }
    
    // Helper to render all pages as images for printing
    func renderAllSheetImages() -> [UIImage] {
        let labelsPerPage = labelFormat.columns * labelFormat.rows
        var images: [UIImage] = []
        var idx = 0
        while idx < contacts.count || (contacts.isEmpty && idx == 0) {
            let end = min(idx + labelsPerPage, contacts.count)
            let pageContacts = contacts.isEmpty ? [] : Array(contacts[idx..<end])
            let size = CGSize(width: labelFormat.sheetSize.width * 72, height: labelFormat.sheetSize.height * 72)
            let controller = UIHostingController(rootView:
                ZStack {
                    Color.white // Ensure white background
                    PrintLabelSheetView(
                        contacts: pageContacts,
                        labelFormat: labelFormat,
                        addressType: addressType,
                        template: template,
                        templateManager: templateManager
                    )
                }
                .frame(width: size.width, height: size.height)
            )
            let view = controller.view
            view?.bounds = CGRect(origin: .zero, size: size)
            view?.backgroundColor = .white
            let window = UIWindow(frame: CGRect(origin: .zero, size: size))
            window.rootViewController = controller
            window.makeKeyAndVisible()
            controller.view.setNeedsLayout()
            controller.view.layoutIfNeeded()
            let renderer = UIGraphicsImageRenderer(size: size)
            let image = renderer.image { ctx in
                view?.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
            }
            images.append(image)
            idx += labelsPerPage
            if contacts.isEmpty { break }
        }
        return images
    }
    

    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Custom button bar
                HStack(spacing: 16) {
                                    Button(action: {
                    let printInfo = UIPrintInfo(dictionary: nil)
                    printInfo.outputType = .photo
                    printInfo.jobName = "Labels"
                    
                    let controller = UIPrintInteractionController.shared
                    controller.printInfo = printInfo
                    
                    let sheetImages = renderAllSheetImages()
                    if sheetImages.count == 1 {
                        controller.printingItem = sheetImages[0]
                    } else {
                        controller.printingItems = sheetImages
                    }
                    
                    controller.present(animated: true) { _, _, _ in
                        // Print dialog dismissed
                    }
                }) {
                    Text("Print")
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.borderedProminent)
                    Button(action: { dismiss() }) {
                        Text("Done")
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
                .frame(maxWidth: 600)
                
                // Sheet preview (all pages stacked vertically)
                GeometryReader { geo in
                    ScrollView([.vertical, .horizontal]) {
                        VStack(spacing: 40) {
                            ForEach(0..<pages.count, id: \.self) { pageIndex in
                                                            LabelSheetView(
                                contacts: pages[pageIndex],
                                labelFormat: labelFormat,
                                addressType: addressType,
                                template: template,
                                templateManager: templateManager
                            )
                                .overlay(
                                    Text("Page \(pageIndex + 1)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .padding(6)
                                        .background(Color(.systemGray6).opacity(0.8))
                                        .cornerRadius(8)
                                        .padding(),
                                    alignment: .topTrailing
                                )
                            }
                        }
                        .padding(.vertical, 20)
                    }
                    .ignoresSafeArea()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("Label Preview")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

}

// New: Extracted single sheet view, fills in column-major order, pads with nils if needed
struct LabelSheetView: View {
    let contacts: [FarmContact]
    let labelFormat: PrintLabelsView.AveryLabelFormat
    let addressType: AddressType
    let template: LabelTemplate?
    let templateManager: LabelTemplateManager
    
    var body: some View {
        let columns = labelFormat.columns
        let rows = labelFormat.rows
        let totalLabels = columns * rows
        
        // Pad contacts to fill the sheet
        let paddedContacts: [FarmContact?] = contacts.map { Optional($0) } + Array(repeating: nil, count: max(0, totalLabels - contacts.count))
        
        // Column-major order
        let columnLabels: [[FarmContact?]] = (0..<columns).map { col in
            (0..<rows).map { row in
                let idx = row + col * rows
                return idx < paddedContacts.count ? paddedContacts[idx] : nil
            }
        }
        
        VStack(spacing: 0) {
            // Top margin
            Spacer().frame(height: labelFormat.topMargin * 72)
            
            // Labels grid
            HStack(alignment: .top, spacing: labelFormat.horizontalGap * 72) {
                ForEach(0..<columns, id: \.self) { col in
                    VStack(spacing: labelFormat.verticalGap * 72) {
                        ForEach(0..<rows, id: \.self) { row in
                            let contact = columnLabels[col][row]
                            ZStack {
                                Color.white
                                if let contact = contact {
                                    if let template = template {
                                        // Use custom template
                                        VStack(alignment: .center, spacing: 2) {
                                            Text(templateManager.renderLabel(for: contact, using: template))
                                                .font(.custom(template.fontName, size: template.fontSize))
                                                .foregroundColor(.black)
                                                .multilineTextAlignment(.center)
                                                .lineLimit(nil)
                                        }
                                        .padding(4)
                                    } else {
                                        // Use default format
                                        VStack(alignment: .center, spacing: 2) {
                                            let fullName = contact.fullName
                                            let address = addressType == .mailing ? (contact.mailingAddress ?? "") : contact.displaySiteAddress
                                            let cityStateZip = addressType == .mailing ? ((contact.city ?? "") + (contact.state != nil ? ", \(contact.state!)" : "") + " \(contact.formattedZipCode)") : ""
                                            
                                            Spacer()
                                            Text(fullName)
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundColor(.black)
                                                .lineLimit(1)
                                                .multilineTextAlignment(.center)
                                            Text(address)
                                                .font(.system(size: 10))
                                                .foregroundColor(.black)
                                                .lineLimit(2)
                                                .multilineTextAlignment(.center)
                                            if addressType == .mailing && !cityStateZip.isEmpty {
                                                Text(cityStateZip)
                                                    .font(.system(size: 10))
                                                    .foregroundColor(.black)
                                                    .lineLimit(1)
                                                    .multilineTextAlignment(.center)
                                            }
                                            Spacer()
                                        }
                                        .padding(4)
                                    }
                                }
                            }
                            .frame(width: labelFormat.labelSize.width * 72, height: labelFormat.labelSize.height * 72)
                            .border(Color.gray, width: 0.5)
                        }
                    }
                }
            }
            .padding(.leading, labelFormat.sideMargin * 72)
            .padding(.trailing, labelFormat.sideMargin * 72)
            
            Spacer()
        }
        .background(Color(.systemGray5))
        .frame(width: labelFormat.sheetSize.width * 72, height: labelFormat.sheetSize.height * 72)
    }
}

// Print-only version without borders or background
struct PrintLabelSheetView: View {
    let contacts: [FarmContact]
    let labelFormat: PrintLabelsView.AveryLabelFormat
    let addressType: AddressType
    let template: LabelTemplate?
    let templateManager: LabelTemplateManager
    
    var body: some View {
        let columns = labelFormat.columns
        let rows = labelFormat.rows
        let totalLabels = columns * rows
        
        // Pad contacts to fill the sheet
        let paddedContacts: [FarmContact?] = contacts.map { Optional($0) } + Array(repeating: nil, count: max(0, totalLabels - contacts.count))
        
        // Column-major order
        let columnLabels: [[FarmContact?]] = (0..<columns).map { col in
            (0..<rows).map { row in
                let idx = row + col * rows
                return idx < paddedContacts.count ? paddedContacts[idx] : nil
            }
        }
        
        VStack(spacing: 0) {
            // Top margin
            Spacer().frame(height: labelFormat.topMargin * 72)
            
            // Labels grid
            HStack(alignment: .top, spacing: labelFormat.horizontalGap * 72) {
                ForEach(0..<columns, id: \.self) { col in
                    VStack(spacing: labelFormat.verticalGap * 72) {
                        ForEach(0..<rows, id: \.self) { row in
                            let contact = columnLabels[col][row]
                            ZStack {
                                Color.white
                                if let contact = contact {
                                    if let template = template {
                                        // Use custom template
                                        VStack(alignment: .center, spacing: 2) {
                                            Text(templateManager.renderLabel(for: contact, using: template))
                                                .font(.custom(template.fontName, size: template.fontSize))
                                                .foregroundColor(.black)
                                                .multilineTextAlignment(.center)
                                                .lineLimit(nil)
                                        }
                                        .padding(4)
                                    } else {
                                        // Use default format
                                        VStack(alignment: .center, spacing: 2) {
                                            let fullName = contact.fullName
                                            let address = addressType == .mailing ? (contact.mailingAddress ?? "") : contact.displaySiteAddress
                                            let cityStateZip = addressType == .mailing ? ((contact.city ?? "") + (contact.state != nil ? ", \(contact.state!)" : "") + " \(contact.formattedZipCode)") : ""
                                            
                                            Spacer()
                                            Text(fullName)
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundColor(.black)
                                                .lineLimit(1)
                                                .multilineTextAlignment(.center)
                                            Text(address)
                                                .font(.system(size: 10))
                                                .foregroundColor(.black)
                                                .lineLimit(2)
                                                .multilineTextAlignment(.center)
                                            if addressType == .mailing && !cityStateZip.isEmpty {
                                                Text(cityStateZip)
                                                    .font(.system(size: 10))
                                                    .foregroundColor(.black)
                                                    .lineLimit(1)
                                                    .multilineTextAlignment(.center)
                                            }
                                            Spacer()
                                        }
                                        .padding(4)
                                    }
                                }
                            }
                            .frame(width: labelFormat.labelSize.width * 72, height: labelFormat.labelSize.height * 72)
                            // No border for printing
                        }
                    }
                }
            }
            .padding(.leading, labelFormat.sideMargin * 72)
            .padding(.trailing, labelFormat.sideMargin * 72)
            
            Spacer()
        }
        .background(Color.white) // White background for printing
        .frame(width: labelFormat.sheetSize.width * 72, height: labelFormat.sheetSize.height * 72)
    }
}

// UIKit print bridge - updated to handle multiple images
import UIKit
struct PrintInteractionView: UIViewControllerRepresentable {
    let sheetImages: [UIImage]
    var onPrintComplete: (() -> Void)? = nil
    
    func makeUIViewController(context: Context) -> UIPrintInteractionControllerWrapper {
        let wrapper = UIPrintInteractionControllerWrapper(sheetImages: sheetImages)
        wrapper.onPrintComplete = onPrintComplete
        return wrapper
    }
    
    func updateUIViewController(_ uiViewController: UIPrintInteractionControllerWrapper, context: Context) {}
}

class UIPrintInteractionControllerWrapper: UIViewController {
    let sheetImages: [UIImage]
    var onPrintComplete: (() -> Void)?
    
    init(sheetImages: [UIImage]) {
        self.sheetImages = sheetImages
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            let printInfo = UIPrintInfo(dictionary: nil)
            printInfo.outputType = .photo
            printInfo.jobName = "Labels"
            
            let controller = UIPrintInteractionController.shared
            controller.printInfo = printInfo
            
            // Print all pages
            if self.sheetImages.count == 1 {
                controller.printingItem = self.sheetImages[0]
            } else {
                controller.printingItems = self.sheetImages
            }
            
            controller.present(animated: true) { _, _, _ in
                DispatchQueue.main.async {
                    self.dismiss(animated: true) {
                        self.onPrintComplete?()
                    }
                }
            }
        }
    }
}

struct PrintSheetView: View {
    let contacts: [FarmContact]
    let labelFormat: PrintLabelsView.AveryLabelFormat
    let addressType: AddressType
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                Image(systemName: "printer")
                    .font(.system(size: 60))
                    .foregroundColor(Constants.Colors.primary)
                
                Text("Print Labels")
                    .font(Constants.Typography.headerFont)
                    .foregroundColor(Constants.Colors.text)
                
                Text("Printing \(contacts.count) labels using \(labelFormat.rawValue)")
                    .font(Constants.Typography.bodyFont)
                    .foregroundColor(.secondaryLabel)
                    .multilineTextAlignment(.center)
                
                // Simulated print progress
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
                    .scaleEffect(1.5)
                
                Text("Printing...")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .primaryButtonStyle()
                .padding(.bottom, Constants.Spacing.medium)
            }
            .padding(Constants.Spacing.large)
            .navigationTitle("Printing")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct TemplateSelectorView: View {
    @ObservedObject var templateManager: LabelTemplateManager
    @Binding var selectedTemplate: LabelTemplate?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                ForEach(templateManager.templates) { template in
                    Button(action: {
                        selectedTemplate = template
                        dismiss()
                    }) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(template.name)
                                    .font(.headline)
                                Text(template.description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if selectedTemplate?.id == template.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("Select Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    PrintLabelsView(templateManager: LabelTemplateManager())
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 