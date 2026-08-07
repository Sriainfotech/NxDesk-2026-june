"use client"

import { useState, useEffect } from "react"
import { Search, Info, X } from "lucide-react"
import Sidebar from "../components/Sidebar"
// Mock data for similar articles
import { axiosInstance } from "../utils/axiosInstance"
const MOCK_ARTICLES = [
  {
    id: "KB00000028",
    title: "Improving Application Performance",
    description: "Improving Application Performance link By Sue Harper Manage and tune Oracle Application",
    author: "Sue Harper",
  },
  {
    id: "KB00002201",
    title: "Apple Cloud Syncing Performance Issue",
    description: "Apple Cloud Syncing Performance Issue Add memory to cloud servers Work around is to have users",
    author: "John Doe",
  },
  {
    id: "KB00002901",
    title: "Users experience performance issues accessing Mac applications",
    description: "Users experience performance issues accessing Mac applications Insufficient CPU, RAM, or free",
    author: "Jane Smith",
  },
  {
    id: "KB00004206",
    title: "Tips to improve PC performance in Windows 10",
    description: "Tips to improve PC performance in Windows 10 For more info about updates, including how you can",
    author: "Mike Johnson",
  },
  {
    id: "KB00004207",
    title: "Tips to improve PC performance in Windows 10",
    description: "Tips to improve PC performance in Windows 10 Having many apps, programs, web browsers, and so",
    author: "Lisa Brown",
  },
]

export default function KnowledgeArticle() {
  const [view, setView] = useState("search") // 'search' or 'create'
  const [articles, setArticles] = useState(MOCK_ARTICLES)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredArticles, setFilteredArticles] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState("How To")
  const [articleTitle, setArticleTitle] = useState("")
  const [similarArticles, setSimilarArticles] = useState([])
  const [showSimilar, setShowSimilar] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [metadata, setMetadata] = useState({
    visibility: "",
    publishExternal: "No",
    author: "Allen Albrook",
    language: "",
    assignee: "None Yet",
    supportGroup: "None Yet",
    keywords: "",
    company: "Calibro Services",
    site: "",
    siteGroup: "",
    organization: "",
    department: "",
    solution: "",
    causeOfIssue: "",
    category: 1,
    ticket: "S00000005"
  })
  
  const api = axiosInstance
  
  // Replace your fetchKnowledgeArticles function with this
  const fetchKnowledgeArticles = async () => {
    setIsLoading(true)
    setErrorMessage("")
    
    try {
      const response = await api.get('/knowledge_article/knowledge_create/')
      
      // Transform API data to match our article structure
      const apiArticles = response.data.map(article => ({
        id: `KB${article.article_id.toString().padStart(8, '0')}`,
        title: article.title,
        description: article.solution,
        author: article.created_by,
        causeOfIssue: article.cause_of_the_issue,
        createdAt: article.created_at,
        modifiedAt: article.modified_at,
        category: article.category,
        ticket: article.ticket
      }))
      
      // Combine with existing mock data for now
      // In production, you might want to use only API data
      setArticles([...apiArticles, ...MOCK_ARTICLES])
    } catch (error) {
      console.error("Failed to fetch knowledge articles:", error)
      setErrorMessage("Failed to load knowledge articles. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Replace your createKnowledgeArticle function with this
  const createKnowledgeArticle = async () => {
    setIsLoading(true)
    setErrorMessage("")
    
    try {
      const articleData = {
        created_by: metadata.author,
        title: articleTitle,
        solution: metadata.solution || "Default solution text",
        cause_of_the_issue: metadata.causeOfIssue || "Default cause text",
        category: metadata.category,
        ticket: metadata.ticket
      }
      
      const response = await api.post('/knowledge_article/knowledge_create/', articleData)
      
      // Transform the API response to match our article structure
      const newArticle = {
        id: `KB${response.data.article_id.toString().padStart(8, '0')}`,
        title: response.data.title,
        description: response.data.solution,
        author: response.data.created_by,
        causeOfIssue: response.data.cause_of_the_issue,
        createdAt: response.data.created_at,
        modifiedAt: response.data.modified_at,
        category: response.data.category,
        ticket: response.data.ticket
      }
      
      // Add to articles list
      setArticles([newArticle, ...articles])
      
      return true
    } catch (error) {
      console.error("Failed to create knowledge article:", error)
      setErrorMessage("Failed to create knowledge article. Please try again.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch knowledge articles on component mount
  useEffect(() => {
    fetchKnowledgeArticles()
  }, [])

  // Fetch knowledge articles from API


  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredArticles(filtered)
    } else {
      setFilteredArticles(articles)
    }
  }, [searchTerm, articles])

  // Check for similar articles when title changes
  useEffect(() => {
    if (articleTitle.length > 3) {
      const similar = articles.filter((article) => article.title.toLowerCase().includes(articleTitle.toLowerCase()))
      setSimilarArticles(similar)
      setShowSimilar(similar.length > 0)
    } else {
      setSimilarArticles([])
      setShowSimilar(false)
    }
  }, [articleTitle, articles])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const success = await createKnowledgeArticle()
    
    if (success) {
      // Reset form
      setArticleTitle("")
      setShowSimilar(false)
      setMetadata({
        ...metadata,
        solution: "",
        causeOfIssue: ""
      })

      // Switch to search view
      setView("search")
    }
  }

  // Copy from existing article
  const handleCopyFromArticle = (article) => {
    setArticleTitle(article.title)
    
    // If article has causeOfIssue and solution properties, copy them too
    if (article.causeOfIssue) {
      setMetadata({
        ...metadata,
        causeOfIssue: article.causeOfIssue
      })
    }
    
    if (article.description) {
      setMetadata({
        ...metadata,
        solution: article.description
      })
    }
    
    setShowSimilar(false)
  }

  return (        
    <div className="flex w-full min-h-screen bg-gray-50">
        <div className="hidden lg:flex">
            <Sidebar />
        </div>

    <div className="w-full bg-gray-50">

          {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700">
            {view === "search" ? "Knowledge Articles" : "Create Knowledge"}
          </h1>
          <div>
            {view === "search" ? (
              <button
                onClick={() => setView("create")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Create Article
              </button>
            ) : (
              <button
                onClick={() => setView("search")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Back to Search
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {isLoading && (
          <div className="text-center py-4">
            <p>Loading...</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}
        
        {view === "search" ? (
          /* Search View */
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search knowledge articles..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="space-y-4">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <Info className="text-gray-400 mt-1 mr-3" size={20} />
                      <div>
                        <div className="text-xs text-gray-500">{article.id}</div>
                        <h3 className="font-medium text-green-600">{article.title}</h3>
                        <p className="text-sm text-gray-600">{article.description}</p>
                        <div className="text-xs text-gray-500 mt-2">By {article.author}</div>
                        {article.ticket && (
                          <div className="text-xs text-gray-500">Related ticket: {article.ticket}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No articles found. Try a different search term or create a new article.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Create View */
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">Complete fields and click "Submit Changes" to proceed</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Article Details Form - Replace the existing form fields in the left column with these */}
<div className="lg:col-span-2 space-y-6">
  <div className="border border-gray-200 rounded-lg p-4">
    <h2 className="font-medium mb-2">Article Information</h2>
    <p className="text-sm text-gray-600 mb-3">
      Create a knowledge article to document solutions for common issues.
    </p>
  </div>

  <div className="space-y-4">
    <div>
      <label className="block mb-1">
        Title <span className="text-red-500">(required)</span>
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          required
          placeholder="Enter a descriptive title"
        />
        {articleTitle && (
          <button
            type="button"
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
            onClick={() => setArticleTitle("")}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
    
    {/* Solution field */}
    <div>
      <label className="block mb-1">
        Solution <span className="text-red-500">(required)</span>
      </label>
      <textarea
        className="w-full p-2 border border-gray-300 rounded h-40"
        value={metadata.solution}
        onChange={(e) => setMetadata({ ...metadata, solution: e.target.value })}
        required
        placeholder="Provide the solution steps or instructions"
      />
    </div>
    
    {/* Cause of the issue field */}
    <div>
      <label className="block mb-1">
        Cause of the Issue <span className="text-red-500">(required)</span>
      </label>
      <textarea
        className="w-full p-2 border border-gray-300 rounded h-32"
        value={metadata.causeOfIssue}
        onChange={(e) => setMetadata({ ...metadata, causeOfIssue: e.target.value })}
        required
        placeholder="Describe what causes this issue"
      />
    </div>

    {/* Related Ticket field */}
    <div>
      <label className="block mb-1">
        Related Ticket <span className="text-red-500">(required)</span>
      </label>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded"
        value={metadata.ticket}
        onChange={(e) => setMetadata({ ...metadata, ticket: e.target.value })}
        required
        placeholder="e.g. S00000005"
      />
    </div>

    {/* Category field */}
    <div>
      <label className="block mb-1">
        Category <span className="text-red-500">(required)</span>
      </label>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={metadata.category}
        onChange={(e) => setMetadata({ ...metadata, category: parseInt(e.target.value) })}
        required
      >
        <option value="">Select a category</option>
        <option value="1">Hardware</option>
        <option value="2">Software</option>
        <option value="3">Network</option>
        <option value="4">Security</option>
        <option value="5">Other</option>
      </select>
    </div>

    {/* Similar Articles Section - Keep this section as is */}
    {showSimilar && (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-red-500 font-medium">We found several similar articles</div>
          <button
            type="button"
            className="text-green-600 hover:text-green-700 text-sm"
            onClick={() => setShowSimilar(false)}
          >
            Hide them
          </button>
        </div>

        <div className="mb-2 font-medium">Similar Articles by Title</div>

        <div className="space-y-6">
          {similarArticles.map((article) => (
            <div key={article.id} className="flex items-start">
              <Info className="text-gray-400 mt-1 mr-3" size={20} />
              <div className="flex-1">
                <div className="text-xs text-gray-500">{article.id}</div>
                <h3 className="font-medium text-green-600">{article.title}</h3>
                <p className="text-sm text-gray-600">{article.description}</p>

                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    className="w-full border border-gray-300 rounded py-1.5 hover:bg-gray-50"
                    onClick={() => handleCopyFromArticle(article)}
                  >
                    Copy From Article
                  </button>
                  <button
                    type="button"
                    className="w-full border border-gray-300 rounded py-1.5 hover:bg-gray-50"
                    onClick={() => {
                      /* Edit instead logic */
                    }}
                  >
                    Edit Instead
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>

{/* Right Column - Author Information */}
<div className="space-y-6">
  <div className="border border-gray-200 rounded-lg p-4">
    <h2 className="font-medium mb-4">Author Information</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Author</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          value={metadata.created_by}
          onChange={(e) => setMetadata({ ...metadata, created_by: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Company</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={metadata.company}
            onChange={(e) => setMetadata({ ...metadata, company: e.target.value })}
          />
          <span className="bg-gray-200 text-xs px-2 py-1 rounded">Primary</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm mb-1">Keywords</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Add keywords separated by comma"
          value={metadata.keywords}
          onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">These help with search and categorization</p>
      </div>

      <div>
        <label className="block text-sm mb-1">Visibility</label>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={metadata.visibility}
          onChange={(e) => setMetadata({ ...metadata, visibility: e.target.value })}
        >
          <option value="">Select one</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>
  </div>

  <div className="text-center text-sm text-gray-500">
    This will become the first version when published
  </div>

  <div className="flex justify-end">
    <button 
      type="submit" 
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
      disabled={isLoading}
    >
      {isLoading ? "Submitting..." : "Submit Article"}
    </button>
  </div>
</div>
            </form>
          </div>
        )}
      </main>
    </div>
</div>

  )
}