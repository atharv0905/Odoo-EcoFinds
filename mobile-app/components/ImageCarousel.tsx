import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { ProductImage } from "../types/api";

interface ImageCarouselProps {
  images: ProductImage[];
  height?: number;
  aspectRatio?: number;
  borderRadius?: number;
  showPagination?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  onImagePress?: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get("window");

export default function ImageCarousel({
  images,
  height = 200,
  aspectRatio,
  borderRadius = 12,
  showPagination = true,
  autoScroll = true,
  autoScrollInterval = 3000,
  onImagePress,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<number | null>(null);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
    resetAutoScrollTimer();
  };

  const resetAutoScrollTimer = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    if (autoScroll && images.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % images.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
          return nextIndex;
        });
      }, autoScrollInterval) as any;
    }
  };

  useEffect(() => {
    resetAutoScrollTimer();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [autoScroll, images.length, autoScrollInterval]);

  const imageHeight = aspectRatio ? screenWidth / aspectRatio : height;

  if (!images || images.length === 0) {
    // Fallback static image
    return (
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
        }}
        style={[styles.fallbackImage, { height: imageHeight, borderRadius }]}
        resizeMode="cover"
      />
    );
  }

  if (images.length === 1) {
    // Single image - no carousel needed
    return (
      <TouchableOpacity
        onPress={() => onImagePress?.(0)}
        style={[
          styles.singleImageContainer,
          { height: imageHeight, borderRadius },
        ]}
      >
        <Image
          source={{ uri: images[0].url }}
          style={[styles.singleImage, { borderRadius }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height: imageHeight + (showPagination ? 30 : 0) },
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        onTouchStart={() => {
          if (autoScrollTimer.current) {
            clearInterval(autoScrollTimer.current);
          }
        }}
        onTouchEnd={resetAutoScrollTimer}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={image._id || `image-${index}`}
            onPress={() => onImagePress?.(index)}
            style={[
              styles.imageContainer,
              { width: screenWidth, height: imageHeight },
            ]}
          >
            <Image
              source={{ uri: image.url }}
              style={[styles.image, { borderRadius }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showPagination && images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex ? styles.paginationDotActive : null,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    padding: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  singleImageContainer: {
    width: "100%",
  },
  singleImage: {
    width: "100%",
    height: "100%",
  },
  fallbackImage: {
    width: "100%",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    height: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  paginationDotActive: {
    backgroundColor: "#4CAF50",
    width: 12,
    height: 8,
    borderRadius: 4,
    borderColor: "#4CAF50",
    transform: [{ scaleY: 1.2 }],
  },
});
