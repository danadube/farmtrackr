//
//  GoogleSheetsOAuthManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import AuthenticationServices
import SwiftUI

@MainActor
class GoogleSheetsOAuthManager: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let clientID = GoogleSheetsConfig.clientID
    private let clientSecret = GoogleSheetsConfig.clientSecret
    private let redirectURI = GoogleSheetsConfig.redirectURI
    private let scope = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly"
    
    @Published var accessToken: String? = nil
    private var refreshToken: String?
    private var webAuthSession: ASWebAuthenticationSession?
    
    // MARK: - Authentication
    
    func authenticate() async {
        isLoading = true
        errorMessage = nil
        
        print("🔐 Starting Google OAuth authentication...")
        print("📱 Client ID: \(clientID)")
        print("🔗 Redirect URI: \(redirectURI)")
        print("📋 Scope: \(scope)")
        
        do {
            let authURL = buildAuthURL()
            print("🌐 Auth URL: \(authURL)")
            
            let tokenResponse = try await performOAuthFlow(authURL: authURL)
            
            print("✅ Authentication successful!")
            print("🔑 Access token received: \(tokenResponse.accessToken.prefix(20))...")
            print("🔄 Refresh token received: \(tokenResponse.refreshToken.prefix(20))...")
            
            self.accessToken = tokenResponse.accessToken
            self.isAuthenticated = true
            self.isLoading = false
            
            print("🎉 Authentication state updated - isAuthenticated: \(self.isAuthenticated)")
        } catch {
            print("❌ Authentication failed: \(error.localizedDescription)")
            self.errorMessage = error.localizedDescription
            self.isAuthenticated = false
            self.isLoading = false
        }
    }
    
    private func buildAuthURL() -> URL {
        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: scope),
            URLQueryItem(name: "access_type", value: "offline"),
            URLQueryItem(name: "prompt", value: "consent")
        ]
        return components.url!
    }
    
    private func performOAuthFlow(authURL: URL) async throws -> TokenResponse {
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    continuation.resume(throwing: GoogleSheetsError.authenticationFailed("Manager deallocated"))
                    return
                }
                
                print("🔐 Starting OAuth flow with URL: \(authURL)")
                
                self.webAuthSession = ASWebAuthenticationSession(
                    url: authURL,
                    callbackURLScheme: "com.danadube.FarmTrackr"
                ) { [weak self] callbackURL, error in
                    guard let self = self else {
                        continuation.resume(throwing: GoogleSheetsError.authenticationFailed("Manager deallocated"))
                        return
                    }
                    
                    if let error = error {
                        print("❌ OAuth error: \(error.localizedDescription)")
                        
                        // Handle specific "access blocked" error
                        if error.localizedDescription.contains("access blocked") || 
                           error.localizedDescription.contains("Authorization Error") {
                            continuation.resume(throwing: GoogleSheetsError.authenticationFailed("Access blocked: Please ensure your email is added as a test user in the OAuth consent screen. Go to https://console.cloud.google.com/apis/credentials/consent and add your email under 'Test users'."))
                        } else {
                            continuation.resume(throwing: error)
                        }
                        return
                    }
                    
                    guard let callbackURL = callbackURL else {
                        print("❌ No callback URL received")
                        continuation.resume(throwing: GoogleSheetsError.authenticationFailed("No callback URL received"))
                        return
                    }
                    
                    print("✅ Received callback URL: \(callbackURL)")
                    
                    // Extract authorization code from callback URL
                    guard let code = self.extractAuthorizationCode(from: callbackURL) else {
                        print("❌ No authorization code found in callback")
                        continuation.resume(throwing: GoogleSheetsError.authenticationFailed("No authorization code found"))
                        return
                    }
                    
                    print("✅ Authorization code extracted successfully")
                    
                    // Exchange authorization code for access token
                    Task {
                        do {
                            let tokenResponse = try await self.exchangeCodeForToken(code: code)
                            print("✅ Token exchange successful")
                            continuation.resume(returning: tokenResponse)
                        } catch {
                            print("❌ Token exchange failed: \(error.localizedDescription)")
                            continuation.resume(throwing: error)
                        }
                    }
                }
                
                self.webAuthSession?.presentationContextProvider = self
                self.webAuthSession?.start()
            }
        }
    }
    
    private func extractAuthorizationCode(from url: URL) -> String? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
            return nil
        }
        return code
    }
    
    private func exchangeCodeForToken(code: String) async throws -> TokenResponse {
        let tokenURL = URL(string: "https://oauth2.googleapis.com/token")!
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "client_id": clientID,
            "client_secret": clientSecret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirectURI
        ]
        
        let bodyString = body.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
        request.httpBody = bodyString.data(using: .utf8)
        
        print("🔄 Exchanging authorization code for token...")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GoogleSheetsError.authenticationFailed("Invalid response from Google OAuth server")
        }
        
        print("📡 Token exchange response status: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode != 200 {
            // Try to parse error response
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Token exchange error response: \(errorData)")
                
                if errorData.contains("invalid_client") {
                    throw GoogleSheetsError.authenticationFailed("Invalid client configuration. Please check your Client ID and Client Secret in GoogleSheetsConfig.swift")
                } else if errorData.contains("invalid_grant") {
                    throw GoogleSheetsError.authenticationFailed("Invalid authorization code. Please try authenticating again.")
                } else if errorData.contains("access_denied") {
                    throw GoogleSheetsError.authenticationFailed("Access denied. Please ensure your email is added as a test user in the OAuth consent screen.")
                } else {
                    throw GoogleSheetsError.authenticationFailed("Token exchange failed with status \(httpResponse.statusCode): \(errorData)")
                }
            } else {
                throw GoogleSheetsError.authenticationFailed("Token exchange failed with status \(httpResponse.statusCode)")
            }
        }
        
        let tokenData = try JSONDecoder().decode(TokenExchangeResponse.self, from: data)
        
        print("✅ Token exchange successful - Access token received")
        
        return TokenResponse(
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken ?? ""
        )
    }
    
    func refreshAccessToken() async throws -> String {
        guard let refreshToken = refreshToken else {
            throw GoogleSheetsError.notAuthenticated
        }
        
        let tokenURL = URL(string: "https://oauth2.googleapis.com/token")!
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "client_id": clientID,
            "client_secret": clientSecret,
            "refresh_token": refreshToken,
            "grant_type": "refresh_token"
        ]
        
        let bodyString = body.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
        request.httpBody = bodyString.data(using: .utf8)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw GoogleSheetsError.authenticationFailed("Failed to refresh access token")
        }
        
        let tokenData = try JSONDecoder().decode(TokenRefreshResponse.self, from: data)
        
        self.accessToken = tokenData.accessToken
        
        return tokenData.accessToken
    }
    
    func getAccessToken() -> String? {
        return accessToken
    }
    
    func logout() {
        accessToken = nil
        refreshToken = nil
        isAuthenticated = false
        webAuthSession?.cancel()
        webAuthSession = nil
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding

extension GoogleSheetsOAuthManager: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            fatalError("No window available for OAuth presentation")
        }
        return window
    }
}

// MARK: - Data Models

struct TokenResponse {
    let accessToken: String
    let refreshToken: String
}

struct TokenExchangeResponse: Codable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int
    let tokenType: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case tokenType = "token_type"
    }
}

struct TokenRefreshResponse: Codable {
    let accessToken: String
    let expiresIn: Int
    let tokenType: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case expiresIn = "expires_in"
        case tokenType = "token_type"
    }
}

 