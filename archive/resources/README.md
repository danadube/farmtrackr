# 🌾 FarmTrackr

A comprehensive farm CRM app built with SwiftUI for iPad. FarmTrackr helps you manage contacts, documents, and data with powerful import/export capabilities and Google Sheets integration.

![FarmTrackr Logo](FarmTrackr/Assets.xcassets/farmtrackr_logo_TB%201024.imageset/farmtrackr_logo_TB%201024.png)

## ✨ Features

### 📱 Core Functionality
- **Contact Management**: Complete CRUD operations with 20+ data fields
- **Master-Detail UI**: iPad-optimized interface with split view navigation
- **Search & Filter**: Real-time search with multiple sorting options
- **Data Validation**: Comprehensive validation with error reporting

### 📊 Import/Export System
- **CSV Import**: Flexible import with automatic field mapping
- **Excel Support**: .xlsx file support using CoreXLSX library
- **Google Sheets**: Direct integration with Google Sheets API
- **Multiple Export Formats**: CSV, PDF, JSON, Excel
- **Import Templates**: Save and reuse import configurations

### ☁️ Cloud & Sync
- **iCloud Sync**: CloudKit integration with automatic synchronization
- **Backup & Restore**: Complete data safety features
- **Cross-Device**: Seamless data sync across all your devices

### 🎨 User Experience
- **Modern Design**: SwiftUI with farm-themed aesthetics
- **Theme System**: Multiple themes with dark mode support
- **Accessibility**: VoiceOver support and dynamic type
- **Responsive Design**: Adapts to different screen sizes

### 🔧 Advanced Features
- **Batch Operations**: Multi-select for bulk actions
- **Data Quality**: Data scoring and validation tools
- **Label Printing**: Avery template support for mailing labels
- **Document Management**: Store and organize important documents

## 🚀 Getting Started

### Prerequisites
- macOS 14.0 or later
- Xcode 15.0 or later
- iOS 18.5 or later (for running on device)
- iPad (recommended) or iPhone

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danadube/FarmTrackr.git
   cd FarmTrackr
   ```

2. **Open in Xcode**
   ```bash
   open FarmTrackr.xcodeproj
   ```

3. **Build and Run**
   - Select your target device or simulator
   - Press `Cmd+R` to build and run

### First Time Setup

1. **Launch the app** on your iPad
2. **Grant permissions** for iCloud sync when prompted
3. **Add your first contact** using the "Add Contact" button
4. **Import existing data** using the Import/Export section

## 📱 Screenshots

*Screenshots coming soon*

## 🏗️ Architecture

### Tech Stack
- **Framework**: SwiftUI + Core Data
- **Data Persistence**: Core Data with CloudKit
- **Import/Export**: Custom managers with CoreXLSX
- **UI**: MVVM pattern with ObservableObject
- **Testing**: XCTest with comprehensive coverage

### Project Structure
```
FarmTrackr/
├── Models/                 # Core Data models
├── Views/                  # SwiftUI views
├── Managers/               # Business logic managers
├── Utilities/              # Helper utilities
├── Resources/              # Assets and templates
└── Tests/                  # Unit and UI tests
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: 32 tests covering core functionality
- **UI Tests**: End-to-end user workflow tests
- **Core Data Tests**: Model validation
- **Import/Export Tests**: Data handling validation

Run tests with:
```bash
xcodebuild test -scheme FarmTrackr -destination 'platform=iOS Simulator,name=iPad Pro 13-inch (M4)'
```

## 📋 Roadmap

### Phase 1: Google Sheets Integration ✅
- [x] OAuth 2.0 authentication
- [x] Direct read/write to Google Sheets
- [x] Real-time data synchronization

### Phase 2: Apple Numbers Support 🚧
- [ ] Import from .numbers files
- [ ] Export to .numbers format
- [ ] iCloud Numbers integration

### Phase 3: Performance Optimization 📋
- [ ] Large dataset handling (10,000+ contacts)
- [ ] Lazy loading implementation
- [ ] Memory management improvements

### Phase 4: Enhanced Features 📋
- [ ] Advanced reporting and analytics
- [ ] Email integration
- [ ] Custom export templates
- [ ] Mac desktop enhancements

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dana Dube**
- GitHub: [@danadube](https://github.com/danadube)

## 🙏 Acknowledgments

- CoreXLSX library for Excel file support
- Apple's SwiftUI and Core Data frameworks
- The open source community for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/danadube/FarmTrackr/issues) page
2. Create a new issue with detailed information
3. Contact the maintainer

---

**Built with ❤️ for farmers and agricultural professionals**
