#!/usr/bin/env python3
"""
Directory Content Extractor
Recursively traverses directories and prints all file contents to an output file
"""

import os
import sys
from pathlib import Path
import argparse

def is_binary_file(file_path):
    """Check if a file is binary by looking for null bytes"""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            return b'\0' in chunk
    except:
        return True

def get_file_content(file_path):
    """Get the content of a file, handling different encodings"""
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"[ERROR reading file: {str(e)}]"
    
    return "[ERROR: Could not decode file with any supported encoding]"

def extract_directory_contents(root_path, output_file, max_file_size=1024*1024):
    """
    Extract contents of all files in directory tree
    
    Args:
        root_path: Starting directory path
        output_file: Output file handle
        max_file_size: Maximum file size to read (default 1MB)
    """
    
    root_path = Path(root_path).resolve()
    
    # Write header
    output_file.write("="*80 + "\n")
    output_file.write(f"DIRECTORY CONTENT EXTRACTION\n")
    output_file.write(f"Root Path: {root_path}\n")
    output_file.write("="*80 + "\n\n")
    
    file_count = 0
    skipped_count = 0
    
    # Walk through directory tree
    for root, dirs, files in os.walk(root_path):
        current_dir = Path(root)
        
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        if files:
            output_file.write(f"\n{'='*60}\n")
            output_file.write(f"DIRECTORY: {current_dir}\n")
            output_file.write(f"{'='*60}\n\n")
            
            for file_name in sorted(files):
                file_path = current_dir / file_name
                
                # Skip hidden files
                if file_name.startswith('.'):
                    continue
                
                output_file.write(f"\n{'-'*40}\n")
                output_file.write(f"FILE: {file_path}\n")
                output_file.write(f"{'-'*40}\n")
                
                try:
                    # Check file size
                    file_size = file_path.stat().st_size
                    if file_size > max_file_size:
                        output_file.write(f"[SKIPPED: File too large ({file_size} bytes)]\n")
                        skipped_count += 1
                        continue
                    
                    # Check if binary
                    if is_binary_file(file_path):
                        output_file.write(f"[SKIPPED: Binary file ({file_size} bytes)]\n")
                        skipped_count += 1
                        continue
                    
                    # Read and write file content
                    content = get_file_content(file_path)
                    if content.strip():
                        output_file.write(content)
                        if not content.endswith('\n'):
                            output_file.write('\n')
                    else:
                        output_file.write("[EMPTY FILE]\n")
                    
                    file_count += 1
                    
                except Exception as e:
                    output_file.write(f"[ERROR: {str(e)}]\n")
                    skipped_count += 1
                
                output_file.write(f"\n{'-'*40}\n")
    
    # Write summary
    output_file.write(f"\n\n{'='*80}\n")
    output_file.write(f"EXTRACTION SUMMARY\n")
    output_file.write(f"{'='*80}\n")
    output_file.write(f"Files processed: {file_count}\n")
    output_file.write(f"Files skipped: {skipped_count}\n")
    output_file.write(f"Total files: {file_count + skipped_count}\n")

def main():
    parser = argparse.ArgumentParser(description='Extract contents of all files in a directory tree')
    parser.add_argument('directory', nargs='?', default='.', 
                       help='Directory to extract from (default: current directory)')
    parser.add_argument('-o', '--output', default='directory_contents.txt',
                       help='Output file name (default: directory_contents.txt)')
    parser.add_argument('--max-size', type=int, default=1024*1024,
                       help='Maximum file size to read in bytes (default: 1MB)')
    parser.add_argument('--include-hidden', action='store_true',
                       help='Include hidden files and directories')
    
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.exists(args.directory):
        print(f"Error: Directory '{args.directory}' does not exist")
        sys.exit(1)
    
    if not os.path.isdir(args.directory):
        print(f"Error: '{args.directory}' is not a directory")
        sys.exit(1)
    
    # Create output file
    try:
        with open(args.output, 'w', encoding='utf-8') as output_file:
            print(f"Extracting contents from '{args.directory}'...")
            print(f"Output will be saved to '{args.output}'")
            
            extract_directory_contents(args.directory, output_file, args.max_size)
            
            print(f"Extraction complete! Results saved to '{args.output}'")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()