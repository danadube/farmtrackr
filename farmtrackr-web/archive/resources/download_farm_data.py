#!/usr/bin/env python3
"""
Script to download Google Sheets as CSV files for FarmTrackr import.
This script will help you download your farm data from Google Sheets.
"""

import requests
import os
from urllib.parse import urlparse, parse_qs

def extract_sheet_id(url):
    """Extract sheet ID from Google Sheets URL."""
    parsed = urlparse(url)
    if 'docs.google.com' in parsed.netloc and '/spreadsheets/d/' in parsed.path:
        # Extract the sheet ID from the path
        path_parts = parsed.path.split('/')
        for i, part in enumerate(path_parts):
            if part == 'd' and i + 1 < len(path_parts):
                return path_parts[i + 1]
    return None

def download_sheet_as_csv(sheet_id, filename):
    """Download a Google Sheet as CSV."""
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid=0"
    
    try:
        response = requests.get(csv_url)
        response.raise_for_status()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"✓ Downloaded {filename}")
        return True
    except Exception as e:
        print(f"✗ Failed to download {filename}: {e}")
        return False

def main():
    # Farm data URLs
    farms = {
        "Alicante": "https://docs.google.com/spreadsheets/d/1nQmKfv_nTiDcW8DJhexLJRbZvH-wY4YTlR74BR1SUTY/edit?usp=drive_link",
        "Cielo": "https://docs.google.com/spreadsheets/d/1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ/edit?usp=drive_link",
        "Escala": "https://docs.google.com/spreadsheets/d/10RtH6xqaJVSdEgP3vL1voea7orJNGgnjnl4kxjEcUR8/edit?usp=drive_link",
        "Ivy": "https://docs.google.com/spreadsheets/d/1LernlV9bfBYxpu0-4jbUq-qWZHiM68CstY36Iba6gDc/edit?usp=drive_link",
        "Presidential": "https://docs.google.com/spreadsheets/d/1VtGOjuOw_11ehY5HXHkRWTHuml0FF2J4gPmCw6icvV4/edit?usp=drive_link",
        "Santo_Tomas": "https://docs.google.com/spreadsheets/d/1U5c93QFjthKRNexGV_WYgGsedC-JQwbo8w1yl5RLHmM/edit?usp=drive_link",
        "Sunterrace": "https://docs.google.com/spreadsheets/d/1vLju9E0D1iG4a9W-1iIUvMkQlitV6qTWXE3YuT2NHbg/edit?usp=drive_link",
        "Versailles": "https://docs.google.com/spreadsheets/d/1nKN_zNKnmuNQESHJrPy6-ZOhOVULSCX42F6fxJjLHjo/edit?usp=drive_link",
        "Victoria_Falls": "https://docs.google.com/spreadsheets/d/19X1EREijaqEyfLSPMYy4c3WhpYBeEJWql_xZcrgzmNc/edit?usp=drive_link"
    }
    
    # Create output directory
    output_dir = "farm_data_csv"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Downloading farm data from Google Sheets...")
    print("=" * 50)
    
    success_count = 0
    total_count = len(farms)
    
    for farm_name, url in farms.items():
        sheet_id = extract_sheet_id(url)
        if sheet_id:
            filename = os.path.join(output_dir, f"{farm_name}_contacts.csv")
            if download_sheet_as_csv(sheet_id, filename):
                success_count += 1
        else:
            print(f"✗ Could not extract sheet ID from {farm_name} URL")
    
    print("=" * 50)
    print(f"Download complete: {success_count}/{total_count} files downloaded")
    print(f"Files saved to: {output_dir}/")
    print("\nNext steps:")
    print("1. Open your FarmTrackr app")
    print("2. Go to Import section")
    print("3. Select each CSV file to import")
    print("4. Review and confirm the data")

if __name__ == "__main__":
    main() 