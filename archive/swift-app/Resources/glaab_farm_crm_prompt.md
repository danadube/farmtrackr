# Glaab Farm CRM App - Cursor Development Prompt

## Project Overview
Create a comprehensive Farm CRM (Customer Relationship Management) application for Glaab Farm that runs natively on iPad with full Mac desktop compatibility. The app should manage farm customer data, contacts, and relationships with robust import/export capabilities.

## Technical Requirements

### Platform & Framework
- **Primary Platform**: iPad (iOS 15.0+)
- **Secondary Platform**: Mac desktop (macOS 12.0+)
- **Development**: Xcode with Swift 5.0+
- **Architecture**: SwiftUI for UI, Core Data for persistence
- **Design Pattern**: MVVM (Model-View-ViewModel)

### Core Data Model
Based on the provided CSV structure, create the following Core Data entity:

```swift
// FarmContact Entity
@objc(FarmContact)
public class FarmContact: NSManagedObject {
    @NSManaged public var firstName: String
    @NSManaged public var lastName: String
    @NSManaged public var mailingAddress: String
    @NSManaged public var city: String
    @NSManaged public var state: String
    @NSManaged public var zipCode: Int32
    @NSManaged public var email1: String?
    @NSManaged public var email2: String?
    @NSManaged public var phoneNumber1: String?
    @NSManaged public var phoneNumber2: String?
    @NSManaged public var phoneNumber3: String?
    @NSManaged public var phoneNumber4: String?
    @NSManaged public var phoneNumber5: String?
    @NSManaged public var phoneNumber6: String?
    @NSManaged public var siteMailingAddress: String?
    @NSManaged public var siteCity: String?
    @NSManaged public var siteState: String?
    @NSManaged public var siteZipCode: Int32
    @NSManaged public var notes: String?
    @NSManaged public var farm: String
    @NSManaged public var dateCreated: Date
    @NSManaged public var dateModified: Date
}
```

## Key Features to Implement

### 1. Data Import System
- **CSV Import**: Read and parse CSV files with error handling
- **Excel Import**: Support .xlsx and .xls formats using appropriate libraries
- **Data Validation**: Verify phone numbers, email formats, zip codes
- **Duplicate Detection**: Identify and merge duplicate entries
- **Import Preview**: Show data before confirming import

### 2. Export Capabilities
- **PDF Export**: Generate professional PDF reports with farm branding
- **CSV Export**: Export filtered or complete datasets
- **Excel Export**: Create formatted .xlsx files with multiple sheets
- **Label Generation**: Create mailing labels in various formats (Avery templates)
- **Batch Operations**: Export multiple lists simultaneously

### 3. User Interface Design

#### iPad Interface
- **Master-Detail Layout**: Contact list on left, details on right
- **Touch-Optimized**: Large touch targets, gesture support
- **Split View**: Multiple lists viewable simultaneously
- **Toolbar**: Quick access to import/export functions
- **Search & Filter**: Real-time search with multiple filter options

#### Mac Desktop Interface
- **Menu Bar**: Full menu system with keyboard shortcuts
- **Sidebar Navigation**: Collapsible sidebar for lists and categories
- **Multi-Window Support**: Multiple contact windows open simultaneously
- **Keyboard Navigation**: Full keyboard accessibility

### 4. List Management
- **Multiple Views**: 
  - All Contacts
  - By Farm
  - By State/Region
  - Recent Additions
  - Favorites/Starred
- **Custom Lists**: User-created filtered lists
- **Sort Options**: Name, date, farm, location
- **Quick Actions**: Call, email, message directly from list

### 5. Contact Management
- **Detailed Views**: Complete contact information display
- **Edit Mode**: Inline editing with validation
- **Communication History**: Track calls, emails, meetings
- **Notes System**: Rich text notes with timestamps
- **Photo Support**: Contact photos and farm images

## Technical Implementation Guidelines

### SwiftUI Views Structure
```swift
// Main App Structure
@main
struct GlaabFarmCRMApp: App {
    let persistenceController = PersistenceController.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}

// Main Content View
struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(sortDescriptors: []) private var contacts: FetchedResults<FarmContact>
    
    var body: some View {
        NavigationView {
            ContactListView()
            ContactDetailView()
        }
        .navigationViewStyle(DoubleColumnNavigationViewStyle())
    }
}
```

### Data Import Manager
```swift
class DataImportManager: ObservableObject {
    @Published var importProgress: Double = 0
    @Published var importStatus: String = ""
    
    func importCSV(from url: URL) async throws {
        // CSV parsing implementation
    }
    
    func importExcel(from url: URL) async throws {
        // Excel parsing implementation
    }
    
    func validateData(_ records: [ContactRecord]) -> [ValidationError] {
        // Data validation logic
    }
}
```

### Export Manager
```swift
class ExportManager: ObservableObject {
    func exportToPDF(contacts: [FarmContact]) async throws -> URL {
        // PDF generation using PDFKit
    }
    
    func exportToCSV(contacts: [FarmContact]) async throws -> URL {
        // CSV export implementation
    }
    
    func exportToExcel(contacts: [FarmContact]) async throws -> URL {
        // Excel export implementation
    }
    
    func generateAvery5160Labels(contacts: [FarmContact]) async throws -> URL {
        // Generate Avery 5160 labels (30 per sheet, 2⅝" × 1")
        return try await createAveryLabels(contacts: contacts, format: .avery5160)
    }
    
    func generateCustomLabels(contacts: [FarmContact], format: LabelFormat) async throws -> URL {
        // Custom label generation for other Avery formats
        return try await createAveryLabels(contacts: contacts, format: format)
    }
    
    private func createAveryLabels(contacts: [FarmContact], format: LabelFormat) async throws -> URL {
        // Label generation implementation
    }
}

enum LabelFormat {
    case avery5160 // 30 labels: 2⅝" × 1"
    case avery5161 // 20 labels: 4" × 1"
    case avery5162 // 14 labels: 4" × 1⅓"
    case avery5163 // 10 labels: 4" × 2"
    case avery5164 // 6 labels: 4" × 3⅓"
    
    var dimensions: (width: CGFloat, height: CGFloat) {
        switch self {
        case .avery5160: return (190.5, 72) // 2⅝" × 1" in points
        case .avery5161: return (288, 72)   // 4" × 1" in points
        case .avery5162: return (288, 96)   // 4" × 1⅓" in points
        case .avery5163: return (288, 144)  // 4" × 2" in points
        case .avery5164: return (288, 240)  // 4" × 3⅓" in points
        }
    }
    
    var layout: (columns: Int, rows: Int) {
        switch self {
        case .avery5160: return (3, 10)  // 3 columns, 10 rows = 30 labels
        case .avery5161: return (2, 10)  // 2 columns, 10 rows = 20 labels
        case .avery5162: return (2, 7)   // 2 columns, 7 rows = 14 labels
        case .avery5163: return (2, 5)   // 2 columns, 5 rows = 10 labels
        case .avery5164: return (2, 3)   // 2 columns, 3 rows = 6 labels
        }
    }
}
```

## Avery 5160 Label Implementation

### Label Generation Service
```swift
import PDFKit
import CoreGraphics

class AveryLabelService {
    static let shared = AveryLabelService()
    
    func generateAvery5160Labels(contacts: [FarmContact]) -> PDFDocument {
        let pdfDocument = PDFDocument()
        let pageSize = CGSize(width: 612, height: 792) // 8.5" × 11" in points
        
        // Avery 5160 specifications
        let labelWidth: CGFloat = 190.5  // 2⅝" in points
        let labelHeight: CGFloat = 72     // 1" in points
        let marginLeft: CGFloat = 21.25   // 0.295" left margin
        let marginTop: CGFloat = 36       // 0.5" top margin
        let gutterH: CGFloat = 11.25      // Horizontal gutter between labels
        let gutterV: CGFloat = 0          // Vertical gutter between labels
        
        let labelsPerRow = 3
        let rowsPerPage = 10
        let labelsPerPage = labelsPerRow * rowsPerPage
        
        var contactIndex = 0
        let totalContacts = contacts.count
        
        while contactIndex < totalContacts {
            let page = PDFPage()
            let context = CGContext.pdf(mediaBox: CGRect(origin: .zero, size: pageSize))
            
            for row in 0..<rowsPerPage {
                for col in 0..<labelsPerRow {
                    guard contactIndex < totalContacts else { break }
                    
                    let contact = contacts[contactIndex]
                    let x = marginLeft + CGFloat(col) * (labelWidth + gutterH)
                    let y = pageSize.height - marginTop - CGFloat(row + 1) * labelHeight
                    
                    drawContactOnLabel(
                        contact: contact,
                        in: context,
                        rect: CGRect(x: x, y: y, width: labelWidth, height: labelHeight)
                    )
                    
                    contactIndex += 1
                }
                if contactIndex >= totalContacts { break }
            }
            
            page.setValue(context, forAnnotationKey: .contents)
            pdfDocument.insert(page, at: pdfDocument.pageCount)
        }
        
        return pdfDocument
    }
    
    private func drawContactOnLabel(contact: FarmContact, in context: CGContext, rect: CGRect) {
        let padding: CGFloat = 4
        let workingRect = rect.insetBy(dx: padding, dy: padding)
        
        // Format address
        let fullName = "\(contact.firstName) \(contact.lastName)"
        let address = contact.mailingAddress
        let cityStateZip = "\(contact.city), \(contact.state) \(contact.zipCode)"
        
        // Font settings
        let nameFont = UIFont.systemFont(ofSize: 12, weight: .semibold)
        let addressFont = UIFont.systemFont(ofSize: 10)
        
        // Calculate text heights
        let nameHeight = fullName.height(withConstrainedWidth: workingRect.width, font: nameFont)
        let addressHeight = address.height(withConstrainedWidth: workingRect.width, font: addressFont)
        let cityHeight = cityStateZip.height(withConstrainedWidth: workingRect.width, font: addressFont)
        
        let totalTextHeight = nameHeight + addressHeight + cityHeight + 4 // 4 points spacing
        let startY = workingRect.origin.y + (workingRect.height - totalTextHeight) / 2
        
        // Draw name
        fullName.draw(
            in: CGRect(x: workingRect.origin.x, y: startY, width: workingRect.width, height: nameHeight),
            withAttributes: [
                .font: nameFont,
                .foregroundColor: UIColor.black
            ]
        )
        
        // Draw address
        address.draw(
            in: CGRect(x: workingRect.origin.x, y: startY + nameHeight + 2, width: workingRect.width, height: addressHeight),
            withAttributes: [
                .font: addressFont,
                .foregroundColor: UIColor.black
            ]
        )
        
        // Draw city, state, zip
        cityStateZip.draw(
            in: CGRect(x: workingRect.origin.x, y: startY + nameHeight + addressHeight + 4, width: workingRect.width, height: cityHeight),
            withAttributes: [
                .font: addressFont,
                .foregroundColor: UIColor.black
            ]
        )
    }
}

// String extension for text height calculation
extension String {
    func height(withConstrainedWidth width: CGFloat, font: UIFont) -> CGFloat {
        let constraintRect = CGSize(width: width, height: .greatestFiniteMagnitude)
        let boundingBox = self.boundingRect(
            with: constraintRect,
            options: .usesLineFragmentOrigin,
            attributes: [.font: font],
            context: nil
        )
        return ceil(boundingBox.height)
    }
}
```

```swift
dependencies: [
    .package(url: "https://github.com/CoreOffice/CoreXLSX", from: "0.14.0"), // Excel support
    .package(url: "https://github.com/tid-kijyun/Kanna", from: "5.2.0"), // HTML/XML parsing
    .package(url: "https://github.com/apple/swift-collections", from: "1.0.0") // Collections
]
```

## UI/UX Specifications

### Color Scheme
- Primary: Farm Green (#2E7D32)
- Secondary: Harvest Gold (#FFA000)
- Background: Light Gray (#F5F5F5)
- Text: Dark Gray (#333333)
- Accent: Sky Blue (#1976D2)

### Typography
- Headers: SF Pro Display, Bold, 24pt
- Body: SF Pro Text, Regular, 16pt
- Captions: SF Pro Text, Regular, 12pt

### Spacing & Layout
- Standard padding: 16pt
- Card spacing: 8pt
- Button height: 44pt minimum
- List row height: 60pt minimum

## Testing Requirements

### Unit Tests
- Core Data operations
- Import/export functionality
- Data validation
- Contact management

### UI Tests
- Navigation flow
- Import/export workflows
- Contact creation/editing
- Search and filtering

### Performance Tests
- Large dataset handling (10,000+ contacts)
- Import/export speed
- Memory usage optimization
- Background processing

## Accessibility Features
- VoiceOver support
- Dynamic Type support
- High Contrast mode
- Keyboard navigation
- Screen reader compatibility

## Security & Privacy
- Core Data encryption
- Secure file handling
- Privacy policy compliance
- Data export permissions
- User consent for data operations

## Deployment Notes
- App Store submission requirements
- TestFlight distribution
- Enterprise deployment options
- Version control with Git
- Documentation requirements

## File Structure
```
GlaabFarmCRM/
├── App/
│   ├── GlaabFarmCRMApp.swift
│   ├── ContentView.swift
│   └── AppDelegate.swift
├── Models/
│   ├── FarmContact.swift
│   ├── PersistenceController.swift
│   └── DataModel.xcdatamodeld
├── Views/
│   ├── ContactListView.swift
│   ├── ContactDetailView.swift
│   ├── ContactEditView.swift
│   └── SettingsView.swift
├── ViewModels/
│   ├── ContactListViewModel.swift
│   ├── ContactDetailViewModel.swift
│   └── ImportExportViewModel.swift
├── Managers/
│   ├── DataImportManager.swift
│   ├── ExportManager.swift
│   └── CoreDataManager.swift
├── Utilities/
│   ├── Extensions.swift
│   ├── Constants.swift
│   └── Helpers.swift
└── Resources/
    ├── Assets.xcassets
    ├── Localizable.strings
    └── Info.plist
```

## Implementation Priority
1. **Phase 1**: Core Data model and basic CRUD operations
2. **Phase 2**: SwiftUI interface for iPad
3. **Phase 3**: Import/export functionality
4. **Phase 4**: Mac desktop compatibility
5. **Phase 5**: Advanced features (labels, multiple lists)
6. **Phase 6**: Testing and optimization
7. **Phase 7**: App Store submission

Start with Phase 1 and build incrementally. Focus on creating a solid foundation with Core Data before implementing the UI layer.