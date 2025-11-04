import SwiftUI

struct GoogleDriveFile: Identifiable, Codable {
    let id: String
    let name: String
    let mimeType: String
}

struct GoogleDrivePickerView: View {
    @State private var files: [GoogleDriveFile] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @Binding var selectedFile: GoogleDriveFile?

    let accessToken: String // Pass in your OAuth access token

    var body: some View {
        NavigationView {
            List {
                if isLoading {
                    ProgressView("Loading files...")
                } else if let errorMessage = errorMessage {
                    Text(errorMessage).foregroundColor(.red)
                } else {
                    ForEach(files) { file in
                        Button(action: {
                            selectedFile = file
                        }) {
                            HStack {
                                Image(systemName: "tablecells")
                                Text(file.name)
                                Spacer()
                                if selectedFile?.id == file.id {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Select Google Sheet")
            .onAppear(perform: fetchFiles)
        }
    }

    func fetchFiles() {
        isLoading = true
        errorMessage = nil
        let url = URL(string: "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,mimeType)&pageSize=100")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                if let error = error {
                    errorMessage = error.localizedDescription
                    return
                }
                guard let data = data else {
                    errorMessage = "No data received"
                    return
                }
                do {
                    let decoded = try JSONDecoder().decode([String: [GoogleDriveFile]].self, from: data)
                    files = decoded["files"] ?? []
                } catch {
                    errorMessage = "Failed to parse files: \(error.localizedDescription)"
                }
            }
        }.resume()
    }
} 