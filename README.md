# CloverPit Save File Editor

A tool to decrypt and encrypt CloverPit game save files. It also allows you to edit the save file directly in the browser using the web app.

This tool is not affiliated with CloverPit or Panik Arcade.

## Web App

Open https://jexxme.github.io/cloverpit-save-editor/ in your browser and upload your encrypted save file.

## CLI Requirements

- Python 3.6+
- No external dependencies (uses only standard library)

## Usage

### Command Line Usage

```bash
# Decrypt
python tools/decrypt_cloverpit.py decrypt <input_file> [-o <output_file>]

# Encrypt
python tools/decrypt_cloverpit.py encrypt <input_file> [-o <output_file>]

# Use custom password (advanced)
python tools/decrypt_cloverpit.py decrypt <input_file> -p "custom_password"
```

### Python API Usage

```python
from decrypt_cloverpit import decrypt_save_file, encrypt_save_file

# Decrypt
decrypt_save_file('GameDataFull.json', 'output.json', 'custom_password')

# Encrypt
encrypt_save_file('modified_save.json', 'GameDataFull.json', 'custom_password')
```

Note: The custom password is optional and defaults to the game's password.

## How It Works

CloverPit uses a custom XOR-based encryption:

   - The game's password is used for encryption/decryption
   - Password is transformed 16 times through shuffling and XOR
   - Data is then XORed once with the final transformed password
   - Files are stored as latin-1 encoded bytes

## File Structure

```
cloverpit-save-decrypt/
├── README.md              # This file
├── index.html             # The web app
├── tools/
│   └── decrypt_cloverpit.py  # Main encryption/decryption tool
```

## Modifying Save Files (CLI)

1. Decrypt your save:
   ```bash
   python tools/decrypt_cloverpit.py decrypt GameDataFull.json
   ```

2. Edit the `GameDataFull_decrypted.json` file with any text editor

3. Re-encrypt:
   ```bash
   python tools/decrypt_cloverpit.py encrypt GameDataFull_decrypted.json
   ```

4. **IMPORTANT**: Back up your original save before replacing it!

## Common Save File Locations

- **Windows**: `%USERPROFILE%\AppData\LocalLow\Panik\CloverPit\SaveData\GameData\`
- **Or Steam**: `<SteamLibrary>\steamapps\common\CloverPit\SaveData\GameData\`

## Troubleshooting

### "Invalid JSON" error
- Make sure you're decrypting an encrypted file (not an already decrypted one)
- Verify the file isn't corrupted

### "UnicodeDecodeError"
- The file might already be decrypted (it's plain JSON)
- Try opening it in a text editor to check

### Game version mismatch
- This tool works for game version 2 and above

## Safety Notes

- **Always backup your saves before modifying**
- Modifying saves may cause game instability
- Online/multiplayer features may reject modified saves
- This is for educational and personal use only

## License

This tool is provided as-is for educational purposes. The game CloverPit and its code belong to their respective copyright holders.
