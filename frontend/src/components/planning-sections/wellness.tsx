import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, Waves, Heart, Plus, Leaf, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface WellnessLocation {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number; // 1-100
  price: string;
  rating: number;
  location: string;
  type: 'spa' | 'park' | 'garden' | 'beach' | 'thermal' | 'yoga';
  duration: string;
  features: string[];
  atmosphere: string;
  bestTime: string;
}

interface WellnessSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

// Mock data - in real app this would come from API
const mockWellnessLocations: WellnessLocation[] = [
  {
    id: '1',
    name: 'Lodhi Gardens',
    description: 'Historic park with Mughal-era tombs and lush green landscapes',
    image: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&h=600&fit=crop',
    suggested: 95,
    price: 'Free',
    rating: 4.7,
    location: 'New Delhi',
    type: 'garden',
    duration: '1-3 hours',
    features: ['Historic Monuments', 'Jogging Tracks', 'Peaceful Walks', 'Bird Watching'],
    atmosphere: 'Serene and historic',
    bestTime: 'Early morning or evening'
  },
  {
    id: '2',
    name: 'Ananda in the Himalayas',
    description: 'Luxury wellness retreat with Ayurvedic treatments and yoga',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    suggested: 89,
    price: '₹25000-50000',
    rating: 4.9,
    location: 'Rishikesh, Uttarakhand',
    type: 'spa',
    duration: '2-4 hours',
    features: ['Ayurvedic Treatments', 'Yoga', 'Meditation', 'Himalayan Views'],
    atmosphere: 'Ultra-luxurious and tranquil',
    bestTime: 'Any time'
  },
  {
    id: '3',
    name: 'Cubbon Park',
    description: 'Sprawling urban park perfect for morning walks and relaxation',
    image: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&h=600&fit=crop',
    suggested: 92,
    price: 'Free',
    rating: 4.5,
    location: 'Bangalore, Karnataka',
    type: 'park',
    duration: '1-2 hours',
    features: ['Green Spaces', 'Walking Paths', 'Historic Buildings', 'Fresh Air'],
    atmosphere: 'Peaceful and refreshing',
    bestTime: 'Early morning'
  },
  {
    id: '4',
    name: 'Ayurvedic Spa at Taj',
    description: 'Traditional Ayurvedic treatments and therapies',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    suggested: 86,
    price: '₹3000-8000',
    rating: 4.4,
    location: 'Multiple Locations',
    type: 'spa',
    duration: '2-3 hours',
    features: ['Ayurvedic Massage', 'Herbal Treatments', 'Steam Baths', 'Wellness Consultation'],
    atmosphere: 'Traditional and healing',
    bestTime: 'Afternoon'
  },
  {
    id: '5',
    name: 'Hanging Gardens',
    description: 'Terraced gardens with sunset views over Arabian Sea',
    image: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&h=600&fit=crop',
    suggested: 83,
    price: 'Free',
    rating: 4.6,
    location: 'Malabar Hill, Mumbai',
    type: 'garden',
    duration: '1-2 hours',
    features: ['Sunset Views', 'Terraced Gardens', 'Sea Breeze', 'Photo Spots'],
    atmosphere: 'Romantic and peaceful',
    bestTime: 'Evening for sunset'
  },
  {
    id: '6',
    name: 'Isha Yoga Center',
    description: 'Spiritual center offering yoga and meditation programs',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    suggested: 78,
    price: '₹500-2000/class',
    rating: 4.5,
    location: 'Coimbatore, Tamil Nadu',
    type: 'yoga',
    duration: '1-3 hours',
    features: ['Yoga Programs', 'Meditation', 'Spiritual Guidance', 'Peaceful Setting'],
    atmosphere: 'Spiritual and centered',
    bestTime: 'Morning or evening'
  },
  {
    id: '7',
    name: 'Seine Riverbank Walks',
    description: 'Peaceful walks along the historic Seine River with beautiful views',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop',
    suggested: 81,
    price: 'Free',
    rating: 4.3,
    location: 'Various locations along Seine',
    type: 'park',
    duration: '1-3 hours',
    features: ['River Views', 'Historic Bridges', 'Peaceful Walking', 'Photography Spots'],
    atmosphere: 'Romantic and calming',
    bestTime: 'Sunset or early morning'
  },
  {
    id: '8',
    name: 'Spa Caudalie at Plaza Athénée',
    description: 'Vinotherapy spa treatments in luxurious Parisian setting',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    suggested: 75,
    price: '€180-450',
    rating: 4.8,
    location: 'Champs-Élysées, 8th arrondissement',
    type: 'spa',
    duration: '2-5 hours',
    features: ['Vinotherapy', 'Luxury Treatments', 'Premium Products', 'Expert Therapists'],
    atmosphere: 'Exclusive and rejuvenating',
    bestTime: 'Any time'
  }
];

export function WellnessSection({ planningData, onSelectionChange, isTransitioning }: WellnessSectionProps) {
  const getTopSuggestionCount = (tripStyle: string) => {
    switch (tripStyle) {
      case 'laid-back': return 3; // More wellness for laid-back trips
      case 'adventurous': return 2;
      default: return 2; // balanced
    }
  };

  const topSuggestionCount = getTopSuggestionCount(planningData.tripStyle);
  const sortedWellness = [...mockWellnessLocations].sort((a, b) => b.suggested - a.suggested);
  
  // Pre-select top AI suggestions by default
  const defaultSelections = sortedWellness.slice(0, topSuggestionCount).map(w => w.id);
  const [selectedWellness, setSelectedWellness] = useState<string[]>(defaultSelections);
  const [hoveredWellness, setHoveredWellness] = useState<string | null>(null);

  // Initialize with default selections
  useEffect(() => {
    const newDefaultSelections = sortedWellness.slice(0, topSuggestionCount).map(w => w.id);
    setSelectedWellness(newDefaultSelections);
    onSelectionChange(newDefaultSelections);
  }, [planningData?.tripStyle]);

  const handleToggleWellness = (wellnessId: string) => {
    const newSelection = selectedWellness.includes(wellnessId)
      ? selectedWellness.filter(id => id !== wellnessId)
      : [...selectedWellness, wellnessId];
    
    setSelectedWellness(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      spa: 'bg-purple-500/20 text-purple-300',
      park: 'bg-green-500/20 text-green-300',
      garden: 'bg-emerald-500/20 text-emerald-300',
      beach: 'bg-blue-500/20 text-blue-300',
      thermal: 'bg-orange-500/20 text-orange-300',
      yoga: 'bg-pink-500/20 text-pink-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      spa: Sparkles,
      park: Leaf,
      garden: Leaf,
      beach: Waves,
      thermal: Waves,
      yoga: Sparkles
    };
    return icons[type as keyof typeof icons] || Leaf;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section intro */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block p-4 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 backdrop-blur-sm mb-6"
        >
          <Waves className="w-8 h-8 text-teal-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">
          Wellness & Relaxation
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Find peaceful spots to unwind and rejuvenate during your travels.
          From luxury spas to serene gardens, discover your perfect sanctuary.
        </p>
      </motion.div>

      {/* Wellness locations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedWellness.map((wellness, index) => {
          const isSelected = selectedWellness.includes(wellness.id);
          const isTopSuggestion = index < topSuggestionCount;
          const isHovered = hoveredWellness === wellness.id;
          const TypeIcon = getTypeIcon(wellness.type);

          return (
            <motion.div
              key={wellness.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              onHoverStart={() => setHoveredWellness(wellness.id)}
              onHoverEnd={() => setHoveredWellness(null)}
              className="group"
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-teal-400 bg-teal-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  {/* Image */}
                  <div className="aspect-video overflow-hidden">
                    <motion.img
                      src={wellness.image}
                      alt={wellness.name}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: isHovered ? 1.05 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Suggested badge */}
                  {isTopSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="absolute top-3 left-3"
                    >
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        AI Suggested
                      </Badge>
                    </motion.div>
                  )}

                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Type badge */}
                  <div className="absolute bottom-3 right-3">
                    <div className={`flex items-center rounded-full px-2 py-1 text-xs ${getTypeColor(wellness.type)}`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {wellness.type}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-lg leading-tight">{wellness.name}</h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">{wellness.rating}</span>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {wellness.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {wellness.location}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {wellness.duration}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {wellness.atmosphere}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {wellness.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs bg-white/10 text-white/70">
                        {feature}
                      </Badge>
                    ))}
                    {wellness.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">
                        +{wellness.features.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Best time */}
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                      Best: {wellness.bestTime}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-teal-400">{wellness.price}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleWellness(wellness.id)}
                      className={isSelected 
                        ? "bg-teal-600 hover:bg-teal-700 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {isSelected ? (
                        <>
                          <Heart className="w-4 h-4 mr-1 fill-current" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {selectedWellness.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 rounded-full px-6 py-3 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-teal-400" />
              <span className="text-white">
                {selectedWellness.length} wellness spot{selectedWellness.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}