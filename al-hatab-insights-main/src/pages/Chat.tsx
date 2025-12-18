import { useRef, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, Database, Image as ImageIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/components/floating-bot/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageLightbox } from "@/components/floating-bot/ImageLightbox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearChat } = useChat();

  return (
    <header className="h-14 sm:h-16 border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-6 bg-white">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <img
              src="/image.png"
              alt="AI Gennie"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-xs sm:text-sm text-foreground leading-tight truncate">
              {t("chat.title")}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate hidden sm:block">{t("chat.subtitle")}</p>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={clearChat}
        className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs shrink-0"
      >
        Clear
      </Button>
    </header>
  );
};

const ChatEmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <img
            src="/image.png"
            alt="AI Gennie"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover opacity-80"
          />
        </div>
        <p className="text-xs sm:text-sm font-medium text-foreground">
          {t("chat.startConversation")}
        </p>
        <p className="text-[10px] sm:text-xs mt-1 text-muted-foreground">
          {t("chat.askAboutData")}
        </p>
      </div>
    </div>
  );
};

const ChatMessages = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6">
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
};

const ChatInput = () => {
  const { t } = useTranslation();
  const { input, setInput, isLoading, sendCurrentMessage } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  };

  return (
    <div className="border-t border-border bg-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 sm:px-4 py-1.5 sm:py-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.askAboutData")}
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm sm:text-base"
          />
          <Button
            onClick={sendCurrentMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const { t } = useTranslation();
  const { messages, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChatHeader />
      <main className="flex-1 flex flex-col bg-background">
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ChatMessages>
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-2">
                <div
                  className={`text-[10px] sm:text-xs font-medium ${
                    message.role === "assistant"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.role === "assistant" ? t("chat.title") : "You"}
                </div>
                <ReactMarkdown
                  className="text-xs sm:text-sm whitespace-pre-wrap text-foreground prose prose-sm max-w-none break-words"
                  remarkPlugins={[remarkGfm]}
                >
                  {message.content}
                </ReactMarkdown>

                {message.sql && (
                  <div className="mt-1 border border-border/60 rounded-md bg-card px-2 sm:px-3 py-1.5 sm:py-2">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {t("chat.sqlQuery")}
                    </p>
                    <code className="text-[10px] sm:text-xs block overflow-x-auto font-mono scrollbar-hide">
                      {message.sql}
                    </code>
                  </div>
                )}

                {message.data && message.data.length > 0 && (
                  <div className="mt-1 border border-border/60 rounded-md bg-card px-2 sm:px-3 py-1.5 sm:py-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      {t("chat.results")}: {message.data.length}{" "}
                      {message.data.length !== 1 ? t("chat.rows") : t("chat.row")}
                    </p>
                    <div className="max-h-48 sm:max-h-56 overflow-x-auto overflow-y-auto text-[10px] sm:text-xs scrollbar-hide">
                      <table className="w-full text-left min-w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            {Object.keys(message.data[0]).map((key) => (
                              <th key={key} className="p-1 font-semibold text-muted-foreground whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {message.data.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b border-border/30">
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="p-1 whitespace-nowrap">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {message.data.length > 5 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {t("chat.andMoreRows", { count: message.data.length - 5 })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {message.viz && (
                  <div className="mt-1 border border-border/60 rounded-md bg-card px-2 sm:px-3 py-1.5 sm:py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {t("chat.visualization")}
                      </p>
                    </div>
                    <ImageLightbox
                      src={`data:${message.mime || "image/png"};base64,${message.viz}`}
                      alt="Chart"
                      thumbnailClassName="max-w-full sm:max-w-md"
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
                <span>{t("chat.processing")}</span>
              </div>
            )}
          </ChatMessages>
        )}
      </main>
      <ChatInput />
    </div>
  );
};

export default Chat;


