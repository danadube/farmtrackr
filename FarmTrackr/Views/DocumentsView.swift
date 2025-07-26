//
//  DocumentsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct DocumentsView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var themeVM: ThemeViewModel
    @StateObject private var documentManager: DocumentManager
    @State private var searchText = ""
    @State private var showingCreateTemplate = false
    @State private var showingMailMerge = false
    @State private var showingDocumentEditor = false
    @State private var documentToEdit: Document?
    @State private var showingDocumentList = false
    @State private var showingDeleteDialog = false
    @State private var documentToDelete: Document?
    @State private var showingDocumentPicker = false
    @State private var showingGoogleDrivePicker = false
    @State private var selectedDocument: Document?
    @State private var showingDocumentDetail = false
    @State private var viewMode: ViewMode = .list
    
    enum ViewMode {
        case list, grid
    }
    
    init(context: NSManagedObjectContext) {
        self._documentManager = StateObject(wrappedValue: DocumentManager(context: context))
    }
    
    var filteredDocuments: [Document] {
        if searchText.isEmpty {
            return documentManager.documents
        } else {
            return documentManager.documents.filter { document in
                document.name?.localizedCaseInsensitiveContains(searchText) == true ||
                document.content?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // TabHeader
            TabHeader(icon: "doc.text", logoName: nil, title: "Documents", subtitle: "Manage your farm documents")
            
            ScrollView {
                VStack(spacing: Constants.Spacing.large) {
                    searchAndActionsSection
                    documentsSection
                }
                .padding(Constants.Spacing.large)
            }
        }
        .background(themeVM.theme.colors.background)
        .fullScreenCover(isPresented: $showingCreateTemplate) {
            TemplateEditorView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .fullScreenCover(isPresented: $showingDocumentEditor) {
            DocumentEditorView(documentManager: documentManager, document: documentToEdit)
                .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingMailMerge) {
            MailMergeView(documentManager: documentManager)
                .environmentObject(themeVM)
        }
        .alert("Delete Document?", isPresented: $showingDeleteDialog) {
            Button("Delete", role: .destructive) {
                if let document = documentToDelete {
                    documentManager.deleteDocument(document)
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Are you sure you want to delete this document? This action cannot be undone.")
        }
    }
    
    private var searchAndActionsSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Document Management")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                // Search and view toggle
                HStack {
                    // Search bar
                    SearchBar(text: $searchText, placeholder: "Search documents...")
                    
                    Spacer()
                    
                    // View toggle
                    Picker("View", selection: $viewMode) {
                        Image(systemName: "list.bullet").tag(ViewMode.list)
                        Image(systemName: "square.grid.2x2").tag(ViewMode.grid)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .frame(width: 100)
                }
                
                // Action buttons
                HStack(spacing: Constants.Spacing.medium) {
                    Button(action: { showingCreateTemplate = true }) {
                        HStack {
                            Image(systemName: "plus")
                            Text("New Document")
                        }
                        .font(themeVM.theme.fonts.buttonFont)
                        .foregroundColor(.white)
                        .padding(.horizontal, Constants.Spacing.medium)
                        .padding(.vertical, Constants.Spacing.small)
                        .background(themeVM.theme.colors.primary)
                        .cornerRadius(Constants.CornerRadius.medium)
                    }
                    
                    Button(action: { showingMailMerge = true }) {
                        HStack {
                            Image(systemName: "envelope.badge")
                            Text("Mail Merge")
                        }
                        .font(themeVM.theme.fonts.buttonFont)
                        .foregroundColor(themeVM.theme.colors.primary)
                        .padding(.horizontal, Constants.Spacing.medium)
                        .padding(.vertical, Constants.Spacing.small)
                        .background(themeVM.theme.colors.primary.opacity(0.1))
                        .cornerRadius(Constants.CornerRadius.medium)
                    }
                    
                    Spacer()
                }
            }
            .interactiveCardStyle()
        }
    }
    
    private var documentsSection: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
            Text("Documents")
                .font(themeVM.theme.fonts.titleFont)
                .foregroundColor(themeVM.theme.colors.text)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                if filteredDocuments.isEmpty {
                    emptyDocumentsView
                } else {
                    documentsContentView
                }
            }
            .interactiveCardStyle()
        }
    }
    
    private var emptyDocumentsView: some View {
        VStack(spacing: Constants.Spacing.small) {
            Image(systemName: "doc.text")
                .font(.system(size: 40))
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            Text("No documents yet")
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
            Text("Add your first document to get started")
                .font(themeVM.theme.fonts.captionFont)
                .foregroundColor(themeVM.theme.colors.secondaryLabel)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Constants.Spacing.large)
    }
    
    private var documentsContentView: some View {
        Group {
            if viewMode == .list {
                LazyVStack(spacing: Constants.Spacing.small) {
                    ForEach(filteredDocuments, id: \.self) { document in
                        DocumentRowView(
                            document: document,
                            onTap: {
                                selectedDocument = document
                                showingDocumentDetail = true
                            },
                            onEdit: {
                                documentToEdit = document
                                showingDocumentEditor = true
                            },
                            onDelete: {
                                documentToDelete = document
                                showingDeleteDialog = true
                            }
                        )
                        
                        if document != filteredDocuments.last {
                            Divider()
                                .background(Color(.separator))
                        }
                    }
                }
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: Constants.Spacing.medium) {
                                    ForEach(filteredDocuments, id: \.self) { document in
                    DocumentCardView(
                        document: document,
                        onTap: {
                            selectedDocument = document
                            showingDocumentDetail = true
                        },
                        onEdit: {
                            documentToEdit = document
                            showingDocumentEditor = true
                        },
                        onDelete: {
                            documentToDelete = document
                            showingDeleteDialog = true
                        }
                    )
                }
                }
            }
        }
    }
    
    // MARK: - Actions
    private func createNewDocument() {
        documentToEdit = nil
        showingDocumentEditor = true
    }
}

// MARK: - Document Card View
struct DocumentCardView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Card title header
            HStack {
                Text("Document")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                // Action buttons
                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.primary)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.primary.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Edit document")
                    
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.error)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.error.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Delete document")
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 16)
            
            Divider()
                .background(themeVM.theme.colors.border)
                .padding(.horizontal, 20)
            
            // Document content
            VStack(alignment: .leading, spacing: 16) {
                // Document icon and name
                HStack(spacing: 12) {
                    Image(systemName: "doc.text")
                        .font(.title2)
                        .foregroundColor(themeVM.theme.colors.primary)
                        .frame(width: 32, height: 32)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.name ?? "Untitled Document")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(themeVM.theme.colors.text)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        
                        Text(document.content?.prefix(80) ?? "")
                            .font(.system(size: 13))
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                    
                    Spacer()
                }
                
                // Date info
                HStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 11))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                        .font(.system(size: 11))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    
                    Spacer()
                    
                    // Tap indicator
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
            .contentShape(Rectangle())
            .onTapGesture {
                onTap()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.black.opacity(0.06), lineWidth: 1)
        )
    }
}

// MARK: - Document Row View
struct DocumentRowView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Card title header
            HStack {
                Text("Document")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(themeVM.theme.colors.text)
                
                Spacer()
                
                // Action buttons
                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.primary)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.primary.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Edit document")
                    
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(themeVM.theme.colors.error)
                            .frame(width: 28, height: 28)
                            .background(themeVM.theme.colors.error.opacity(0.1))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Delete document")
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)
            
            Divider()
                .background(themeVM.theme.colors.border)
                .padding(.horizontal, 16)
            
            // Document content
            HStack(spacing: 16) {
                // Document icon
                Image(systemName: "doc.text")
                    .font(.title2)
                    .foregroundColor(themeVM.theme.colors.primary)
                    .frame(width: 32, height: 32)
                
                // Document info
                VStack(alignment: .leading, spacing: 4) {
                    Text(document.name ?? "Untitled Document")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                            .font(.system(size: 11))
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        
                        Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                            .font(.system(size: 12))
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    }
                }
                
                Spacer()
                
                // Tap area for opening document
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
                    .frame(width: 24, height: 24)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
            .contentShape(Rectangle())
            .onTapGesture {
                onTap()
            }
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.black.opacity(0.06), lineWidth: 1)
        )
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    let placeholder: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(Color.textColor.opacity(0.6))
            
            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .foregroundColor(Color.textColor)
                .accentColor(themeVM.theme.colors.accent)
                .placeholder(when: text.isEmpty) {
                    Text(placeholder)
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
                .help("Clear search")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.borderColor.opacity(0.3), lineWidth: 1)
        )
    }
}

#Preview {
    DocumentsView(context: PersistenceController.shared.container.viewContext)
        .environment(\.managedObjectContext, PersistenceController.shared.container.viewContext)
} 