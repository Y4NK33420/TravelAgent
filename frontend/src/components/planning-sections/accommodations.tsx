import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Wifi, Car, Coffee, Waves, Heart, Plus, Users, Bed } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  image: string;
  suggested: number; // 1-100
  price: string;
  rating: number;
  amenities: string[];
  location: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'resort' | 'boutique';
  rooms: string;
  guests: number;
}

interface AccommodationsSectionProps {
  planningData: any;
  onSelectionChange: (data: any) => void;
  isTransitioning: boolean;
}

// Mock data - in real app this would come from API
const mockAccommodations: Accommodation[] = [
  {
    id: '1',
    name: 'The Oberoi Amarvilas, Agra',
    description: 'Luxury hotel with stunning Taj Mahal views from every room',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
    suggested: 96,
    price: '₹25000-40000/night',
    rating: 4.8,
    amenities: ['Wi-Fi', 'Restaurant', 'Spa', 'Concierge', 'Room Service'],
    location: 'Taj East Gate Road, Agra',
    type: 'boutique',
    rooms: 'Premier Room',
    guests: 2
  },
  {
    id: '2',
    name: 'Heritage Haveli Stay',
    description: 'Traditional haveli converted into boutique accommodation',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    suggested: 92,
    price: '₹5000-8000/night',
    rating: 4.7,
    amenities: ['Wi-Fi', 'Kitchen', 'Rooftop', 'Cultural Tours'],
    location: 'Old Jaipur, Rajasthan',
    type: 'airbnb',
    rooms: 'Heritage Suite',
    guests: 4
  },
  {
    id: '3',
    name: 'The Imperial New Delhi',
    description: 'Colonial-era luxury hotel in the heart of Delhi',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
    suggested: 89,
    price: '₹12000-18000/night',
    rating: 4.6,
    amenities: ['Wi-Fi', 'Restaurant', 'Gym', 'Pool', 'Business Center'],
    location: 'Connaught Place, New Delhi',
    type: 'hotel',
    rooms: 'Deluxe Room',
    guests: 2
  },
  {
    id: '4',
    name: 'Zostel Jaipur',
    description: 'Budget-friendly hostel with vibrant social atmosphere',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
    suggested: 78,
    price: '₹600-1200/night',
    rating: 4.2,
    amenities: ['Wi-Fi', 'Shared Kitchen', 'Common Room', 'Laundry'],
    location: 'Pink City, Jaipur',
    type: 'hostel',
    rooms: 'Shared Dormitory',
    guests: 1
  },
  {
    id: '5',
    name: 'Taj Lake Palace, Udaipur',
    description: 'Iconic palace hotel floating on Lake Pichola',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    suggested: 85,
    price: '₹45000-80000/night',
    rating: 4.9,
    amenities: ['Wi-Fi', 'Spa', 'Fine Dining', 'Butler Service', 'Boat Transfer'],
    location: 'Lake Pichola, Udaipur',
    type: 'hotel',
    rooms: 'Palace Suite',
    guests: 2
  },
  {
    id: '6',
    name: 'Kerala Houseboat',
    description: 'Traditional houseboat experience on the backwaters',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    suggested: 81,
    price: '₹8000-15000/night',
    rating: 4.4,
    amenities: ['Wi-Fi', 'Kitchenette', 'Scenic Views', 'Private Deck'],
    location: 'Alleppey, Kerala',
    type: 'airbnb',
    rooms: 'Houseboat',
    guests: 2
  }
];

const amenityIcons: { [key: string]: any } = {
  'Wi-Fi': Wifi,
  'Restaurant': Coffee,
  'Bar': Coffee,
  'Spa': Waves,
  'Gym': Users,
  'Kitchen': Coffee,
  'Parking': Car,
  'Pool': Waves,
  'Terrace': Waves,
  'Balcony': Waves
};

export function AccommodationsSection({ planningData, onSelectionChange, isTransitioning }: AccommodationsSectionProps) {
  // Determine how many suggestions to highlight based on trip style
  const getTopSuggestionCount = (tripStyle: string) => {
    switch (tripStyle) {
      case 'laid-back': return 2;
      case 'adventurous': return 3;
      default: return 2; // balanced
    }
  };

  const topSuggestionCount = getTopSuggestionCount(planningData.tripStyle);
  const sortedAccommodations = [...mockAccommodations].sort((a, b) => b.suggested - a.suggested);
  
  // Pre-select top AI suggestions by default
  const defaultSelections = sortedAccommodations.slice(0, topSuggestionCount).map(a => a.id);
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>(defaultSelections);
  const [hoveredAccommodation, setHoveredAccommodation] = useState<string | null>(null);

  // Initialize with default selections
  useEffect(() => {
    const newDefaultSelections = sortedAccommodations.slice(0, topSuggestionCount).map(a => a.id);
    setSelectedAccommodations(newDefaultSelections);
    onSelectionChange(newDefaultSelections);
  }, [planningData?.tripStyle]);

  const handleToggleAccommodation = (accommodationId: string) => {
    const newSelection = selectedAccommodations.includes(accommodationId)
      ? selectedAccommodations.filter(id => id !== accommodationId)
      : [...selectedAccommodations, accommodationId];
    
    setSelectedAccommodations(newSelection);
    onSelectionChange(newSelection);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      hotel: 'bg-blue-500/20 text-blue-300',
      hostel: 'bg-green-500/20 text-green-300',
      airbnb: 'bg-purple-500/20 text-purple-300',
      resort: 'bg-amber-500/20 text-amber-300',
      boutique: 'bg-pink-500/20 text-pink-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
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
          className="inline-block p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm mb-6"
        >
          <Bed className="w-8 h-8 text-purple-400" />
        </motion.div>
        
        <h2 className="text-3xl text-white mb-4">
          Find Your Perfect Stay
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Choose accommodations that match your style and budget. 
          From luxury hotels to cozy apartments, we've curated the best options.
        </p>
      </motion.div>

      {/* Accommodations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAccommodations.map((accommodation, index) => {
          const isSelected = selectedAccommodations.includes(accommodation.id);
          const isTopSuggestion = index < topSuggestionCount;
          const isHovered = hoveredAccommodation === accommodation.id;

          return (
            <motion.div
              key={accommodation.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              onHoverStart={() => setHoveredAccommodation(accommodation.id)}
              onHoverEnd={() => setHoveredAccommodation(null)}
              className="group"
            >
              <Card className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-purple-400 bg-purple-500/10' 
                  : 'bg-black/20 hover:bg-black/30'
              } backdrop-blur-sm border-white/10`}>
                <div className="relative">
                  {/* Image */}
                  <div className="aspect-video overflow-hidden">
                    <motion.img
                      src={accommodation.image}
                      alt={accommodation.name}
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
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Type badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className={getTypeColor(accommodation.type)}>
                      {accommodation.type}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-lg leading-tight">{accommodation.name}</h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">{accommodation.rating}</span>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {accommodation.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {accommodation.location}
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <Bed className="w-4 h-4 mr-2" />
                      {accommodation.rooms} • {accommodation.guests} guest{accommodation.guests !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {accommodation.amenities.slice(0, 4).map((amenity) => {
                      const IconComponent = amenityIcons[amenity] || Coffee;
                      return (
                        <Badge key={amenity} variant="secondary" className="text-xs bg-white/10 text-white/70 flex items-center">
                          <IconComponent className="w-3 h-3 mr-1" />
                          {amenity}
                        </Badge>
                      );
                    })}
                    {accommodation.amenities.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">
                        +{accommodation.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-purple-400">{accommodation.price}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleToggleAccommodation(accommodation.id)}
                      className={isSelected 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
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
        {selectedAccommodations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 rounded-full px-6 py-3 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-purple-400" />
              <span className="text-white">
                {selectedAccommodations.length} accommodation{selectedAccommodations.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}