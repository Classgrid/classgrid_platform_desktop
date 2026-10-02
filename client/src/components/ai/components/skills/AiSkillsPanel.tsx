import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Zap, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Textarea } from "@/components/marketing_ui/textarea";
import { Switch } from "@/components/marketing_ui/switch";
import { toast } from "sonner";

const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {value: string, label: string}[] }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 bg-muted/50 hover:bg-muted text-sm font-medium rounded-lg px-3 py-2 cursor-pointer text-foreground transition-colors min-w-[160px] border border-transparent focus-within:border-border"
      >
        <span>{selected.label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-full min-w-[160px] bg-popover border border-border rounded-lg shadow-md z-50 py-1 flex flex-col max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors ${opt.value === value ? 'bg-muted/50 font-medium text-foreground' : 'text-muted-foreground'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function AiSkillsPanel({ backendUrl }: { backendUrl: string }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillInstructions, setNewSkillInstructions] = useState("");

  const DEFAULT_SKILLS = [
    { id: 'socratic', name: 'Socratic Thinker', desc: 'Ask guiding questions to encourage critical thinking instead of direct answers.' },
    { id: 'steps', name: 'Step-by-Step Solver', desc: 'Break complex solutions down into clearly numbered, logical steps.' },
    { id: 'truth', name: 'Strict Truthfulness', desc: 'Explicitly state "I don\'t know" instead of guessing if unsure.' },
    { id: 'action', name: 'Action-Oriented', desc: 'Always conclude with a clear, actionable next step.' },
    { id: 'brevity', name: 'Strict Brevity', desc: 'Skip all pleasantries and greetings. Deliver only the direct answer.' },
    { id: 'privacy', name: 'Data Privacy Guard', desc: 'Redact all Personally Identifiable Information (PII) before outputting.' },
    { id: 'polite', name: 'Polite Corrector', desc: 'Correct user mistakes politely, constructively, and without condescension.' },
    { id: 'citation', name: 'Source Citation', desc: 'Always explicitly cite the tool, database, or document used.' },
    { id: 'a11y', name: 'Accessibility First', desc: 'Ensure all provided UI code meets standard accessibility guidelines.' },
    { id: 'review', name: 'Constructive Reviewer', desc: 'Use the compliment sandwich method when reviewing work.' },
  ];

  // We can just store preferences in localStorage for now, as it's UI config
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('classgrid_ai_prefs');
    if (saved) return JSON.parse(saved);
    return {
      tone: 'balanced',
      verbosity: 'balanced',
      format: 'markdown',
      emoji: 'default',
      level: 'intermediate',
      aboutMe: '',
      howToRespond: '',
      nickname: '',
      occupation: '',
      activeDefaults: ['truth', 'privacy']
    };
  });

  const savePreferences = () => {
    localStorage.setItem('classgrid_ai_prefs', JSON.stringify(prefs));
    toast.success("Preferences saved successfully!");
  };

  const toggleDefaultSkill = (id: string) => {
    setPrefs((prev: any) => ({
      ...prev,
      activeDefaults: prev.activeDefaults.includes(id) 
        ? prev.activeDefaults.filter((s: string) => s !== id)
        : [...prev.activeDefaults, id]
    }));
  };

  const fetchSkills = async () => {
    // We would normally fetch from our new backend endpoint here.
    // For now, since the AI manages it via MCP, we'll implement a basic fetch if there's a REST endpoint.
    // Since we didn't build a REST endpoint in org.routes yet, let's just display what we have or mock it.
    // Wait, the user asked for this page to show the skills. We need a REST route to fetch them.
    // I will simulate it and then build the REST route next.
    try {
      const res = await fetch(`${backendUrl}/api/ai/skills`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const createSkill = async () => {
    if (!newSkillName.trim() || !newSkillInstructions.trim()) return;
    try {
      const res = await fetch(`${backendUrl}/api/ai/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newSkillName, instructions: newSkillInstructions })
      });
      if (res.ok) {
        toast.success("Skill created successfully!");
        setNewSkillName("");
        setNewSkillInstructions("");
        setShowAddForm(false);
        fetchSkills();
      }
    } catch (e) {
      toast.error("Failed to create skill");
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/ai/skills/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Skill deleted");
        fetchSkills();
      }
    } catch (e) {
      toast.error("Failed to delete skill");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        AI Skills & Personalization
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        Customize how Classgrid AI behaves, thinks, and responds to you.
      </p>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 space-y-8">
        
        {/* DROPDOWNS */}
        <section className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="border-b border-border pb-3 mb-2">
            <h4 className="font-semibold text-lg">Behavior Defaults</h4>
            <p className="text-xs text-muted-foreground mt-1">Choose additional customizations on top of your base style and tone.</p>
          </div>
          
          <div className="flex flex-col divide-y divide-border/50">
            <div className="flex items-center justify-between py-4">
              <label className="text-sm font-medium">Base Tone</label>
              <CustomSelect 
                value={prefs.tone} 
                onChange={(val) => setPrefs({...prefs, tone: val})} 
                options={[
                  { value: 'professional', label: 'Professional' },
                  { value: 'friendly', label: 'Friendly' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'candid', label: 'Candid' },
                  { value: 'quirky', label: 'Quirky' },
                  { value: 'efficient', label: 'Efficient' }
                ]} 
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <label className="text-sm font-medium">Verbosity</label>
              <CustomSelect 
                value={prefs.verbosity} 
                onChange={(val) => setPrefs({...prefs, verbosity: val})} 
                options={[
                  { value: 'detailed', label: 'Detailed' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'concise', label: 'Concise' }
                ]} 
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <label className="text-sm font-medium">Format Preference</label>
              <CustomSelect 
                value={prefs.format} 
                onChange={(val) => setPrefs({...prefs, format: val})} 
                options={[
                  { value: 'markdown', label: 'Markdown & Lists' },
                  { value: 'plain', label: 'Plain Text' },
                  { value: 'code', label: 'Code-Heavy' },
                  { value: 'visual', label: 'Visual (Tables)' }
                ]} 
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <label className="text-sm font-medium">Emoji Usage</label>
              <CustomSelect 
                value={prefs.emoji} 
                onChange={(val) => setPrefs({...prefs, emoji: val})} 
                options={[
                  { value: 'more', label: 'More Emojis' },
                  { value: 'default', label: 'Default' },
                  { value: 'none', label: 'No Emojis' }
                ]} 
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <label className="text-sm font-medium">Explanation Level</label>
              <CustomSelect 
                value={prefs.level} 
                onChange={(val) => setPrefs({...prefs, level: val})} 
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]} 
              />
            </div>
          </div>
        </section>

        {/* TEXT INPUTS */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-6 shadow-sm">
          <h4 className="font-semibold text-lg border-b border-border pb-2">Custom Instructions</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1.5">
              <label className="text-sm font-medium">Nickname</label>
              <Input 
                placeholder="What should AI call you?" 
                value={prefs.nickname} 
                onChange={(e) => setPrefs({...prefs, nickname: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Occupation</label>
              <Input 
                placeholder="What is your role?" 
                value={prefs.occupation} 
                onChange={(e) => setPrefs({...prefs, occupation: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What would you like Classgrid AI to know about you?</label>
            <p className="text-xs text-muted-foreground mb-2">Interests, values, or preferences to keep in mind.</p>
            <Textarea 
              rows={3} 
              className="resize-none"
              placeholder="Tell us your goals, what you are working on, or any background context..."
              value={prefs.aboutMe}
              onChange={(e) => setPrefs({...prefs, aboutMe: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">How would you like Classgrid AI to respond?</label>
            <Textarea 
              rows={3} 
              className="resize-none"
              placeholder="Add any specific formatting rules, topics to avoid, or custom instructions..."
              value={prefs.howToRespond}
              onChange={(e) => setPrefs({...prefs, howToRespond: e.target.value})}
            />
          </div>
        </section>

        {/* TOGGLES */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-semibold text-lg border-b border-border pb-2">Default AI Skills</h4>
          <div className="space-y-4 mt-4">
            {DEFAULT_SKILLS.map(skill => (
              <div key={skill.id} className="flex items-start justify-between">
                <div className="space-y-0.5 max-w-[85%]">
                  <p className="font-medium text-sm">{skill.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{skill.desc}</p>
                </div>
                <Switch 
                  checked={prefs.activeDefaults.includes(skill.id)} 
                  onCheckedChange={() => toggleDefaultSkill(skill.id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ADD CUSTOM SKILL CARD */}
        <section className="bg-card border border-border p-5 rounded-xl shadow-sm transition-all">
          {!showAddForm ? (
            <div 
              className="flex items-center gap-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors group"
              onClick={() => setShowAddForm(true)}
            >
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-purple-500/10 group-hover:text-purple-500 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-[15px]">Add Custom Skill</h4>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-border pb-3 mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  Create Custom Skill
                </h4>
              </div>
              <div className="space-y-3">
                <Input 
                  placeholder='Skill Name (e.g., "Math Socratic Tutor")'
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
                <Textarea 
                  placeholder='Skill Instructions (e.g., "When I ask a math question, never give me the direct answer. Only give me the first step...")'
                  value={newSkillInstructions}
                  onChange={(e) => setNewSkillInstructions(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={createSkill}>Save Skill</Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CUSTOM SKILLS LIST */}
        {(skills.length > 0 || loading) && (
          <section className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <h4 className="font-semibold text-lg border-b border-border pb-3 mb-2">Your Custom Skills</h4>
            <div className="flex flex-col divide-y divide-border/50">
              {skills.map(skill => (
                <div key={skill._id} className="group flex items-start justify-between py-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      {skill.name}
                    </h5>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{skill.instructions}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    onClick={() => deleteSkill(skill._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {loading && <p className="text-sm text-muted-foreground py-4">Loading skills...</p>}
            </div>
          </section>
        )}
        {/* SAVE BUTTON */}
        <div className="pt-6 border-t border-border mt-4 flex justify-end">
          <Button onClick={savePreferences} className="gap-2 px-6">
            <Save className="w-4 h-4" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
