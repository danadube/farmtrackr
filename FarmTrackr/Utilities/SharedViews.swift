import SwiftUI
import UniformTypeIdentifiers

// MARK: - ShareSheet
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - DocumentPicker
struct DocumentPicker: UIViewControllerRepresentable {
    let types: [UTType]
    let onPick: (URL) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onPick: onPick)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onPick: (URL) -> Void
        
        init(onPick: @escaping (URL) -> Void) {
            self.onPick = onPick
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            onPick(url)
        }
    }
}

// MARK: - ImportPreviewView for Label Templates
struct LabelTemplateImportPreviewView: View {
    let data: Data
    @Environment(\.dismiss) private var dismiss
    @State private var templates: [LabelTemplate] = []
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Import Preview")
                    .font(.title2)
                    .padding()
                
                if templates.isEmpty {
                    ContentUnavailableView(
                        "Invalid File",
                        systemImage: "exclamationmark.triangle",
                        description: Text("Could not parse template data")
                    )
                } else {
                    List {
                        ForEach(templates) { template in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(template.name)
                                    .font(.headline)
                                Text(template.description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("\(template.fields.filter(\.isEnabled).count) fields")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            do {
                templates = try JSONDecoder().decode([LabelTemplate].self, from: data)
            } catch {
                showingError = true
            }
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text("Failed to parse template data")
        }
    }
}

// MARK: - Tab Header
struct TabHeader: View {
    let icon: String
    let logoName: String?
    let title: String
    let subtitle: String
    @EnvironmentObject var themeVM: ThemeViewModel

    var body: some View {
        HStack(alignment: .center, spacing: themeVM.theme.spacing.medium) {
            ZStack {
                Circle()
                    .fill(themeVM.theme.colors.primary.opacity(0.25))
                    .frame(width: 60, height: 60)
                Image(systemName: icon)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundColor(themeVM.theme.colors.primary)
            }
            if let logoName = logoName {
                Image(logoName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(themeVM.theme.colors.text)
                Text(subtitle)
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            Spacer()
        }
        .padding(themeVM.theme.spacing.large)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    themeVM.theme.colors.primary.opacity(0.15),
                    themeVM.theme.colors.cardBackground,
                    themeVM.theme.colors.cardBackground.opacity(0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(themeVM.theme.cornerRadius.large)
        .shadow(color: .black.opacity(0.25), radius: 15, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                .stroke(themeVM.theme.colors.primary.opacity(0.3), lineWidth: 2.5)
        )
        .padding(.horizontal, themeVM.theme.spacing.large)
        .padding(.bottom, themeVM.theme.spacing.medium)
    }
}

// SidebarTab: Use proper Apple sidebar spacing and alignment with action
struct SidebarTab: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(isSelected ? themeVM.theme.colors.accent : (isHovered ? Color(.label) : Color(.secondaryLabel)))
                    .frame(width: 20, height: 20, alignment: .center)
                    .padding(.leading, 12)
                
                Text(title)
                    .font(.system(size: 15, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(isSelected ? themeVM.theme.colors.accent : (isHovered ? Color(.label) : Color(.label)))
                Spacer()
            }
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        isSelected ? 
                        themeVM.theme.colors.accent.opacity(0.15) : 
                        (isHovered ? Color(.secondarySystemBackground) : Color.clear)
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(
                        isSelected ? themeVM.theme.colors.accent.opacity(0.3) : Color.clear,
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = hovering
            }
        }
    }
} 