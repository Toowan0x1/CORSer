# CORSer
A powerful and user-friendly web application for testing CORS (Cross-Origin Resource Sharing) configurations and API endpoints. This tool helps developers validate CORS settings, test API responses, and debug cross-origin issues with ease.

## Installation and Usage

### Option 1: Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cors-testing-tool.git
   cd cors-testing-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Option 2: Docker Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cors-testing-tool.git
   cd cors-testing-tool
   ```

2. Build the Docker image:
   ```bash
   docker build -t cors-testing-tool .
   ```

3. Run the container:
   ```bash
   docker run -p 5173:5173 cors-testing-tool
   ```

4. Access the tool:
   ```
   http://localhost:5173
   ```

## Usage Guide

### Making a Request

1. Enter the target URL in the URL input field
2. Select the HTTP method (GET, POST, PUT, DELETE)
3. Add any required headers using the "Add Header" button
4. Click "Send Request" to make the API call

### Understanding the Response

The response section displays:
- Response time with performance indicators
- CORS configuration status
- HTTP status code
- Response headers with copy functionality
- Formatted response body with copy functionality










![Tool Image](https://raw.githubusercontent.com/Toowan0x1/CORSer/refs/heads/master/media/Screenshot%20From%202025-01-27%2019-49-02.png)

1. URL Input:
- A text box for users to input the API URL they want to test.
2. HTTP Method Selection:
- Dropdown to select methods like GET, POST, PUT, etc.
3. Custom Headers:
- Allow users to add headers like Authorization, Content-Type, etc.
4. Preflight Request Option:
- Simulate OPTIONS requests to test preflight responses.
5. Response Display:
- Show response headers, status codes, and body.
6. CORS Analysis:
- Analyze headers like Access-Control-Allow-Origin, Access-Control-Allow-Methods, and Access-Control-Allow-Headers.
7. Error Explanation:
- Provide insights into common CORS errors (e.g., missing headers, mismatched origins).
8. History:
- Save recent tests for quick re-testing.
