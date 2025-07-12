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