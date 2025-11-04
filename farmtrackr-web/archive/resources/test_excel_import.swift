#!/usr/bin/env swift

import Foundation

// Simple test to verify Excel file can be read
let filePath = "/Users/danadube/Desktop/FarmTrackr-old/FarmTrackr/Resources/Farm Tables San Marino.xlsx"
let fileURL = URL(fileURLWithPath: filePath)

print("Testing Excel file: \(filePath)")
print("File exists: \(FileManager.default.fileExists(atPath: filePath))")

if let data = try? Data(contentsOf: fileURL) {
    print("File size: \(data.count) bytes")
    
    // Check if it's a valid ZIP file (Excel files are ZIP archives)
    let zipSignature = data.prefix(4)
    let expectedSignature = Data([0x50, 0x4B, 0x03, 0x04]) // ZIP signature
    print("Is ZIP file: \(zipSignature == expectedSignature)")
    
    // Try to read as string to see if we can get any content
    if let content = String(data: data, encoding: .utf8) {
        print("First 200 characters: \(String(content.prefix(200)))")
    } else {
        print("Cannot read as UTF-8 string (expected for binary Excel file)")
    }
} else {
    print("Failed to read file data")
} 