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
                    themeVM.theme.colors.primary.opacity(0.2),
                    themeVM.theme.colors.primary.opacity(0.1),
                    themeVM.theme.colors.primary.opacity(0.3)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(themeVM.theme.cornerRadius.large)
        .shadow(color: .black.opacity(0.25), radius: 15, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.large)
                .stroke(themeVM.theme.colors.primary.opacity(0.2), lineWidth: 1.5)
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
                // Icon with enhanced hover effects
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(isSelected ? themeVM.theme.colors.accent : (isHovered ? themeVM.theme.colors.primary : Color(.secondaryLabel)))
                    .frame(width: 20, height: 20)
                    .scaleEffect(isHovered ? 1.1 : 1.0)
                    .shadow(color: isHovered ? themeVM.theme.colors.primary.opacity(0.4) : Color.clear, radius: 4, x: 0, y: 2)
                    .animation(.easeInOut(duration: 0.2), value: isHovered)
                
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(isSelected ? themeVM.theme.colors.accent : (isHovered ? themeVM.theme.colors.primary : Color(.secondaryLabel)))
                    .animation(.easeInOut(duration: 0.2), value: isHovered)
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                ZStack {
                    // Main background
                    RoundedRectangle(cornerRadius: 8)
                        .fill(
                            isSelected ? 
                            AnyShapeStyle(themeVM.theme.colors.accent.opacity(0.15)) : 
                            (isHovered ? 
                                AnyShapeStyle(
                                    LinearGradient(
                                        colors: [
                                            themeVM.theme.colors.primary.opacity(0.1),
                                            themeVM.theme.colors.secondary.opacity(0.05)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                ) : AnyShapeStyle(Color.clear))
                        )
                    
                    // Left border animation
                    HStack {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(
                                LinearGradient(
                                    colors: [themeVM.theme.colors.primary, themeVM.theme.colors.secondary],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 4)
                            .scaleEffect(y: isHovered ? 1.0 : 0.0, anchor: .center)
                            .animation(.easeInOut(duration: 0.2), value: isHovered)
                        
                        Spacer()
                    }
                }
            )
            .offset(x: isHovered ? 4 : 0)
            .animation(.easeInOut(duration: 0.2), value: isHovered)
        }
        .buttonStyle(PlainButtonStyle())
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = true
            }
            // Reset hover state after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHovered = false
                }
            }
            action()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(title)
        .accessibilityHint(isSelected ? "Selected" : "Tap to select")
    }
}

// MARK: - Hover Button Component
struct HoverButton: View {
    let title: String
    let action: () -> Void
    let icon: String?
    let style: HoverButtonStyle
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var isHovered = false
    
    enum HoverButtonStyle {
        case primary
        case secondary
        case tertiary
        case danger
    }
    
    init(
        title: String,
        icon: String? = nil,
        style: HoverButtonStyle = .secondary,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 12, weight: .medium))
                }
                Text(title)
                    .font(themeVM.theme.fonts.captionFont)
                    .fontWeight(.medium)
            }
            .foregroundColor(foregroundColor)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.small)
                    .fill(backgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: themeVM.theme.cornerRadius.small)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isHovered ? 1.05 : 1.0)
        .shadow(
            color: isHovered ? shadowColor : Color.clear,
            radius: isHovered ? 4 : 0,
            x: 0,
            y: isHovered ? 2 : 0
        )
        .animation(.easeInOut(duration: 0.2), value: isHovered)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = true
            }
            // Reset hover state after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHovered = false
                }
            }
            action()
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary:
            return .white
        case .secondary:
            return isHovered ? themeVM.theme.colors.primary : themeVM.theme.colors.text
        case .tertiary:
            return isHovered ? themeVM.theme.colors.accent : themeVM.theme.colors.text
        case .danger:
            return isHovered ? .white : .red
        }
    }
    
    private var backgroundColor: Color {
        switch style {
        case .primary:
            return isHovered ? themeVM.theme.colors.primary.opacity(0.9) : themeVM.theme.colors.primary
        case .secondary:
            return isHovered ? themeVM.theme.colors.primary.opacity(0.1) : themeVM.theme.colors.backgroundSecondary
        case .tertiary:
            return isHovered ? themeVM.theme.colors.accent.opacity(0.1) : themeVM.theme.colors.backgroundSecondary
        case .danger:
            return isHovered ? .red : .red.opacity(0.1)
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .primary:
            return Color.clear
        case .secondary:
            return isHovered ? themeVM.theme.colors.primary.opacity(0.3) : Color.clear
        case .tertiary:
            return isHovered ? themeVM.theme.colors.accent.opacity(0.3) : Color.clear
        case .danger:
            return isHovered ? .red : .red.opacity(0.3)
        }
    }
    
    private var borderWidth: CGFloat {
        return isHovered ? 1.5 : 0
    }
    
    private var shadowColor: Color {
        switch style {
        case .primary:
            return themeVM.theme.colors.primary.opacity(0.4)
        case .secondary:
            return themeVM.theme.colors.primary.opacity(0.2)
        case .tertiary:
            return themeVM.theme.colors.accent.opacity(0.2)
        case .danger:
            return .red.opacity(0.3)
        }
    }
} 