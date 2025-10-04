#!/usr/bin/env python3
"""
CloverPit Save File Decryptor
Decrypts GameDataFull.json using the game's custom encryption algorithm
"""

import json
import sys
from pathlib import Path

# The actual password used for game saves (game version >= 2)
PASSWORD = "uoiyiuh_+=-5216gh;lj??!/345"

def _CryptoShiftsNumber(password):
    """Calculate number of encryption iterations based on password"""
    num = 8
    for char in password:
        num += ord(char)

    while num > 16 or num < 8:
        if num > 16:
            num -= 16
        if num < 8:
            num += 8

    return num

def EncryptCustom(data, password):
    """
    Encrypt/Decrypt data using CloverPit's custom algorithm.
    Since this is XOR-based, the same function works for both.

    Algorithm:
    1. Convert password to character array
    2. Transform password array N times (N calculated from password):
       a. Shuffle password array based on character positions
       b. XOR shuffled array with original password
    3. XOR data ONCE with the final transformed password array
    4. Return result

    IMPORTANT: The data is NOT XORed multiple times - only the password
    is transformed multiple times, then data is XORed once with final key.
    """
    if not data or not password:
        return ""

    length = len(data)
    num_iterations = _CryptoShiftsNumber(password)

    password_array = list(password)
    array2 = ['\0'] * len(password_array)

    # Transform password array num_iterations times
    for iteration in range(num_iterations):
        for j in range(len(password_array)):
            # Calculate shuffle position
            num2 = abs(ord(password_array[j]) % len(password_array))
            num3 = int((j + num2) % len(password_array))

            # Shuffle and XOR
            array2[j] = password_array[num3]
            array2[j] = chr(ord(array2[j]) ^ ord(password_array[j]))

    # XOR data ONCE with the final transformed password
    result = []
    for k in range(length):
        char_value = ord(data[k])
        key_char = ord(array2[k % len(array2)])
        result.append(chr(char_value ^ key_char))

    return ''.join(result)

def decrypt_save_file(encrypted_file_path, output_file_path=None, password=PASSWORD):
    """Decrypt a CloverPit save file"""

    # Read encrypted file
    with open(encrypted_file_path, 'rb') as f:
        encrypted_bytes = f.read()

    # Convert bytes to string (latin-1 preserves byte values)
    encrypted_str = encrypted_bytes.decode('latin-1')

    # Decrypt
    print(f"Decrypting with password: {password}")
    print(f"Password length: {len(password)}")
    print(f"Iterations: {_CryptoShiftsNumber(password)}")
    print(f"File size: {len(encrypted_bytes)} bytes")

    decrypted_str = EncryptCustom(encrypted_str, password)

    # Parse and validate JSON
    try:
        json_data = json.loads(decrypted_str)
        print("\n[SUCCESS] Decrypted and parsed JSON!")

        # Determine output path
        if output_file_path is None:
            output_file_path = Path(encrypted_file_path).with_name(
                Path(encrypted_file_path).stem + '_decrypted.json'
            )

        # Save decrypted JSON
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)

        print(f"[OK] Saved to: {output_file_path}")

        # Show preview
        preview = json.dumps(json_data, indent=2)[:500]
        print(f"\nPreview:\n{preview}...")

        return True

    except json.JSONDecodeError as e:
        print(f"\n[FAILED] Decryption failed: Invalid JSON - {e}")
        print(f"First 200 chars: {decrypted_str[:200]}")
        return False

def encrypt_save_file(json_file_path, output_file_path=None, password=PASSWORD):
    """Encrypt a JSON file using CloverPit's algorithm"""

    # Read JSON
    with open(json_file_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    # Convert to string (no whitespace to match game's format)
    json_str = json.dumps(json_data, separators=(',', ':'), ensure_ascii=False)

    # Encrypt
    print(f"Encrypting with password: {password}")
    encrypted_str = EncryptCustom(json_str, password)

    # Convert to bytes
    encrypted_bytes = encrypted_str.encode('latin-1')

    # Determine output path
    if output_file_path is None:
        output_file_path = Path(json_file_path).with_name(
            Path(json_file_path).stem.replace('_decrypted', '') + '.json'
        )

    # Save encrypted file
    with open(output_file_path, 'wb') as f:
        f.write(encrypted_bytes)

    print(f"[OK] Encrypted and saved to: {output_file_path}")
    return True

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="CloverPit Save File Encryption/Decryption Tool"
    )
    parser.add_argument(
        'action',
        choices=['decrypt', 'encrypt'],
        help="Action to perform"
    )
    parser.add_argument(
        'input_file',
        help="Input file path"
    )
    parser.add_argument(
        '-o', '--output',
        help="Output file path (optional)"
    )
    parser.add_argument(
        '-p', '--password',
        default=PASSWORD,
        help=f"Custom password (default: game's password)"
    )

    args = parser.parse_args()

    if args.action == 'decrypt':
        success = decrypt_save_file(args.input_file, args.output, args.password)
    else:
        success = encrypt_save_file(args.input_file, args.output, args.password)

    sys.exit(0 if success else 1)
