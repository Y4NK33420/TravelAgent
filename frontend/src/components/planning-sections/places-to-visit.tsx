import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, Camera, Heart, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Attraction {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number; // 1-100
  price?: string;
  rating: number;
  tags: string[];
  location: string;
  duration: string;
  type: 'landmark' | 'museum' | 'nature' | 'cultural' | 'adventure';
}

interface PlacesToVisitSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

// Mock data - in real app this would come from API
const mockAttractions: Attraction[] = [
  {
    id: '1',
    name: 'Taj Mahal',
    description: 'Iconic white marble mausoleum and UNESCO World Heritage site',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop',
    suggested: 98,
    price: '₹1050',
    rating: 4.8,
    tags: ['Iconic', 'UNESCO', 'Architecture'],
    location: 'Agra, Uttar Pradesh',
    duration: '2-3 hours',
    type: 'landmark'
  },
  {
    id: '2',
    name: 'Amber Fort',
    description: 'Majestic hilltop fort with stunning architecture and elephant rides',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&h=600&fit=crop',
    suggested: 95,
    price: '₹500',
    rating: 4.7,
    tags: ['Fort', 'History', 'Architecture'],
    location: 'Jaipur, Rajasthan',
    duration: '3-4 hours',
    type: 'landmark'
  },
  {
    id: '3',
    name: 'Varanasi Ghats',
    description: 'Sacred riverfront steps along the Ganges with spiritual ceremonies',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&h=600&fit=crop',
    suggested: 87,
    price: '₹500-1000',
    rating: 4.5,
    tags: ['Spiritual', 'Cultural', 'Scenic'],
    location: 'Varanasi, Uttar Pradesh',
    duration: '2-3 hours',
    type: 'cultural'
  },
  {
    id: '4',
    name: 'Hawa Mahal',
    description: 'Iconic pink sandstone palace with honeycomb facade',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop',
    suggested: 92,
    price: '₹200',
    rating: 4.6,
    tags: ['Palace', 'Architecture', 'Photography'],
    location: 'Jaipur, Rajasthan',
    duration: '1-2 hours',
    type: 'landmark'
  },
  {
    id: '5',
    name: 'Gateway of India',
    description: 'Historic arch monument overlooking the Arabian Sea',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&h=600&fit=crop',
    suggested: 89,
    price: 'Free',
    rating: 4.7,
    tags: ['Monument', 'Historic', 'Waterfront'],
    location: 'Mumbai, Maharashtra',
    duration: '1-2 hours',
    type: 'landmark'
  },
  {
    id: '6',
    name: 'Qutub Minar',
    description: 'Ancient 73-meter tall minaret and UNESCO World Heritage site',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
    suggested: 84,
    price: '₹600',
    rating: 4.4,
    tags: ['Historic', 'UNESCO', 'Architecture'],
    location: 'New Delhi',
    duration: '2-3 hours',
    type: 'cultural'
  }
];

export function PlacesToVisitSection({ planningData, onSelectionChange, isTransitioning }: PlacesToVisitSectionProps) {
  // Add defensive checks
  
  // Determine how many suggestions to highlight based on trip style
  const getTopSuggestionCount = (tripStyle: string) => {
    switch (tripStyle) {
      case 'laid-back': return 2;
      case 'adventurous': return 4;
      default: return 3; // balanced
    }
  };

  const topSuggestionCount = getTopSuggestionCount(planningData?.tripStyle || 'balanced');
  const sortedAttractions = [...mockAttractions].sort((a, b) => b.suggested - a.suggested);
  
  // Pre-select top AI suggestions by default
  const defaultSelections = sortedAttractions.slice(0, topSuggestionCount).map(a => a.id);
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>(defaultSelections);
  const [hoveredAttraction, setHoveredAttraction] = useState<string | null>(null);

  // Initialize with default selections
  useEffect(() => {
    const newDefaultSelections = sortedAttractions.slice(0, topSuggestionCount).map(a => a.id);
    setSelectedAttractions(newDefaultSelections);
    onSelectionChange(newDefaultSelections);
  }, [planningData?.tripStyle]); // Only run when trip style changes

  const handleToggleAttraction = (attractionId: string) => {
    const newSelection = selectedAttractions.includes(attractionId)
      ? selectedAttractions.filter(id => id !== attractionId)
      : [...selectedAttractions, attractionId];
    
    setSelectedAttractions(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      landmark: 'bg-amber-500/20 text-amber-300',
      museum: 'bg-purple-500/20 text-purple-300',
      nature: 'bg-green-500/20 text-green-300',
      cultural: 'bg-blue-500/20 text-blue-300',
      adventure: 'bg-red-500/20 text-red-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  // Safety check
  if (!planningData) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <div className="text-white text-xl">Loading planning data...</div>
      </div>
    );
  }

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
          className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm mb-6"
        >
          <MapPin className="w-8 h-8 text-blue-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">
          Discover Amazing Places
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Select the attractions and landmarks that capture your imagination. 
          Our AI has curated these based on your preferences.
        </p>
      </motion.div>

      {/* Attractions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAttractions.map((attraction, index) => {
          const isSelected = selectedAttractions.includes(attraction.id);
          const isTopSuggestion = index < topSuggestionCount;
          const isHovered = hoveredAttraction === attraction.id;

          return (
            <motion.div
              key={attraction.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              onHoverStart={() => setHoveredAttraction(attraction.id)}
              onHoverEnd={() => setHoveredAttraction(null)}
              className="group"
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-blue-400 bg-blue-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  {/* Image */}
                  <div className="aspect-video overflow-hidden">
                    <motion.img
                      src={attraction.image}
                      alt={attraction.name}
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
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Type badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className={getTypeColor(attraction.type)}>
                      {attraction.type}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-lg leading-tight">{attraction.name}</h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">{attraction.rating}</span>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {attraction.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {attraction.location}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {attraction.duration}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {attraction.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-white/10 text-white/70">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">{attraction.price}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleAttraction(attraction.id)}
                      className={isSelected 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
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
        {selectedAttractions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 rounded-full px-6 py-3 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-blue-400" />
              <span className="text-white">
                {selectedAttractions.length} place{selectedAttractions.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}