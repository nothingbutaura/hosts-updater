# Website Blocker & Hosts Manager

A simple tool to manage and generate a custom `hosts` file to block unwanted websites across various categories.

## Features

- **Consolidated Hosts File**: Automatically combines multiple blocklists from the `blocks/` directory.
- **Web Interface**: Easy-to-use UI to add new domains to specific categories.
- **Categorized Blocking**: Organize blocked domains into files like `social.txt`, `gaming.txt`, etc.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hosts-updater
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### 1. Start the Server

Run the following command to start the Express server:

```bash
node index.js
```

By default, the server runs on `http://localhost:3000`. You can change the port by setting the `PORT` environment variable:

```bash
PORT=8080 node index.js
```

### 2. Get the Hosts File

Visit the root URL to get the full, generated hosts file:

- **URL**: `http://localhost:3000/`
- **Output**: A plain-text file formatted as a standard `hosts` file, combining `blocks/template.txt` and all other files in the `blocks/` directory.

### 3. Add New Domains

Use the built-in web interface to add new domains to a specific category:

- **URL**: `http://localhost:3000/add`
- **Instructions**:
    1. Select a category from the dropdown (e.g., `socmed`, `games`).
    2. Enter the domains you want to block in the textarea (separated by commas or new lines).
    3. Click "Add Domains". The server will automatically format the domains and append them to the corresponding file in the `blocks/` directory.

## Project Structure

- `index.js`: Main server file.
- `index.html`: UI for adding new domains.
- `blocks/`: Directory containing category-specific blocklists.
    - `template.txt`: The base header for the generated hosts file.
    - `*.txt`: Category files (e.g., `dating.txt`, `gambling.txt`).
