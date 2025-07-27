#!/usr/bin/env swift

import Foundation

// Test CoreXLSX functionality directly
let filePath = "/Users/danadube/Desktop/FarmTrackr-old/FarmTrackr/Resources/Farm Tables San Marino.xlsx"

print("Testing Excel file with CoreXLSX: \(filePath)")

// Check if file exists
guard FileManager.default.fileExists(atPath: filePath) else {
    print("❌ File does not exist")
    exit(1)
}

print("✅ File exists")

// Try to read the file
guard let data = try? Data(contentsOf: URL(fileURLWithPath: filePath)) else {
    print("❌ Failed to read file data")
    exit(1)
}

print("✅ File data read successfully (\(data.count) bytes)")

// Check if it's a valid ZIP file
let zipSignature = data.prefix(4)
let expectedSignature = Data([0x50, 0x4B, 0x03, 0x04])
if zipSignature == expectedSignature {
    print("✅ Valid ZIP file (Excel format)")
} else {
    print("❌ Not a valid ZIP file")
    exit(1)
}

// Try to extract and examine the ZIP contents
print("\n🔍 Examining ZIP contents...")

// Create a temporary directory
let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent("excel_test_\(UUID().uuidString)")
try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)

// Extract the ZIP file
let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
process.arguments = ["-q", filePath, "-d", tempDir.path]

do {
    try process.run()
    process.waitUntilExit()
    
    if process.terminationStatus == 0 {
        print("✅ Successfully extracted ZIP contents")
        
        // List the contents
        let contents = try FileManager.default.contentsOfDirectory(at: tempDir, includingPropertiesForKeys: nil)
        print("\n📁 ZIP contents:")
        for item in contents.sorted(by: { $0.path < $1.path }) {
            let relativePath = item.path.replacingOccurrences(of: tempDir.path, with: "")
            print("  \(relativePath)")
        }
        
        // Look for worksheets
        let xlDir = tempDir.appendingPathComponent("xl")
        if FileManager.default.fileExists(atPath: xlDir.path) {
            let xlContents = try FileManager.default.contentsOfDirectory(at: xlDir, includingPropertiesForKeys: nil)
            print("\n📊 XL directory contents:")
            for item in xlContents.sorted(by: { $0.path < $1.path }) {
                let relativePath = item.path.replacingOccurrences(of: tempDir.path, with: "")
                print("  \(relativePath)")
            }
            
            // Look for worksheets directory
            let worksheetsDir = xlDir.appendingPathComponent("worksheets")
            if FileManager.default.fileExists(atPath: worksheetsDir.path) {
                let worksheetFiles = try FileManager.default.contentsOfDirectory(at: worksheetsDir, includingPropertiesForKeys: nil)
                print("\n📋 Worksheet files:")
                for worksheet in worksheetFiles.sorted(by: { $0.path < $1.path }) {
                    let relativePath = worksheet.path.replacingOccurrences(of: tempDir.path, with: "")
                    print("  \(relativePath)")
                    
                    // Try to read the first few lines of the worksheet
                    if let content = try? String(contentsOf: worksheet) {
                        let lines = content.components(separatedBy: .newlines).prefix(5)
                        print("    First 5 lines:")
                        for (i, line) in lines.enumerated() {
                            if !line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                print("      \(i+1): \(line)")
                            }
                        }
                    }
                }
            }
        }
        
    } else {
        print("❌ Failed to extract ZIP contents")
    }
} catch {
    print("❌ Error extracting ZIP: \(error)")
}

// Clean up
try? FileManager.default.removeItem(at: tempDir)

print("\n�� Test completed") 