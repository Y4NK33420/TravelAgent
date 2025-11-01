import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  MapPin, Calendar, Users, DollarSign, Clock, Edit3, Save, X, 
  Plane, Hotel, Utensils, Camera, Star, Navigation, Phone, Globe,
  Coffee, ShoppingBag, Mountain, Waves, Building, Car, Train,
  AlertTriangle, CheckCircle, RotateCcw, Sparkles, Heart,
  ArrowLeft, Download, Share2, Plus, Music, Leaf
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TripPlanProps {
  tripData?: any; // This will now be the combined planning data
  onEdit: (section: string, data: any) => void;
  onClose?: () => void;
}

// Generate trip plan from planning selections
function generateTripPlan(planningData: any) {
  console.log('Planning data received:', planningData); // Debug log
  
  // Fallback to mock data if planning data is invalid
  if (!planningData) {
    console.log('No planning data, using mock data');
    return mockTripData;
  }

  const selectedItems = planningData.selectedItems || {};
  const destination = planningData.destination || planningData.query || "India";
  const startDate = planningData.startDate || planningData.dates?.start || "2024-04-15";
  const endDate = planningData.endDate || planningData.dates?.end || "2024-04-20";
  const travelers = planningData.travelers || planningData.groupSize || 2;
  const tripStyle = planningData.tripStyle || "balanced";

  console.log('Processed data:', { destination, startDate, endDate, travelers, tripStyle, selectedItems }); // Debug log

  // Create itinerary days based on selections
  const days = [];
  let dayCount;
  
  try {
    dayCount = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
  } catch (error) {
    console.log('Date parsing error, using 5 days default');
    dayCount = 5;
  }

  // Get all selected items arrays
  const placesArray = selectedItems.places || [];
  const diningArray = selectedItems.dining || [];
  const activitiesArray = selectedItems.activities || [];
  const accommodationsArray = selectedItems.accommodations || [];

  for (let i = 0; i < dayCount; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Distribute selected items across days
    const dayActivities = [];
    
    // Add places to visit (cycle through if needed)
    if (placesArray.length > 0) {
      const placeIndex = i % placesArray.length;
      dayActivities.push({
        id: `place-${i}`,
        time: "10:00",
        title: getPlaceName(placesArray[placeIndex]),
        description: getPlaceDescription(placesArray[placeIndex]),
        location: destination,
        duration: "2-3 hours",
        cost: 0,
        rating: 4.7,
        category: 'sightseeing',
        bookingRequired: false
      });
    }

    // Add dining (cycle through if needed)
    if (diningArray.length > 0) {
      const diningIndex = i % diningArray.length;
      dayActivities.push({
        id: `dining-${i}`,
        time: "19:00",
        title: getDiningName(diningArray[diningIndex]),
        description: getDiningDescription(diningArray[diningIndex]),
        location: destination,
        duration: "1.5-2 hours",
        cost: 85,
        rating: 4.6,
        category: 'food',
        bookingRequired: true
      });
    }

    // Add activities (cycle through if needed)
    if (activitiesArray.length > 0) {
      const activityIndex = i % activitiesArray.length;
      dayActivities.push({
        id: `activity-${i}`,
        time: "14:00",
        title: getActivityName(activitiesArray[activityIndex]),
        description: getActivityDescription(activitiesArray[activityIndex]),
        location: destination,
        duration: "2-3 hours",
        cost: 65,
        rating: 4.8,
        category: 'activity',
        bookingRequired: true
      });
    }

    // Ensure each day has at least one activity
    if (dayActivities.length === 0) {
      dayActivities.push({
        id: `default-${i}`,
        time: "10:00",
        title: "Explore the City",
        description: "Discover local neighborhoods and hidden gems",
        location: destination,
        duration: "3-4 hours",
        cost: 0,
        rating: 4.5,
        category: 'sightseeing',
        bookingRequired: false
      });
    }

    days.push({
      day: i + 1,
      date: dayDate.toISOString().split('T')[0],
      city: destination,
      activities: dayActivities,
      accommodation: {
        name: getAccommodationName(accommodationsArray[0]),
        address: `Historic District, ${typeof destination === 'string' ? destination : destination?.name || 'City'}`,
        rating: 4.5,
        pricePerNight: 180,
        amenities: ["Free WiFi", "Breakfast", "Concierge", "Gym"],
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
        checkIn: "15:00",
        checkOut: "11:00"
      },
      weather: {
        temperature: `${18 + i * 2}°C`, // Vary temperature slightly
        condition: ["Sunny", "Partly Cloudy", "Clear", "Sunny", "Partly Cloudy"][i % 5],
        icon: ["☀️", "⛅", "🌤️", "☀️", "⛅"][i % 5],
        precipitation: [5, 10, 0, 5, 15][i % 5]
      },
      budget: {
        accommodation: 180,
        food: 120,
        activities: 150,
        transport: 50,
        total: 500
      }
    });
  }

  const result = {
    destination,
    dates: { start: startDate, end: endDate },
    travelers,
    budget: getBudgetCategory(tripStyle),
    totalBudget: days.reduce((sum, day) => sum + day.budget.total, 0),
    overview: `Experience the best of ${typeof destination === 'string' ? destination : destination?.name || 'your destination'} with a perfectly curated ${tripStyle} itinerary featuring handpicked accommodations, dining, and activities.`,
    days,
    selectedItems,
    tripStyle
  };

  console.log('Generated trip plan:', result); // Debug log
  return result;
}

// Helper functions to get names and descriptions
function getPlaceName(placeId: string | undefined) {
  if (!placeId) return 'Local Attraction';
  
  const places = {
    '1': 'Taj Mahal',
    '2': 'Amber Fort',
    '3': 'Varanasi Ghats',
    '4': 'Hawa Mahal',
    '5': 'Gateway of India',
    '6': 'Qutub Minar'
  };
  return places[placeId as keyof typeof places] || 'Historic Landmark';
}

function getPlaceDescription(placeId: string | undefined) {
  if (!placeId) return 'Discover this amazing local attraction';
  
  const descriptions = {
    '1': 'Marble mausoleum in Agra, India, famed for its sunrise glow',
    '2': 'Majestic hilltop fort overlooking Jaipur with ornate palaces',
    '3': 'Spiritual riverfront steps along the Ganges in Varanasi',
    '4': 'Iconic honeycomb palace facade in Jaipur',
    '5': 'Historic arch monument on Mumbai’s waterfront',
    '6': 'Ancient minaret and UNESCO World Heritage site in Delhi'
  };
  return descriptions[placeId as keyof typeof descriptions] || 'Amazing historical site to explore';
}
function getDiningName(diningId: string | undefined) {
  if (!diningId) return 'Local Restaurant';
  
  const restaurants = {
    '1': 'Karim’s',
    '2': 'Indian Accent',
    '3': 'Bukhara',
    '4': 'Saravana Bhavan',
    '5': 'Paranthe Wali Gali',
    '6': 'Leopold Cafe'
  };
  return restaurants[diningId as keyof typeof restaurants] || 'Local Bistro';
}

function getDiningDescription(diningId: string | undefined) {
  if (!diningId) return 'Authentic local dining experience';
  
  const descriptions = {
    '1': 'Iconic Mughlai cuisine near Jama Masjid',
    '2': 'Contemporary Indian tasting menu',
    '3': 'Famed North Indian tandoor dishes',
    '4': 'Classic South Indian vegetarian meals',
    '5': 'Historic lane famous for stuffed parathas',
    '6': 'Mumbai institution with colonial charm'
  };
  return descriptions[diningId as keyof typeof descriptions] || 'Authentic local dining experience';
}

function getActivityName(activityId: string | undefined) {
  if (!activityId) return 'Local Experience';
  
  const activities = {
    '1': 'Taj Mahal Sunrise Tour',
    '2': 'Old Delhi Rickshaw & Food Walk',
    '3': 'Jaipur City Palace & Amber Fort',
    '4': 'Ganges Sunrise Boat Ride',
    '5': 'Bollywood Studio Tour',
    '6': 'Indian Cooking Class'
  };
  return activities[activityId as keyof typeof activities] || 'Cultural Experience';
}

function getActivityDescription(activityId: string | undefined) {
  if (!activityId) return 'Exciting local activity to enjoy';
  
  const descriptions = {
    '1': 'Experience the Taj Mahal at dawn with an expert guide',
    '2': 'Street food tasting and heritage lanes of Old Delhi',
    '3': 'Architectural wonders and royal history in Jaipur',
    '4': 'Serene boat ride on the Ganges with sunrise rituals',
    '5': 'Behind-the-scenes look at India’s film industry',
    '6': 'Hands-on class cooking regional Indian dishes'
  };
  return descriptions[activityId as keyof typeof descriptions] || 'Exciting activity to enjoy';
}

function getAccommodationName(accommodationId: string | undefined) {
  if (!accommodationId) return 'Boutique Hotel';
  
  const accommodations = {
    '1': 'The Oberoi Amarvilas, Agra',
    '2': 'The Imperial New Delhi',
    '3': 'Taj Lake Palace, Udaipur',
    '4': 'ITC Rajputana, Jaipur',
    '5': 'Zostel Jaipur',
    '6': 'The Leela Palace, New Delhi'
  };
  return accommodations[accommodationId as keyof typeof accommodations] || 'Boutique Hotel';
}

function getBudgetCategory(tripStyle: string) {
  const budgets = {
    'laid-back': 'Relaxed ($800-1500)',
    'balanced': 'Balanced ($1500-2500)',
    'adventurous': 'Premium ($2500-4000)'
  };
  return budgets[tripStyle as keyof typeof budgets] || 'Balanced ($1500-2500)';
}

// Mock fallback data
const mockTripData = {
  destination: "India",
  dates: { start: "2024-04-15", end: "2024-04-20" },
  travelers: 2,
  budget: "Balanced ($1500-2500)",
  totalBudget: 2400,
  overview: "Experience the diversity of India with a curated itinerary featuring iconic landmarks, vibrant cuisine, and unforgettable cultural experiences.",
  tripStyle: "balanced",
  days: [
    {
      day: 1,
      date: "2024-04-15",
      city: "India",
      activities: [
        {
          id: "1",
          time: "10:00",
          title: "Taj Mahal Sunrise Visit",
          description: "Marble mausoleum in Agra, India, famed for its sunrise glow",
          location: "Agra, India",
          duration: "2-3 hours",
          cost: 29,
          rating: 4.8,
          category: 'sightseeing',
          bookingRequired: false
        },
        {
          id: "2",
          time: "19:00",
          title: "Dinner at Indian Accent",
          description: "Contemporary Indian tasting menu",
          location: "New Delhi, India",
          duration: "1.5-2 hours",
          cost: 85,
          rating: 4.6,
          category: 'food',
          bookingRequired: true
        }
      ],
      accommodation: {
        name: "The Oberoi Amarvilas, Agra",
        address: "Taj East Gate Road, Agra, Uttar Pradesh",
        rating: 4.5,
        pricePerNight: 180,
        amenities: ["Free WiFi", "Restaurant", "Gym", "24/7 Front Desk"],
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
        checkIn: "15:00",
        checkOut: "11:00"
      },
      weather: {
        temperature: "22°C",
        condition: "Sunny",
        icon: "☀️",
        precipitation: 5
      },
      budget: {
        accommodation: 180,
        food: 120,
        activities: 150,
        transport: 50,
        total: 500
      }
    }
  ]
};

export function TripPlan({ tripData: rawTripData, onEdit, onClose }: TripPlanProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showReplanTooltip, setShowReplanTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate trip plan from planning data with error handling
  let tripData;
  try {
    tripData = generateTripPlan(rawTripData);
    // Simulate a brief loading time for better UX
    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }, []);
  } catch (error) {
    console.error('Error generating trip plan:', error);
    setError('Failed to generate trip plan. Using default data.');
    tripData = mockTripData;
    setIsLoading(false);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl mb-2">Creating Your Perfect Trip</h2>
          <p className="text-white/70">Generating your personalized itinerary...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">Something went wrong</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleEdit = (section: string, currentData: any) => {
    setEditingSection(section);
    setEditValues(currentData);
  };

  const handleSave = (section: string) => {
    onEdit(section, editValues);
    setEditingSection(null);
    setShowReplanTooltip(true);
    setTimeout(() => setShowReplanTooltip(false), 3000);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      sightseeing: Camera,
      food: Utensils,
      activity: Mountain,
      transport: Car,
      shopping: ShoppingBag,
      culture: Building,
      entertainment: Music,
      wellness: Leaf
    };
    return icons[category as keyof typeof icons] || Camera;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      sightseeing: 'bg-blue-500/20 text-blue-300',
      food: 'bg-green-500/20 text-green-300',
      activity: 'bg-purple-500/20 text-purple-300',
      transport: 'bg-orange-500/20 text-orange-300',
      shopping: 'bg-pink-500/20 text-pink-300',
      culture: 'bg-indigo-500/20 text-indigo-300',
      entertainment: 'bg-red-500/20 text-red-300',
      wellness: 'bg-teal-500/20 text-teal-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Success notification */}
        <AnimatePresence>
          {showReplanTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg">Trip updated successfully!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 max-w-7xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              <CardContent className="relative p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                      >
                        <Globe className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h1 className="text-4xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                          {typeof tripData.destination === 'string' ? tripData.destination : tripData.destination?.name || 'Your Destination'}
                        </h1>
                        <p className="text-white/70 text-lg">Your AI-curated travel itinerary</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="border-white/20 !text-white hover:bg-white/10 hover:!text-white backdrop-blur-sm font-medium"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 !text-white hover:bg-white/10 hover:!text-white backdrop-blur-sm font-medium"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                        {onClose && (
                          <Button
                            onClick={onClose}
                            variant="ghost"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-white/80 text-lg leading-relaxed mb-6">{tripData.overview}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl backdrop-blur-sm"
                      >
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-white">
                          {new Date(tripData.dates.start).toLocaleDateString()} - {new Date(tripData.dates.end).toLocaleDateString()}
                        </span>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl backdrop-blur-sm"
                      >
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="text-white">{tripData.travelers} travelers</span>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl backdrop-blur-sm"
                      >
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-white">${tripData.totalBudget}</span>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-xl backdrop-blur-sm"
                      >
                        <Heart className="w-5 h-5 text-pink-400" />
                        <span className="text-white capitalize">{tripData.tripStyle} style</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trip Days */}
          <div className="space-y-12">
            {tripData.days.map((day: any, dayIndex: number) => (
              <motion.div
                key={day.day}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: dayIndex * 0.2, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Day Header */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
                  <CardContent className="relative p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: dayIndex * 0.5 }}
                          className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-2xl shadow-xl"
                        >
                          {day.day}
                        </motion.div>
                        <div>
                          <h2 className="text-3xl text-white mb-2">Day {day.day} - {day.city}</h2>
                          <p className="text-white/70 text-lg">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="text-3xl">{day.weather.icon}</span>
                          <div>
                            <div className="text-xl">{day.weather.temperature}</div>
                            <div className="text-sm text-white/60">{day.weather.condition}</div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border-green-500/30 px-4 py-2 text-lg">
                          ${day.budget.total}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Activities */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl text-white flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-400" />
                      Activities & Experiences
                    </h3>
                    
                    <div className="space-y-6">
                      {day.activities.map((activity: any, activityIndex: number) => {
                        const IconComponent = getCategoryIcon(activity.category);
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: (dayIndex * 0.2) + (activityIndex * 0.1), duration: 0.6 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="group"
                          >
                            <Card className="bg-black/20 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <CardContent className="relative p-6">
                                <div className="flex gap-6">
                                  <div className="flex-shrink-0">
                                    <motion.div 
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"
                                    >
                                      <IconComponent className="w-8 h-8 text-blue-400" />
                                    </motion.div>
                                    <div className="text-center">
                                      <div className="text-white text-lg">{activity.time}</div>
                                      <div className="text-white/60 text-sm">{activity.duration}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div>
                                        <h4 className="text-xl text-white group-hover:text-blue-400 transition-colors mb-2">
                                          {activity.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-white/70 mb-3">
                                          <MapPin className="w-4 h-4" />
                                          {typeof activity.location === 'string' ? activity.location : activity.location?.name || 'Location not specified'}
                                          {activity.rating && (
                                            <>
                                              <span>•</span>
                                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                              <span>{activity.rating}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <Badge className={getCategoryColor(activity.category)}>
                                          {activity.category}
                                        </Badge>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEdit(`activity-${activity.id}`, activity)}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/10"
                                            >
                                              <Edit3 className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit activity</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                    
                                    <p className="text-white/80 mb-4 leading-relaxed">{activity.description}</p>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <span className="text-green-400 text-lg">${activity.cost}</span>
                                        {activity.bookingRequired && (
                                          <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                                            Booking Required
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accommodation & Info */}
                  <div className="space-y-8">
                    {/* Accommodation */}
                    <motion.div
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: dayIndex * 0.2 + 0.3, duration: 0.6 }}
                    >
                      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5" />
                        <CardHeader className="relative pb-4">
                          <CardTitle className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                              <Hotel className="w-6 h-6 text-green-400" />
                              Accommodation
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(`accommodation-${day.day}`, day.accommodation)}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit accommodation</TooltipContent>
                            </Tooltip>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className="space-y-4">
                            <div className="aspect-video rounded-xl overflow-hidden">
                              <ImageWithFallback
                                src={day.accommodation.image}
                                alt={day.accommodation.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div>
                              <h4 className="text-lg text-white mb-2">{day.accommodation.name}</h4>
                              <p className="text-white/70 mb-3">{day.accommodation.address}</p>
                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.floor(day.accommodation.rating)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-500'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-white/70">
                                    {day.accommodation.rating}
                                  </span>
                                </div>
                                <span className="text-green-400 text-lg">
                                  ${day.accommodation.pricePerNight}/night
                                </span>
                              </div>
                              
                              <div className="text-white/70 mb-4">
                                <div>Check-in: {day.accommodation.checkIn}</div>
                                <div>Check-out: {day.accommodation.checkOut}</div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {day.accommodation.amenities.map((amenity: string) => (
                                  <Badge key={amenity} variant="secondary" className="bg-white/10 text-white/70 text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Budget Breakdown */}
                    <motion.div
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: dayIndex * 0.2 + 0.4, duration: 0.6 }}
                    >
                      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5" />
                        <CardHeader className="relative pb-4">
                          <CardTitle className="flex items-center gap-3 text-white">
                            <DollarSign className="w-6 h-6 text-amber-400" />
                            Daily Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className="space-y-3">
                            <div className="flex justify-between text-white/80">
                              <span>Accommodation</span>
                              <span>${day.budget.accommodation}</span>
                            </div>
                            <div className="flex justify-between text-white/80">
                              <span>Food & Dining</span>
                              <span>${day.budget.food}</span>
                            </div>
                            <div className="flex justify-between text-white/80">
                              <span>Activities</span>
                              <span>${day.budget.activities}</span>
                            </div>
                            <div className="flex justify-between text-white/80">
                              <span>Transportation</span>
                              <span>${day.budget.transport}</span>
                            </div>
                            <Separator className="bg-white/20" />
                            <div className="flex justify-between text-white text-lg">
                              <span>Total</span>
                              <span className="text-green-400">${day.budget.total}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Footer */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16"
          >
            <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              <CardContent className="relative p-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl text-white mb-4">Your Perfect Trip Awaits!</h3>
                <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                  This AI-curated itinerary is designed to give you the best possible experience in {typeof tripData.destination === 'string' ? tripData.destination : tripData.destination?.name || 'your destination'}. 
                  All suggestions are based on your preferences and can be customized to your needs.
                </p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 !text-white font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download Itinerary
                  </Button>
                  <Button variant="outline" className="border-white/20 !text-white hover:bg-white/10 hover:!text-white font-medium">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}