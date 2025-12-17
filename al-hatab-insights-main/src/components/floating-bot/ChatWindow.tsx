import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  X,
  Loader2,
  Database,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useChat } from "./ChatContext";
import { ImageLightbox } from "./ImageLightbox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWindow = ({ isOpen, onClose }: ChatWindowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { messages, input, setInput, isLoading, sendCurrentMessage, clearChat } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  };

  const handleOpenFullPage = () => {
    onClose();
    navigate("/chat");
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-6 bg-card border-2 border-primary/20 rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 backdrop-blur-sm overflow-hidden ${
        isExpanded ? "bottom-6 w-[min(480px,100vw-3rem)] h-[80vh]" : "bottom-28 w-96 h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg border-2 border-primary/20">
            <img
              src="/image.png"
              alt="AI Gennie"
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <Database class="w-5 h-5 text-primary-foreground" />
                  `;
                }
              }}
            />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{t("chat.title")}</h3>
            <p className="text-xs text-muted-foreground font-medium">{t("chat.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="h-8 w-8"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenFullPage}
            className="h-8 w-8"
            aria-label="Open full chat"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-8 w-8"
            aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <img
                  src="/image.png"
                  alt="AI Gennie"
                  className="w-12 h-12 rounded-full object-cover opacity-60"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <Database class="w-8 h-8 text-primary opacity-50" />
                      `;
                    }
                  }}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{t("chat.startConversation")}</p>
              <p className="text-xs mt-1 text-muted-foreground">{t("chat.askAboutData")}</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === "user"
                  ? "message-bubble-user text-primary-foreground"
                  : "message-bubble-assistant text-foreground"
              }`}
            >
              <ReactMarkdown
                className="prose prose-sm max-w-none whitespace-pre-wrap break-words"
                remarkPlugins={[remarkGfm]}
              >
                {message.content}
              </ReactMarkdown>

              {/* SQL Query Display */}
              {message.sql && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {t("chat.sqlQuery")}
                  </p>
                  <code className="text-xs bg-background/60 p-2.5 rounded-md block overflow-x-auto font-mono border border-border/30">
                    {message.sql}
                  </code>
                </div>
              )}

              {/* Data Table Preview */}
              {message.data && message.data.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("chat.results")}: {message.data.length} {message.data.length !== 1 ? t("chat.rows") : t("chat.row")}
                  </p>
                  <div className="max-h-32 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border/50">
                          {Object.keys(message.data[0]).map((key) => (
                            <th key={key} className="p-1 font-semibold text-muted-foreground">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {message.data.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b border-border/30">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="p-1">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {message.data.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("chat.andMoreRows", { count: message.data.length - 3 })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Visualization */}
              {message.viz && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t("chat.visualization")}</p>
                  </div>
                  <ImageLightbox
                    src={`data:${message.mime || "image/png"};base64,${message.viz}`}
                    alt="Chart"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground/70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="message-bubble-assistant rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-foreground font-medium">{t("chat.processing")}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.askAboutData")}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendCurrentMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

