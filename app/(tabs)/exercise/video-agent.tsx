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
import { Send, Sparkles, Copy, Check, Camera, Play, Hash, MessageSquare, Dumbbell, Zap, TrendingUp, Music } from "lucide-react-native";
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
  type: "script" | "storyboard" | "prompts" | "captions" | "full_pack" | "instant_pack";
  data: {
    videoScript?: VideoScriptScene[];
    verticalStoryboard?: StoryboardShot[];
    videoGenerationPrompts?: string[];
    finalHeroShotPrompt?: string;
    autoCaptions?: string[];
    hashtags?: string[];
    cta?: string;
    viralHooks?: string[];
    trendingSounds?: string[];
    bRollSuggestions?: string[];
  };
};

const VIRAL_HOOKS = [
  "POV: Your blood sugar after this {EXERCISE}",
  "The workout that changed my diabetes management",
  "Doctor said move more... I chose violence 💪",
  "This {EXERCISE} hits different when you're diabetic",
  "Stop scrolling and try this with me",
  "The exercise my endocrinologist recommended",
  "30 days of this changed everything",
  "Wait for the calorie burn... 🔥",
];

const TRENDING_SOUNDS = [
  "Eye of the Tiger - Survivor (for motivation)",
  "Workout motivation - Original Audio",
  "Level Up - Ciara (for transitions)",
  "Push it - Salt-N-Pepa (classic)",
  "Stronger - Kanye West (for intensity)",
  "That workout sound - Trending 2024",
  "Gym motivation mix - Popular",
];

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

  const { messages, sendMessage, status, error } = useRorkAgent({
    tools: {
      generateVideoScript: createRorkTool({
        description: "Generate a time-coded video script for a short-form workout video (30-60 seconds). Use this when the user wants to create a video script or plan video content.",
        zodSchema: z.object({
          style: z.enum(["fast-paced", "educational", "motivational", "cinematic", "viral"]).describe("The style of the video"),
          duration: z.number().min(15).max(90).describe("Target video duration in seconds"),
          focusArea: z.string().optional().describe("What to emphasize: form demonstration, benefits, modifications, etc."),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateVideoScript called", toolInput);
          const title = exercise?.title ?? "the workout";
          const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{EXERCISE}", title) ?? "";
          
          const script: VideoScriptScene[] = toolInput.style === "viral" ? [
            { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}" - Dynamic action teaser` },
            { timecode: "[00:02-00:05]", content: "Quick stats flash: calories, duration, intensity" },
            { timecode: "[00:05-00:08]", content: "3-2-1 countdown with energy build" },
            { timecode: "[00:08-00:18]", content: "Full speed demonstration with beat sync" },
            { timecode: "[00:18-00:23]", content: "Form check close-up with text tips" },
            { timecode: "[00:23-00:27]", content: "Intensity variation: easy/medium/hard" },
            { timecode: "[00:27-00:30]", content: "Power pose finish + sweat shot + CTA" },
          ] : [
            { timecode: "[00:00-00:03]", content: `Hook: "${viralHook}" - Dynamic intro showing ${title} in action` },
            { timecode: "[00:03-00:08]", content: `Quick benefits overlay - burns ${exercise?.caloriesBurned ?? 100} cal, ${exercise?.intensity ?? "medium"} intensity` },
            { timecode: "[00:08-00:18]", content: `${toolInput.style === "fast-paced" ? "Quick cuts of" : "Smooth demonstration of"} proper form with callouts` },
            { timecode: "[00:18-00:30]", content: "Main exercise demonstration with form tips on screen" },
            { timecode: "[00:30-00:40]", content: "Common mistakes vs correct form split-screen" },
            { timecode: "[00:40-00:50]", content: "Modification options: beginner/intermediate/advanced" },
            { timecode: "[00:50-00:60]", content: "CTA with motivational power pose and stats recap" },
          ];
          setGeneratedContent({ 
            type: "script", 
            data: { 
              videoScript: script,
              viralHooks: [viralHook],
              trendingSounds: TRENDING_SOUNDS.slice(0, 3),
            } 
          });
          return JSON.stringify({ success: true, scenes: script.length, style: toolInput.style });
        },
      }),

      generateStoryboard: createRorkTool({
        description: "Generate a detailed shot-by-shot storyboard for vertical workout video (9:16). Use when user wants camera angles, shot types, or visual planning.",
        zodSchema: z.object({
          shotCount: z.number().min(6).max(12).describe("Number of shots to generate"),
          cameraStyle: z.enum(["overhead", "dynamic", "handheld", "tripod", "cinematic"]).describe("Primary camera style"),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateStoryboard called", toolInput);
          const title = exercise?.title ?? "Workout";
          
          const cinematicShots: StoryboardShot[] = [
            { shotNumber: 1, duration: "2s", angle: "low angle silhouette", action: "Dramatic intro pose against light", onScreenText: "", soundCue: "Bass build" },
            { shotNumber: 2, duration: "3s", angle: "medium full-body", action: `Title card: "${title}" with stats`, onScreenText: `${title}`, soundCue: "Beat drop" },
            { shotNumber: 3, duration: "2s", angle: "close-up face", action: "Determined expression, deep breath", onScreenText: `${exercise?.caloriesBurned ?? 100} cal`, soundCue: "Inhale" },
            { shotNumber: 4, duration: "5s", angle: "tracking side", action: "Full movement demonstration at speed", onScreenText: "", soundCue: "Beat sync" },
            { shotNumber: 5, duration: "3s", angle: "overhead 45°", action: "Form highlight with visual guides", onScreenText: "Form tip", soundCue: "Callout" },
            { shotNumber: 6, duration: "4s", angle: "front medium", action: "Rep count with intensity building", onScreenText: "3...2...1", soundCue: "Count" },
            { shotNumber: 7, duration: "3s", angle: "close-up muscle", action: "Muscle engagement detail shot", onScreenText: "", soundCue: "Effort" },
            { shotNumber: 8, duration: "3s", angle: "slow-mo wide", action: "Peak movement moment", onScreenText: "", soundCue: "Slow build" },
            { shotNumber: 9, duration: "2s", angle: "reaction close-up", action: "Sweat/determination shot", onScreenText: `${exercise?.intensity ?? "Medium"}`, soundCue: "Push" },
            { shotNumber: 10, duration: "3s", angle: "hero pose", action: "Power finish + fist pump", onScreenText: "You got this! 💪", soundCue: "Finale" },
          ];
          
          const bRoll = [
            "Water bottle being grabbed/drunk",
            "Towel wipe across forehead",
            "Timer/stopwatch close-up",
            "Sneakers hitting floor",
            "Deep breathing recovery",
            "Fist clench determination",
          ];
          
          const shots = cinematicShots.slice(0, toolInput.shotCount);
          setGeneratedContent({ 
            type: "storyboard", 
            data: { 
              verticalStoryboard: shots,
              bRollSuggestions: bRoll,
            } 
          });
          return JSON.stringify({ success: true, shots: shots.length, style: toolInput.cameraStyle });
        },
      }),

      generateAIVideoPrompts: createRorkTool({
        description: "Generate prompts for AI video tools like Runway, Sora, Pika, or Luma. Use when user wants to create AI-generated workout video clips.",
        zodSchema: z.object({
          tool: z.enum(["runway", "sora", "pika", "luma", "kling", "generic"]).describe("Target AI video tool"),
          promptCount: z.number().min(3).max(10).describe("Number of prompts to generate"),
        }),
        execute: (toolInput) => {
          console.log("[ExerciseVideoAgent] generateAIVideoPrompts called", toolInput);
          const title = exercise?.title ?? "workout exercise";
          
          const toolSpecificParams = {
            runway: "cinematic motion, smooth camera movement, gen-3 alpha quality",
            sora: "photorealistic, natural motion, consistent lighting throughout",
            pika: "stylized motion, creative transitions, dynamic camera",
            luma: "dream machine quality, fluid motion, cinematic depth",
            kling: "hyper-realistic, professional cinematography, 4K detail",
            generic: "high quality, smooth motion, professional lighting",
          };
          
          const prompts = [
            `[HOOK SHOT] Athletic person in dramatic silhouette pose, backlit against bright window, about to start ${title}, anticipation builds, camera slowly reveals, 9:16 vertical, ${toolSpecificParams[toolInput.tool]}`,
            `[POWER INTRO] Confident athlete performing ${title} from low angle, powerful stance, modern gym with dramatic lighting, determination in eyes, professional fitness content, ${toolSpecificParams[toolInput.tool]}`,
            `[FORM DEMO] Side tracking shot following perfect ${title} form, muscle definition visible, smooth continuous movement, gym mirrors in background, instructional fitness aesthetic, ${toolSpecificParams[toolInput.tool]}`,
            `[INTENSITY BUILD] Close-up of focused face during peak ${title} effort, sweat visible, jaw set with determination, rack focus to full body movement, motivational energy, ${toolSpecificParams[toolInput.tool]}`,
            `[SLOW-MO GLORY] Slow motion capture of ${title} peak movement moment, sweat droplets flying, muscles engaged, dramatic side lighting creating definition, epic fitness moment, ${toolSpecificParams[toolInput.tool]}`,
            `[REP COUNT] Front-facing ${title} demonstration with visible rep counting overlay position, eye contact with camera, encouraging expression, relatable fitness content, ${toolSpecificParams[toolInput.tool]}`,
            `[MUSCLE DETAIL] Macro close-up of muscles engaging during ${title}, skin texture and definition visible, camera pulls back to full movement, anatomy appreciation, ${toolSpecificParams[toolInput.tool]}`,
            `[VICTORY POSE] Triumphant finish pose after completing ${title}, fist pump or arms raised, sweat glistening, satisfied accomplished expression, inspiring ending, ${toolSpecificParams[toolInput.tool]}`,
          ].slice(0, toolInput.promptCount);
          
          const heroPrompt = `[THUMBNAIL HERO] Professional fitness photography masterpiece of athlete mid-${title}, perfect form captured at peak movement, dramatic Rembrandt lighting from side, sweat glistening catching light, modern minimal gym background with depth blur, determined powerful expression, athletic wear, ultra shallow depth of field, 9:16 vertical composition, makes viewer immediately want to workout, ${toolSpecificParams[toolInput.tool]}, award-winning sports photography`;
          
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
          const title = exercise?.title ?? "This workout";
          const cals = exercise?.caloriesBurned ?? 100;
          const duration = exercise?.duration ?? 20;
          const intensity = exercise?.intensity ?? "Medium";
          
          const platformCaptions = {
            tiktok: [
              `POV: Your blood sugar after ${title} 📉💚`,
              `${cals} calories didn't stand a chance 🔥`,
              "My glucose monitor loves this workout",
              `${duration} mins is all you need fr`,
              "The way this stabilizes blood sugar >>>>",
              "Diabetic fitness check ✅",
            ],
            instagram: [
              `${title} — ${cals} calories of progress 💪`,
              `${duration} minutes | ${intensity} intensity | Diabetes-approved`,
              "Moving my body, managing my health",
              "Blood sugar friendly fitness at its finest",
              "Consistency over perfection 💚",
              "Save this for your next workout 📌",
            ],
            youtube: [
              `${title} - Diabetes-Friendly Workout (${cals} Calories!)`,
              `${duration}-Minute ${intensity} Workout | Blood Sugar Safe`,
              "Exercise That Actually Helps Blood Sugar",
              "Low Impact, High Results Workout",
              "Perfect for Type 2 Diabetes Management",
              "Doctor-Recommended Exercise Routine",
            ],
            all: [
              `${title} — ${cals} cal burn 🔥`,
              `${duration} mins of diabetes-friendly movement`,
              `${intensity} intensity, maximum results`,
              "Your blood sugar will thank you",
              "Fitness that works WITH your body",
              "Save • Share • Sweat 💪",
            ],
          };
          
          const platformHashtags = {
            tiktok: ["#diabetesfitness", "#workoutwithme", "#fitnesstok", "#diabetesawareness", "#homeworkout", "#bloodsugar", "#fyp", "#viral", "#healthytok", "#type2diabetes"],
            instagram: ["#diabetesfitness", "#workoutmotivation", "#fitnessfirst", "#diabeteslife", "#exerciseroutine", "#healthyhabits", "#fitnessjourney", "#diabeticfitness", "#bloodsugarcontrol", "#fitnessgram"],
            youtube: ["#diabetesworkout", "#fitness", "#homeworkout", "#diabetesfriendly", "#exercise", "#healthylifestyle", "#bloodsugar"],
            all: ["#diabetesfitness", "#workout", "#exercise", "#bloodsugarcontrol", "#diabetesfriendly", "#fitnessroutine", "#healthyliving", "#diabetesawareness"],
          };
          
          const platformCTAs = {
            tiktok: { fun: "Duet this and show me your form! 💪", educational: "Follow for daily diabetes workouts 📌", trendy: "Comment 'WORKOUT' for more routines 👇", professional: "Follow for diabetes-friendly fitness" },
            instagram: { fun: "Tag your workout buddy! 👯", educational: "Save this for your morning routine 📌", trendy: "Drop a 💪 if you're trying this!", professional: "Link in bio for full workout plan" },
            youtube: { fun: "SMASH subscribe for more workouts! 🔔", educational: "Subscribe for weekly diabetes fitness", trendy: "Comment your calorie burn below! 👇", professional: "Subscribe for more diabetes-safe workouts" },
            all: { fun: "Try this and tag me! 💪🔥", educational: "Save for your next workout 📌", trendy: "Share with someone who needs this!", professional: "Follow for diabetes-friendly workouts" },
          };
          
          const captions = platformCaptions[toolInput.platform];
          const hashtags = platformHashtags[toolInput.platform];
          const cta = platformCTAs[toolInput.platform][toolInput.tone];
          
          setGeneratedContent({ 
            type: "captions", 
            data: { 
              autoCaptions: captions, 
              hashtags, 
              cta,
              viralHooks: VIRAL_HOOKS.slice(0, 3).map(h => h.replace("{EXERCISE}", title)),
            } 
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
          
          const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{EXERCISE}", exercise.title) ?? "";
          
          const script: VideoScriptScene[] = [
            { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}" - Dynamic teaser` },
            { timecode: "[00:02-00:05]", content: `Stats flash: ${exercise.caloriesBurned} cal | ${exercise.duration} min | ${exercise.intensity}` },
            { timecode: "[00:05-00:08]", content: "3-2-1 countdown with energy build" },
            { timecode: "[00:08-00:18]", content: "Full demonstration with beat-synced cuts" },
            { timecode: "[00:18-00:23]", content: "Form check close-up with text callouts" },
            { timecode: "[00:23-00:27]", content: "Modification showcase: easy/hard versions" },
            { timecode: "[00:27-00:30]", content: "Power finish + sweat shot + CTA overlay" },
          ];

          const storyboard: StoryboardShot[] = [
            { shotNumber: 1, duration: "2s", angle: "silhouette low", action: "Dramatic intro pose", onScreenText: "", soundCue: "Bass build" },
            { shotNumber: 2, duration: "3s", angle: "medium front", action: "Title + stats reveal", onScreenText: exercise.title, soundCue: "Drop" },
            { shotNumber: 3, duration: "3s", angle: "tracking side", action: "Form demonstration", onScreenText: `${exercise.caloriesBurned} cal`, soundCue: "Beat" },
            { shotNumber: 4, duration: "5s", angle: "dynamic multi", action: "Full speed execution", onScreenText: "", soundCue: "Energy" },
            { shotNumber: 5, duration: "3s", angle: "close-up", action: "Sweat + determination", onScreenText: exercise.intensity, soundCue: "Push" },
            { shotNumber: 6, duration: "2s", angle: "hero wide", action: "Victory pose", onScreenText: "Follow! 💪", soundCue: "Finale" },
          ];

          const prompts = [
            `[HOOK] Silhouette of athlete about to perform ${exercise.title}, dramatic backlight, anticipation, 9:16, cinematic`,
            `[ACTION] Dynamic ${exercise.title} demonstration, perfect form, tracking shot, modern gym, motivational`,
            `[INTENSITY] Close-up face during ${exercise.title} peak effort, sweat, determination, shallow DOF`,
            `[VICTORY] Power pose finish after ${exercise.title}, accomplished expression, inspiring fitness content`,
          ];

          const captions = [
            `POV: Your blood sugar after ${exercise.title} 📉💚`,
            `${exercise.caloriesBurned} calories in ${exercise.duration} minutes 🔥`,
            `${exercise.intensity} intensity, maximum results`,
            "Diabetic fitness check ✅",
          ];

          const hashtags = ["#diabetesfitness", "#workout", "#bloodsugar", "#fitnesstok", "#diabeteslife", "#exercise", "#fyp", "#viral", "#healthytok"];
          
          setGeneratedContent({ 
            type: "full_pack", 
            data: { 
              videoScript: script, 
              verticalStoryboard: storyboard, 
              videoGenerationPrompts: prompts,
              finalHeroShotPrompt: `[THUMBNAIL] Professional fitness photo of athlete mid-${exercise.title}, perfect form, dramatic lighting, sweat glistening, determined expression, 9:16 vertical, award-winning`,
              autoCaptions: captions,
              hashtags,
              cta: "Save this and crush your next workout! 💪🔥",
              viralHooks: [viralHook, ...VIRAL_HOOKS.slice(0, 2).map(h => h.replace("{EXERCISE}", exercise.title))],
              trendingSounds: TRENDING_SOUNDS.slice(0, 4),
              bRollSuggestions: [
                "Water bottle grab/drink",
                "Towel wipe forehead",
                "Timer close-up",
                "Deep breathing recovery",
              ],
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
    
    const exerciseContext = exercise 
      ? `Exercise: "${exercise.title}" (${exercise.duration} min, ${exercise.caloriesBurned} cal, ${exercise.intensity}). `
      : "";
    
    const systemContext = `[System: You are a workout video content creator. Use the appropriate tool based on the request: generateFullVideoPack for complete packs, generateVideoScript for scripts, generateStoryboard for shot lists, generateAIVideoPrompts for AI prompts, generateCaptionsAndHashtags for social media content. Always call a tool to generate content.] `;
    
    console.log("[ExerciseVideoAgent] sending message", { message: messageToSend, hasExercise: Boolean(exercise), status });
    sendMessage({ text: `${systemContext}${exerciseContext}${messageToSend}` });
    setInput("");
  }, [input, isLoading, exercise, sendMessage, status]);

  const generateInstantPack = useCallback(() => {
    if (!exercise) return;
    
    const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{EXERCISE}", exercise.title) ?? "";
    
    const script: VideoScriptScene[] = [
      { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}"` },
      { timecode: "[00:02-00:05]", content: `Stats: ${exercise.caloriesBurned} cal | ${exercise.duration} min` },
      { timecode: "[00:05-00:20]", content: "Full demo with form tips" },
      { timecode: "[00:20-00:27]", content: "Intensity options" },
      { timecode: "[00:27-00:30]", content: "Power finish + CTA" },
    ];
    
    const storyboard: StoryboardShot[] = [
      { shotNumber: 1, duration: "2s", angle: "dramatic", action: "Hook teaser", onScreenText: "", soundCue: "Drop" },
      { shotNumber: 2, duration: "3s", angle: "medium", action: "Title + stats", onScreenText: exercise.title, soundCue: "Beat" },
      { shotNumber: 3, duration: "15s", angle: "tracking", action: "Full demo", onScreenText: `${exercise.caloriesBurned} cal`, soundCue: "Energy" },
      { shotNumber: 4, duration: "5s", angle: "hero", action: "Finish + CTA", onScreenText: "Follow! 💪", soundCue: "Finale" },
    ];
    
    setGeneratedContent({
      type: "instant_pack",
      data: {
        videoScript: script,
        verticalStoryboard: storyboard,
        videoGenerationPrompts: [
          `Dynamic ${exercise.title} workout video, athletic person, perfect form, 9:16 vertical, viral fitness`,
          `Victory pose after ${exercise.title}, sweat, determination, inspiring fitness content`,
        ],
        finalHeroShotPrompt: `Professional fitness photo ${exercise.title}, dramatic lighting, perfect form, 9:16`,
        autoCaptions: [
          `${exercise.title} — ${exercise.caloriesBurned} cal 🔥`,
          "Diabetes-friendly fitness",
          `${exercise.duration} min workout`,
        ],
        hashtags: ["#diabetesfitness", "#workout", "#fitnesstok", "#healthytok", "#fyp"],
        cta: "Save this! 💪",
        viralHooks: [viralHook],
        trendingSounds: TRENDING_SOUNDS.slice(0, 2),
      },
    });
  }, [exercise]);

  const quickActions = [
    { label: "⚡ Instant Pack", icon: Zap, prompt: "__INSTANT__", instant: true },
    { label: "Viral Pack", icon: TrendingUp, prompt: "Generate a viral video pack optimized for maximum engagement" },
    { label: "AI Prompts", icon: Sparkles, prompt: "Generate AI video prompts for Runway Gen-3" },
    { label: "TikTok Ready", icon: MessageSquare, prompt: "Create trendy captions and hashtags for TikTok" },
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

        {generatedContent.data.viralHooks && generatedContent.data.viralHooks.length > 0 && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <TrendingUp size={14} color={Colors.light.tint} />
              <Text style={styles.cardTitle}>Viral Hooks</Text>
            </View>
            {generatedContent.data.viralHooks.map((hook, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.hookItem}
                onPress={() => copyToClipboard(hook, 3000 + idx)}
              >
                <Text style={styles.hookText}>{`"${hook}"`}</Text>
                {copiedIndex === 3000 + idx ? (
                  <Check size={14} color={Colors.light.success} />
                ) : (
                  <Copy size={14} color={Colors.light.textSecondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {generatedContent.data.trendingSounds && generatedContent.data.trendingSounds.length > 0 && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Music size={14} color={Colors.light.gold} />
              <Text style={styles.cardTitle}>Trending Sounds</Text>
            </View>
            {generatedContent.data.trendingSounds.map((sound, idx) => (
              <View key={idx} style={styles.soundItem}>
                <Text style={styles.soundText}>🎵 {sound}</Text>
              </View>
            ))}
          </View>
        )}

        {generatedContent.data.bRollSuggestions && generatedContent.data.bRollSuggestions.length > 0 && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <Camera size={14} color={Colors.light.accent} />
              <Text style={styles.cardTitle}>B-Roll Ideas</Text>
            </View>
            {generatedContent.data.bRollSuggestions.map((broll, idx) => (
              <View key={idx} style={styles.brollItem}>
                <Text style={styles.brollText}>• {broll}</Text>
              </View>
            ))}
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
                style={[styles.quickAction, action.instant && styles.quickActionInstant]}
                onPress={() => {
                  if (action.instant) {
                    generateInstantPack();
                  } else {
                    handleSend(action.prompt);
                  }
                }}
                activeOpacity={0.8}
                disabled={isLoading && !action.instant}
              >
                <action.icon size={16} color={action.instant ? "#fff" : Colors.light.tint} />
                <Text style={[styles.quickActionText, action.instant && styles.quickActionTextInstant]}>{action.label}</Text>
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
            placeholder="Ask me to create workout video content..."
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={() => handleSend()}
            testID="exercise-video-agent-input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
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
  quickActionInstant: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  quickActionTextInstant: {
    color: "#fff",
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
  hookItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.tintLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  hookText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic" as const,
    color: Colors.light.text,
    lineHeight: 18,
  },
  soundItem: {
    backgroundColor: Colors.light.goldLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  soundText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  brollItem: {
    paddingVertical: 6,
  },
  brollText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
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
