import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
       <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Medical AI Assistant</h1>
          <p className="text-gray-500">Ask questions about symptoms, medications, or general health.</p>
       </div>
       <div className="flex-1 min-h-0">
          <ChatInterface />
       </div>
    </div>
  );
}
