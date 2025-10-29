//
//  ImportPreviewView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI
import CoreData

struct ContactPreviewRow: View {
    let contact: ContactRecord
    let rowNumber: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            HStack {
                Text("Row \(rowNumber)")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                    .padding(.horizontal, Constants.Spacing.small)
                    .padding(.vertical, 2)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(Constants.CornerRadius.small)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: Constants.Spacing.small) {
                Text("\(contact.firstName) \(contact.lastName)")
                    .font(Constants.Typography.titleFont)
                    .foregroundColor(Color.textColor)
                
                Text(contact.farm)
                    .font(Constants.Typography.bodyFont)
                    .foregroundColor(.secondaryLabel)
                
                if !contact.mailingAddress.isEmpty {
                    Text(contact.mailingAddress)
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(Color.textColor)
                    
                    Text("\(contact.city), \(contact.state) \(contact.zipCode > 0 ? String(contact.zipCode) : "")")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(.secondaryLabel)
                }
                
                // Contact Information
                HStack(spacing: Constants.Spacing.medium) {
                    if let email = contact.email1, !email.isEmpty {
                        ContactInfoBadge(icon: "envelope", text: email)
                    }
                    
                    if let phone = contact.phoneNumber1, !phone.isEmpty {
                        ContactInfoBadge(icon: "phone", text: phone)
                    }
                }
            }
        }
        .padding(Constants.Spacing.medium)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(Constants.CornerRadius.medium)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: Constants.Spacing.small, leading: Constants.Spacing.medium, bottom: Constants.Spacing.small, trailing: Constants.Spacing.medium))
    }
}

struct ValidationErrorRow: View {
    let error: ValidationError
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            HStack {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(Constants.Colors.warning)
                
                Text("Row \(error.row)")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                    .padding(.horizontal, Constants.Spacing.small)
                    .padding(.vertical, 2)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(Constants.CornerRadius.small)
                
                Spacer()
            }
            
            Text(error.message)
                .font(Constants.Typography.bodyFont)
                .foregroundColor(Color.textColor)
            
            Text("Field: \(error.field)")
                .font(Constants.Typography.captionFont)
                .foregroundColor(.secondaryLabel)
        }
        .padding(Constants.Spacing.medium)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(Constants.CornerRadius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                .stroke(Constants.Colors.warning, lineWidth: 1)
        )
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: Constants.Spacing.small, leading: Constants.Spacing.medium, bottom: Constants.Spacing.small, trailing: Constants.Spacing.medium))
    }
}

struct ContactInfoBadge: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(Constants.Colors.primary)
            
            Text(text)
                .font(Constants.Typography.captionFont)
                .foregroundColor(Color.textColor)
        }
        .padding(.horizontal, Constants.Spacing.small)
        .padding(.vertical, 2)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(Constants.CornerRadius.small)
    }
}

struct ImportProgressView: View {
    let progress: Double
    let status: String
    
    var body: some View {
        VStack(spacing: Constants.Spacing.medium) {
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: Constants.Colors.primary))
            
            Text(status)
                .font(Constants.Typography.bodyFont)
                .foregroundColor(Constants.Colors.secondary)
        }
        .padding(Constants.Spacing.medium)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(Constants.CornerRadius.medium)
    }
} 

struct ImportPreviewView: View {
    let contacts: [ContactRecord]
    let errors: [ValidationError]
    let importManager: DataImportManager
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @State private var showingImportProgress = false
    @State private var importProgress: Double = 0.0
    @State private var importStatus = ""
    @State private var showingImportComplete = false
    @State private var importError: String?
    @State private var showingError = false
    @State private var dataQualityScore: DataQualityScore?
    @State private var validationSuggestions: [String: [String]] = [:]
    @State private var showingQualityDetails = false
    @State private var showingSuggestions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: Constants.Spacing.large) {
                // Header
                VStack(spacing: Constants.Spacing.medium) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 36))
                        .foregroundColor(Constants.Colors.primary)
                    
                    Text("Import Preview")
                        .font(Constants.Typography.headerFont)
                        .foregroundColor(Constants.Colors.text)
                    
                    Text("Review your data before importing")
                        .font(Constants.Typography.bodyFont)
                        .foregroundColor(.secondaryLabel)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, Constants.Spacing.large)
                
                // Summary
                VStack(spacing: Constants.Spacing.medium) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(contacts.count)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(Constants.Colors.primary)
                            Text("Contacts")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.secondaryLabel)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text("\(errors.count)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(errors.isEmpty ? .green : Constants.Colors.warning)
                            Text("Issues")
                                .font(Constants.Typography.captionFont)
                                .foregroundColor(.secondaryLabel)
                        }
                    }
                    .padding(Constants.Spacing.medium)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(Constants.CornerRadius.medium)
                    
                    // Data Quality Score
                    if let qualityScore = dataQualityScore {
                        DataQualityScoreCard(score: qualityScore)
                    }
                }
                
                // Content
                if errors.isEmpty {
                    // Show contacts preview
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Preview")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        
                        ScrollView {
                            LazyVStack(spacing: Constants.Spacing.small) {
                                ForEach(Array(contacts.prefix(5).enumerated()), id: \.offset) { index, contact in
                                    ContactPreviewRow(contact: contact, rowNumber: index + 1)
                                }
                                
                                if contacts.count > 5 {
                                    Text("... and \(contacts.count - 5) more contacts")
                                        .font(Constants.Typography.captionFont)
                                        .foregroundColor(.secondaryLabel)
                                        .frame(maxWidth: .infinity)
                                        .padding(Constants.Spacing.medium)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                } else {
                    // Show validation errors
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Validation Issues")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        
                        ScrollView {
                            LazyVStack(spacing: Constants.Spacing.small) {
                                ForEach(Array(errors.prefix(10).enumerated()), id: \.offset) { index, error in
                                    ValidationErrorRow(error: error)
                                }
                                
                                if errors.count > 10 {
                                    Text("... and \(errors.count - 10) more issues")
                                        .font(Constants.Typography.captionFont)
                                        .foregroundColor(.secondaryLabel)
                                        .frame(maxWidth: .infinity)
                                        .padding(Constants.Spacing.medium)
                                }
                            }
                        }
                        .frame(maxHeight: 300)
                    }
                }
                
                Spacer()
                
                // Action Buttons
                VStack(spacing: Constants.Spacing.medium) {
                    // Quality and Suggestions Buttons
                    HStack(spacing: Constants.Spacing.medium) {
                        Button(action: {
                            showingQualityDetails = true
                        }) {
                            HStack {
                                Image(systemName: "chart.bar")
                                Text("Quality Details")
                            }
                            .foregroundColor(Constants.Colors.primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .background(
                                RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                    .stroke(Constants.Colors.primary, lineWidth: 1)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: {
                            showingSuggestions = true
                        }) {
                            HStack {
                                Image(systemName: "lightbulb")
                                Text("Suggestions")
                            }
                            .foregroundColor(Constants.Colors.secondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .background(
                                RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                    .stroke(Constants.Colors.secondary, lineWidth: 1)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    Button(action: {
                        Task {
                            await startImport()
                        }
                    }) {
                        HStack {
                            Image(systemName: "checkmark.circle")
                            Text("Import \(contacts.count) Contacts")
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .fill(Constants.Colors.primary)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(Constants.Colors.secondary)
                }
            }
            .padding(Constants.Spacing.large)
            .background(Color(.systemBackground))
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingImportProgress) {
            ImportProgressView(progress: importProgress, status: importStatus)
        }
        .alert("Import Complete", isPresented: $showingImportComplete) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Successfully imported \(contacts.count) contacts")
        }
        .alert("Import Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(importError ?? "An unknown error occurred")
        }
        .sheet(isPresented: $showingQualityDetails) {
            DataQualityDetailsView(score: dataQualityScore ?? DataQualityScore(overallScore: 0, fieldScores: [:], recommendations: [], criticalIssues: [], minorIssues: []))
        }
        .sheet(isPresented: $showingSuggestions) {
            ValidationSuggestionsView(suggestions: validationSuggestions)
        }
        .onAppear {
            loadDataQualityInfo()
        }
    }
    
    private func startImport() async {
        guard !contacts.isEmpty else {
            await MainActor.run {
                importError = "No valid contacts to import"
                showingError = true
            }
            return
        }
        
        await importContacts()
    }
    
    private func importContacts() async {
        await MainActor.run {
            showingImportProgress = true
            importProgress = 0.0
            importStatus = "Starting import..."
        }
        
        do {
            let totalContacts = contacts.count
            var importedCount = 0
            
            for contact in contacts {
                try await importManager.importContact(contact, into: viewContext)
                importedCount += 1
                
                await MainActor.run {
                    importProgress = totalContacts > 0 ? Double(importedCount) / Double(totalContacts) : 0.0
                    importStatus = "Imported \(importedCount) of \(totalContacts) contacts..."
                }
            }
            
            try viewContext.save()
            
            await MainActor.run {
                showingImportProgress = false
                showingImportComplete = true
            }
            
        } catch {
            await MainActor.run {
                showingImportProgress = false
                importError = "Failed to import contacts: \(error.localizedDescription)"
                showingError = true
            }
        }
    }
    
    private func loadDataQualityInfo() {
        // Calculate data quality score
        dataQualityScore = importManager.assessDataQuality(contacts)
        
        // Get validation suggestions
        validationSuggestions = importManager.getValidationSuggestions(contacts)
    }
}

// MARK: - Data Quality Score Card
struct DataQualityScoreCard: View {
    let score: DataQualityScore
    
    var scoreColor: Color {
        switch score.overallScore {
        case 80...100: return .green
        case 60..<80: return .orange
        default: return .red
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: Constants.Spacing.small) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundColor(scoreColor)
                
                Text("Data Quality Score")
                    .font(Constants.Typography.titleFont)
                    .foregroundColor(Constants.Colors.text)
                
                Spacer()
                
                Text("\(score.overallScore)%")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(scoreColor)
            }
            
            ProgressView(value: Double(score.overallScore), total: 100)
                .progressViewStyle(LinearProgressViewStyle(tint: scoreColor))
            
            if !score.recommendations.isEmpty {
                Text("Recommendations:")
                    .font(Constants.Typography.captionFont)
                    .foregroundColor(.secondaryLabel)
                
                ForEach(score.recommendations.prefix(2), id: \.self) { recommendation in
                    Text("• \(recommendation)")
                        .font(Constants.Typography.captionFont)
                        .foregroundColor(Constants.Colors.text)
                }
            }
        }
        .padding(Constants.Spacing.medium)
        .background(Color.cardBackgroundAdaptive)
        .cornerRadius(Constants.CornerRadius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                .stroke(scoreColor.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Data Quality Details View
struct DataQualityDetailsView: View {
    let score: DataQualityScore
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: Constants.Spacing.large) {
                    // Overall Score
                    VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                        Text("Overall Quality Score")
                            .font(Constants.Typography.titleFont)
                            .foregroundColor(Constants.Colors.text)
                        
                        HStack {
                            Text("\(score.overallScore)%")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(scoreColor)
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text(qualityDescription)
                                    .font(Constants.Typography.bodyFont)
                                    .foregroundColor(Constants.Colors.text)
                                Text(qualityAdvice)
                                    .font(Constants.Typography.captionFont)
                                    .foregroundColor(.secondaryLabel)
                            }
                        }
                        
                        ProgressView(value: Double(score.overallScore), total: 100)
                            .progressViewStyle(LinearProgressViewStyle(tint: scoreColor))
                    }
                    .padding(Constants.Spacing.medium)
                    .background(Color.cardBackgroundAdaptive)
                    .cornerRadius(Constants.CornerRadius.medium)
                    
                    // Critical Issues
                    if !score.criticalIssues.isEmpty {
                        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                Text("Critical Issues")
                                    .font(Constants.Typography.titleFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                            
                            ForEach(score.criticalIssues, id: \.self) { issue in
                                Text("• \(issue)")
                                    .font(Constants.Typography.bodyFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                        }
                        .padding(Constants.Spacing.medium)
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(Constants.CornerRadius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .stroke(Color.red.opacity(0.3), lineWidth: 1)
                        )
                    }
                    
                    // Minor Issues
                    if !score.minorIssues.isEmpty {
                        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                            HStack {
                                Image(systemName: "exclamationmark.triangle")
                                    .foregroundColor(.orange)
                                Text("Minor Issues")
                                    .font(Constants.Typography.titleFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                            
                            ForEach(score.minorIssues, id: \.self) { issue in
                                Text("• \(issue)")
                                    .font(Constants.Typography.bodyFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                        }
                        .padding(Constants.Spacing.medium)
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(Constants.CornerRadius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                        )
                    }
                    
                    // Recommendations
                    if !score.recommendations.isEmpty {
                        VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                            HStack {
                                Image(systemName: "lightbulb.fill")
                                    .foregroundColor(Constants.Colors.secondary)
                                Text("Recommendations")
                                    .font(Constants.Typography.titleFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                            
                            ForEach(score.recommendations, id: \.self) { recommendation in
                                Text("• \(recommendation)")
                                    .font(Constants.Typography.bodyFont)
                                    .foregroundColor(Constants.Colors.text)
                            }
                        }
                        .padding(Constants.Spacing.medium)
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(Constants.CornerRadius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                                .stroke(Constants.Colors.secondary.opacity(0.3), lineWidth: 1)
                        )
                    }
                }
                .padding(Constants.Spacing.large)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Data Quality Details")
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
    
    private var scoreColor: Color {
        switch score.overallScore {
        case 80...100: return .green
        case 60..<80: return .orange
        default: return .red
        }
    }
    
    private var qualityDescription: String {
        switch score.overallScore {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        default: return "Poor"
        }
    }
    
    private var qualityAdvice: String {
        switch score.overallScore {
        case 80...100: return "Your data is ready for import"
        case 60..<80: return "Consider reviewing minor issues"
        case 40..<60: return "Review and correct issues before import"
        default: return "Fix critical issues before import"
        }
    }
}

// MARK: - Validation Suggestions View
struct ValidationSuggestionsView: View {
    let suggestions: [String: [String]]
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: Constants.Spacing.large) {
                    if suggestions.isEmpty {
                        VStack(spacing: Constants.Spacing.medium) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 48))
                                .foregroundColor(.green)
                            
                            Text("No Suggestions")
                                .font(Constants.Typography.titleFont)
                                .foregroundColor(Constants.Colors.text)
                            
                            Text("Your data looks good! No validation suggestions at this time.")
                                .font(Constants.Typography.bodyFont)
                                .foregroundColor(.secondaryLabel)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(Constants.Spacing.large)
                    } else {
                        ForEach(Array(suggestions.keys.sorted()), id: \.self) { rowKey in
                            VStack(alignment: .leading, spacing: Constants.Spacing.medium) {
                                Text(rowKey)
                                    .font(Constants.Typography.titleFont)
                                    .foregroundColor(Constants.Colors.text)
                                
                                ForEach(suggestions[rowKey] ?? [], id: \.self) { suggestion in
                                    HStack(alignment: .top, spacing: Constants.Spacing.small) {
                                        Image(systemName: "lightbulb")
                                            .foregroundColor(Constants.Colors.secondary)
                                            .font(.caption)
                                        
                                        Text(suggestion)
                                            .font(Constants.Typography.bodyFont)
                                            .foregroundColor(Constants.Colors.text)
                                    }
                                }
                            }
                            .padding(Constants.Spacing.medium)
                            .background(Color.cardBackgroundAdaptive)
                            .cornerRadius(Constants.CornerRadius.medium)
                        }
                    }
                }
                .padding(Constants.Spacing.large)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Validation Suggestions")
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