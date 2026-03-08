import { useState } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [message, setMessage] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [status, setStatus] = useState('Idle')

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/verify', {
        headers: { 'X-API-Key': password }
      });
      
      if (response.ok) {
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Access Denied: Invalid Password');
      }
    } catch (err) {
      setLoginError('Cannot connect to server');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!csvFile || !message) {
      alert("Please provide at least a CSV file and a message.")
      return
    }

    setStatus('Processing')

    const formData = new FormData()
    formData.append('message', message)
    formData.append('contacts_file', csvFile)
    
    if (imageFile) {
      formData.append('image_file', imageFile)
    }

    try {
      const response = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: {
          'X-API-Key': password // Make sure this perfectly matches your Python script!
        },
        body: formData,
      })

      const result = await response.json()
      
      if (result.status === "success") {
        setStatus('Success')
      } else {
        setStatus('Error: ' + result.message)
      }
    } catch (error) {
      console.error(error)
      setStatus('Error: Could not connect to API')
    }
  }

  const getStatusStyles = () => {
    if (status === 'Processing') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (status === 'Success') return 'bg-green-50 text-green-700 border-green-200'
    if (status.startsWith('Error')) return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  // SMART SHRINKER: Keeps the UI clean by truncating long file names
  const shortenFileName = (name) => {
    if (!name) return '';
    if (name.length > 22) {
      return name.substring(0, 12) + '...' + name.substring(name.length - 7);
    }
    return name;
  }

if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          
          <div className="bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6 text-white text-center">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Secure Login
            </h1>
            <p className="text-green-50 mt-1 text-xs sm:text-sm">Enter your system password to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secret key..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none transition-all text-gray-700 text-sm sm:text-base"
                required
              />
              {loginError && (
                <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {loginError}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 sm:py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-green-100 text-sm sm:text-base"
            >
              Unlock System
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        <div className="bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span className="truncate">Campaign Manager</span>
          </h1>
          <p className="text-green-50 mt-1 text-xs sm:text-sm">Automate your personalized bulk messages safely.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="relative overflow-hidden">
              <label className={`flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${csvFile ? 'border-[#25D366] bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mb-2 mx-auto ${csvFile ? 'text-[#25D366]' : 'text-gray-400'}`}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h2"></path><path d="M14 13h2"></path><path d="M14 17h2"></path></svg>
                  {/* Truncated CSV Name */}
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {csvFile ? shortenFileName(csvFile.name) : 'Upload Contacts (.csv)'}
                  </p>
                </div>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files[0])} required />
              </label>
            </div>

            <div className="relative overflow-hidden">
              <label className={`flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mb-2 mx-auto ${imageFile ? 'text-blue-500' : 'text-gray-400'}`}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                  {/* Truncated Image Name */}
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {imageFile ? shortenFileName(imageFile.name) : 'Attach Image (Optional)'}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message Template</label>
            <textarea 
              rows="6" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none transition-all resize-none text-gray-700 text-sm sm:text-base"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi {Name},&#10;&#10;Type your promotional message here. Use {ColumnName} to inject personalized data from your CSV..."
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={status === 'Processing'}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 sm:py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-100 text-sm sm:text-base"
          >
            {status === 'Processing' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Running...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                Start Campaign
              </>
            )}
          </button>

          {status !== 'Idle' && (
            <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border text-sm sm:text-base ${getStatusStyles()}`}>
              <span className="font-medium">{status}</span>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}

export default App