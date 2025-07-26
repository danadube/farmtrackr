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
                    // Search and view toggle
                    HStack {
                        // Search bar
                        SearchBar(text: $searchText, placeholder: "Search documents...")
                        
                        Button(action: { showingDocumentList.toggle() }) {
                            Image(systemName: "list.bullet")
                                .font(.title2)
                                .foregroundColor(themeVM.theme.colors.accent)
                        }
                        .help("Toggle between grid and list view")
                    }
                    
                    // Quick actions
                    HStack(spacing: 16) {
                        Button(action: createNewDocument) {
                            HStack {
                                Image(systemName: "doc.badge.plus")
                                Text("New Document")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(themeVM.theme.colors.accent)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .help("Create a new document")
                        
                        Button(action: { showingCreateTemplate = true }) {
                            HStack {
                                Image(systemName: "doc.text.below.ecg")
                                Text("New Template")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.cardBackgroundAdaptive)
                            .foregroundColor(Color.textColor)
                            .cornerRadius(12)
                        }
                        .help("Create a new document template")
                        
                        Button(action: { showingMailMerge = true }) {
                            HStack {
                                Image(systemName: "envelope.badge")
                                Text("Mail Merge")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.cardBackgroundAdaptive)
                            .foregroundColor(Color.textColor)
                            .cornerRadius(12)
                        }
                        .help("Create documents from templates and contact data")
                    }
                    
                    // Documents grid or list
                    if showingDocumentList {
                        documentListView
                    } else {
                        documentGridView
                    }
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
    
    // MARK: - Document Grid View
    private var documentGridView: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: 16),
            GridItem(.flexible(), spacing: 16)
        ], spacing: 16) {
            ForEach(filteredDocuments, id: \.id) { document in
                DocumentCardView(
                    document: document,
                    onTap: { openDocument(document) },
                    onDelete: { deleteDocument(document) }
                )
                .environmentObject(themeVM)
            }
        }
    }
    
    // MARK: - Document List View
    private var documentListView: some View {
        VStack(spacing: 12) {
            ForEach(filteredDocuments, id: \.id) { document in
                DocumentRowView(
                    document: document,
                    onTap: { openDocument(document) },
                    onDelete: { deleteDocument(document) }
                )
                .environmentObject(themeVM)
            }
        }
    }
    
    // MARK: - Actions
    private func createNewDocument() {
        documentToEdit = nil
        showingDocumentEditor = true
    }
    
    private func openDocument(_ document: Document) {
        documentToEdit = document
        showingDocumentEditor = true
    }
    
    private func deleteDocument(_ document: Document) {
        documentToDelete = document
        showingDeleteDialog = true
    }
}

// MARK: - Document Card View
struct DocumentCardView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Button(action: onTap) {
                    HStack {
                        Image(systemName: "doc.text")
                            .font(.title2)
                            .foregroundColor(themeVM.theme.colors.accent)
                        
                        Spacer()
                        
                        Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.8))
                    }
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.error)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Delete document")
            }
            
            Button(action: onTap) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(document.name ?? "Untitled Document")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(Color.textColor)
                        .lineLimit(2)
                    
                    Text(document.content?.prefix(100) ?? "")
                        .font(.caption)
                        .foregroundColor(Color.textColor.opacity(0.7))
                        .lineLimit(3)
                }
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .floatingCardStyle()
    }
}

// MARK: - Document Row View
struct DocumentRowView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let document: Document
    let onTap: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            Button(action: onTap) {
                HStack(spacing: 16) {
                    Image(systemName: "doc.text")
                        .font(.title2)
                        .foregroundColor(themeVM.theme.colors.accent)
                        .frame(width: 32)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.name ?? "Untitled Document")
                            .font(.headline)
                            .foregroundColor(Color.textColor)
                        
                        Text(document.modifiedDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                            .font(.caption)
                            .foregroundColor(Color.textColor.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(Color.textColor.opacity(0.6))
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.caption)
                    .foregroundColor(themeVM.theme.colors.error)
            }
            .buttonStyle(PlainButtonStyle())
            .help("Delete document")
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(8)
        .shadow(color: Color.adaptiveShadowColor.opacity(0.15), radius: 4, x: 0, y: 2)
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