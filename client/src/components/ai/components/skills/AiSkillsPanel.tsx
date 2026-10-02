import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Zap, Save } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Textarea } from "@/components/marketing_ui/textarea";
import { Switch } from "@/components/marketing_ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/marketing_ui/select";

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

  useEffect(() => {
    localStorage.setItem('classgrid_ai_prefs', JSON.stringify(prefs));
  }, [prefs]);

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
        <Zap className="w-6 h-6 text-purple-500" />
        AI Skills & Personalization
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        Customize how Classgrid AI behaves, thinks, and responds to you.
      </p>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 space-y-8">
        
        {/* DROPDOWNS */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-semibold text-lg border-b border-border pb-2">Behavior Defaults</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Tone</label>
              <Select value={prefs.tone} onValueChange={(v) => setPrefs({...prefs, tone: v})}>
                <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="candid">Candid</SelectItem>
                  <SelectItem value="quirky">Quirky</SelectItem>
                  <SelectItem value="efficient">Efficient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verbosity</label>
              <Select value={prefs.verbosity} onValueChange={(v) => setPrefs({...prefs, verbosity: v})}>
                <SelectTrigger><SelectValue placeholder="Select verbosity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed (In-depth)</SelectItem>
                  <SelectItem value="balanced">Balanced (Default)</SelectItem>
                  <SelectItem value="concise">Concise (Direct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format Preference</label>
              <Select value={prefs.format} onValueChange={(v) => setPrefs({...prefs, format: v})}>
                <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Heavy Markdown & Lists</SelectItem>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="code">Code-Heavy</SelectItem>
                  <SelectItem value="visual">Visual (Tables & Diagrams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Emoji Usage</label>
              <Select value={prefs.emoji} onValueChange={(v) => setPrefs({...prefs, emoji: v})}>
                <SelectTrigger><SelectValue placeholder="Select emoji" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="more">More Emojis</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="none">Strictly No Emojis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Explanation Level</label>
              <Select value={prefs.level} onValueChange={(v) => setPrefs({...prefs, level: v})}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced (Jargon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* TEXT INPUTS */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-6 shadow-sm">
          <h4 className="font-semibold text-lg border-b border-border pb-2">Custom Instructions</h4>
          
          <div className="grid grid-cols-2 gap-4">
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

        {/* CUSTOM SKILLS */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-semibold text-lg">Your Custom Skills</h4>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            )}
          </div>

          {showAddForm && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 border border-border">
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
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button size="sm" onClick={createSkill}>Save Skill</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {skills.map(skill => (
              <div key={skill._id} className="group flex items-start justify-between p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-purple-500" />
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
            {!loading && skills.length === 0 && !showAddForm && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom skills added yet. The AI can also create these for you during a chat!
              </p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
