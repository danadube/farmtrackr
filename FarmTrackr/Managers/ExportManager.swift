//
//  ExportManager.swift
//  Glaab Farm CRM
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import CoreData
import PDFKit

class ExportManager: ObservableObject {
    @Published var exportProgress: Double = 0
    @Published var exportStatus: String = ""
    @Published var isExporting: Bool = false
    
    func exportToCSV(contacts: [FarmContact]) async throws -> URL {
        await MainActor.run {
            isExporting = true
            exportStatus = "Preparing CSV export..."
            exportProgress = 0.1
        }
        
        let csvString = createCSVString(from: contacts)
        
        await MainActor.run {
            exportProgress = 0.5
            exportStatus = "Writing file..."
        }
        
        let fileName = "Glaab_Farm_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).csv"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
        
        await MainActor.run {
            exportProgress = 1.0
            exportStatus = "Export completed!"
            isExporting = false
        }
        
        return fileURL
    }
    
    func exportToPDF(contacts: [FarmContact]) async throws -> URL {
        await MainActor.run {
            isExporting = true
            exportStatus = "Generating PDF..."
            exportProgress = 0.1
        }
        
        let pdfData = createPDFData(from: contacts)
        
        await MainActor.run {
            exportProgress = 0.5
            exportStatus = "Writing PDF file..."
        }
        
        let fileName = "Glaab_Farm_Contacts_\(Date().formatted(date: .abbreviated, time: .omitted)).pdf"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try pdfData.write(to: fileURL)
        
        await MainActor.run {
            exportProgress = 1.0
            exportStatus = "Export completed!"
            isExporting = false
        }
        
        return fileURL
    }
    
    private func createCSVString(from contacts: [FarmContact]) -> String {
        let headers = [
            "First Name", "Last Name", "Mailing Address", "City", "State", "ZIP Code",
            "Email 1", "Email 2", "Phone 1", "Phone 2", "Phone 3", "Phone 4", "Phone 5", "Phone 6",
            "Site Address", "Site City", "Site State", "Site ZIP Code", "Notes", "Farm",
            "Date Created", "Date Modified"
        ]
        
        var csvString = headers.joined(separator: ",") + "\n"
        
        for contact in contacts {
            let row = [
                escapeCSVField(contact.firstName ?? ""),
                escapeCSVField(contact.lastName ?? ""),
                escapeCSVField(contact.mailingAddress ?? ""),
                escapeCSVField(contact.city ?? ""),
                escapeCSVField(contact.state ?? ""),
                contact.zipCode > 0 ? String(contact.zipCode) : "",
                escapeCSVField(contact.email1 ?? ""),
                escapeCSVField(contact.email2 ?? ""),
                escapeCSVField(contact.phoneNumber1 ?? ""),
                escapeCSVField(contact.phoneNumber2 ?? ""),
                escapeCSVField(contact.phoneNumber3 ?? ""),
                escapeCSVField(contact.phoneNumber4 ?? ""),
                escapeCSVField(contact.phoneNumber5 ?? ""),
                escapeCSVField(contact.phoneNumber6 ?? ""),
                escapeCSVField(contact.siteMailingAddress ?? ""),
                escapeCSVField(contact.siteCity ?? ""),
                escapeCSVField(contact.siteState ?? ""),
                contact.siteZipCode > 0 ? String(contact.siteZipCode) : "",
                escapeCSVField(contact.notes ?? ""),
                escapeCSVField(contact.farm ?? ""),
                contact.dateCreated?.formatted(date: .abbreviated, time: .omitted) ?? "",
                contact.dateModified?.formatted(date: .abbreviated, time: .omitted) ?? ""
            ]
            
            csvString += row.joined(separator: ",") + "\n"
        }
        
        return csvString
    }
    
    private func escapeCSVField(_ field: String) -> String {
        if field.contains(",") || field.contains("\"") || field.contains("\n") {
            return "\"\(field.replacingOccurrences(of: "\"", with: "\"\""))\""
        }
        return field
    }
    
    private func createPDFData(from contacts: [FarmContact]) -> Data {
        let pdfMetaData = [
            kCGPDFContextCreator: "FarmTrackr",
            kCGPDFContextAuthor: "Glaab Farm",
            kCGPDFContextTitle: "Contact List"
        ]
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        let pageRect = CGRect(x: 0, y: 0, width: 595.2, height: 841.8) // A4 size
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            let titleAttributes = [
                NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 24),
                NSAttributedString.Key.foregroundColor: UIColor.black
            ]
            
            let headerAttributes = [
                NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 12),
                NSAttributedString.Key.foregroundColor: UIColor.black
            ]
            
            let textAttributes = [
                NSAttributedString.Key.font: UIFont.systemFont(ofSize: 10),
                NSAttributedString.Key.foregroundColor: UIColor.black
            ]
            
            // Title
            let title = "Glaab Farm Contact List"
            title.draw(at: CGPoint(x: 50, y: 50), withAttributes: titleAttributes)
            
            // Date
            let dateString = "Generated on: \(Date().formatted(date: .abbreviated, time: .omitted))"
            dateString.draw(at: CGPoint(x: 50, y: 80), withAttributes: textAttributes)
            
            // Headers
            let headers = ["Name", "Farm", "Phone", "Email", "Address"]
            var xPosition: CGFloat = 50
            let yPosition: CGFloat = 120
            
            for header in headers {
                header.draw(at: CGPoint(x: xPosition, y: yPosition), withAttributes: headerAttributes)
                xPosition += 100
            }
            
            // Contact rows
            var currentY: CGFloat = 140
            let lineHeight: CGFloat = 20
            
            for contact in contacts {
                if currentY > pageRect.height - 100 {
                    context.beginPage()
                    currentY = 50
                }
                
                let name = "\(contact.firstName ?? "") \(contact.lastName ?? "")"
                let farm = contact.farm ?? ""
                let phone = contact.primaryPhone ?? ""
                let email = contact.primaryEmail ?? ""
                let address = contact.displayAddress
                
                name.draw(at: CGPoint(x: 50, y: currentY), withAttributes: textAttributes)
                farm.draw(at: CGPoint(x: 150, y: currentY), withAttributes: textAttributes)
                phone.draw(at: CGPoint(x: 250, y: currentY), withAttributes: textAttributes)
                email.draw(at: CGPoint(x: 350, y: currentY), withAttributes: textAttributes)
                address.draw(at: CGPoint(x: 450, y: currentY), withAttributes: textAttributes)
                
                currentY += lineHeight
            }
        }
        
        return data
    }
} 