//
//  IssueDetailsView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct IssueDetailsView: View {
    let issues: [ValidationResult]
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        NavigationView {
            VStack {
                if issues.isEmpty {
                    // Empty state
                    VStack(spacing: Constants.Spacing.large) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)
                        
                        Text("No Issues Found")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(themeVM.theme.colors.text)
                        
                        Text("Your data quality assessment shows no validation issues. All contacts appear to be properly formatted.")
                            .font(themeVM.theme.fonts.bodyFont)
                            .foregroundColor(themeVM.theme.colors.secondaryLabel)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Constants.Spacing.large)
                        
                        Button(action: {
                            // This would add some test data with issues
                            // For now, just show a message
                        }) {
                            Text("Add Test Data")
                                .font(themeVM.theme.fonts.bodyFont)
                                .foregroundColor(.white)
                                .padding()
                                .background(themeVM.theme.colors.primary)
                                .cornerRadius(Constants.CornerRadius.medium)
                        }
                    }
                    .padding(Constants.Spacing.large)
                } else {
                    // Issues list
                    List(issues, id: \.id) { issue in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 8) {
                                Image(systemName: !issue.errors.isEmpty ? "exclamationmark.triangle.fill" : "info.circle")
                                    .foregroundColor(!issue.errors.isEmpty ? .red : .orange)
                                Text(issue.field.capitalized)
                                    .font(.headline)
                                    .foregroundColor(themeVM.theme.colors.text)
                            }
                            if !issue.errors.isEmpty {
                                ForEach(issue.errors, id: \.self) { error in
                                    Text(error)
                                        .font(.body)
                                        .foregroundColor(.red)
                                }
                            }
                            if !issue.warnings.isEmpty {
                                ForEach(issue.warnings, id: \.self) { warning in
                                    Text(warning)
                                        .font(.body)
                                        .foregroundColor(.orange)
                                }
                            }
                            if !issue.suggestions.isEmpty {
                                ForEach(issue.suggestions, id: \.self) { suggestion in
                                    Text("Suggestion: \(suggestion)")
                                        .font(.caption)
                                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            .navigationTitle("Issue Details")
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