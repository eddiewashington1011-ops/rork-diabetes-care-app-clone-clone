import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Send, Video, Sparkles, Copy, Check, Camera, Play, Hash, MessageSquare } from "lucide-react-native";
import { createRorkTool, useRorkAgent } from "@rork-ai/toolkit-sdk";
import * as z from "zod";
import * as Clipboard from "expo-clipboard";
import Colors from "@/constants/colors";
import { useRecipes } from "@/providers/recipes";
import { ShortVideoPack } from "@/mocks/recipes";

type VideoScriptScene = {
  timecode: string;
  content: string;
};

type StoryboardShot = {
  shotNumber: number;
  duration: string;
  angle: string;
  action: string;
  onScreenText: string;
  soundCue: string;
};

type GeneratedContent = {
  type: "script" | "storyboard" | "prompts" | "captions" | "full_pack";
  data: Partial<ShortVideoPack>;
};

export default function VideoAgentScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { getRecipeById } = useRecipes();
  const recipe = useMemo(() => getRecipeById(recipeId), [getRecipeById, recipeId]);

  const [input, setInput] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const { messages, sendMessage, status, error } = useRorkAgent({
    tools: {
      generateVideoScript: createRorkTool({
        description: "Generate a time-coded video script for a short-form cooking video (30-60 seconds). Use this when the user wants to create a video script or plan video content.",
        zodSchema: z.object({
          style: z.enum(["fast-paced", "educational", "asmr", "cinematic"]).describe("The style of the video"),
          duration: z.number().min(15).max(90).describe("Target video duration in seconds"),
          focusArea: z.string().optional().describe("What to emphasize: cooking process, final dish, nutrition info, etc."),
        }),
        execute: (toolInput) => {
          console.log("[VideoAgent] generateVideoScript called", toolInput);
          const script: VideoScriptScene[] = [
            { timecode: "[00:00-00:03]", content: `Hook: Stunning reveal of ${recipe?.title ?? "the dish"} with steam rising` },
            { timecode: "[00:03-00:08]", content: "Quick ingredient showcase with nutrition overlay" },
            { timecode: "[00:08-00:18]", content: `${toolInput.style === "fast-paced" ? "Rapid cuts of" : "Smooth shots showing"} prep work` },
            { timecode: "[00:18-00:30]", content: "Main cooking action with satisfying sounds" },
            { timecode: "[00:30-00:40]", content: "Plating sequence with garnish close-ups" },
            { timecode: "[00:40-00:50]", content: "Hero shot + nutrition facts overlay" },
            { timecode: "[00:50-00:60]", content: "CTA with fork bite shot" },
          ];
          setGeneratedContent({ type: "script", data: { videoScript: script } });
          return JSON.stringify({ success: true, scenes: script.length, style: toolInput.style });
        },
      }),

      generateStoryboard: createRorkTool({
        description: "Generate a detailed shot-by-shot storyboard for vertical video (9:16). Use when user wants camera angles, shot types, or visual planning.",
        zodSchema: z.object({
          shotCount: z.number().min(6).max(12).describe("Number of shots to generate"),
          cameraStyle: z.enum(["overhead", "dynamic", "handheld", "tripod"]).describe("Primary camera style"),
        }),
        execute: (toolInput) => {
          console.log("[VideoAgent] generateStoryboard called", toolInput);
          const angles = ["overhead", "close-up", "45-degree", "eye-level", "slow pan", "macro"];
          const shots: StoryboardShot[] = Array.from({ length: toolInput.shotCount }, (_, i) => ({
            shotNumber: i + 1,
            duration: `${2 + Math.floor(Math.random() * 3)}s`,
            angle: angles[i % angles.length] ?? "overhead",
            action: i === 0 ? "Hero reveal shot" : i === toolInput.shotCount - 1 ? "Final bite shot" : `Cooking step ${i}`,
            onScreenText: i === 0 ? recipe?.title ?? "Recipe" : i === 1 ? `${recipe?.carbsPerServing ?? 20}g carbs` : "",
            soundCue: i === 0 ? "Music hit" : ["sizzle", "chop", "pour", "stir"][i % 4] ?? "ambient",
          }));
          setGeneratedContent({ type: "storyboard", data: { verticalStoryboard: shots } });
          return JSON.stringify({ success: true, shots: shots.length, style: toolInput.cameraStyle });
        },
      }),

      generateAIVideoPrompts: createRorkTool({
        description: "Generate prompts for AI video tools like Runway, Sora, Pika, or Luma. Use when user wants to create AI-generated video clips.",
        zodSchema: z.object({
          tool: z.enum(["runway", "sora", "pika", "luma", "generic"]).describe("Target AI video tool"),
          promptCount: z.number().min(3).max(10).describe("Number of prompts to generate"),
        }),
        execute: (toolInput) => {
          console.log("[VideoAgent] generateAIVideoPrompts called", toolInput);
          const title = recipe?.title ?? "delicious dish";
          const prompts = [
            `Cinematic overhead shot of ${title}, steam rising gently, professional food photography lighting, 9:16 vertical format, 4K quality`,
            `Close-up of fresh ingredients on marble counter, soft natural window lighting, shallow depth of field, vertical format`,
            `Smooth tracking shot of chef's hands chopping vegetables, wooden cutting board, satisfying cooking video aesthetic`,
            `Eye-level shot of ingredients sizzling in pan, steam and movement visible, warm kitchen lighting, professional food video`,
            `Macro close-up of sauce being drizzled over dish, slow motion feel, restaurant quality presentation`,
            `45-degree angle of beautifully plated ${title}, garnished with fresh herbs, soft diffused lighting`,
            `Close-up of fork lifting perfect bite, steam visible, appetizing food porn aesthetic, vertical format`,
          ].slice(0, toolInput.promptCount);
          
          const heroPrompt = `Professional food photography of ${title}, perfectly plated on elegant ceramic dish, soft side lighting with gentle shadows, shallow depth of field, garnished with microgreens, steam rising delicately, warm inviting color palette, 9:16 vertical, makes viewer hungry, ${toolInput.tool === "runway" ? "cinematic motion" : "hyper-realistic"}`;
          
          setGeneratedContent({ 
            type: "prompts", 
            data: { videoGenerationPrompts: prompts, finalHeroShotPrompt: heroPrompt } 
          });
          return JSON.stringify({ success: true, prompts: prompts.length, tool: toolInput.tool });
        },
      }),

      generateCaptionsAndHashtags: createRorkTool({
        description: "Generate auto-captions, CTAs, and hashtags for social media posting. Use when user wants text content for TikTok, Reels, or Shorts.",
        zodSchema: z.object({
          platform: z.enum(["tiktok", "instagram", "youtube", "all"]).describe("Target platform"),
          tone: z.enum(["educational", "fun", "trendy", "professional"]).describe("Tone of the captions"),
        }),
        execute: (toolInput) => {
          console.log("[VideoAgent] generateCaptionsAndHashtags called", toolInput);
          const captions = [
            `${recipe?.title ?? "This recipe"} - only ${recipe?.carbsPerServing ?? 20}g carbs!`,
            "Perfect for blood sugar control 🩸✨",
            "No added sugars in this one!",
            `${recipe?.calories ?? 350} calories of pure satisfaction`,
            `Ready in ${(recipe?.prepTime ?? 10) + (recipe?.cookTime ?? 15)} minutes`,
            "Diabetes-friendly comfort food 💚",
          ];
          
          const hashtags = toolInput.platform === "tiktok" 
            ? ["#diabetesfriendly", "#lowcarb", "#healthytiktok", "#foodtok", "#diabetesawareness", "#mealprep", "#healthyrecipes"]
            : toolInput.platform === "instagram"
            ? ["#diabetesfriendly", "#lowcarbrecipes", "#healthyeating", "#bloodsugarcontrol", "#mealprep", "#cleaneating", "#healthyfood"]
            : ["#diabetesfriendly", "#lowcarb", "#healthyrecipes", "#bloodsugar", "#mealprep", "#healthyeating", "#diabetesawareness"];
          
          const cta = toolInput.tone === "fun" 
            ? "Save this and try it tonight! 🔥"
            : toolInput.tone === "educational"
            ? "Save for your next meal prep session 📌"
            : "Follow for more diabetes-friendly recipes!";
          
          setGeneratedContent({ 
            type: "captions", 
            data: { autoCaptions: captions, hashtags, cta } 
          });
          return JSON.stringify({ success: true, captions: captions.length, hashtags: hashtags.length, platform: toolInput.platform });
        },
      }),

      generateFullVideoPack: createRorkTool({
        description: "Generate a complete video content pack with script, storyboard, AI prompts, captions, and hashtags. Use when user wants everything at once.",
        zodSchema: z.object({
          style: z.enum(["viral", "educational", "aesthetic", "quick"]).describe("Overall content style"),
        }),
        execute: (toolInput) => {
          console.log("[VideoAgent] generateFullVideoPack called", toolInput);
          if (!recipe) return JSON.stringify({ success: false, error: "No recipe found" });
          
          const script: VideoScriptScene[] = [
            { timecode: "[00:00-00:03]", content: `Hook: Stunning reveal of ${recipe.title} with steam rising` },
            { timecode: "[00:03-00:08]", content: "Quick ingredient showcase with nutrition overlay" },
            { timecode: "[00:08-00:18]", content: `${toolInput.style === "viral" ? "Rapid cuts of" : "Smooth shots showing"} prep work` },
            { timecode: "[00:18-00:30]", content: "Main cooking action with satisfying sounds" },
            { timecode: "[00:30-00:40]", content: "Plating sequence with garnish close-ups" },
            { timecode: "[00:40-00:50]", content: "Hero shot + nutrition facts overlay" },
            { timecode: "[00:50-00:60]", content: "CTA with fork bite shot" },
          ];

          const storyboard: StoryboardShot[] = [
            { shotNumber: 1, duration: "3s", angle: "overhead", action: "Hero reveal", onScreenText: recipe.title, soundCue: "Music hit" },
            { shotNumber: 2, duration: "5s", angle: "close-up", action: "Ingredients", onScreenText: `${recipe.carbsPerServing}g carbs`, soundCue: "upbeat" },
            { shotNumber: 3, duration: "10s", angle: "45-degree", action: "Prep work", onScreenText: "", soundCue: "chop sounds" },
            { shotNumber: 4, duration: "12s", angle: "eye-level", action: "Cooking", onScreenText: "", soundCue: "sizzle" },
            { shotNumber: 5, duration: "10s", angle: "overhead", action: "Plating", onScreenText: "", soundCue: "transition" },
            { shotNumber: 6, duration: "5s", angle: "hero", action: "Final shot", onScreenText: "CTA", soundCue: "Music finale" },
          ];

          const prompts = [
            `Cinematic overhead shot of ${recipe.title}, steam rising, professional food photography, 9:16 vertical, 4K`,
            `Close-up of fresh ingredients on marble counter, soft natural lighting, shallow depth of field`,
            `Smooth tracking shot of cooking process, warm kitchen lighting, professional food video`,
          ];

          const captions = [
            `${recipe.title} - only ${recipe.carbsPerServing}g carbs!`,
            "Perfect for blood sugar control 🩸✨",
            `${recipe.calories} calories of pure satisfaction`,
            "Diabetes-friendly comfort food 💚",
          ];

          const hashtags = ["#diabetesfriendly", "#lowcarb", "#healthytiktok", "#foodtok", "#mealprep", "#healthyrecipes"];
          
          setGeneratedContent({ 
            type: "full_pack", 
            data: { 
              videoScript: script, 
              verticalStoryboard: storyboard, 
              videoGenerationPrompts: prompts,
              finalHeroShotPrompt: `Professional food photography of ${recipe.title}, perfectly plated, soft lighting, 9:16 vertical`,
              autoCaptions: captions,
              hashtags,
              cta: "Save this and try it tonight! 🔥"
            } 
          });
          return JSON.stringify({ success: true, message: "Full video pack generated!" });
        },
      }),
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleSend = useCallback((directMessage?: string) => {
    const messageToSend = directMessage ?? input;
    if (!messageToSend.trim() || isLoading) return;
    
    const recipeContext = recipe 
      ? `Recipe: "${recipe.title}" (${recipe.calories} cal, ${recipe.carbsPerServing}g carbs). `
      : "";
    
    const systemContext = `[System: You are a food video content creator. Use the appropriate tool based on the request: generateFullVideoPack for complete packs, generateVideoScript for scripts, generateStoryboard for shot lists, generateAIVideoPrompts for AI prompts, generateCaptionsAndHashtags for social media content. Always call a tool to generate content.] `;
    
    console.log("[VideoAgent] sending message", { message: messageToSend, hasRecipe: Boolean(recipe), status });
    sendMessage({ text: `${systemContext}${recipeContext}${messageToSend}` });
    setInput("");
  }, [input, isLoading, recipe, sendMessage, status]);

  const quickActions = [
    { label: "Full Video Pack", icon: Video, prompt: "Generate a complete video pack for this recipe" },
    { label: "Video Script", icon: Play, prompt: "Create a 45-second video script" },
    { label: "AI Prompts", icon: Sparkles, prompt: "Generate AI video prompts for Runway" },
    { label: "Captions", icon: MessageSquare, prompt: "Create captions and hashtags for TikTok" },
  ];

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, generatedContent]);

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    return (
      <View style={styles.generatedContainer}>
        <View style={styles.generatedHeader}>
          <Video size={18} color={Colors.light.coral} />
          <Text style={styles.generatedTitle}>
            {generatedContent.type === "script" && "Video Script"}
            {generatedContent.type === "storyboard" && "Shot List"}
            {generatedContent.type === "prompts" && "AI Video Prompts"}
            {generatedContent.type === "captions" && "Captions & Hashtags"}
            {generatedContent.type === "full_pack" && "Complete Video Pack"}
          </Text>
        </View>

        {generatedContent.data.videoScript && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Play size={14} color={Colors.light.coral} />
              <Text style={styles.cardTitle}>Script</Text>
            </View>
            {generatedContent.data.videoScript.map((scene, idx) => (
              <View key={idx} style={styles.scriptItem}>
                <Text style={styles.timecode}>{scene.timecode}</Text>
                <Text style={styles.scriptContent}>{scene.content}</Text>
              </View>
            ))}
          </View>
        )}

        {generatedContent.data.verticalStoryboard && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Camera size={14} color={Colors.light.sapphire} />
              <Text style={styles.cardTitle}>Storyboard</Text>
            </View>
            {generatedContent.data.verticalStoryboard.map((shot, idx) => (
              <View key={idx} style={styles.shotItem}>
                <View style={styles.shotHeader}>
                  <Text style={styles.shotNumber}>Shot {shot.shotNumber}</Text>
                  <Text style={styles.shotDuration}>{shot.duration}</Text>
                </View>
                <Text style={styles.shotAngle}>{shot.angle}</Text>
                <Text style={styles.shotAction}>{shot.action}</Text>
              </View>
            ))}
          </View>
        )}

        {generatedContent.data.videoGenerationPrompts && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Sparkles size={14} color={Colors.light.gold} />
              <Text style={styles.cardTitle}>AI Prompts</Text>
            </View>
            {generatedContent.data.videoGenerationPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptItem}
                onPress={() => copyToClipboard(prompt, idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.promptText} numberOfLines={3}>{prompt}</Text>
                {copiedIndex === idx ? (
                  <Check size={14} color={Colors.light.success} />
                ) : (
                  <Copy size={14} color={Colors.light.textSecondary} />
                )}
              </TouchableOpacity>
            ))}
            {generatedContent.data.finalHeroShotPrompt && (
              <TouchableOpacity
                style={styles.heroPrompt}
                onPress={() => copyToClipboard(generatedContent.data.finalHeroShotPrompt!, 999)}
              >
                <Text style={styles.heroLabel}>🎬 Hero Shot</Text>
                <Text style={styles.heroText}>{generatedContent.data.finalHeroShotPrompt}</Text>
                <View style={styles.copyRow}>
                  {copiedIndex === 999 ? (
                    <Check size={14} color={Colors.light.success} />
                  ) : (
                    <Copy size={14} color={Colors.light.coral} />
                  )}
                  <Text style={styles.copyLabel}>{copiedIndex === 999 ? "Copied!" : "Copy"}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {generatedContent.data.autoCaptions && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <MessageSquare size={14} color={Colors.light.success} />
              <Text style={styles.cardTitle}>Captions</Text>
            </View>
            {generatedContent.data.autoCaptions.map((caption, idx) => (
              <View key={idx} style={styles.captionItem}>
                <Text style={styles.captionText}>{caption}</Text>
              </View>
            ))}
            {generatedContent.data.cta && (
              <View style={styles.ctaBox}>
                <Text style={styles.ctaLabel}>CTA</Text>
                <Text style={styles.ctaText}>{generatedContent.data.cta}</Text>
              </View>
            )}
          </View>
        )}

        {generatedContent.data.hashtags && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Hash size={14} color={Colors.light.sapphire} />
              <Text style={styles.cardTitle}>Hashtags</Text>
            </View>
            <View style={styles.hashtagsWrap}>
              {generatedContent.data.hashtags.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.hashtagChip}
                  onPress={() => copyToClipboard(tag, 1000 + idx)}
                >
                  <Text style={styles.hashtagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.copyAllBtn}
              onPress={() => copyToClipboard(generatedContent.data.hashtags!.join(" "), 2000)}
            >
              {copiedIndex === 2000 ? (
                <Check size={14} color={Colors.light.success} />
              ) : (
                <Copy size={14} color={Colors.light.sapphire} />
              )}
              <Text style={styles.copyAllText}>{copiedIndex === 2000 ? "Copied!" : "Copy all"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="video-agent-screen">
      <Stack.Screen
        options={{
          title: "Video Creator",
          headerStyle: { backgroundColor: Colors.light.surface },
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeCard}>
            <Animated.View style={[styles.welcomeIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Video size={28} color="#fff" />
            </Animated.View>
            <Text style={styles.welcomeTitle}>Video Content Agent</Text>
            <Text style={styles.welcomeSubtitle}>
              {recipe ? `Creating content for "${recipe.title}"` : "Create viral short-form video content"}
            </Text>
            <Text style={styles.welcomeDesc}>
              I can generate video scripts, storyboards, AI video prompts, captions, and hashtags for TikTok, Reels, and Shorts.
            </Text>
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickAction}
                onPress={() => handleSend(action.prompt)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <action.icon size={16} color={Colors.light.coral} />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageContainer,
                m.role === "user" ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  const cleanText = part.text.replace(/\[Context:.*?\]/g, "").replace(/^User:\s*/i, "").trim();
                  if (!cleanText) return null;
                  return (
                    <Text
                      key={`${m.id}-${i}`}
                      style={[
                        styles.messageText,
                        m.role === "user" ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {cleanText}
                    </Text>
                  );
                }
                if (part.type === "tool") {
                  return (
                    <View key={`${m.id}-${i}`} style={styles.toolBadge}>
                      <Sparkles size={12} color={Colors.light.gold} />
                      <Text style={styles.toolText}>
                        {part.state === "output-available" ? "✓ Generated" : "Generating..."}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          ))}

          {renderGeneratedContent()}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.coral} />
              <Text style={styles.loadingText}>Creating content...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error.message || "Something went wrong. Please try again."}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me to create video content..."
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={() => handleSend()}
            testID="video-agent-input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
            testID="video-agent-send"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeCard: {
    backgroundColor: Colors.light.coral,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.coral,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: "#fff",
  },
  assistantText: {
    color: Colors.light.text,
  },
  toolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  toolText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.gold,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    backgroundColor: Colors.light.dangerLight,
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.danger,
    textAlign: "center",
  },
  generatedContainer: {
    marginTop: 16,
    gap: 12,
  },
  generatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  contentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  scriptItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  timecode: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.coral,
    width: 80,
  },
  scriptContent: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  shotItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  shotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  shotNumber: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.sapphire,
  },
  shotDuration: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  shotAngle: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.gold,
    textTransform: "uppercase" as const,
  },
  shotAction: {
    fontSize: 13,
    color: Colors.light.text,
    marginTop: 2,
  },
  promptItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.light.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  promptText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 17,
  },
  heroPrompt: {
    backgroundColor: Colors.light.coralLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.coral,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 17,
    marginBottom: 8,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.coral,
  },
  captionItem: {
    backgroundColor: Colors.light.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.success,
  },
  captionText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  ctaBox: {
    backgroundColor: Colors.light.tintLight,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  ctaLabel: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: Colors.light.tint,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  hashtagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: Colors.light.sapphireLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.sapphire,
  },
  copyAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.sapphireLight,
    borderRadius: 10,
  },
  copyAllText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.sapphire,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: 24,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
});
