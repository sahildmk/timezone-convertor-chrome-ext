# Timezone Converter Chrome Extension

A Chrome extension that allows you to convert timezones directly in text fields by highlighting time text.

## Features

- Highlight any time text (e.g., "7am", "7:50 PM", "14:30") on any webpage
- Popup appears with timezone conversion options
- Default source timezone is your browser's locale
- Select destination timezone from a dropdown
- Convert and insert the converted time back into editable text fields

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this extension folder
4. The extension will be loaded and ready to use

## Usage

1. Highlight any time text on a webpage (works with formats like "7am", "2:30 PM", "14:45")
2. A popup will appear near the selected text
3. Choose your source and destination timezones
4. Click "Convert" to see the converted time
5. Click "Insert" to replace the highlighted text with the converted time (only works in editable fields)

## Supported Time Formats

- 12-hour format: "7am", "7:30 PM", "2:15 AM"
- 24-hour format: "14:30", "9:45", "23:59"
- With seconds: "14:30:45"

## Supported Timezones

The extension includes common timezones like:

- America/New_York, America/Chicago, America/Denver, America/Los_Angeles
- Europe/London, Europe/Paris, Europe/Berlin, Europe/Rome
- Asia/Tokyo, Asia/Shanghai, Asia/Kolkata, Asia/Dubai
- Australia/Sydney, Pacific/Auckland
