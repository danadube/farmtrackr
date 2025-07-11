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
    let states: [String]
    @Binding var selectedFarm: String
    @Binding var selectedState: String
    
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
                
                Section("Filter by State") {
                    Picker("State", selection: $selectedState) {
                        Text("All States").tag("All States")
                        ForEach(states, id: \.self) { state in
                            Text(state).tag(state)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section {
                    Button("Clear All Filters") {
                        selectedFarm = "All Farms"
                        selectedState = "All States"
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