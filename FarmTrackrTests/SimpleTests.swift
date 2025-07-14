//
//  SimpleTests.swift
//  FarmTrackrTests
//
//  Created by Dana Dube on 7/12/25.
//

import Testing
import SwiftUI
@testable import FarmTrackr

struct SimpleTests {
    
    // MARK: - Basic Functionality Tests (No Core Data)
    
    @Test func testBasicStringOperations() async throws {
        await MainActor.run {
            let testString = "Hello, World!"
            #expect(testString.count == 13)
            #expect(testString.contains("Hello"))
            #expect(testString.uppercased() == "HELLO, WORLD!")
        }
    }
    
    @Test func testArrayOperations() async throws {
        await MainActor.run {
            let numbers = [1, 2, 3, 4, 5]
            #expect(numbers.count == 5)
            #expect(numbers.first == 1)
            #expect(numbers.last == 5)
            #expect(numbers.reduce(0, +) == 15)
        }
    }
    
    @Test func testDictionaryOperations() async throws {
        await MainActor.run {
            let dict = ["a": 1, "b": 2, "c": 3]
            #expect(dict.count == 3)
            #expect(dict["a"] == 1)
            #expect(dict["d"] == nil)
        }
    }
    
    @Test func testDateOperations() async throws {
        await MainActor.run {
            let now = Date()
            let future = now.addingTimeInterval(3600) // 1 hour later
            #expect(future > now)
            #expect(now < future)
        }
    }
    
    @Test func testOptionalHandling() async throws {
        await MainActor.run {
            let optionalString: String? = "test"
            let nilString: String? = nil
            
            #expect(optionalString != nil)
            #expect(nilString == nil)
            #expect(optionalString?.uppercased() == "TEST")
            #expect(nilString?.uppercased() == nil)
        }
    }
    
    @Test func testBasicMath() async throws {
        await MainActor.run {
            #expect(2 + 2 == 4)
            #expect(10 - 5 == 5)
            #expect(3 * 4 == 12)
            #expect(15 / 3 == 5)
            #expect(7 % 3 == 1)
        }
    }
    
    @Test func testBooleanLogic() async throws {
        await MainActor.run {
            // Test AND operations
            let and1 = true && true
            let and2 = true && false
            let and3 = false && true
            let and4 = false && false
            
            #expect(and1 == true)
            #expect(and2 == false)
            #expect(and3 == false)
            #expect(and4 == false)
            
            // Test OR operations
            let or1 = true || true
            let or2 = true || false
            let or3 = false || true
            let or4 = false || false
            
            #expect(or1 == true)
            #expect(or2 == true)
            #expect(or3 == true)
            #expect(or4 == false)
            
            // Test NOT operations
            let not1 = !true
            let not2 = !false
            
            #expect(not1 == false)
            #expect(not2 == true)
        }
    }
    
    @Test func testStringFormatting() async throws {
        await MainActor.run {
            let name = "John"
            let age = 30
            let formatted = "\(name) is \(age) years old"
            #expect(formatted == "John is 30 years old")
            
            let number = 42
            let formattedNumber = String(format: "The answer is %d", number)
            #expect(formattedNumber == "The answer is 42")
        }
    }
    
    @Test func testArrayFiltering() async throws {
        await MainActor.run {
            let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            let evenNumbers = numbers.filter { $0 % 2 == 0 }
            let oddNumbers = numbers.filter { $0 % 2 == 1 }
            
            #expect(evenNumbers == [2, 4, 6, 8, 10])
            #expect(oddNumbers == [1, 3, 5, 7, 9])
        }
    }
    
    @Test func testArrayMapping() async throws {
        await MainActor.run {
            let numbers = [1, 2, 3, 4, 5]
            let doubled = numbers.map { $0 * 2 }
            let strings = numbers.map { "Number \($0)" }
            
            #expect(doubled == [2, 4, 6, 8, 10])
            #expect(strings == ["Number 1", "Number 2", "Number 3", "Number 4", "Number 5"])
        }
    }
    
    @Test func testArrayReduction() async throws {
        await MainActor.run {
            let numbers = [1, 2, 3, 4, 5]
            let sum = numbers.reduce(0, +)
            let product = numbers.reduce(1, *)
            
            #expect(sum == 15)
            #expect(product == 120)
        }
    }
    
    @Test func testStringSplitting() async throws {
        await MainActor.run {
            let sentence = "Hello,World,Swift"
            let parts = sentence.split(separator: ",")
            #expect(parts.count == 3)
            #expect(parts[0] == "Hello")
            #expect(parts[1] == "World")
            #expect(parts[2] == "Swift")
        }
    }
    
    @Test func testStringJoining() async throws {
        await MainActor.run {
            let words = ["Hello", "World", "Swift"]
            let sentence = words.joined(separator: " ")
            #expect(sentence == "Hello World Swift")
        }
    }
    
    @Test func testRangeOperations() async throws {
        await MainActor.run {
            let range = 1...5
            #expect(range.contains(3))
            #expect(range.contains(1))
            #expect(range.contains(5))
            #expect(!range.contains(0))
            #expect(!range.contains(6))
        }
    }
    
    @Test func testSetOperations() async throws {
        await MainActor.run {
            let set1: Set<Int> = [1, 2, 3, 4, 5]
            let set2: Set<Int> = [4, 5, 6, 7, 8]
            
            let intersection = set1.intersection(set2)
            let union = set1.union(set2)
            let difference = set1.subtracting(set2)
            
            #expect(intersection == [4, 5])
            #expect(union == [1, 2, 3, 4, 5, 6, 7, 8])
            #expect(difference == [1, 2, 3])
        }
    }
} 