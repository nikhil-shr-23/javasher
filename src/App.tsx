import { useState, useEffect, useRef } from 'react'
import Editor, { loader } from "@monaco-editor/react"
import axios from 'axios'
import * as monaco from 'monaco-editor'

// Configure Monaco Editor with Java language features
loader.init().then((monaco) => {
  // Add Java keywords
  const completionProvider = (model: monaco.editor.ITextModel, position: monaco.Position): monaco.languages.ProviderResult<monaco.languages.CompletionList> => {
    return {
      suggestions: [
        {
          label: 'System.out.println',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'System.out.println($1);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          }
        },
        {
          label: 'public class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public class ${1:ClassName} {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a public class',
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          }
        },
        {
          label: 'public static void main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public static void main(String[] args) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create main method',
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          }
        }
      ]
    };
  };

  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: completionProvider
  });
});

function App() {
  const [code, setCode] = useState<string>(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`)
  const [output, setOutput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Add dark mode class by default
    document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          setCode(content)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRunCode = async () => {
    try {
      setIsLoading(true)
      setOutput('Compiling and running...')
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/compile`, { code })
      if (response.data.error) {
        setOutput(response.data.error)
      } else {
        setOutput(response.data.output || 'No output')
      }
    } catch (error) {
      setOutput('Error: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    automaticLayout: true,
    snippetSuggestions: 'inline',
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    quickSuggestions: true,
    tabCompletion: 'on'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="w-full px-2 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 max-w-[98%] mx-auto space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">JavaSher</h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".java"
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-sm sm:text-base"
            >
              📁 Upload File
            </button>
            <button
              onClick={toggleTheme}
              className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-sm sm:text-base"
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)] max-w-[98%] mx-auto space-y-4 lg:space-y-0">
          {/* Editor Panel */}
          <div className="w-full lg:w-3/4 h-[60vh] lg:h-full">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 lg:mr-2">
              <div className="h-[calc(100%-3.5rem)] border dark:border-gray-700 rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="java"
                  theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={editorOptions}
                />
              </div>
              <button
                onClick={handleRunCode}
                disabled={isLoading}
                className="mt-2 w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="w-full lg:w-1/4 h-[40vh] lg:h-full">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Output</h2>
              <pre className="h-[calc(100%-2.5rem)] p-2 rounded-lg overflow-auto font-mono text-xs sm:text-sm whitespace-pre-wrap bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
                {output || 'Click "Run Code" to see the output'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
