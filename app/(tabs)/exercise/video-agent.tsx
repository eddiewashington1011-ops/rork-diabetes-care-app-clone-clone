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
import { Send, Video, Sparkles, Copy, Check, Camera, Play, Hash, MessageSquare, Dumbbell } from "lucide-react-native";
import { createRorkTool, useRorkAgent } from "@rork-ai/toolkit-sdk";
import * as z from "zod";
import * as Clipboard from "expo-clipboard";
import Colors from "@/constants/colors";
import { exercises } from "@/mocks/exercises";

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
  data: {
    videoScript?: VideoScriptScene[];
    verticalStoryboard?: StoryboardShot[];
    videoGenerationPrompts?: string[];
    finalHeroShotPrompt?: string;
    autoCaptions?: string[];
    hashtags?: string[];
    cta?: string;
  };
};

export default function ExerciseVideoAgentScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const exercise = useMemo(() => exercises.find((e) => e.id === exerciseId), [exerciseId]);

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

  const { messages, sendMessage, status } = useRorkAgent({
    tools: {
      generateVideoScript: createRorkTool({
        description: "Generate a time-coded video script for a short-form workout video (30-60 seconds). Use this when the user wants to create a video script or plan video content.",
        zodSchema: z.object({
          style: z.enum(["fast-paced", "educational", "motivational", "cinematic"]).describe("The style of the video"),
          duration: z.number().min(15).max(90).describe("Target video duration in seconds"),
          focusArea: z.string().optional().describe("What to emphasize: form demonstration, benefits, modifications, etc."),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateVideoScript called", toolInput);
          const script: VideoScriptScene[] = [
            { timecode: "[00:00-00:03]", content: `Hook: Dynamic intro showing ${exercise?.title ?? "the workout"} in action` },
            { timecode: "[00:03-00:08]", content: "Quick benefits overlay - diabetes-friendly exercise" },
            { timecode: "[00:08-00:18]", content: `${toolInput.style === "fast-paced" ? "Quick cuts of" : "Smooth demonstration of"} proper form` },
            { timecode: "[00:18-00:30]", content: "Main exercise demonstration with form tips" },
            { timecode: "[00:30-00:40]", content: "Common mistakes vs correct form comparison" },
            { timecode: "[00:40-00:50]", content: "Modification options + stats overlay" },
            { timecode: "[00:50-00:60]", content: "CTA with motivational ending shot" },
          ];
          setGeneratedContent({ type: "script", data: { videoScript: script } });
          return JSON.stringify({ success: true, scenes: script.length, style: toolInput.style });
        },
      }),

      generateStoryboard: createRorkTool({
        description: "Generate a detailed shot-by-shot storyboard for vertical workout video (9:16). Use when user wants camera angles, shot types, or visual planning.",
        zodSchema: z.object({
          shotCount: z.number().min(6).max(12).describe("Number of shots to generate"),
          cameraStyle: z.enum(["overhead", "dynamic", "handheld", "tripod"]).describe("Primary camera style"),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateStoryboard called", toolInput);
          const angles = ["full-body", "close-up", "45-degree", "eye-level", "slow-mo", "tracking"];
          const shots: StoryboardShot[] = Array.from({ length: toolInput.shotCount }, (_, i) => ({
            shotNumber: i + 1,
            duration: `${2 + Math.floor(Math.random() * 3)}s`,
            angle: angles[i % angles.length] ?? "full-body",
            action: i === 0 ? "Dynamic intro pose" : i === toolInput.shotCount - 1 ? "Motivational end pose" : `Exercise step ${i}`,
            onScreenText: i === 0 ? exercise?.title ?? "Workout" : i === 1 ? `${exercise?.caloriesBurned ?? 100} cal burn` : "",
            soundCue: i === 0 ? "Music drop" : ["exhale", "count", "beat", "transition"][i % 4] ?? "ambient",
          }));
          setGeneratedContent({ type: "storyboard", data: { verticalStoryboard: shots } });
          return JSON.stringify({ success: true, shots: shots.length, style: toolInput.cameraStyle });
        },
      }),

      generateAIVideoPrompts: createRorkTool({
        description: "Generate prompts for AI video tools like Runway, Sora, Pika, or Luma. Use when user wants to create AI-generated workout video clips.",
        zodSchema: z.object({
          tool: z.enum(["runway", "sora", "pika", "luma", "generic"]).describe("Target AI video tool"),
          promptCount: z.number().min(3).max(10).describe("Number of prompts to generate"),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateAIVideoPrompts called", toolInput);
          const title = exercise?.title ?? "workout exercise";
          const prompts = [
            `Cinematic shot of person performing ${title}, athletic wear, gym setting, professional fitness photography lighting, 9:16 vertical format, 4K quality`,
            `Close-up of proper form during ${title}, focused expression, shallow depth of field, motivational fitness aesthetic`,
            `Smooth tracking shot of athlete doing ${title}, modern gym background, dynamic camera movement, vertical format`,
            `Eye-level shot of full body ${title} demonstration, clean minimal gym, bright natural lighting, professional fitness video`,
            `Slow motion capture of key movement in ${title}, sweat droplets visible, dramatic lighting, inspiring workout aesthetic`,
            `45-degree angle of trainer demonstrating ${title}, encouraging expression, premium gym environment, vertical video`,
            `Wide to close transition shot of ${title}, showing full movement then form detail, fitness content style`,
          ].slice(0, toolInput.promptCount);
          
          const heroPrompt = `Professional fitness photography of athlete performing ${title}, perfect form demonstration, modern gym with natural lighting, athletic wear, sweat glistening, determined focused expression, shallow depth of field, inspiring motivational mood, 9:16 vertical, makes viewer want to workout, ${toolInput.tool === "runway" ? "cinematic motion" : "hyper-realistic"}`;
          
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
          console.log("[ExerciseVideoAgent] generateCaptionsAndHashtags called", toolInput);
          const captions = [
            `${exercise?.title ?? "This workout"} - burns ${exercise?.caloriesBurned ?? 100} calories! 🔥`,
            "Perfect for managing blood sugar levels 💪",
            `Only ${exercise?.duration ?? 20} minutes needed!`,
            `${exercise?.intensity ?? "Medium"} intensity - you got this!`,
            "Diabetes-friendly workout routine 💚",
            "Save this for your next workout session!",
          ];
          
          const hashtags = toolInput.platform === "tiktok" 
            ? ["#diabetesfitness", "#workoutwithme", "#fitnesstok", "#diabetesawareness", "#homeworkout", "#lowimpact", "#healthylifestyle"]
            : toolInput.platform === "instagram"
            ? ["#diabetesfitness", "#workoutmotivation", "#fitnessfirst", "#diabeteslife", "#exerciseroutine", "#healthyhabits", "#fitnessjourney"]
            : ["#diabetesfitness", "#workout", "#exercise", "#bloodsugarcontrol", "#diabetesfriendly", "#fitnessroutine", "#healthyliving"];
          
          const cta = toolInput.tone === "fun" 
            ? "Try this and tag me! 💪🔥"
            : toolInput.tone === "educational"
            ? "Save for your next workout 📌"
            : "Follow for more diabetes-friendly workouts!";
          
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
        execute: async (toolInput) => {
          console.log("[ExerciseVideoAgent] generateFullVideoPack called", toolInput);
          if (!exercise) return JSON.stringify({ success: false, error: "No exercise found" });
          
          const script: VideoScriptScene[] = [
            { timecode: "[00:00-00:03]", content: `Hook: Dynamic intro of ${exercise.title}` },
            { timecode: "[00:03-00:08]", content: "Benefits overlay for diabetes management" },
            { timecode: "[00:08-00:20]", content: "Step-by-step form demonstration" },
            { timecode: "[00:20-00:35]", content: "Full exercise execution with tips" },
            { timecode: "[00:35-00:45]", content: "Modifications and intensity options" },
            { timecode: "[00:45-00:55]", content: "Stats overlay + results preview" },
            { timecode: "[00:55-00:60]", content: "Motivational CTA ending" },
          ];

          const storyboard: StoryboardShot[] = [
            { shotNumber: 1, duration: "3s", angle: "wide", action: "Intro pose", onScreenText: exercise.title, soundCue: "Music hit" },
            { shotNumber: 2, duration: "5s", angle: "medium", action: "Benefits display", onScreenText: `${exercise.caloriesBurned} cal`, soundCue: "upbeat" },
            { shotNumber: 3, duration: "12s", angle: "full-body", action: "Form demonstration", onScreenText: "", soundCue: "instructional" },
            { shotNumber: 4, duration: "15s", angle: "tracking", action: "Exercise execution", onScreenText: "Rep count", soundCue: "energetic" },
            { shotNumber: 5, duration: "10s", angle: "split-screen", action: "Modifications", onScreenText: "Options", soundCue: "transition" },
            { shotNumber: 6, duration: "5s", angle: "hero", action: "Final pose", onScreenText: "CTA", soundCue: "Music finale" },
          ];

          const prompts = [
            `Cinematic shot of ${exercise.title} demonstration, professional fitness setting, 9:16 vertical`,
            `Close-up of proper form during ${exercise.title}, motivational lighting`,
            `Dynamic tracking shot of full ${exercise.title} movement, modern gym`,
          ];

          const captions = [
            `${exercise.title} - ${exercise.caloriesBurned} cal burn! 🔥`,
            "Perfect for blood sugar control 💪",
            `${exercise.duration} minutes, ${exercise.intensity} intensity`,
            "Diabetes-friendly fitness routine 💚",
          ];

          const hashtags = ["#diabetesfitness", "#workout", "#bloodsugar", "#fitness", "#diabeteslife", "#exercise"];
          
          setGeneratedContent({ 
            type: "full_pack", 
            data: { 
              videoScript: script, 
              verticalStoryboard: storyboard, 
              videoGenerationPrompts: prompts,
              autoCaptions: captions,
              hashtags,
              cta: "Follow for more diabetes-friendly workouts! 💪"
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

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    
    const exerciseContext = exercise 
      ? `[Context: Exercise "${exercise.title}" - ${exercise.duration} min, ${exercise.caloriesBurned} cal, ${exercise.intensity} intensity, ${exercise.category}]`
      : "";
    
    const systemContext = `You are a creative fitness video content specialist for short-form workout videos (TikTok, Reels, Shorts). Help create engaging diabetes-friendly exercise content. ${exerciseContext}`;
    
    console.log("[ExerciseVideoAgent] sending message", { input, hasExercise: Boolean(exercise) });
    sendMessage({ text: `${systemContext}\n\nUser: ${input}` });
    setInput("");
  }, [input, isLoading, exercise, sendMessage]);

  const quickActions = [
    { label: "Full Video Pack", icon: Video, prompt: "Generate a complete video pack for this exercise" },
    { label: "Video Script", icon: Play, prompt: "Create a 45-second workout video script" },
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
          <Dumbbell size={18} color={Colors.light.tint} />
          <Text style={styles.generatedTitle}>
            {generatedContent.type === "script" && "Workout Script"}
            {generatedContent.type === "storyboard" && "Shot List"}
            {generatedContent.type === "prompts" && "AI Video Prompts"}
            {generatedContent.type === "captions" && "Captions & Hashtags"}
            {generatedContent.type === "full_pack" && "Complete Video Pack"}
          </Text>
        </View>

        {generatedContent.data.videoScript && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Play size={14} color={Colors.light.tint} />
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
              <Camera size={14} color={Colors.light.accent} />
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
                    <Copy size={14} color={Colors.light.tint} />
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
              <Hash size={14} color={Colors.light.accent} />
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
                <Copy size={14} color={Colors.light.accent} />
              )}
              <Text style={styles.copyAllText}>{copiedIndex === 2000 ? "Copied!" : "Copy all"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="exercise-video-agent-screen">
      <Stack.Screen
        options={{
          title: "Workout Video Creator",
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
              <Dumbbell size={28} color="#fff" />
            </Animated.View>
            <Text style={styles.welcomeTitle}>Workout Video Agent</Text>
            <Text style={styles.welcomeSubtitle}>
              {exercise ? `Creating content for "${exercise.title}"` : "Create viral fitness video content"}
            </Text>
            <Text style={styles.welcomeDesc}>
              I can generate workout video scripts, storyboards, AI video prompts, captions, and hashtags for TikTok, Reels, and Shorts.
            </Text>
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickAction}
                onPress={() => {
                  setInput(action.prompt);
                  setTimeout(() => handleSend(), 100);
                }}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <action.icon size={16} color={Colors.light.tint} />
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
              <ActivityIndicator size="small" color={Colors.light.tint} />
              <Text style={styles.loadingText}>Creating content...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me to create workout video content..."
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            testID="exercise-video-agent-input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
            testID="exercise-video-agent-send"
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
    backgroundColor: Colors.light.tint,
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
    backgroundColor: Colors.light.tint,
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
    color: Colors.light.tint,
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
    color: Colors.light.accent,
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
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.tint,
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
    color: Colors.light.tint,
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
    backgroundColor: Colors.light.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.accent,
  },
  copyAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 10,
  },
  copyAllText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.accent,
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
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
});
