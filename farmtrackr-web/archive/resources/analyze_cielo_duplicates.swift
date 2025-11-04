#!/usr/bin/env swift

import Foundation
import CoreData

// Simple script to analyze Cielo farm duplicates
// This will help identify why there are so many duplicates in the Cielo farm

print("=== Cielo Farm Duplicate Analysis ===")

// The duplicate detection logic in DataValidator.swift checks for:
// 1. Exact name match (firstName + lastName)
// 2. Email match (email1)
// 3. Phone match (phoneNumber1)

print("\nDuplicate Detection Criteria:")
print("1. Exact name match: firstName + lastName (case-insensitive)")
print("2. Email match: email1 (case-insensitive)")
print("3. Phone match: phoneNumber1 (cleaned phone numbers)")

print("\nCommon causes of duplicates in Cielo farm:")
print("1. Multiple imports of the same Excel file")
print("2. Slight variations in names (spaces, capitalization)")
print("3. Different phone number formats for same contact")
print("4. Missing or inconsistent email addresses")
print("5. Import process not checking for existing contacts")

print("\nRecommendations to fix Cielo farm duplicates:")
print("1. Check if Cielo farm data was imported multiple times")
print("2. Review the Excel import process for Cielo farm files")
print("3. Implement pre-import duplicate checking")
print("4. Add farm-specific duplicate detection rules")
print("5. Consider implementing fuzzy matching for names")

print("\nTo investigate further:")
print("1. Check the Excel files in the app bundle for Cielo farm")
print("2. Look at the import history for Cielo farm")
print("3. Examine the actual duplicate contacts in the database")
print("4. Review the import process logs for Cielo farm")

print("\n=== Analysis Complete ===") 