import React, { useState, useEffect } from 'react';
import { Send, Plus, Trash2, ShieldAlert, ShieldCheck, Copy, CheckCircle2, History } from 'lucide-react';

interface Header {
  id: string;
  key: string;
  value: string;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  error?: string;
  corsAnalysis?: {
    hasAccessControlAllowOrigin: boolean;
    hasAccessControlAllowMethods: boolean;
    hasAccessControlAllowHeaders: boolean;
    isConfigured: boolean;
  };
}

interface TestHistory {
  url: string;
  method: string;
  headers: Header[];
  timestamp: number;
}

function App() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<Header[]>([{ id: '1', key: '', value: '' }]);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('testHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('testHistory', JSON.stringify(history));
  }, [history]);

  const handleAddHeader = () => {
    setHeaders([...headers, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter(header => header.id !== id));
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(header => 
      header.id === id ? { ...header, [field]: value } : header
    ));
  };

  const analyzeCORS = (headers: Record<string, string>) => {
    const hasAccessControlAllowOrigin = 'access-control-allow-origin' in headers;
    const hasAccessControlAllowMethods = 'access-control-allow-methods' in headers;
    const hasAccessControlAllowHeaders = 'access-control-allow-headers' in headers;
    
    return {
      hasAccessControlAllowOrigin,
      hasAccessControlAllowMethods,
      hasAccessControlAllowHeaders,
      isConfigured: hasAccessControlAllowOrigin && (hasAccessControlAllowMethods || hasAccessControlAllowHeaders)
    };
  };

  const isBlockedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Block localhost and common internal IP patterns
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^192\.168\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^0\./,
        /\.local$/,
        /^internal\./,
      ];

      // Check hostname against blocked patterns
      if (blockedPatterns.some(pattern => pattern.test(urlObj.hostname))) {
        return true;
      }

      // Block IP addresses that resolve to private networks
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipv4Pattern.test(urlObj.hostname)) {
        const parts = urlObj.hostname.split('.').map(Number);
        if (parts[0] === 127 || parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return true; // Block invalid URLs
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    // SSRF Protection
    if (isBlockedUrl(url)) {
      setResponse({
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        body: null,
        error: 'Access to internal or private networks is not allowed for security reasons.',
        corsAnalysis: {
          hasAccessControlAllowOrigin: false,
          hasAccessControlAllowMethods: false,
          hasAccessControlAllowHeaders: false,
          isConfigured: false
        }
      });
      setLoading(false);
      return;
    }

    try {
      const headerObject = headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(url, {
        method,
        headers: headerObject,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const corsAnalysis = analyzeCORS(responseHeaders);

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        corsAnalysis
      });

      // Add to history
      const newTest: TestHistory = {
        url,
        method,
        headers,
        timestamp: Date.now()
      };
      setHistory(prev => [newTest, ...prev].slice(0, 10)); // Keep only last 10 items

    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        corsAnalysis: {
          hasAccessControlAllowOrigin: false,
          hasAccessControlAllowMethods: false,
          hasAccessControlAllowHeaders: false,
          isConfigured: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ ...copyStatus, [section]: true });
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [section]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const loadFromHistory = (item: TestHistory) => {
    setUrl(item.url);
    setMethod(item.method);
    setHeaders(item.headers);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content - Fixed position when response is shown */}
      <div className={`transition-all duration-300 ease-in-out ${response ? 'w-1/2' : 'w-full'} p-8 ${response ? 'fixed left-0 top-0 bottom-0 overflow-y-auto' : ''}`}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8 relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="absolute left-0 top-0 p-2 text-gray-600 hover:text-gray-900"
                title="Show History"
              >
                <History className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">CORS Testing Tool</h1>
              <p className="mt-2 text-gray-600">Test your API endpoints and CORS configurations</p>
            </div>

            {showHistory && history.length > 0 && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Tests</h3>
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-900">{item.method} {item.url}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Request URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  required
                />
              </div>

              {/* HTTP Method Selection */}
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  HTTP Method
                </label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Custom Headers */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Headers
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Header
                  </button>
                </div>

                <div className="space-y-3">
                  {headers.map((header) => (
                    <div key={header.id} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Header Key"
                        value={header.key}
                        onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      />
                      <input
                        type="text"
                        placeholder="Header Value"
                        value={header.value}
                        onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      />
                      {headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(header.id)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Response Section - Scrollable independently */}
      <div 
        className={`w-1/2 bg-white border-l border-gray-200 p-8 transition-all duration-300 ease-in-out transform ${
          response ? 'translate-x-0 opacity-100 fixed right-0 top-0 bottom-0 overflow-y-auto' : 'translate-x-full opacity-0'
        } ${response ? 'block' : 'hidden'}`}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">Response</h2>
          
          <div className="space-y-6">
            {/* CORS Status */}
            {response?.corsAnalysis && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CORS Status</h3>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  response.corsAnalysis.isConfigured 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {response.corsAnalysis.isConfigured ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {response.corsAnalysis.isConfigured 
                      ? 'CORS is properly configured'
                      : 'CORS is not configured'}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    ✓ Access-Control-Allow-Origin: {response.corsAnalysis.hasAccessControlAllowOrigin ? 'Present' : 'Missing'}
                  </p>
                  <p>
                    ✓ Access-Control-Allow-Methods: {response.corsAnalysis.hasAccessControlAllowMethods ? 'Present' : 'Missing'}
                  </p>
                  <p>
                    ✓ Access-Control-Allow-Headers: {response.corsAnalysis.hasAccessControlAllowHeaders ? 'Present' : 'Missing'}
                  </p>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                response?.status >= 200 && response?.status < 300
                  ? 'bg-green-100 text-green-800'
                  : response?.status >= 400
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {response?.status} {response?.statusText}
              </div>
            </div>

            {/* Headers */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Response Headers</h3>
                <button
                  onClick={() => handleCopy(
                    Object.entries(response?.headers || {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n'),
                    'headers'
                  )}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {copyStatus['headers'] ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copyStatus['headers'] ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                <pre className="text-sm text-gray-700">
                  {response && Object.entries(response.headers).map(([key, value]) => (
                    `${key}: ${value}\n`
                  ))}
                </pre>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Response Body</h3>
                <button
                  onClick={() => handleCopy(
                    response?.error
                      ? response.error
                      : typeof response?.body === 'string'
                      ? response.body
                      : JSON.stringify(response?.body, null, 2),
                    'body'
                  )}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {copyStatus['body'] ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copyStatus['body'] ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                {response?.error ? (
                  <pre className="text-sm text-red-600">{response.error}</pre>
                ) : (
                  <pre className="text-sm text-gray-700">
                    {response?.body && (
                      typeof response.body === 'string' 
                        ? response.body 
                        : JSON.stringify(response.body, null, 2)
                    )}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;