import VoiceAgent from '../components/VoiceAgent';

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Meeting Summary Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your meetings with AI-powered voice assistance. Get instant summaries, 
            extract action items, and organize discussions effortlessly.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {/* Voice Agent Section */}
          <VoiceAgent className="w-full" />
          
          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl mb-4">🎤</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Voice Interaction</h3>
              <p className="text-gray-600">
                Speak naturally and get real-time assistance with your meeting content.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Smart Summaries</h3>
              <p className="text-gray-600">
                AI-powered summaries that capture key points and decisions from your meetings.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Action Items</h3>
              <p className="text-gray-600">
                Automatically extract and organize action items and follow-up tasks.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Connect</h4>
                <p className="text-sm text-gray-600">Start a voice session with one click</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Speak</h4>
                <p className="text-sm text-gray-600">Share your meeting content naturally</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Process</h4>
                <p className="text-sm text-gray-600">AI analyzes and organizes information</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Get Results</h4>
                <p className="text-sm text-gray-600">Receive summaries and insights instantly</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>Powered by OpenAI Agents SDK • Built with Next.js</p>
        </footer>
      </div>
    </div>
  );
}
