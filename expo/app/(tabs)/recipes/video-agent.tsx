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
import { Send, Video, Sparkles, Copy, Check, Camera, Play, Hash, MessageSquare, Zap, TrendingUp, Music } from "lucide-react-native";
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
  type: "script" | "storyboard" | "prompts" | "captions" | "full_pack" | "instant_pack";
  data: Partial<ShortVideoPack> & {
    viralHooks?: string[];
    trendingSounds?: string[];
    bRollSuggestions?: string[];
  };
};

type RecipeRef = {
  title: string;
  carbsPerServing: number;
  calories: number;
  prepTime: number;
  cookTime: number;
} | null;

type ContentSetter = React.Dispatch<React.SetStateAction<GeneratedContent | null>>;

const VIRAL_HOOKS = [
  "POV: You just found your new favorite low-carb meal",
  "The meal that changed my blood sugar game forever",
  "Doctor said I couldn't eat good food... I proved them wrong",
  "This {RECIPE} hits different when you're managing diabetes",
  "Stop scrolling - this recipe will save your meal prep",
  "My nutritionist couldn't believe this was diabetes-friendly",
  "The secret ingredient no one talks about",
  "Wait for the final reveal... 🤯",
];

const TRENDING_SOUNDS = [
  "Oh No - Kreepa (for reveals)",
  "Aesthetic cooking ASMR - Original",
  "Cooking with confidence - Upbeat mix",
  "Satisfying food prep - Viral audio",
  "Clean girl cooking - Trending 2024",
  "That one sound - For transitions",
  "Healthy eating motivation - Popular",
];

function createTools(recipeRef: React.MutableRefObject<RecipeRef>, setContent: ContentSetter) {
  return {
    generateVideoScript: createRorkTool({
      description: "Generate a time-coded video script for a short-form cooking video (30-60 seconds). Use this when the user wants to create a video script or plan video content.",
      zodSchema: z.object({
        style: z.enum(["fast-paced", "educational", "asmr", "cinematic", "viral"]).describe("The style of the video"),
        duration: z.number().min(15).max(90).describe("Target video duration in seconds"),
        focusArea: z.string().optional().describe("What to emphasize: cooking process, final dish, nutrition info, etc."),
      }),
      execute: (toolInput) => {
        console.log("[VideoAgent] generateVideoScript called", toolInput);
        const recipe = recipeRef.current;
        const title = recipe?.title ?? "the dish";
        
        const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{RECIPE}", title) ?? "";
        
        const script: VideoScriptScene[] = toolInput.style === "viral" ? [
          { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}" - Close-up teaser of final dish` },
          { timecode: "[00:02-00:05]", content: "Quick ingredient toss/pour shot with text overlay: ingredients list" },
          { timecode: "[00:05-00:08]", content: "Rapid 3-cut prep sequence: chop-slice-dice with ASMR audio" },
          { timecode: "[00:08-00:15]", content: "Cooking money shot: sizzle, steam, satisfying sounds (slow-mo optional)" },
          { timecode: "[00:15-00:20]", content: "Build-up transition: ingredients coming together, music rising" },
          { timecode: "[00:20-00:25]", content: `Nutrition pop-up: "Only ${recipe?.carbsPerServing ?? 20}g carbs!" with checkmark animation` },
          { timecode: "[00:25-00:28]", content: "Hero plating shot: garnish drop in slow-mo" },
          { timecode: "[00:28-00:30]", content: "THE BITE: Fork lift with cheese pull/steam, freeze frame on reaction" },
        ] : [
          { timecode: "[00:00-00:03]", content: `Hook: Stunning reveal of ${title} with steam rising - text: "${viralHook}"` },
          { timecode: "[00:03-00:08]", content: "Quick ingredient showcase with animated nutrition overlay" },
          { timecode: "[00:08-00:18]", content: `${toolInput.style === "fast-paced" ? "Rapid cuts of" : "Smooth shots showing"} prep work with satisfying ASMR` },
          { timecode: "[00:18-00:30]", content: "Main cooking action with sizzle sounds and steam" },
          { timecode: "[00:30-00:40]", content: "Plating sequence with garnish close-ups and dramatic lighting" },
          { timecode: "[00:40-00:50]", content: `Hero shot + animated nutrition facts: ${recipe?.calories ?? 350} cal, ${recipe?.carbsPerServing ?? 20}g carbs` },
          { timecode: "[00:50-00:60]", content: "CTA with satisfying fork bite shot and text overlay" },
        ];
        
        setContent({ 
          type: "script", 
          data: { 
            videoScript: script,
            viralHooks: [viralHook],
            trendingSounds: TRENDING_SOUNDS.slice(0, 3),
          },
        });
        return JSON.stringify({ success: true, scenes: script.length, style: toolInput.style });
      },
    }),

    generateStoryboard: createRorkTool({
      description: "Generate a detailed shot-by-shot storyboard for vertical video (9:16). Use when user wants camera angles, shot types, or visual planning.",
      zodSchema: z.object({
        shotCount: z.number().min(6).max(12).describe("Number of shots to generate"),
        cameraStyle: z.enum(["overhead", "dynamic", "handheld", "tripod", "cinematic"]).describe("Primary camera style"),
      }),
      execute: (toolInput) => {
        console.log("[VideoAgent] generateStoryboard called", toolInput);
        const recipe = recipeRef.current;
        const title = recipe?.title ?? "Recipe";
        
        const cinematicShots: StoryboardShot[] = [
          { shotNumber: 1, duration: "2s", angle: "extreme close-up", action: "Teaser: steam rising from dish (out of focus to sharp)", onScreenText: "", soundCue: "Bass drop" },
          { shotNumber: 2, duration: "3s", angle: "overhead 90°", action: `Title reveal: "${title}" with ingredients layout`, onScreenText: title, soundCue: "Upbeat start" },
          { shotNumber: 3, duration: "2s", angle: "45° dutch angle", action: "Ingredient pour/toss into frame", onScreenText: `${recipe?.carbsPerServing ?? 20}g carbs`, soundCue: "Whoosh" },
          { shotNumber: 4, duration: "4s", angle: "tracking close-up", action: "Knife work: chop sequence with ASMR", onScreenText: "", soundCue: "Crisp chops" },
          { shotNumber: 5, duration: "3s", angle: "low angle", action: "Pan/pot hero shot with steam backlit", onScreenText: "", soundCue: "Sizzle" },
          { shotNumber: 6, duration: "4s", angle: "overhead with motion", action: "Cooking action: stir/flip with visible heat", onScreenText: "", soundCue: "Cooking ASMR" },
          { shotNumber: 7, duration: "3s", angle: "rack focus", action: "Ingredients to finished dish transition", onScreenText: "", soundCue: "Music build" },
          { shotNumber: 8, duration: "3s", angle: "hero shot 30°", action: "Plating with garnish drop (slow-mo)", onScreenText: "", soundCue: "Drop beat" },
          { shotNumber: 9, duration: "2s", angle: "macro lens", action: "Texture detail: sauce drizzle/cheese pull", onScreenText: `${recipe?.calories ?? 350} cal`, soundCue: "Satisfying" },
          { shotNumber: 10, duration: "2s", angle: "eye-level", action: "THE BITE: fork lift with steam", onScreenText: "Save this! 📌", soundCue: "Music finale" },
        ];
        
        const bRoll = [
          "Hands washing vegetables under running water",
          "Spices being sprinkled from height",
          "Oil swirling in hot pan",
          "Fresh herbs being torn",
          "Steam rising against dark background",
          "Timer/clock showing quick prep time",
        ];
        
        const shots = cinematicShots.slice(0, toolInput.shotCount);
        setContent({ 
          type: "storyboard", 
          data: { 
            verticalStoryboard: shots,
            bRollSuggestions: bRoll,
          },
        });
        return JSON.stringify({ success: true, shots: shots.length, style: toolInput.cameraStyle });
      },
    }),

    generateAIVideoPrompts: createRorkTool({
      description: "Generate prompts for AI video tools like Runway, Sora, Pika, or Luma. Use when user wants to create AI-generated video clips.",
      zodSchema: z.object({
        tool: z.enum(["runway", "sora", "pika", "luma", "kling", "generic"]).describe("Target AI video tool"),
        promptCount: z.number().min(3).max(10).describe("Number of prompts to generate"),
      }),
      execute: (toolInput) => {
        console.log("[VideoAgent] generateAIVideoPrompts called", toolInput);
        const recipe = recipeRef.current;
        const title = recipe?.title ?? "delicious dish";
        
        const toolSpecificParams = {
          runway: "cinematic motion, smooth camera movement, gen-3 alpha quality",
          sora: "photorealistic, natural motion, consistent lighting throughout",
          pika: "stylized motion, creative transitions, dynamic camera",
          luma: "dream machine quality, fluid motion, cinematic depth",
          kling: "hyper-realistic, professional cinematography, 4K detail",
          generic: "high quality, smooth motion, professional lighting",
        };
        
        const prompts = [
          `[HOOK SHOT] Extreme close-up of ${title} with steam rising against dark background, camera slowly pulls back to reveal full dish, dramatic side lighting, bokeh background, 9:16 vertical, ${toolSpecificParams[toolInput.tool]}`,
          `[INGREDIENT DROP] Overhead shot of fresh colorful ingredients falling onto marble surface in slow motion, each ingredient lands perfectly in place, soft natural lighting from window, shallow depth of field, vertical format, ${toolSpecificParams[toolInput.tool]}`,
          `[PREP SEQUENCE] Chef's hands confidently chopping vegetables on wooden cutting board, camera tracks along knife motion, satisfying rhythm, warm kitchen ambient lighting, ASMR-worthy crisp sounds implied, ${toolSpecificParams[toolInput.tool]}`,
          `[COOKING ACTION] Eye-level shot of ${title} ingredients sizzling in cast iron pan, steam and heat shimmer visible, camera slowly pushes in, golden hour kitchen lighting, oil glistening, ${toolSpecificParams[toolInput.tool]}`,
          `[SAUCE DRIZZLE] Macro lens extreme close-up of golden sauce being drizzled over dish in slow motion, sauce catches light and glistens, camera follows drizzle path, ${toolSpecificParams[toolInput.tool]}`,
          `[PLATING GLORY] 45-degree angle tracking shot as garnish is delicately placed on ${title}, camera circles dish slightly, restaurant-quality presentation, soft diffused lighting with gentle shadows, ${toolSpecificParams[toolInput.tool]}`,
          `[MONEY SHOT] Cinematic close-up of fork piercing ${title} and lifting perfect bite with cheese pull/steam, camera follows fork upward, viewer POV perspective, makes viewer instantly hungry, ${toolSpecificParams[toolInput.tool]}`,
          `[REVEAL TRANSITION] Camera pushes through steam cloud to reveal beautifully plated ${title}, rack focus from blurry to sharp, dramatic lighting shift, hero moment, ${toolSpecificParams[toolInput.tool]}`,
        ].slice(0, toolInput.promptCount);
        
        const heroPrompt = `[HERO THUMBNAIL] Professional food photography masterpiece of ${title}, perfectly plated on artisan ceramic dish, dramatic Rembrandt lighting from side with gentle fill, ultra shallow depth of field f/1.4, garnished with fresh microgreens and edible flowers, delicate steam wisps rising, warm inviting color palette with teal shadows, 9:16 vertical composition with rule of thirds, makes viewer's mouth water instantly, ${toolSpecificParams[toolInput.tool]}, award-winning food photography`;
        
        setContent({ 
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
        const recipe = recipeRef.current;
        const title = recipe?.title ?? "This recipe";
        const carbs = recipe?.carbsPerServing ?? 20;
        const cals = recipe?.calories ?? 350;
        const totalTime = (recipe?.prepTime ?? 10) + (recipe?.cookTime ?? 15);
        
        const platformCaptions = {
          tiktok: [
            `POV: You found your new favorite ${title} 🔥`,
            `Only ${carbs}g carbs and it slaps this hard?!`,
            "My doctor would be so proud rn",
            `${totalTime} mins from hungry to happy`,
            "Blood sugar staying stable while I eat like royalty",
            "The way this changed my life >>>>",
          ],
          instagram: [
            `${title} — where flavor meets function ✨`,
            `${carbs}g carbs | ${cals} cal | Endless satisfaction`,
            "Diabetes-friendly never looked this good",
            `From prep to plate in ${totalTime} minutes`,
            "Nourishing my body without sacrificing taste",
            "Save this for your Sunday meal prep 📌",
          ],
          youtube: [
            `${title} - Diabetes-Friendly Recipe (Only ${carbs}g Carbs!)`,
            `Easy ${totalTime}-Minute Recipe | ${cals} Calories`,
            "Blood Sugar Friendly Comfort Food",
            "Low Carb Recipe That Actually Tastes Amazing",
            "Meal Prep This For The Whole Week",
            "Doctor-Approved Delicious Recipe",
          ],
          all: [
            `${title} — ${carbs}g carbs of pure joy`,
            "Diabetes-friendly comfort food at its finest",
            `Ready in ${totalTime} minutes`,
            `${cals} calories, zero compromise on flavor`,
            "Your blood sugar will thank you",
            "Save • Share • Make it tonight",
          ],
        };
        
        const platformHashtags = {
          tiktok: ["#diabetesfriendly", "#lowcarb", "#healthytiktok", "#foodtok", "#diabetesawareness", "#mealprep", "#healthyrecipes", "#bloodsugar", "#type2diabetes", "#fyp"],
          instagram: ["#diabetesfriendly", "#lowcarbrecipes", "#healthyeating", "#bloodsugarcontrol", "#mealprep", "#cleaneating", "#healthyfood", "#diabeticfriendly", "#balancedmeals", "#foodphotography"],
          youtube: ["#diabetesrecipe", "#lowcarbmeals", "#healthycooking", "#mealprep", "#diabetesfriendly", "#easyrecipe", "#healthylifestyle"],
          all: ["#diabetesfriendly", "#lowcarb", "#healthyrecipes", "#bloodsugar", "#mealprep", "#healthyeating", "#diabetesawareness", "#cleaneating"],
        };
        
        const platformCTAs = {
          tiktok: { fun: "Save this before it blows up! 💾", educational: "Follow for more diabetes wins 🏆", trendy: "Comment 'RECIPE' for the full breakdown 👇", professional: "Follow for daily diabetes-friendly recipes" },
          instagram: { fun: "Double tap if you'd devour this! ❤️", educational: "Save for your next meal prep Sunday 📌", trendy: "Tag someone who needs this recipe! 👇", professional: "Link in bio for full recipe & nutrition info" },
          youtube: { fun: "SMASH that subscribe for more recipes! 🔔", educational: "Subscribe for weekly diabetes-friendly meals", trendy: "Comment your carb limit below! 👇", professional: "Subscribe and hit the bell for new recipes" },
          all: { fun: "Save this and try it tonight! 🔥", educational: "Save for your next meal prep session 📌", trendy: "Share with someone who needs this! 💪", professional: "Follow for more diabetes-friendly recipes" },
        };
        
        const captions = platformCaptions[toolInput.platform];
        const hashtags = platformHashtags[toolInput.platform];
        const cta = platformCTAs[toolInput.platform][toolInput.tone];
        
        setContent({ 
          type: "captions", 
          data: { 
            autoCaptions: captions, 
            hashtags, 
            cta,
            viralHooks: VIRAL_HOOKS.slice(0, 3).map(h => h.replace("{RECIPE}", title)),
          },
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
        const recipe = recipeRef.current;
        if (!recipe) return JSON.stringify({ success: false, error: "No recipe found" });
        
        const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{RECIPE}", recipe.title) ?? "";
        
        const script: VideoScriptScene[] = [
          { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}" - Teaser of final dish` },
          { timecode: "[00:02-00:05]", content: "Rapid ingredient showcase with animated nutrition pop-ups" },
          { timecode: "[00:05-00:12]", content: `${toolInput.style === "viral" ? "Quick-cut montage" : "Smooth demonstration"} of prep with ASMR audio` },
          { timecode: "[00:12-00:22]", content: "Cooking money shots: sizzle, steam, satisfying sounds" },
          { timecode: "[00:22-00:27]", content: "Plating sequence with slow-mo garnish drop" },
          { timecode: "[00:27-00:30]", content: `Hero shot + THE BITE with text: "${recipe.carbsPerServing}g carbs, ${recipe.calories} cal"` },
        ];

        const storyboard: StoryboardShot[] = [
          { shotNumber: 1, duration: "2s", angle: "extreme close-up", action: "Steam/texture teaser (rack focus)", onScreenText: "", soundCue: "Bass hit" },
          { shotNumber: 2, duration: "3s", angle: "overhead 90°", action: "Title + ingredients reveal", onScreenText: recipe.title, soundCue: "Upbeat drop" },
          { shotNumber: 3, duration: "3s", angle: "tracking", action: "Knife work with ASMR chops", onScreenText: `${recipe.carbsPerServing}g carbs`, soundCue: "Crisp audio" },
          { shotNumber: 4, duration: "5s", angle: "45° low", action: "Pan cooking with visible heat", onScreenText: "", soundCue: "Sizzle" },
          { shotNumber: 5, duration: "3s", angle: "macro", action: "Sauce/garnish application", onScreenText: "", soundCue: "Build" },
          { shotNumber: 6, duration: "2s", angle: "hero 30°", action: "Fork bite with steam", onScreenText: "Save this! 📌", soundCue: "Finale" },
        ];

        const prompts = [
          `[HOOK] Extreme close-up ${recipe.title} steam rising, dramatic lighting, rack focus reveal, 9:16 vertical, cinematic motion`,
          `[PREP] Chef hands chopping for ${recipe.title}, wooden board, tracking shot, ASMR-worthy, warm kitchen light`,
          `[COOKING] ${recipe.title} sizzling in pan, steam and heat shimmer, low angle, golden hour lighting`,
          `[HERO] Fork lifting perfect bite of ${recipe.title}, cheese pull/steam, viewer POV, makes mouth water`,
        ];

        const captions = [
          `POV: You found the ${recipe.title} that changes everything 🔥`,
          `Only ${recipe.carbsPerServing}g carbs and it hits this hard?!`,
          `${recipe.calories} cal of pure satisfaction`,
          "Blood sugar staying stable while eating like royalty",
        ];

        const hashtags = ["#diabetesfriendly", "#lowcarb", "#healthytiktok", "#foodtok", "#diabetesawareness", "#mealprep", "#healthyrecipes", "#fyp", "#viral"];
        
        setContent({ 
          type: "full_pack", 
          data: { 
            videoScript: script, 
            verticalStoryboard: storyboard, 
            videoGenerationPrompts: prompts,
            finalHeroShotPrompt: `[THUMBNAIL] Professional food photography ${recipe.title}, dramatic Rembrandt lighting, f/1.4 bokeh, steam wisps, artisan ceramic, microgreen garnish, 9:16 vertical, award-winning`,
            autoCaptions: captions,
            hashtags,
            cta: "Save this before it blows up! 💾",
            viralHooks: [viralHook, ...VIRAL_HOOKS.slice(0, 2).map(h => h.replace("{RECIPE}", recipe.title))],
            trendingSounds: TRENDING_SOUNDS.slice(0, 4),
            bRollSuggestions: [
              "Hands washing vegetables under running water",
              "Spices being sprinkled from height",
              "Oil swirling in hot pan",
              "Fresh herbs being torn",
            ],
          },
        });
        return JSON.stringify({ success: true, message: "Full video pack generated!" });
      },
    }),
  };
}

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
  
  const recipeRef = useRef<RecipeRef>(null);
  recipeRef.current = recipe ? {
    title: recipe.title,
    carbsPerServing: recipe.carbsPerServing,
    calories: recipe.calories,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
  } : null;

  const toolsRef = useRef(createTools(recipeRef, setGeneratedContent));

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
    tools: toolsRef.current,
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

  const generateInstantPack = useCallback(() => {
    if (!recipe) return;
    
    const viralHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)]?.replace("{RECIPE}", recipe.title) ?? "";
    
    const script: VideoScriptScene[] = [
      { timecode: "[00:00-00:02]", content: `HOOK: "${viralHook}"` },
      { timecode: "[00:02-00:05]", content: `Ingredients flash: ${recipe.carbsPerServing}g carbs` },
      { timecode: "[00:05-00:15]", content: "Quick prep montage with ASMR" },
      { timecode: "[00:15-00:25]", content: "Cooking action shots" },
      { timecode: "[00:25-00:30]", content: "Hero shot + bite" },
    ];
    
    const storyboard: StoryboardShot[] = [
      { shotNumber: 1, duration: "2s", angle: "close-up", action: "Hook teaser", onScreenText: "", soundCue: "Drop" },
      { shotNumber: 2, duration: "3s", angle: "overhead", action: "Ingredients", onScreenText: recipe.title, soundCue: "Beat" },
      { shotNumber: 3, duration: "10s", angle: "tracking", action: "Prep + Cook", onScreenText: `${recipe.carbsPerServing}g carbs`, soundCue: "ASMR" },
      { shotNumber: 4, duration: "5s", angle: "hero", action: "Plate + Bite", onScreenText: "Save! 📌", soundCue: "Finale" },
    ];
    
    setGeneratedContent({
      type: "instant_pack",
      data: {
        videoScript: script,
        verticalStoryboard: storyboard,
        videoGenerationPrompts: [
          `Cinematic ${recipe.title} cooking video, steam, sizzle, 9:16 vertical, viral food content`,
          `Fork lifting bite of ${recipe.title}, cheese pull, steam, food porn aesthetic`,
        ],
        finalHeroShotPrompt: `Professional food photo ${recipe.title}, dramatic lighting, shallow DOF, steam, 9:16`,
        autoCaptions: [
          `${recipe.title} — ${recipe.carbsPerServing}g carbs 🔥`,
          "Diabetes-friendly and delicious",
          `Ready in ${recipe.prepTime + recipe.cookTime} min`,
        ],
        hashtags: ["#diabetesfriendly", "#lowcarb", "#foodtok", "#healthytiktok", "#fyp"],
        cta: "Save this! 💾",
        viralHooks: [viralHook],
        trendingSounds: TRENDING_SOUNDS.slice(0, 2),
      },
    });
  }, [recipe]);

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

        {generatedContent.data.viralHooks && generatedContent.data.viralHooks.length > 0 && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <TrendingUp size={14} color={Colors.light.coral} />
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
              <Camera size={14} color={Colors.light.sapphire} />
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
                <action.icon size={16} color={action.instant ? "#fff" : Colors.light.coral} />
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
  quickActionInstant: {
    backgroundColor: Colors.light.coral,
    borderColor: Colors.light.coral,
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
  hookItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.coralLight,
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
    backgroundColor: Colors.light.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
});
