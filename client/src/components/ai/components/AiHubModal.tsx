import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Plug, Zap, TerminalSquare, Settings,  Activity, 
  Coins,  
  ArrowUpCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { INTEGRATIONS_LIST } from "./AskAiPanel";

interface AiHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = [
  { id: "plugins", label: "Plugins", icon: Plug },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "prompts", label: "Prompts", icon: TerminalSquare },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "credits", label: "AI Credits", icon: Coins },
  { id: "upgrade", label: "Upgrade", icon: ArrowUpCircle },
];

export function AiHubModal({ isOpen, onClose }: AiHubModalProps) {
  const [activeTab, setActiveTab] = useState("plugins");
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [connectedPlugins, setConnectedPlugins] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Reset selected plugin if tab changes
  React.useEffect(() => {
     setSelectedPlugin(null);
  }, [activeTab]);

  const handleConnect = async (id: string, name: string) => {
    setIsConnecting(true);
    try {
      const isGoogle = ['gmail', 'gcal', 'gdrive', 'gclass', 'gmeet'].includes(id);
      const isMicrosoft = id === 'outlook' || id === 'teams';
      
      let endpoint = '';
      if (isGoogle) {
        const service = id === 'gcal' ? 'calendar' : id === 'gdrive' ? 'drive' : id === 'gclass' ? 'classroom' : id === 'gmeet' ? 'meet' : 'gmail';
        endpoint = `/api/google-workspace/connect?service=${service}`;
      } else if (isMicrosoft) {
        endpoint = `/api/auth/microsoft/connect`;
      } else if (id === 'zoom') {
        endpoint = `/api/zoom/connect`;
      } else {
        endpoint = `/api/ai-integrations/connect/${id}`;
      }

      const backendUrl = typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env.VITE_API_URL || "https://api.classgrid.in")
        : "";

      const res = await fetch(backendUrl + endpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success(`${name} connected successfully!`);
        setConnectedPlugins(prev => [...prev, id]);
      } else {
        toast.error(data.message || `Failed to connect ${name}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error connecting to ${name}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getPluginFeatures = (name: string) => {
    return [
      `Allow Classgrid AI to access your ${name} workspace`,
      `Search and sync data automatically`,
      `Take actions directly from the chat interface`
    ];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-hub-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl h-[80vh] flex flex-col md:flex-row bg-background border border-border rounded-2xl shadow-xl overflow-hidden relative"
          >

            {/* ── Left Sidebar ── */}
            <div className="w-full md:w-[240px] shrink-0 border-r border-border bg-sidebar flex flex-col pt-4">

              {/* Tabs */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-muted text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Right Content Area ── */}
            <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
              <div className="p-8 flex-1 overflow-y-auto z-10 relative custom-scrollbar">
                {activeTab === "plugins" ? (
                  selectedPlugin ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col max-w-3xl mx-auto">
                      <button 
                        onClick={() => setSelectedPlugin(null)}
                        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit group"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Back to plugins
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-16 h-16 rounded-2xl border border-border flex items-center justify-center shrink-0 bg-background overflow-hidden shadow-sm">
                            {selectedPlugin.imgUrl ? (
                              <img 
                                src={selectedPlugin.imgUrl} 
                                alt={selectedPlugin.name} 
                                className="w-8 h-8 object-contain" 
                                style={{ filter: selectedPlugin.invertInDarkMode ? 'var(--icon-invert, none)' : selectedPlugin.invertInLightMode ? 'var(--icon-invert-light, none)' : 'none' }}
                              />
                            ) : selectedPlugin.icon ? (
                              <selectedPlugin.icon className="w-8 h-8 text-muted-foreground" />
                            ) : null}
                         </div>
                         <div>
                           <h2 className="text-3xl font-bold text-foreground">{selectedPlugin.name}</h2>
                           <p className="text-sm text-muted-foreground">{selectedPlugin.description || `Integrate ${selectedPlugin.name} with your workspace`}</p>
                         </div>
                      </div>

                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 964 295" className="w-full h-auto mb-8 shrink-0" role="img" aria-label={`${selectedPlugin.name} connected to Classgrid`}>
                        <defs>
                          <clipPath id="cardClip">
                            <rect x="28" y="15" width="875" height="270" rx="18"/>
                          </clipPath>
                          <symbol id="chat" viewBox="0 0 16 16">
                            <path d="M8 1.5C4.4 1.5 1.5 3.9 1.5 6.9c0 1.4.6 2.6 1.6 3.5L2.5 14l3.2-1.6c.7.2 1.5.3 2.3.3 3.6 0 6.5-2.4 6.5-5.4S11.6 1.5 8 1.5z"
                                  fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </symbol>
                        </defs>

                        {/* outer card */}
                        <rect x="28.5" y="15.5" width="875" height="270" rx="18" className="fill-background stroke-border"/>

                        <g clipPath="url(#cardClip)">
                          {/* faint divider */}
                          <line x1="330" y1="15" x2="330" y2="285" className="stroke-border" strokeWidth="1"/>

                          {/* Dynamic Integration icon */}
                          {selectedPlugin.imgUrl ? (
                             <image x="160" y="112" width="93" height="78" preserveAspectRatio="xMidYMid meet"
                                 href={selectedPlugin.imgUrl} style={{ filter: selectedPlugin.invertInDarkMode ? 'var(--icon-invert, none)' : selectedPlugin.invertInLightMode ? 'var(--icon-invert-light, none)' : 'none' }} />
                          ) : (
                             <foreignObject x="160" y="112" width="93" height="78">
                                <div className="w-full h-full flex items-center justify-center">
                                   {selectedPlugin.icon && <selectedPlugin.icon className="w-16 h-16 text-muted-foreground" />}
                                </div>
                             </foreignObject>
                          )}
                          
                          <text x="206" y="222" textAnchor="middle" fontSize="16" fontWeight="500" className="fill-muted-foreground font-sans">{selectedPlugin.name}</text>

                          {/* connection dots */}
                          <circle cx="282" cy="152" r="4.5" className="fill-emerald-500/30"/>
                          <circle cx="302" cy="152" r="4.5" className="fill-emerald-500/60"/>
                          <circle cx="322" cy="152" r="4.5" className="fill-emerald-500"/>

                          {/* Classgrid panel */}
                          <rect x="350.5" y="70.5" width="600" height="260" rx="14" className="fill-background stroke-border"/>

                          {/* Classgrid logo + name */}
                          <image x="379" y="98" width="24" height="24" preserveAspectRatio="xMidYMid meet"
                                 href="/logo.png" />
                          <text x="418" y="118" fontSize="20" fontWeight="700" className="fill-foreground font-sans">Classgrid</text>

                          {/* chat pill 1 */}
                          <rect x="416" y="151" width="303" height="36" rx="18" className="fill-muted"/>
                          <use href="#chat" x="432" y="161" width="16" height="16" className="text-emerald-500/70" />

                          {/* chat pill 2 (active) */}
                          <rect x="374" y="205" width="225" height="36" rx="18" className="fill-emerald-500/10"/>
                          <use href="#chat" x="392" y="215" width="16" height="16" className="text-emerald-500"/>

                          {/* chat pill 3 (cut off) */}
                          <rect x="518" y="259" width="304" height="36" rx="18" className="fill-muted"/>
                          <use href="#chat" x="534" y="269" width="16" height="16" className="text-emerald-500/70" />
                        </g>
                      </svg>

                      <div className="space-y-6 flex-1">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-3">Features available</h3>
                          <ul className="space-y-3">
                            {getPluginFeatures(selectedPlugin.name).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-muted-foreground text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-8 mt-auto border-t border-border">
                        {connectedPlugins.includes(selectedPlugin.id) ? (
                          <div className="flex items-center gap-2 text-emerald-500 font-medium px-6 py-2.5 rounded-full bg-emerald-500/10 w-fit">
                            <CheckCircle2 className="w-5 h-5" />
                            Connected
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleConnect(selectedPlugin.id, selectedPlugin.name)}
                            disabled={isConnecting}
                            className="bg-emerald-500 text-white px-8 py-2.5 rounded-full font-medium shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {isConnecting ? "Connecting..." : "Connect"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Plugins & Integrations</h3>
                      <p className="text-sm text-muted-foreground mb-8 max-w-xl">
                        Connect apps to use in Classgrid. Let Classgrid AI search, sync, and take actions in your workspace tools.
                      </p>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
                        {INTEGRATIONS_LIST.filter(i => i.type !== "action").map((integration) => (
                          <div 
                            key={integration.id} 
                            onClick={() => setSelectedPlugin(integration)}
                            className="group relative bg-background border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-4 min-w-0 pr-4">
                              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center shrink-0 bg-background overflow-hidden shadow-sm">
                                  {integration.imgUrl ? (
                                    <img 
                                      src={integration.imgUrl} 
                                      alt={integration.name} 
                                      className="w-6 h-6 object-contain" 
                                      style={{ filter: integration.invertInDarkMode ? 'var(--icon-invert, none)' : integration.invertInLightMode ? 'var(--icon-invert-light, none)' : 'none' }}
                                    />
                                  ) : integration.icon ? (
                                    <integration.icon className="w-6 h-6 text-muted-foreground" />
                                  ) : null}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-foreground truncate">{integration.name}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {integration.description || "Connect your workspace"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Icon */}
                            <div className="shrink-0 pl-2">
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{TABS.find(t => t.id === activeTab)?.label}</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-xl">
                      Manage your {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} configuration here.
                    </p>
                    
                    {/* Empty Placeholder Area */}
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
                       <p className="text-muted-foreground text-sm">Content for {activeTab} will go here</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Close Button (placed at the end so it renders on top) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-[100] p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
