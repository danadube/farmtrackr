//
//  FilterView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct FilterView: View {
    @Environment(\.dismiss) private var dismiss
    
    let farms: [String]
    @Binding var selectedFarm: String
    @Binding var firstNameFilter: String
    @Binding var lastNameFilter: String
    
    var body: some View {
        NavigationView {
            Form {
                Section("Filter by Farm") {
                    Picker("Farm", selection: $selectedFarm) {
                        Text("All Farms").tag("All Farms")
                        ForEach(farms, id: \.self) { farm in
                            Text(farm).tag(farm)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("Filter by Name") {
                    TextField("First Name", text: $firstNameFilter)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    TextField("Last Name", text: $lastNameFilter)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Section {
                    Button("Clear All Filters") {
                        selectedFarm = "All Farms"
                        firstNameFilter = ""
                        lastNameFilter = ""
                    }
                    .foregroundColor(Constants.Colors.error)
                }
            }
            .navigationTitle("Filters")
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