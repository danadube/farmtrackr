//
//  ContactEditView.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct ContactEditView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    let contact: FarmContact?
    
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var mailingAddress = ""
    @State private var city = ""
    @State private var state = ""
    @State private var zipCode = ""
    @State private var email1 = ""
    @State private var email2 = ""
    @State private var phoneNumber1 = ""
    @State private var phoneNumber2 = ""
    @State private var phoneNumber3 = ""
    @State private var phoneNumber4 = ""
    @State private var phoneNumber5 = ""
    @State private var phoneNumber6 = ""
    @State private var siteMailingAddress = ""
    @State private var siteCity = ""
    @State private var siteState = ""
    @State private var siteZipCode = ""
    @State private var notes = ""
    @State private var farm = ""
    
    @State private var showingValidationAlert = false
    @State private var validationErrors: [String] = []
    
    private var isEditing: Bool {
        contact != nil
    }
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Information Section
                Section("Basic Information") {
                    HStack {
                        TextField("First Name", text: $firstName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        TextField("Last Name", text: $lastName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    TextField("Farm", text: $farm)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                // Contact Information Section
                Section("Contact Information") {
                    TextField("Email 1", text: $email1)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    TextField("Email 2", text: $email2)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    TextField("Phone 1", text: $phoneNumber1)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                    
                    TextField("Phone 2", text: $phoneNumber2)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                    
                    TextField("Phone 3", text: $phoneNumber3)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                    
                    TextField("Phone 4", text: $phoneNumber4)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                    
                    TextField("Phone 5", text: $phoneNumber5)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                    
                    TextField("Phone 6", text: $phoneNumber6)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.phonePad)
                }
                
                // Mailing Address Section
                Section("Mailing Address") {
                    TextField("Address", text: $mailingAddress)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    HStack {
                        TextField("City", text: $city)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        TextField("State", text: $state)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .frame(width: 100)
                    }
                    
                    TextField("ZIP Code", text: $zipCode)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                }
                
                // Site Address Section
                Section("Site Address (Optional)") {
                    TextField("Site Address", text: $siteMailingAddress)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    HStack {
                        TextField("Site City", text: $siteCity)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        TextField("Site State", text: $siteState)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .frame(width: 100)
                    }
                    
                    TextField("Site ZIP Code", text: $siteZipCode)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                }
                
                // Notes Section
                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle(isEditing ? "Edit Contact" : "New Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isEditing ? "Save" : "Add") {
                        saveContact()
                    }
                    .disabled(!isFormValid)
                }
            }
        }
        .onAppear {
            loadContactData()
        }
        .alert("Validation Errors", isPresented: $showingValidationAlert) {
            Button("OK") { }
        } message: {
            Text(validationErrors.joined(separator: "\n"))
        }
    }
    
    private var isFormValid: Bool {
        !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !farm.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func loadContactData() {
        guard let contact = contact else { return }
        
        firstName = contact.firstName ?? ""
        lastName = contact.lastName ?? ""
        mailingAddress = contact.mailingAddress ?? ""
        city = contact.city ?? ""
        state = contact.state ?? ""
        zipCode = contact.zipCode > 0 ? String(contact.zipCode) : ""
        email1 = contact.email1 ?? ""
        email2 = contact.email2 ?? ""
        phoneNumber1 = contact.phoneNumber1 ?? ""
        phoneNumber2 = contact.phoneNumber2 ?? ""
        phoneNumber3 = contact.phoneNumber3 ?? ""
        phoneNumber4 = contact.phoneNumber4 ?? ""
        phoneNumber5 = contact.phoneNumber5 ?? ""
        phoneNumber6 = contact.phoneNumber6 ?? ""
        siteMailingAddress = contact.siteMailingAddress ?? ""
        siteCity = contact.siteCity ?? ""
        siteState = contact.siteState ?? ""
        siteZipCode = contact.siteZipCode > 0 ? String(contact.siteZipCode) : ""
        notes = contact.notes ?? ""
        farm = contact.farm ?? ""
    }
    
    private func saveContact() {
        validationErrors.removeAll()
        
        // Validate required fields
        if firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationErrors.append("First name is required")
        }
        
        if lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationErrors.append("Last name is required")
        }
        
        if farm.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationErrors.append("Farm is required")
        }
        
        // Validate email formats
        if !email1.isEmpty && !email1.isValidEmail {
            validationErrors.append("Email 1 is not in a valid format")
        }
        
        if !email2.isEmpty && !email2.isValidEmail {
            validationErrors.append("Email 2 is not in a valid format")
        }
        
        // Validate phone formats
        let phoneNumbers = [phoneNumber1, phoneNumber2, phoneNumber3, phoneNumber4, phoneNumber5, phoneNumber6]
        for (index, phone) in phoneNumbers.enumerated() {
            if !phone.isEmpty && !phone.isValidPhone {
                validationErrors.append("Phone \(index + 1) is not in a valid format")
            }
        }
        
        // Validate ZIP codes
        if !zipCode.isEmpty && !zipCode.isValidZipCode {
            validationErrors.append("ZIP code is not in a valid format")
        }
        
        if !siteZipCode.isEmpty && !siteZipCode.isValidZipCode {
            validationErrors.append("Site ZIP code is not in a valid format")
        }
        
        if !validationErrors.isEmpty {
            showingValidationAlert = true
            return
        }
        
        // Save contact
        let contactToSave = contact ?? FarmContact(context: viewContext)
        
        contactToSave.firstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.lastName = lastName.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.mailingAddress = mailingAddress.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.city = city.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.state = state.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.zipCode = Int32(zipCode) ?? 0
        contactToSave.email1 = email1.isEmpty ? nil : email1.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.email2 = email2.isEmpty ? nil : email2.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber1 = phoneNumber1.isEmpty ? nil : phoneNumber1.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber2 = phoneNumber2.isEmpty ? nil : phoneNumber2.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber3 = phoneNumber3.isEmpty ? nil : phoneNumber3.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber4 = phoneNumber4.isEmpty ? nil : phoneNumber4.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber5 = phoneNumber5.isEmpty ? nil : phoneNumber5.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.phoneNumber6 = phoneNumber6.isEmpty ? nil : phoneNumber6.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.siteMailingAddress = siteMailingAddress.isEmpty ? nil : siteMailingAddress.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.siteCity = siteCity.isEmpty ? nil : siteCity.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.siteState = siteState.isEmpty ? nil : siteState.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.siteZipCode = Int32(siteZipCode) ?? 0
        contactToSave.notes = notes.isEmpty ? nil : notes.trimmingCharacters(in: .whitespacesAndNewlines)
        contactToSave.farm = farm.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if contact == nil {
            contactToSave.dateCreated = Date()
        }
        contactToSave.dateModified = Date()
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            validationErrors.append("Failed to save contact: \(error.localizedDescription)")
            showingValidationAlert = true
        }
    }
} 