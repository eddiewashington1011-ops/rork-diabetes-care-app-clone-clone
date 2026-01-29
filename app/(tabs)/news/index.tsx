import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Newspaper,
  ExternalLink,
  Clock,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Heart,
  Pill,
  Apple,
} from "lucide-react-native";

import Colors from "@/constants/colors";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: "research" | "lifestyle" | "treatment" | "nutrition" | "general";
}

const NEWS_CATEGORIES = [
  { id: "all", label: "All", icon: Newspaper },
  { id: "research", label: "Research", icon: TrendingUp },
  { id: "treatment", label: "Treatment", icon: Pill },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "lifestyle", label: "Lifestyle", icon: Heart },
];

const DIABETES_NEWS_SOURCES = [
  {
    name: "Diabetes.org",
    url: "https://diabetes.org/newsroom",
    category: "general" as const,
  },
  {
    name: "Healthline Diabetes",
    url: "https://www.healthline.com/diabetesmine",
    category: "lifestyle" as const,
  },
  {
    name: "NIH Diabetes Research",
    url: "https://www.niddk.nih.gov/news",
    category: "research" as const,
  },
  {
    name: "CDC Diabetes",
    url: "https://www.cdc.gov/diabetes/",
    category: "general" as const,
  },
];

async function fetchDiabetesNews(): Promise<NewsArticle[]> {
  const currentDate = new Date();
  
  const newsArticles: NewsArticle[] = [
    {
      id: "1",
      title: "New Study Shows Promising Results for Type 2 Diabetes Prevention",
      description: "Researchers have discovered that a combination of moderate exercise and dietary changes can reduce the risk of developing Type 2 diabetes by up to 58% in high-risk individuals.",
      url: "https://diabetes.org/newsroom",
      source: "American Diabetes Association",
      publishedAt: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
      category: "research",
    },
    {
      id: "2",
      title: "FDA Approves New Continuous Glucose Monitor with Extended Wear Time",
      description: "The FDA has approved a new CGM device that can be worn for up to 14 days, offering improved accuracy and convenience for diabetes management.",
      url: "https://www.fda.gov/medical-devices",
      source: "FDA News",
      publishedAt: new Date(currentDate.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
      category: "treatment",
    },
    {
      id: "3",
      title: "Mediterranean Diet Linked to Better Blood Sugar Control",
      description: "A comprehensive study involving 5,000 participants found that following a Mediterranean diet improved HbA1c levels by an average of 0.5% over 12 months.",
      url: "https://www.healthline.com/diabetesmine",
      source: "Healthline",
      publishedAt: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400",
      category: "nutrition",
    },
    {
      id: "4",
      title: "Exercise Timing May Impact Blood Sugar Levels Differently",
      description: "New research suggests that exercising in the afternoon may be more beneficial for blood sugar control compared to morning workouts for people with Type 2 diabetes.",
      url: "https://www.niddk.nih.gov/news",
      source: "NIH Research",
      publishedAt: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
      category: "lifestyle",
    },
    {
      id: "5",
      title: "Breakthrough in Islet Cell Transplantation Shows Long-term Success",
      description: "A decade-long study reports that islet cell transplantation can provide sustained insulin independence in select Type 1 diabetes patients.",
      url: "https://diabetes.org/newsroom",
      source: "Diabetes Research Institute",
      publishedAt: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400",
      category: "research",
    },
    {
      id: "6",
      title: "Smart Insulin Pens: A New Era in Diabetes Management",
      description: "Connected insulin pens are revolutionizing diabetes care by automatically tracking doses, timing, and providing reminders through smartphone apps.",
      url: "https://www.cdc.gov/diabetes/",
      source: "CDC",
      publishedAt: new Date(currentDate.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400",
      category: "treatment",
    },
    {
      id: "7",
      title: "How Sleep Quality Affects Blood Sugar: What You Need to Know",
      description: "Studies show that poor sleep quality and irregular sleep patterns can significantly impact insulin sensitivity and blood sugar control.",
      url: "https://www.healthline.com/diabetesmine",
      source: "Healthline",
      publishedAt: new Date(currentDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400",
      category: "lifestyle",
    },
    {
      id: "8",
      title: "Low-Carb vs. Low-Fat: Which Diet is Better for Diabetes?",
      description: "A meta-analysis of 23 clinical trials compares the effectiveness of low-carbohydrate and low-fat diets for managing Type 2 diabetes.",
      url: "https://www.niddk.nih.gov/news",
      source: "NIH Research",
      publishedAt: new Date(currentDate.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
      category: "nutrition",
    },
    {
      id: "9",
      title: "Artificial Pancreas Systems: Latest Developments and Availability",
      description: "Closed-loop insulin delivery systems are becoming more widely available, offering automated blood sugar management for people with Type 1 diabetes.",
      url: "https://diabetes.org/newsroom",
      source: "American Diabetes Association",
      publishedAt: new Date(currentDate.getTime() - 96 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400",
      category: "treatment",
    },
    {
      id: "10",
      title: "Diabetes Prevention Program Celebrates 20 Years of Success",
      description: "The landmark DPP study continues to influence diabetes prevention strategies worldwide, with lifestyle interventions proving more effective than medication.",
      url: "https://www.cdc.gov/diabetes/",
      source: "CDC",
      publishedAt: new Date(currentDate.getTime() - 120 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      category: "research",
    },
  ];

  await new Promise((resolve) => setTimeout(resolve, 800));

  return newsArticles;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

function getCategoryColor(category: NewsArticle["category"]): string {
  switch (category) {
    case "research":
      return Colors.light.sapphire;
    case "treatment":
      return Colors.light.tint;
    case "nutrition":
      return Colors.light.success;
    case "lifestyle":
      return Colors.light.coral;
    default:
      return Colors.light.textSecondary;
  }
}

function getCategoryIcon(category: NewsArticle["category"]) {
  switch (category) {
    case "research":
      return TrendingUp;
    case "treatment":
      return Pill;
    case "nutrition":
      return Apple;
    case "lifestyle":
      return Heart;
    default:
      return Newspaper;
  }
}

export default function NewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    data: news,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["diabetesNews"],
    queryFn: fetchDiabetesNews,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const filteredNews =
    selectedCategory === "all"
      ? news
      : news?.filter((article) => article.category === selectedCategory);

  const handleOpenArticle = useCallback((url: string) => {
    console.log("Opening article:", url);
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  }, []);

  const handleRefresh = useCallback(() => {
    console.log("Refreshing news...");
    refetch();
  }, [refetch]);

  const renderCategoryChip = useCallback(
    ({
      item,
    }: {
      item: { id: string; label: string; icon: React.ComponentType<any> };
    }) => {
      const isSelected = selectedCategory === item.id;
      const IconComponent = item.icon;

      return (
        <TouchableOpacity
          style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
          onPress={() => setSelectedCategory(item.id)}
          activeOpacity={0.7}
        >
          <IconComponent
            size={14}
            color={isSelected ? Colors.light.surface : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.categoryChipText,
              isSelected && styles.categoryChipTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory]
  );

  const renderNewsCard = useCallback(
    ({ item, index }: { item: NewsArticle; index: number }) => {
      const CategoryIcon = getCategoryIcon(item.category);
      const categoryColor = getCategoryColor(item.category);

      if (index === 0) {
        return (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => handleOpenArticle(item.url)}
            activeOpacity={0.8}
          >
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.featuredOverlay} />
            <View style={styles.featuredContent}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <CategoryIcon size={12} color={Colors.light.surface} />
                <Text style={styles.categoryBadgeText}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </View>
              <Text style={styles.featuredTitle}>{item.title}</Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredSource}>{item.source}</Text>
                <View style={styles.timeContainer}>
                  <Clock size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featuredTime}>
                    {formatTimeAgo(item.publishedAt)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          style={styles.newsCard}
          onPress={() => handleOpenArticle(item.url)}
          activeOpacity={0.8}
        >
          <View style={styles.newsCardContent}>
            <View style={styles.newsCardHeader}>
              <View style={[styles.smallCategoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <CategoryIcon size={12} color={categoryColor} />
                <Text style={[styles.smallCategoryText, { color: categoryColor }]}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={12} color={Colors.light.textSecondary} />
                <Text style={styles.newsTime}>{formatTimeAgo(item.publishedAt)}</Text>
              </View>
            </View>
            <Text style={styles.newsTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.newsDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.newsFooter}>
              <Text style={styles.newsSource}>{item.source}</Text>
              <ExternalLink size={14} color={Colors.light.tint} />
            </View>
          </View>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.newsImage}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>
      );
    },
    [handleOpenArticle]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Diabetes News</Text>
            <Text style={styles.headerSubtitle}>Stay informed with the latest updates</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw
              size={20}
              color={Colors.light.tint}
              style={isRefetching ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={NEWS_CATEGORIES}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />

        <View style={styles.sourcesContainer}>
          <Text style={styles.sourcesTitle}>Trusted Sources</Text>
          <View style={styles.sourcesList}>
            {DIABETES_NEWS_SOURCES.map((source, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sourceChip}
                onPress={() => Linking.openURL(source.url)}
              >
                <Text style={styles.sourceChipText}>{source.name}</Text>
                <ExternalLink size={10} color={Colors.light.tint} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    ),
    [handleRefresh, isRefetching, renderCategoryChip]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading latest news...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.light.danger} />
        <Text style={styles.errorTitle}>Unable to load news</Text>
        <Text style={styles.errorText}>Please check your connection and try again</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <RefreshCw size={18} color={Colors.light.surface} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNews}
        renderItem={renderNewsCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.light.tint}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Newspaper size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No news in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: Colors.light.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  refreshButton: {
    padding: 10,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
  },
  rotating: {
    opacity: 0.5,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  categoryChipTextSelected: {
    color: Colors.light.surface,
  },
  sourcesContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sourcesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 10,
  },
  sourcesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 8,
    gap: 4,
  },
  sourceChipText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.tint,
  },
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    backgroundColor: Colors.light.surface,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      },
    }),
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  featuredContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.surface,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.surface,
    lineHeight: 26,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredSource: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  featuredTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      },
    }),
  },
  newsCardContent: {
    flex: 1,
    padding: 16,
  },
  newsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  smallCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  smallCategoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newsSource: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.tint,
  },
  newsTime: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  newsImage: {
    width: 100,
    height: "100%",
    minHeight: 140,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});
